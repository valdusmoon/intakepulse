/**
 * Twilio Media Streams event types — type-safe subset of the WebSocket protocol.
 */

export interface MediaFormat {
  encoding: "audio/x-mulaw";
  sampleRate: 8000;
  channels: 1;
}

export interface CustomParameters {
  callSid?: string;
  [key: string]: string | undefined;
}

export interface TwilioStreamStartEvent {
  event: "start";
  sequenceNumber?: string;
  start: {
    streamSid: string;
    accountSid: string;
    callSid: string;
    tracks: string[];
    mediaFormat: MediaFormat;
    customParameters?: CustomParameters;
  };
}

export interface TwilioMediaEvent {
  event: "media";
  sequenceNumber?: string;
  media: {
    track: "inbound" | "outbound";
    chunk: string;
    timestamp: string;
    payload: string; // Base64-encoded μ-law audio
  };
  streamSid: string;
}

export interface TwilioStopEvent {
  event: "stop";
  sequenceNumber?: string;
  stop: {
    accountSid: string;
    callSid: string;
  };
  streamSid: string;
}

export interface TwilioMarkEvent {
  event: "mark";
  sequenceNumber?: string;
  mark: { name: string };
  streamSid: string;
}

export interface TwilioConnectedEvent {
  event: "connected";
  protocol: "Call";
  version: string;
}

/** Sent when the caller presses a touch-tone key during an active stream —
 *  delivered even while the AI's response is playing. */
export interface TwilioDtmfEvent {
  event: "dtmf";
  sequenceNumber?: string;
  streamSid: string;
  dtmf: {
    track: "inbound_track" | "outbound_track";
    digit: string;
  };
}

export type TwilioEvent =
  | TwilioConnectedEvent
  | TwilioStreamStartEvent
  | TwilioMediaEvent
  | TwilioStopEvent
  | TwilioMarkEvent
  | TwilioDtmfEvent;

export interface TwilioOutgoingMedia {
  event: "media";
  streamSid: string;
  media: { payload: string };
}

export interface TwilioOutgoingMark {
  event: "mark";
  streamSid: string;
  mark: { name: string };
}

export interface TwilioOutgoingClear {
  event: "clear";
  streamSid: string;
}

export type TwilioOutgoingMessage = TwilioOutgoingMedia | TwilioOutgoingMark | TwilioOutgoingClear;
