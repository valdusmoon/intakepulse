/**
 * OpenAI Realtime API event types — type-safe subset of the WebSocket protocol
 * we actually handle.
 */

export interface OpenAIAudioDeltaEvent {
  type: "response.audio.delta";
  delta: string; // Base64-encoded audio
  item_id?: string;
}

export interface OpenAITranscriptEvent {
  type: "conversation.item.input_audio_transcription.completed";
  item_id: string;
  content_index: number;
  transcript: string;
}

export interface OpenAITextDeltaEvent {
  type: "response.text.delta";
  delta: string;
  item_id?: string;
}

export interface OpenAITextDoneEvent {
  type: "response.text.done";
  text: string;
}

export interface OpenAISpeechStartedEvent {
  type: "input_audio_buffer.speech_started";
  audio_start_ms: number;
}

export interface OpenAIResponseDoneEvent {
  type: "response.done";
  response: {
    id: string;
    status: string;
  };
}

export interface OpenAIFunctionCallEvent {
  type: "response.function_call_arguments.done";
  call_id: string;
  name: string;
  arguments: string; // JSON string
}

export interface OpenAIErrorEvent {
  type: "error";
  error: {
    type: string;
    code: string;
    message: string;
    param?: string;
  };
}

export type OpenAIEvent =
  | OpenAIAudioDeltaEvent
  | OpenAITranscriptEvent
  | OpenAITextDeltaEvent
  | OpenAITextDoneEvent
  | OpenAISpeechStartedEvent
  | OpenAIResponseDoneEvent
  | OpenAIFunctionCallEvent
  | OpenAIErrorEvent;

export interface FunctionResult {
  success?: boolean;
  error?: string;
  [key: string]: unknown;
}
