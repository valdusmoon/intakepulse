export type BannerState =
  | { type: "none" }
  | { type: "no_subscription" }
  | { type: "trialing"; daysLeft: number }
  | { type: "trial_expired" }
  | { type: "canceled"; accessUntil: string }
  | { type: "ended" }
  | { type: "payment_failed" };
