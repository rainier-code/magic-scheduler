const net = require("net");

function isValidEndpoint(endpoint) {
  if (typeof endpoint !== "string" || endpoint.length > 2048) return false;
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !net.isIP(url.hostname) &&
      url.hostname.includes(".") &&
      !url.hostname.endsWith(".local") &&
      !url.hostname.endsWith(".internal");
  } catch {
    return false;
  }
}

function isValidKey(key, minLength, maxLength) {
  return typeof key === "string" &&
    key.length >= minLength &&
    key.length <= maxLength &&
    /^[A-Za-z0-9_-]+$/.test(key);
}

function validatePushSubscription(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return isValidEndpoint(value.endpoint) &&
    isValidKey(value.keys?.p256dh, 40, 200) &&
    isValidKey(value.keys?.auth, 16, 100);
}

module.exports = { isValidEndpoint, validatePushSubscription };
