"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Card, CardBody, Button, Icon } from "@/components/dashboard/v2/primitives";

import { usePushNotifications } from "./usePushNotifications";

const DISMISS_KEY = "cv-push-prompt-dismissed";

/**
 * Dashboard prompt inviting the operator to turn on Web Push lead alerts on this
 * device. Self-hides when push is already enabled, unsupported, or dismissed. The
 * permanent control lives in Settings → Notifications; this is just the nudge.
 *
 * On iOS Safari, Web Push only works from an installed PWA, so there we show
 * Add-to-Home-Screen instructions instead of an enable button.
 */
export function NotificationsPrompt({ id }: { id?: string }) {
  const { state, busy, error, enable } = usePushNotifications();
  // Default hidden to avoid a flash before we've read localStorage on the client.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode — just hide for this session */
    }
    setDismissed(true);
  }

  if (dismissed) return null;
  if (state === "loading" || state === "enabled" || state === "unsupported") return null;

  let icon = "notifications_active";
  let title = "Get lead alerts on this device";
  let body =
    "Turn on notifications and Callverted pings you the moment a new lead is ready to call back — no watching your inbox.";
  let action: ReactNode = (
    <Button variant="primary" size="sm" disabled={busy} onClick={enable}>
      {busy ? "Turning on…" : "Turn on notifications"}
    </Button>
  );

  if (state === "ios-needs-install") {
    icon = "add_to_home_screen";
    title = "Add Callverted to your Home Screen";
    body =
      "On iPhone, lead alerts work once Callverted is on your Home Screen: tap the Share icon in Safari, choose “Add to Home Screen,” then open Callverted from there to turn them on.";
    action = null;
  } else if (state === "blocked") {
    icon = "notifications_off";
    title = "Notifications are blocked";
    body =
      "You've blocked notifications for Callverted. Re-enable them in your browser's site settings, then reload this page to turn on lead alerts.";
    action = null;
  }

  return (
    // The id lives on this wrapper (not the module scope) so the dashboard tour
    // only finds an anchor when the prompt is actually on screen; when it's
    // hidden the tour degrades to a centered step.
    <div id={id}>
    <Card className="mb-4">
      <CardBody className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-[11px] grid place-items-center shrink-0 bg-cv-primary-soft text-cv-primary">
          <Icon name={icon} className="!text-[21px]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-cv-ink">{title}</p>
          <p className="text-xs text-cv-muted mt-1 leading-relaxed">{body}</p>
          {error && <p className="text-xs text-cv-red mt-1.5">{error}</p>}
          <div className="mt-3 flex items-center gap-3">
            {action}
            <button
              type="button"
              onClick={dismiss}
              className="text-xs font-bold text-cv-muted hover:text-cv-ink transition-colors"
            >
              {action ? "Not now" : "Got it"}
            </button>
          </div>
        </div>
      </CardBody>
    </Card>
    </div>
  );
}
