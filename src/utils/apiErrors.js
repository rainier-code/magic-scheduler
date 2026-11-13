export function getApiErrorMessage(error, fallback) {
  const response = error?.response?.data;
  if (Array.isArray(response?.errors) && response.errors.length) {
    return response.errors.join(" ");
  }
  if (typeof response?.message === "string" && response.message.trim()) {
    return response.message;
  }
  if (error?.response) return fallback;
  return "Unable to reach the server. Check your connection and try again.";
}
