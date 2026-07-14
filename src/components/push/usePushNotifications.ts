"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getExistingSubscription,
  isIOS,
  isPushSupported,
  isStandalone,
  subscribeToPush,
  unsubscribeFromPush,
  VAPID_PUBLIC_KEY,
} from "@/lib/push/client";

export type PushState =
  | "loading" // still checking on mount
  | "unsupported" // browser can't do web push at all
  | "ios-needs-install" // iOS Safari, not installed → must Add to Home Screen first
  | "blocked" // permission was denied by the user
  | "enabled" // subscribed and active on this device
  | "disabled"; // supported + allowed, but not subscribed yet

export function usePushNotifications() {
  const [state, setState] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    // iOS Safari only exposes the Push API once installed to the Home Screen.
    if (isIOS() && !isStandalone()) {
      setState("ios-needs-install");
      return;
    }
    if (!isPushSupported() || !VAPID_PUBLIC_KEY) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("blocked");
      return;
    }
    const sub = await getExistingSubscription();
    setState(sub ? "enabled" : "disabled");
  }, []);

  useEffect(() => {
    refresh().catch(() => setState("unsupported"));
  }, [refresh]);

  const enable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await subscribeToPush();
      setState("enabled");
    } catch (e) {
      const code = e instanceof Error ? e.message : "unknown";
      if (code === "permission-denied") {
        setState("blocked");
        setError("Notifications are blocked. Enable them in your browser settings.");
      } else if (code === "push-not-configured") {
        setError("Push isn't configured on the server yet.");
      } else {
        setError("Couldn't turn on notifications. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await unsubscribeFromPush();
      setState("disabled");
    } catch {
      setError("Couldn't turn off notifications.");
    } finally {
      setBusy(false);
    }
  }, []);

  return { state, busy, error, enable, disable, refresh };
}
