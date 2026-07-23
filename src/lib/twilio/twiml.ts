import { escapeXml } from "./client";

/**
 * Say a message and hang up. Used for guard-rail rejections (no business found,
 * subscription inactive, emergency kill switch, etc).
 */
export function generateErrorTwiml(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(message)}</Say>
  <Hangup/>
</Response>`;
}

/**
 * Ring the business's real line first. `actionUrl` receives the DialCallStatus
 * callback that decides whether the business answered or the AI should take over.
 */
export function generateDialTwiml(opts: {
  forwardingNumber: string;
  timeoutSeconds: number;
  actionUrl: string;
  /** Spoken before the team is dialed so the caller hears the recording notice
   *  before the human leg is captured — the two-party-consent point. */
  disclosure?: string | null;
  /** Record the human-answered leg. Only honored when a disclosure is present:
   *  we never record without a spoken notice. */
  recordHumanLeg?: boolean;
  recordingStatusCallbackUrl?: string;
}): string {
  // Record the human leg only with a spoken disclosure + a callback to receive it.
  // `record-from-answer-dual` captures just the answered conversation (both
  // channels), skipping ringback/voicemail. Completed recordings POST to
  // recordingStatusCallbackUrl, which kicks off transcription (then the audio is
  // deleted — see the recording webhook / process-human-call).
  const willRecord = !!opts.recordHumanLeg && !!opts.disclosure && !!opts.recordingStatusCallbackUrl;
  const recordAttrs = willRecord
    ? ` record="record-from-answer-dual" recordingStatusCallback="${escapeXml(opts.recordingStatusCallbackUrl!)}" recordingStatusCallbackEvent="completed"`
    : "";
  // Speak the disclosure whenever one is passed (coupled with recording by the
  // caller). This answers the inbound leg, so the caller hears the notice, then
  // ringback while the team is dialed (answerOnBridge stays true).
  const sayDisclosure = opts.disclosure
    ? `  <Say voice="Polly.Joanna">${escapeXml(opts.disclosure)}</Say>\n`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
${sayDisclosure}  <Dial timeout="${opts.timeoutSeconds}" action="${escapeXml(opts.actionUrl)}" answerOnBridge="true"${recordAttrs}>
    <Number>${escapeXml(opts.forwardingNumber)}</Number>
  </Dial>
</Response>`;
}

/**
 * Hand the call to the AI overflow receptionist via a Media Stream.
 * Twilio's Media Streams client doesn't support query string parameters on the
 * <Stream> url (fails with error 31920, "WebSocket handshake error") — both
 * callSid and the signed auth token are passed as <Parameter> elements instead,
 * delivered in the "start" event once the WS connection is already open.
 */
export function generateStreamTwiml(opts: {
  wssUrl: string;
  callSid: string;
  token: string;
  /** statusCallback for stream lifecycle events. The stream-stopped event is the
   *  reliable trigger for post-call finalization — a normal inbound HTTP request,
   *  unlike the WebSocket-close path, where outbound calls get frozen. */
  statusCallbackUrl?: string;
}): string {
  const statusAttrs = opts.statusCallbackUrl
    ? ` statusCallback="${escapeXml(opts.statusCallbackUrl)}" statusCallbackMethod="POST"`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${escapeXml(opts.wssUrl)}"${statusAttrs}>
      <Parameter name="callSid" value="${escapeXml(opts.callSid)}" />
      <Parameter name="token" value="${escapeXml(opts.token)}" />
    </Stream>
  </Connect>
</Response>`;
}
