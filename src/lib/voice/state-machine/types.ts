import type { VerticalConfig } from "@/lib/db/schema/verticalConfigs";
import type { PricingRule } from "@/lib/db/schema/pricingRules";
import type { BusinessCallData, SessionState, VoiceState } from "../types/session";

export type { VoiceState };

/**
 * Everything the state machine needs for one call, bundled so engine functions
 * don't need five separate parameters. Fetched once at call start.
 */
export interface FlowContext {
  session: SessionState;
  business: BusinessCallData;
  verticalConfig: VerticalConfig;
  pricingRules: PricingRule[]; // active only
  /** Called once the call is fully wrapped up (lead captured, nothing left to say).
   *  The engine signals completion; the stream route owns actually closing the WS. */
  onComplete: () => void;
  /** Persist the transcript and hand the heavy post-call work (scoring, assessment,
   *  notifications, summary) to the durable background job. Invoked from inside the
   *  LIVE call — the WS-close path can't be trusted with an outbound HTTP call.
   *  Optional so the test-call harness and unit tests can omit it. */
  onFinalize?: () => Promise<void>;
}

export interface ClassificationSuccess {
  valid: true;
  value: string;
}
export interface ClassificationFailure {
  valid: false;
}
export type ClassificationResult = ClassificationSuccess | ClassificationFailure;
