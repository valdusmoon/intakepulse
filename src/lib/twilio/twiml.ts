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
  recordingEnabled?: boolean;
  recordingStatusCallbackUrl?: string;
}): string {
  let recordAttrs = "";
  if (opts.recordingEnabled) {
    recordAttrs = ' record="record-from-answer"';
    if (opts.recordingStatusCallbackUrl) {
      recordAttrs += ` recordingStatusCallback="${escapeXml(opts.recordingStatusCallbackUrl)}" recordingStatusCallbackEvent="completed"`;
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="${opts.timeoutSeconds}" action="${escapeXml(opts.actionUrl)}" answerOnBridge="true"${recordAttrs}>
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
export function generateStreamTwiml(opts: { wssUrl: string; callSid: string; token: string }): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${escapeXml(opts.wssUrl)}">
      <Parameter name="callSid" value="${escapeXml(opts.callSid)}" />
      <Parameter name="token" value="${escapeXml(opts.token)}" />
    </Stream>
  </Connect>
</Response>`;
}

/**
 * Warm-transfer a live call to another number (used by the transfer_call tool).
 */
export function generateTransferTwiml(to: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Number>${escapeXml(to)}</Number>
  </Dial>
</Response>`;
}
