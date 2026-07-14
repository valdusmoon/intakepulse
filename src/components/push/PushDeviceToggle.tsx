"use client";

import { Toggle } from "@/components/dashboard/v2/primitives";

import { usePushNotifications } from "./usePushNotifications";

/**
 * Settings row that turns Web Push lead alerts on/off for THIS device. Push is
 * per-browser, so a subscription only covers the device it was created on — an
 * operator enables it on each phone/computer they want alerts on.
 */
export function PushDeviceToggle() {
  const { state, busy, error, enable, disable } = usePushNotifications();

  const enabled = state === "enabled";
  const canToggle = state === "enabled" || state === "disabled";

  let note =
    "Instant push alert to this device when a new lead is ready — the fastest way to hear about a job.";
  if (state === "ios-needs-install") {
    note =
      "On iPhone, add Callverted to your Home Screen first (Share → Add to Home Screen), then open it from there to enable push.";
  } else if (state === "blocked") {
    note =
      "Notifications are blocked for Callverted. Re-enable them in your browser's site settings, then reload.";
  } else if (state === "unsupported") {
    note = "This browser doesn't support push notifications.";
  }

  return (
    <div className="flex justify-between items-center py-3.5 border-t border-cv-border">
      <div className="pr-4">
        <strong className="block text-xs">Phone alerts on this device</strong>
        <span className="block text-cv-muted text-[10px] mt-1">{note}</span>
        {error && <span className="block text-cv-red text-[10px] mt-1">{error}</span>}
      </div>
      <Toggle
        checked={enabled}
        onChange={(next) => {
          if (!canToggle || busy) return;
          if (next) enable();
          else disable();
        }}
      />
    </div>
  );
}
