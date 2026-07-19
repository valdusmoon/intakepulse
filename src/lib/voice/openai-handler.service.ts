/**
 * OpenAI event handler — relays audio between the OpenAI Realtime session and
 * the Twilio Media Stream WebSocket, and forwards transcripts/tool-calls/turn
 * completion into the state-machine engine. It does NOT decide anything about
 * the conversation itself — that's entirely state-machine/engine.ts.
 *
 * Voice barge-in is intentionally not implemented here: turn_detection.
 * interrupt_response is false (see call-manager.ts), so OpenAI never auto-cuts
 * a response on detected speech. The only thing that interrupts an in-progress
 * response is a DTMF keypress, handled in the stream route via engine.handleDtmf.
 */

import WebSocket from "ws";
import { RealtimeClient } from "./realtime-client";
import { TIMEOUTS } from "./config/constants";
import { logger } from "@/lib/logger";
import type { FlowContext } from "./state-machine/types";
import * as engine from "./state-machine/engine";

export class OpenAIHandlerService {
  setupEventHandlers(
    openaiClient: RealtimeClient,
    twilioWs: WebSocket,
    ctx: FlowContext,
    onFirstResponseDone?: () => void,
  ): void {
    this.handleAudioResponses(openaiClient, twilioWs, ctx);
    this.handleSilenceReset(openaiClient, twilioWs, ctx);
    this.handleTranscripts(openaiClient, ctx);
    this.handleFunctionCalls(openaiClient, ctx);
    this.handleResponseDone(openaiClient, ctx, onFirstResponseDone);
    this.handleErrors(openaiClient, ctx);
  }

  private handleAudioResponses(openaiClient: RealtimeClient, twilioWs: WebSocket, ctx: FlowContext): void {
    openaiClient.on("response.output_audio.delta", (event) => {
      const { session } = ctx;
      const mulawAudio = event.delta; // Already base64-encoded μ-law from OpenAI

      if (event.item_id && event.item_id !== session.lastAssistantItem) {
        session.responseStartTimestamp = session.latestMediaTimestamp;
        session.lastAssistantItem = event.item_id;
      } else if (session.responseStartTimestamp === undefined) {
        session.responseStartTimestamp = session.latestMediaTimestamp;
      }

      if (event.item_id) {
        session.lastAssistantItem = event.item_id;
      }

      twilioWs.send(JSON.stringify({
        event: "media",
        streamSid: session.streamSid,
        media: { payload: mulawAudio },
      }));

      twilioWs.send(JSON.stringify({
        event: "mark",
        streamSid: session.streamSid,
        mark: { name: "audio_chunk" },
      }));
    });
  }

  /** Caller making any sound resets the "gone silent" timeout — no interrupt logic here. */
  private handleSilenceReset(openaiClient: RealtimeClient, twilioWs: WebSocket, ctx: FlowContext): void {
    openaiClient.on("input_audio_buffer.speech_started", () => {
      const { session } = ctx;
      if (session.silenceTimeout) clearTimeout(session.silenceTimeout);
      session.silenceTimeout = setTimeout(() => {
        logger.info("Caller silent for 60s — ending call", { correlationId: session.correlationId });
        twilioWs.close(1000, "Silence timeout");
      }, TIMEOUTS.ONGOING_SILENCE);
    });
  }

  private handleTranscripts(openaiClient: RealtimeClient, ctx: FlowContext): void {
    openaiClient.on("conversation.item.input_audio_transcription.completed", (event) => {
      void engine.handleTranscript(ctx, openaiClient, event.transcript);
    });

    // The assistant side of the transcript comes from the audio that actually
    // went out, not from the text we asked for — they diverge when the model
    // rephrases or the caller barges in partway through a sentence.
    openaiClient.on("response.audio_transcript.done", (event) => {
      if (typeof event?.transcript === "string") {
        engine.recordSpokenTranscript(ctx, event.transcript);
      }
    });
  }

  private handleFunctionCalls(openaiClient: RealtimeClient, ctx: FlowContext): void {
    openaiClient.on("response.function_call_arguments.done", (event) => {
      const { correlationId } = ctx.session;

      if (!event.name) {
        openaiClient.sendFunctionResult(event.call_id, { error: "Invalid function call — missing name" });
        return;
      }

      let args: any = {};
      try {
        args = event.arguments ? JSON.parse(event.arguments) : {};
      } catch (parseError) {
        logger.error("Malformed function arguments", {
          correlationId,
          error: parseError instanceof Error ? parseError.message : String(parseError),
        });
        openaiClient.sendFunctionResult(event.call_id, { error: "Invalid function arguments format" });
        return;
      }

      // Ack immediately so the conversation has no dangling tool call — this
      // is a conversation.item.create, not a response.create, so it doesn't
      // collide with the still-active response.
      openaiClient.sendFunctionResult(event.call_id, { received: true });

      // Defer the engine's reaction until THIS response is confirmed done.
      // handleToolCall may itself call speak()/createResponse() for the next
      // turn, but function_call_arguments.done fires before this same
      // response's own response.done — reacting immediately here raced with
      // it and OpenAI rejected the new response ("conversation already has
      // an active response in progress").
      ctx.session.onResponseDone = () =>
        engine.handleToolCall(ctx, openaiClient, event.name, args).catch((error) => {
          logger.error("Engine tool-call handling failed", {
            correlationId,
            function: event.name,
            error: error instanceof Error ? error.message : String(error),
          });
        });
    });
  }

  private handleResponseDone(openaiClient: RealtimeClient, ctx: FlowContext, onFirstResponseDone?: () => void): void {
    let firstResponseSeen = false;
    openaiClient.on("response.done", (event) => {
      if (!firstResponseSeen) {
        firstResponseSeen = true;
        onFirstResponseDone?.();
      }
      this.accumulateUsage(ctx, event);
      engine.notifyResponseDone(ctx, openaiClient);
    });
  }

  /**
   * Sum this response's token usage into the call's running total and log the
   * updated total. Realtime bills audio and text tokens at very different rates,
   * so they're kept separate; cached input tokens are a discounted subset of
   * input and split out too. The last line logged for a call is its full total,
   * so per-call cost = (each token bucket) x (its published per-1M rate).
   */
  private accumulateUsage(ctx: FlowContext, event: any): void {
    const u = event?.response?.usage;
    if (!u) return;

    const inDetails = u.input_token_details ?? {};
    const outDetails = u.output_token_details ?? {};
    const totals = (ctx.session.usage ??= {
      responses: 0,
      inputTextTokens: 0,
      inputAudioTokens: 0,
      inputCachedTokens: 0,
      outputTextTokens: 0,
      outputAudioTokens: 0,
      totalTokens: 0,
    });

    totals.responses += 1;
    totals.inputTextTokens += inDetails.text_tokens ?? 0;
    totals.inputAudioTokens += inDetails.audio_tokens ?? 0;
    totals.inputCachedTokens += inDetails.cached_tokens ?? 0;
    totals.outputTextTokens += outDetails.text_tokens ?? 0;
    totals.outputAudioTokens += outDetails.audio_tokens ?? 0;
    totals.totalTokens += u.total_tokens ?? 0;

    logger.info("Realtime usage", {
      correlationId: ctx.session.correlationId,
      callSid: ctx.session.callSid,
      responseTotalTokens: u.total_tokens ?? 0,
      callTotals: totals,
    });
  }

  private handleErrors(openaiClient: RealtimeClient, ctx: FlowContext): void {
    openaiClient.on("error", (event) => {
      logger.error("OpenAI error", { correlationId: ctx.session.correlationId, error: event.error });
    });
  }
}
