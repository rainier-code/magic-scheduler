
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat(
    (4 - (base64String.length % 4)) % 4
  );

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map((character) =>
      character.charCodeAt(0)
    )
  );
}

function getServiceWorkerRegistration() {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(
          new Error(
            "Service worker is not ready. Reload the app and try again."
          )
        ),
        10000
      )
    ),
  ]);
}

function validateApiUrl() {
  if (!API_URL) {
    throw new Error(
      "API URL is missing. Check your frontend .env file."
    );
  }
}

// Enable push notifications on this device.
export async function subscribeToPushNotifications() {
  console.log("Push setup: checking browser support...");

  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    throw new Error(
      "Push notifications are not supported by this browser."
    );
  }

  validateApiUrl();

  console.log("Push setup: requesting permission...");

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error(
      "Notification permission was not granted."
    );
  }

  console.log("Push setup: waiting for service worker...");

  const registration = await getServiceWorkerRegistration();

  console.log("Push setup: service worker is ready.");

  const vapidPublicKey =
    import.meta.env.VITE_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    throw new Error("VAPID public key is missing.");
  }

  console.log("Push setup: checking existing subscription...");

  let subscription =
    await registration.pushManager.getSubscription();

  if (!subscription) {
    console.log("Push setup: creating subscription...");

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey:
        urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  console.log("Push setup: saving subscription to backend...");

  await axios.post(
    `${API_URL}/api/push/subscribe`,
    subscription.toJSON(),
    { timeout: 15000 }
  );

  console.log("Push setup: subscription saved successfully.");

  return subscription;
}

// Disable push notifications on this device.
export async function unsubscribeFromPushNotifications() {
  validateApiUrl();

  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported.");
  }

  const registration = await getServiceWorkerRegistration();

  const subscription =
    await registration.pushManager.getSubscription();

  if (!subscription) {
    return;
  }

  const endpoint = subscription.endpoint;

  await axios.delete(
    `${API_URL}/api/push/unsubscribe`,
    {
      data: { endpoint },
      timeout: 15000,
    }
  );

  await subscription.unsubscribe();
}