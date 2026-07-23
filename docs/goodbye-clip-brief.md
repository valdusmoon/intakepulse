# Goodbye audio clipping at hangup — Twilio Media Streams + OpenAI Realtime

A briefing on a persistent audio bug in our AI phone-intake system. It has survived two
fixes. Everything relevant is in this document: the architecture, the exact end-of-call
code, the history of what we tried, the instrumentation we just added, and our current
hypotheses. We would like your read on which hypothesis is most likely and whether there
are known OpenAI Realtime or Twilio Media Streams behaviors that explain it.

## The symptom

The AI's final sign-off line ("You're all set. Thanks for calling, and take care.") gets
cut off near the end when the system hangs up. The caller hears the goodbye start and then
the line goes dead before it finishes. Everything else about the call is smooth. This has
now persisted through three live production test calls, across two successive fixes.

## Architecture

- Inbound phone call → Twilio `<Connect><Stream>` → WebSocket to our Next.js route running
  on Vercel (Node runtime, `experimental_upgradeWebSocket` from `@vercel/functions`).
- That route bridges audio to an OpenAI Realtime session over a second WebSocket.
- Model: `gpt-realtime-2.1-mini` (default; env-overridable), voice `marin`, temperature 0.4.
- Audio both directions is G.711 μ-law 8 kHz (`format: { type: "audio/pcmu" }` in the
  session config), passed through base64 with no transcoding.
- The conversation is a rigid state machine in our code. The model only speaks lines we
  dictate or classifies input. The goodbye is a dictated line spoken via a
  `response.create` with exact instructions.
- Important platform constraint: when our WebSocket to Twilio closes, Twilio ends the
  phone call (the `<Stream>` is the call). So "close the WS" and "hang up on the caller"
  are the same act.

## How outbound audio flows (relay code)

Every `response.output_audio.delta` from OpenAI is forwarded to Twilio immediately, and we
track when the queued audio will finish playing in real time, computed from the actual
μ-law byte count (8 bytes = 1 ms at 8 kHz). After each media frame we also send a Twilio
`mark` event named `audio_chunk` (Twilio echoes a mark back only after all media queued
before it has been played to the caller):

```ts
openaiClient.on("response.output_audio.delta", (event) => {
  const mulawAudio = event.delta; // base64 μ-law straight from OpenAI

  // μ-law @ 8kHz = 8 bytes per millisecond; base64 carries 3 bytes per 4 chars.
  const now = Date.now();
  const chunkMs = Math.round(((mulawAudio.length * 3) / 4) / 8);
  session.audioQueuedUntil = Math.max(session.audioQueuedUntil ?? now, now) + chunkMs;

  twilioWs.send(JSON.stringify({ event: "media", streamSid, media: { payload: mulawAudio } }));
  twilioWs.send(JSON.stringify({ event: "mark", streamSid, mark: { name: "audio_chunk" } }));
});
```

## The end-of-call sequence, exactly

1. The state machine reaches its final state and speaks the goodbye:

```ts
async function finishCall(ctx, client) {
  ctx.session.state = "create_lead";
  await captureLeadOnce(ctx);        // fast DB insert
  await ctx.onFinalize?.();          // fast: transcript write + Inngest event
  ctx.session.state = "end";
  speak(ctx, client, goodbyeLine(ctx));   // response.create with the exact text
  ctx.session.onResponseDone = () => ctx.onComplete();
}
```

2. When OpenAI's `response.done` for the goodbye arrives, `onComplete` runs. Note that
   `response.done` means generation finished; OpenAI generates much faster than 8 kHz
   real time, so at this moment the caller typically still has seconds of audio queued
   in Twilio's buffer. `onComplete` does this:

```ts
// The state machine signals completion; we own the actual WS lifecycle.
const remainingMs = Math.max(0, (session.audioQueuedUntil ?? 0) - Date.now());
const waitMs = Math.min(remainingMs + GOODBYE_TAIL_PADDING, GOODBYE_MAX_WAIT);
// GOODBYE_TAIL_PADDING = 900ms, GOODBYE_MAX_WAIT = 20s

// Queue a named mark BEHIND the goodbye audio. Twilio echoes it back once
// everything queued before it has actually PLAYED to the caller.
ws.send(JSON.stringify({ event: "mark", streamSid, mark: { name: "goodbye-complete" } }));

// Backstop only: if the echo never comes, close after the estimated playout.
setTimeout(() => ws.close(1000, "Conversation complete"), waitMs);
```

3. Two ways the call then ends:
   - Preferred: Twilio echoes the `goodbye-complete` mark back to us (meaning the audio
     played out fully), and we close the WS immediately on receiving it.
   - Backstop: the timer fires after `remainingMs + 900ms` and closes the WS.

4. Closing the WS ends the phone call. Cleanup runs (fast DB writes only).

## Fix history

- **Round 1 (broken):** we closed the WS on a fixed 1.2 s delay after `response.done`.
  Clipped badly, and the diagnosis was clear: `response.done` is generation-complete, not
  playback-complete, and generation runs seconds ahead of the 8 kHz playout.
- **Round 2 (current code, still clipping):** added the `audioQueuedUntil` byte-count
  playout math, the 900 ms tail padding, and the `goodbye-complete` Twilio mark echo as
  the primary close trigger with the timer demoted to a backstop. The goodbye still
  clips near the end.

## Instrumentation just added (deploying next)

We stopped guessing and added per-call diagnostics. After the next test call the logs
will contain:

