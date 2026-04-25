export interface PlanetPosition {
  id: string;
  name: string;
  distance: { fromEarth: { au: string } };
  position: {
    horizontal: { altitude: { degrees: string }; azimuth: { degrees: string } };
    equatorial: { rightAscension: { hours: string }; declination: { degrees: string } };
  };
  extraInfo: { magnitude: number; elongation: number };
}

export interface AstronomyAPIResponse {
  data: {
    dates: {
      from: string;
      to: string;
    };
    observer: { location: { longitude: number; latitude: number; elevation: number } };
    rows: Array<{ body: PlanetPosition; positions: PlanetPosition[] }>;
  };
}

function padDate(n: number) { return n.toString().padStart(2, "0"); }

function formatDate(d: Date) {
  return `${d.getFullYear()}-${padDate(d.getMonth() + 1)}-${padDate(d.getDate())}`;
}

function formatTime(d: Date) {
  return `${padDate(d.getHours())}:${padDate(d.getMinutes())}:00`;
}

export async function fetchPlanetPositions(
  lat: number,
  lon: number,
  date: Date
): Promise<AstronomyAPIResponse> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    elevation: "0",
    from_date: formatDate(date),
    to_date: formatDate(date),
    time: formatTime(date),
  });

  const res = await fetch(`/api/planets?${params}`);
  if (!res.ok) throw new Error("Failed to fetch planet data");
  return res.json();
}

export const PLANET_COLORS: Record<string, string> = {
  mercury: "#b5b5b5",
  venus: "#ffe4a0",
  mars: "#e8603c",
  jupiter: "#c8b090",
  saturn: "#e8d5a0",
  uranus: "#8fd8e4",
  neptune: "#5080ff",
  moon: "#e8e8d8",
  sun: "#fffacd",
};

export const PLANET_DESCRIPTIONS: Record<string, string> = {
  mercury: "The swift messenger, never straying far from the Sun's glow. Spot it low on the horizon just after sunset or before sunrise.",
  venus: "The brightest object in the night sky after the Moon. So dazzling it can cast shadows on a dark night.",
  mars: "The red wanderer, its color comes from iron oxide on its ancient surface. Watch it drift against the stars week by week.",
  jupiter: "The giant, a world so large that all other planets could fit inside it with room to spare. Its four bright moons are visible in binoculars.",
  saturn: "The ringed wonder. Nothing in the solar system prepares you for seeing those rings for the first time, even in a small telescope.",
  uranus: "A pale blue-green ice giant, tipped on its side, rolling through space like a bowling ball.",
  neptune: "The most distant of the planets, a deep blue world of raging supersonic winds invisible to the naked eye.",
  moon: "Our nearest neighbor, a world of silence and ancient craters, lighting the night with borrowed sunlight.",
};

export function magnitudeToPlainLanguage(mag: number): string {
  if (mag < -3) return "extraordinarily bright, visible in daylight";
  if (mag < -1) return "one of the brightest objects in the sky";
  if (mag < 0) return "very bright, unmistakable";
  if (mag < 1) return "bright, easy to spot";
  if (mag < 2) return "moderately bright";
  if (mag < 3) return "visible without difficulty";
  if (mag < 4) return "visible to the naked eye from dark skies";
  if (mag < 5) return "faint, requires dark skies";
  return "very faint, challenging without binoculars";
}

export function elevationToPlainLanguage(alt: number): string {
  if (alt < 0) return "below the horizon";
  if (alt < 10) return "very low on the horizon";
  if (alt < 25) return "low in the sky";
  if (alt < 45) return "about a third of the way up the sky";
  if (alt < 65) return "fairly high in the sky";
  if (alt < 80) return "high overhead";
  return "nearly straight overhead";
}

export function azimuthToCompass(az: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(az / 22.5) % 16];
}
