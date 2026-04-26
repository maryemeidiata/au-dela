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

export function azimuthToCompassFull(az: number): string {
  const dirs = [
    "north", "north-northeast", "northeast", "east-northeast",
    "east", "east-southeast", "southeast", "south-southeast",
    "south", "south-southwest", "southwest", "west-southwest",
    "west", "west-northwest", "northwest", "north-northwest",
  ];
  return dirs[Math.round(az / 22.5) % 16];
}

export interface PlanetMission {
  name: string;
  year: string;
  note: string;
}

export interface PlanetDetailInfo {
  symbol: string;
  diameter: string;
  distanceFromSun: string;
  dayLength: string;
  yearLength: string;
  moons: number;
  gravity: string;
  atmosphere: string;
  temperature: string;
  missions: PlanetMission[];
  funFacts: string[];
}

export const PLANET_DETAILS: Record<string, PlanetDetailInfo> = {
  mercury: {
    symbol: "☿",
    diameter: "4,879 km — 38% of Earth",
    distanceFromSun: "0.39 AU · 57.9 million km",
    dayLength: "59 Earth days",
    yearLength: "88 Earth days",
    moons: 0,
    gravity: "3.7 m/s² — 38% of Earth's",
    atmosphere: "Virtually none — trace oxygen, sodium, hydrogen",
    temperature: "−180 °C to +430 °C",
    missions: [
      { name: "Mariner 10", year: "1974", note: "First spacecraft to visit Mercury — mapped 45% of its surface" },
      { name: "MESSENGER", year: "2011–2015", note: "First to orbit Mercury — confirmed water ice hiding in permanently shadowed polar craters" },
      { name: "BepiColombo", year: "2025 arrival", note: "Joint ESA / JAXA mission currently en route for the most detailed study yet" },
    ],
    funFacts: [
      "A day on Mercury (sunrise to sunrise) lasts longer than its entire year.",
      "Despite being closest to the Sun, Venus is hotter — Mercury has no atmosphere to trap heat.",
      "Its iron core is enormous — roughly 85% of the planet's radius.",
    ],
  },
  venus: {
    symbol: "♀",
    diameter: "12,104 km — 95% of Earth",
    distanceFromSun: "0.72 AU · 108 million km",
    dayLength: "243 Earth days (spins backwards)",
    yearLength: "225 Earth days",
    moons: 0,
    gravity: "8.87 m/s² — 90% of Earth's",
    atmosphere: "96% CO₂ — surface pressure 90× Earth's, clouds of sulfuric acid",
    temperature: "+465 °C average — hottest planet in the solar system",
    missions: [
      { name: "Venera 7", year: "1970", note: "First spacecraft to land on another planet and transmit data back to Earth" },
      { name: "Magellan", year: "1990–1994", note: "NASA radar-mapper revealed volcanic plains, mountains, and thousands of craters through the opaque clouds" },
      { name: "DAVINCI / VERITAS", year: "2030s", note: "Two approved NASA missions will study Venus's atmosphere and map its geology in unprecedented detail" },
    ],
    funFacts: [
      "The surface would crush and melt any lander within hours — the Soviet Venera record is 127 minutes.",
      "Venus spins so slowly that its day is longer than its year.",
      "From Earth it is always near the horizon — it orbits closer to the Sun than we do.",
    ],
  },
  mars: {
    symbol: "♂",
    diameter: "6,779 km — 53% of Earth",
    distanceFromSun: "1.52 AU · 228 million km",
    dayLength: "24 hours 37 minutes",
    yearLength: "687 Earth days",
    moons: 2,
    gravity: "3.7 m/s² — 38% of Earth's",
    atmosphere: "95% CO₂ — about 1% of Earth's pressure",
    temperature: "−153 °C to +20 °C",
    missions: [
      { name: "Viking 1 & 2", year: "1976", note: "First successful Mars landers — searched for signs of life, found complex chemistry but no definitive biology" },
      { name: "Curiosity", year: "2012–present", note: "Confirmed Mars once had liquid water and all the chemistry needed for microbial life" },
      { name: "Perseverance + Ingenuity", year: "2021–present", note: "Ingenuity made the first powered flight on another planet; Perseverance is collecting rock samples for eventual return to Earth" },
    ],
    funFacts: [
      "Olympus Mons is the tallest volcano in the solar system — three times the height of Everest.",
      "Valles Marineris stretches 4,000 km — as wide as the continental United States.",
      "NASA and SpaceX both have active plans to send humans to Mars in the 2030s.",
    ],
  },
  jupiter: {
    symbol: "♃",
    diameter: "139,820 km — 11× Earth",
    distanceFromSun: "5.2 AU · 779 million km",
    dayLength: "10 hours",
    yearLength: "12 Earth years",
    moons: 95,
    gravity: "24.8 m/s² — 2.5× Earth's",
    atmosphere: "89% hydrogen, 10% helium — no solid surface",
    temperature: "−108 °C at cloud tops",
    missions: [
      { name: "Pioneer 10 & 11", year: "1973–1974", note: "First spacecraft to cross the asteroid belt and send close-up images of Jupiter" },
      { name: "Voyager 1 & 2", year: "1979", note: "Discovered Jupiter's faint rings and active volcanoes on its moon Io — first volcanoes seen beyond Earth" },
      { name: "Galileo", year: "1995–2003", note: "Orbited Jupiter for 8 years and found strong evidence for a liquid ocean beneath Europa's icy crust" },
      { name: "Juno", year: "2016–present", note: "Still orbiting — mapping Jupiter's deep atmosphere, magnetic field, and enormous storms" },
    ],
    funFacts: [
      "The Great Red Spot is a storm larger than Earth that has raged continuously for over 350 years.",
      "When Galileo first saw Jupiter's four largest moons in 1610, it proved not everything in the universe orbits Earth.",
      "Europa's subsurface ocean is one of the top candidates in the search for extraterrestrial life.",
    ],
  },
  saturn: {
    symbol: "♄",
    diameter: "116,460 km — 9× Earth",
    distanceFromSun: "9.58 AU · 1.43 billion km",
    dayLength: "10.7 hours",
    yearLength: "29.5 Earth years",
    moons: 146,
    gravity: "10.4 m/s² — roughly Earth's",
    atmosphere: "96% hydrogen, 3% helium",
    temperature: "−178 °C at cloud tops",
    missions: [
      { name: "Pioneer 11", year: "1979", note: "First spacecraft to reach Saturn — discovered an additional ring and confirmed the planet's magnetic field" },
      { name: "Voyager 1 & 2", year: "1980–1981", note: "Revealed thousands of individual ringlets and discovered new moons — the rings are far more complex than anyone imagined" },
      { name: "Cassini–Huygens", year: "2004–2017", note: "Orbited for 13 years; Huygens landed on Titan (the only moon with a thick atmosphere); Cassini found Enceladus spraying liquid water into space" },
    ],
    funFacts: [
      "Saturn's rings are 270,000 km across but only about 100 metres thick — thinner relative to their width than a sheet of paper.",
      "Saturn is less dense than water — it would float if you could find an ocean large enough.",
      "Enceladus has geysers of water ice shooting into space, suggesting a warm subsurface ocean — one of the best places to look for life.",
    ],
  },
  uranus: {
    symbol: "⛢",
    diameter: "50,724 km — 4× Earth",
    distanceFromSun: "19.2 AU · 2.87 billion km",
    dayLength: "17.2 hours",
    yearLength: "84 Earth years",
    moons: 27,
    gravity: "8.7 m/s² — 89% of Earth's",
    atmosphere: "83% hydrogen, 15% helium, 2% methane — methane absorbs red light, giving Uranus its blue-green colour",
    temperature: "−224 °C — coldest planetary atmosphere in the solar system",
    missions: [
      { name: "Voyager 2", year: "1986", note: "The only spacecraft to ever visit Uranus — revealed 10 previously unknown moons, 2 new rings, and a lopsided magnetic field" },
    ],
    funFacts: [
      "Uranus rotates on its side — axial tilt of 98°, so it rolls around the Sun like a bowling ball.",
      "Its moons are all named after Shakespeare characters: Oberon, Titania, Miranda, Ariel, Umbriel…",
      "A Uranus orbiter mission is the highest-priority recommendation in NASA's 2023 planetary science roadmap.",
    ],
  },
  neptune: {
    symbol: "♆",
    diameter: "49,244 km — 3.9× Earth",
    distanceFromSun: "30.1 AU · 4.5 billion km",
    dayLength: "16 hours",
    yearLength: "165 Earth years",
    moons: 16,
    gravity: "11.2 m/s² — 114% of Earth's",
    atmosphere: "80% hydrogen, 19% helium, 1.5% methane",
    temperature: "−218 °C average",
    missions: [
      { name: "Voyager 2", year: "1989", note: "The only spacecraft to visit Neptune — discovered 6 moons, active geysers of nitrogen on Triton, and the Great Dark Spot storm" },
    ],
    funFacts: [
      "Neptune's winds reach 2,100 km/h — the fastest in the solar system.",
      "Triton orbits Neptune backwards and is slowly spiralling inward — in about 3.6 billion years it will break apart and form rings.",
      "Neptune was discovered by mathematics: astronomers predicted its position from gravitational wobbles in Uranus's orbit before anyone pointed a telescope at it.",
    ],
  },
};
