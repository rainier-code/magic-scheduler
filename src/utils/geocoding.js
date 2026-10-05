export async function getCoordinates(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    address
  )}&limit=1`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Unable to search for this location.");
  }

  const data = await response.json();

  if (data.length === 0) {
    throw new Error("Location not found.");
  }

  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
  };
}