- A counter of `audio_chunk` marks sent vs. echoed (how far Twilio playback lags behind
  our sends at any moment).
- On `goodbye-complete` echo: time from mark-send to echo, and `estimatedUnplayedMs`
  (our byte-math estimate of audio still unplayed at echo time; a positive value means
  Twilio claimed playback finished earlier than the math predicts).
- A warning if the backstop timer fires without the echo ever arriving, with the same
  numbers.
- A log when Twilio sends its `stop` event first (meaning the stream died upstream of
  our close logic).
- One summary line per call: `closedBy` (mark-echo | backstop-timer | twilio-stop | ...),
  whether the goodbye mark was sent and echoed, mark-to-echo latency, and estimated
  unplayed ms at teardown.

## Hypotheses, ranked

**H1. The mark echo is honest, but closing the WS at echo-time still cuts the audio
tail somewhere downstream in the telephony path.** The mark echo tells us Twilio's media
stream finished emitting the audio into the call. But between Twilio and the caller's ear
there are carrier-side jitter buffers and (for mobile callers) radio-link buffering.
If closing the WS tears down the call leg immediately, the last few hundred ms may still
be in flight downstream. If this is right, the fix is a short fixed delay (500–1000 ms)
AFTER the mark echo before closing. Question: is there a known/recommended grace interval
between "mark echoed" and terminating a `<Connect><Stream>` call?

**H2. The mark echo arrives early.** Possible causes we can think of: Twilio returning
marks on stream teardown rather than playback; some interaction where a `clear` event
flushes pending marks (we do send `clear` on barge-in, but barge-in is hard-disabled in
the end state, so this shouldn't be in play during the goodbye); or mark echo semantics
being "media received/buffered" rather than "media played" in some edge case. The new
`estimatedUnplayedMs` number will confirm or kill this: a large positive value at echo
time = early echo.

**H3. The backstop timer is what actually closes the call (echo never arrives) and the
byte math underestimates.** Our playout model assumes playback starts the instant we send
the first byte. Real playback starts after a network + jitter-buffer delay L. If the echo
never arrives (lost, or Vercel's experimental WS delivering inbound frames unreliably
during teardown), the timer closes at `remaining + 900ms`, which clips if L > 900 ms.
The `closedBy` field will answer this definitively.

**H4. The audio itself is truncated at the source.** The Realtime API's final
`output_audio.delta` chunks for a response arriving after `response.done`, getting lost,
or the `marin` voice's synthesis ending abruptly. We doubt this (the same pipeline plays
every other line fully, and clipping only at hangup points to teardown timing), but we'd
like confirmation: are all `response.output_audio.delta` events for a response guaranteed
to be emitted strictly before that response's `response.done`?

## Questions for you

1. Ordering guarantee: in the Realtime API, is every `response.output_audio.delta`
   for a response always delivered before its `response.done`? Any known cases of audio
   deltas trailing or being dropped at session close?
2. Is there any known issue with `gpt-realtime-2.1-mini` / voice `marin` producing
   truncated final syllables in generated audio (i.e., clipping at generation rather
   than playback)?
3. Twilio Media Streams mark semantics: does a mark echo strictly mean "all prior media
   has been played into the call," or can it fire on buffer-accepted or during teardown?
   Any known interactions that flush marks early?
4. For bidirectional `<Connect><Stream>`, what is the recommended way to hang up only
   after the caller has fully heard the last audio? Is close-on-mark-echo the blessed
   pattern, and should there be a grace delay after the echo before closing the WS,
   given downstream carrier buffering?
5. Would you restructure the ending entirely, e.g., have the server send a `<Stop>` /
   TwiML redirect to a `<Say>`/`<Hangup>` instead of closing the WS, so Twilio owns the
   teardown timing?
6. Given the H1–H4 ranking, which would you bet on, and what single measurement would
   most cheaply discriminate?

Constraints to respect in any suggestion: the greeting/flow architecture is settled (rigid
state machine, model never drives); we run on Vercel's experimental WebSocket support, so
work done after the WS closes is unreliable (outbound HTTP after close is known-frozen);
and the goodbye line itself must stay (it closes the call after a confirmation that
already promised a callback).

---

## Update (2026-07-23): reviewed answer, changes implemented

The review confirmed H1 with a Twilio-docs-grounded mechanism: our `<Connect>` had no
`action` attribute, so the TwiML document ended the instant our WS closed and Twilio hung
up right there. The mark echo proves Twilio finished emitting the audio, not that the
tail cleared carrier-side buffers. Implemented:

- `<Connect action="/api/twilio/voice/after-stream" method="POST">` on both Stream TwiML
  emitters. The action route (Twilio-signature-verified) returns
  `<Pause length="1"/><Hangup/>` and logs per call, so Twilio's call-control layer owns
  the teardown and the logs prove the guard ran.
- Close-on-mark-echo, byte-math backstop timer, and all the per-call diagnostics stay
  exactly as described above (mark echo remains the primary playout truth; the timer is
  only for "echo never came").
- A state-tagged log on every `clear` we send, to prove no clear fires near the close
  path (barge-in and DTMF interrupts are already hard-guarded out of the terminal states,
  and the clipped test call was keypadless).

Deliberately NOT taken: switching the goodbye trigger from `response.done` to
`response.output_audio.done`. For a single response, `output_audio.done` precedes
`response.done` and all audio deltas precede both, so `response.done` is the same-or-later
signal; the wait is on Twilio playout, not OpenAI generation, and the engine's turn
sequencing is keyed to `response.done` throughout. Changing it would gain nothing.
