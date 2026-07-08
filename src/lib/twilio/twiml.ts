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
 * callSid is passed as a <Parameter> (not query string) for proxy compatibility,
 * plus a signed token in the query string authorizing the WS upgrade itself.
 */
export function generateStreamTwiml(opts: { wssUrl: string; callSid: string; token: string }): string {
  const streamUrl = `${opts.wssUrl}?token=${encodeURIComponent(opts.token)}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${escapeXml(streamUrl)}">
      <Parameter name="callSid" value="${escapeXml(opts.callSid)}" />
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
