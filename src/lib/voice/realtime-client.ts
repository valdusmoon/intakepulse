/**
 * OpenAI Realtime API WebSocket client — bidirectional audio streaming for
 * low-latency voice conversations. Provider-protocol only, no telephony coupling.
 */

import WebSocket from "ws";

export interface RealtimeClientConfig {
  apiKey: string;
  model: string;
  voice?: string;
  instructions?: string;
  temperature?: number;
}

export type ToolChoice = "none" | "auto" | { type: "function"; name: string };

export interface RealtimeSessionConfig {
  modalities: string[];
  instructions: string;
  voice: string;
  input_audio_format: string;
  output_audio_format: string;
  input_audio_transcription?: {
    model: string;
  };
  turn_detection?: {
    type: string;
    threshold: number;
    prefix_padding_ms: number;
    silence_duration_ms: number;
    // Server VAD still detects speech start/stop (needed for reliable end-of-turn
    // detection) but these two flags stop it from acting on that detection itself —
    // the state-machine engine decides exactly when to interrupt or respond.
    create_response: boolean;
    interrupt_response: boolean;
  };
  tools?: unknown[];
  tool_choice?: ToolChoice;
}

/** Per-response overrides — lets the engine constrain exactly one turn without
 *  mutating session-wide defaults (e.g. force one classification tool for a
 *  single state, or ask the model to say one specific fixed line). */
export interface ResponseOverrides {
  instructions?: string;
  modalities?: string[];
  tools?: unknown[];
  tool_choice?: ToolChoice;
}

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private config: RealtimeClientConfig;
  private isConnected = false;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor(config: RealtimeClientConfig) {
    this.config = {
      voice: "alloy",
      temperature: 0.3,
      ...config,
    };
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `wss://api.openai.com/v1/realtime?model=${this.config.model}`;

      this.ws = new WebSocket(url, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "OpenAI-Beta": "realtime=v1",
        },
      });

      this.ws.on("open", () => {
        this.isConnected = true;
        resolve();
      });

      this.ws.on("message", (data) => {
        this.handleMessage(data.toString());
      });

      this.ws.on("error", (error) => {
        this.isConnected = false;
        reject(error);
      });

      this.ws.on("close", () => {
        this.isConnected = false;
      });
    });
  }

  async configureSession(config: Partial<RealtimeSessionConfig>): Promise<void> {
    const sessionConfig: RealtimeSessionConfig = {
      modalities: ["text", "audio"],
      instructions: this.config.instructions || "You are a helpful AI assistant.",
      voice: this.config.voice || "alloy",
      input_audio_format: "g711_ulaw",
      output_audio_format: "g711_ulaw",
      input_audio_transcription: { model: "whisper-1" },
      turn_detection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 700,
        create_response: false,
        interrupt_response: false,
      },
      ...config,
    };

    this.sendEvent("session.update", { session: sessionConfig });
  }

  /** Send base64-encoded μ-law audio to OpenAI */
  sendAudio(audioBase64: string): void {
    if (!this.isConnected) return;
    this.sendEvent("input_audio_buffer.append", { audio: audioBase64 });
  }

  /**
   * Explicitly request a response for the current turn, optionally overriding
   * instructions/tools/tool_choice for just this one turn. The engine calls this
   * exactly once per state transition — nothing is generated automatically
   * (session.turn_detection.create_response is false).
   */
  createResponse(overrides?: ResponseOverrides): void {
    this.sendEvent("response.create", overrides ? { response: overrides } : undefined);
  }

  /**
   * Cancel an in-progress response — used on a DTMF keypress so a caller can
   * "press 1" over the AI still talking without waiting for it to finish.
   */
  cancelResponse(): void {
    this.sendEvent("response.cancel");
  }

  /**
   * Truncate a conversation item at the point the caller actually heard it —
   * called alongside cancelResponse() on DTMF interruption so OpenAI's own
   * transcript matches what was actually heard.
   */
  truncateItem(itemId: string, audioEndMs: number): void {
    this.sendEvent("conversation.item.truncate", {
      item_id: itemId,
      content_index: 0,
      audio_end_ms: audioEndMs,
    });
  }

  /**
   * Acknowledge a function call so the conversation history doesn't have a
   * dangling tool call. Does NOT trigger a new response — the engine explicitly
   * calls createResponse() when it's ready for the next state's prompt.
   */
  sendFunctionResult(callId: string, result: unknown): void {
    this.sendEvent("conversation.item.create", {
      item: {
        type: "function_call_output",
        call_id: callId,
        output: JSON.stringify(result),
      },
    });
  }

  on(eventType: string, handler: (data: any) => void): void {
    this.messageHandlers.set(eventType, handler);
  }

  private sendEvent(type: string, data?: Record<string, unknown>): void {
    if (!this.ws || !this.isConnected) return;
    this.ws.send(JSON.stringify({ type, ...data }));
  }

  private handleMessage(data: string): void {
    try {
      const event = JSON.parse(data);
      this.messageHandlers.get(event.type)?.(event);
      this.messageHandlers.get("*")?.(event);
    } catch (error) {
      console.error("[voice] Error handling OpenAI message:", error);
    }
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }
}
