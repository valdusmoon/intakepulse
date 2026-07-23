/* Callverted service worker — Web Push ONLY.
 *
 * Deliberately no fetch/caching handler: this app is not offline-first, and a
 * cache layer here would risk serving stale authenticated pages. The worker
 * exists solely to receive push messages and open the right lead on tap.
 */

self.addEventListener("install", () => {
  // Activate a new worker immediately rather than waiting for all tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "New lead", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "New lead";
  const url = data.url || "/dashboard/leads";
  const options = {
    body: data.body || "",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    tag: data.tag || "lead",
    // Keep hot-lead alerts on screen until the operator acts.
    requireInteraction: true,
    data: { url },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/* Browsers rotate push endpoints (Chrome/FCM does this without warning). Without
 * this handler the server keeps sending to the dead endpoint — FCM even accepts
 * the send (201, no 410 to prune) and silently drops it, so alerts just stop
 * until the user toggles push off/on by hand. Re-subscribe with the same VAPID
 * key and swap the server row for the new endpoint. */
self.addEventListener("pushsubscriptionchange", (event) => {
  const oldEndpoint = event.oldSubscription ? event.oldSubscription.endpoint : null;

  const resubscribe = Promise.resolve(event.newSubscription)
    .then((sub) => {
      if (sub) return sub;
      // The old subscription's options carry the applicationServerKey, so the
      // worker doesn't need the VAPID public key baked in.
      const options = (event.oldSubscription && event.oldSubscription.options) || {
        userVisibleOnly: true,
      };
      return self.registration.pushManager.subscribe(options);
    })
    .then((sub) =>
      fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // oldEndpoint lets the server delete the rotated-away row instead of
        // leaving a dead sibling to 410 later.
        body: JSON.stringify({ subscription: sub.toJSON(), oldEndpoint }),
      }),
    )
    .catch(() => {
      // Best effort — if this fails (e.g. signed out), the dashboard's
      // re-sync-on-load repairs the registration on the next visit.
    });

  event.waitUntil(resubscribe);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If a tab is already on this lead, focus it.
        for (const client of clientList) {
          if (client.url.includes(target) && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise focus any open app window and navigate it there.
        for (const client of clientList) {
          if ("focus" in client && "navigate" in client) {
            return client.focus().then(() => client.navigate(target));
          }
        }
        // No window open — open a new one.
        if (self.clients.openWindow) {
          return self.clients.openWindow(target);
        }
      }),
  );
});
