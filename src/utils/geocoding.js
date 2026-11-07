const NOMINATIM_URL = "https://nominatim.openstreetmap.org";

// Simple in-memory cache so the same address isn't looked up repeatedly
// (Nominatim's usage policy allows ~1 request per second).
const geocodeCache = new Map();

export async function getCoordinates(address, { signal } = {}) {
  const query = address?.trim();

  if (!query) {
    throw new Error("Please enter a location.");
  }

  const cacheKey = query.toLowerCase();

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  let response;

  try {
    response = await fetch(
      `${NOMINATIM_URL}/search?format=json&limit=1&q=${encodeURIComponent(
        query
      )}`,
      { signal, headers: { "Accept-Language": "en" } }
    );
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "Couldn't reach the location service. Check your internet connection.",
      { cause: error }
    );
  }

  if (!response.ok) {
    throw new Error("Unable to search for this location right now.", {
      cause: new Error(
        `Nominatim search failed: ${response.status} ${response.statusText}`
      ),
    });
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
    throw new Error("The location service returned an unexpected response.", {
      cause: error,
    });
  }

  if (data.length === 0) {
    throw new Error(
      "Location not found. Try adding a city or province."
    );
  }

  const result = {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };

  geocodeCache.set(cacheKey, result);

  return result;
}

// Turns coordinates into a readable place name, e.g. "Porac, Pampanga"
export async function reverseGeocode(latitude, longitude, { signal } = {}) {
  const fallback = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

  try {
    const response = await fetch(
      `${NOMINATIM_URL}/reverse?format=json&zoom=16&lat=${latitude}&lon=${longitude}`,
      { signal, headers: { "Accept-Language": "en" } }
    );

    if (!response.ok) return fallback;

    const data = await response.json();
    const address = data.address || {};

    const parts = [
      address.road,
      address.suburb || address.village || address.neighbourhood,
      address.city || address.town || address.municipality,
      address.state || address.province,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : data.display_name || fallback;
  } catch {
    return fallback;
  }
}

export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        const messages = {
          1: "Location permission was denied. Allow access in your browser settings.",
          2: "Your location couldn't be determined. Try again or type it in.",
          3: "Getting your location took too long. Please try again.",
        };

        reject(
          new Error(messages[error.code] || "Unable to get your location.", {
            cause: error,
          })
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  });
}