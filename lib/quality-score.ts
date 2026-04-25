import cloudCoverData from "@/data/cloud-cover.json";
import { moonPhaseOnDate } from "./coordinates";

interface CityEntry {
  coords: [number, number];
  monthly: number[];
}

interface CloudData {
  cities: Record<string, CityEntry>;
  default_by_type: { urban: number; suburban: number; rural: number };
}

const data = cloudCoverData as unknown as CloudData;

function nearestCityCloudCover(lat: number, lon: number, month: number): number {
  let closest: CityEntry | null = null;
  let minDist = Infinity;

  for (const city of Object.values(data.cities)) {
    const d = Math.hypot(city.coords[0] - lat, city.coords[1] - lon);
    if (d < minDist) { minDist = d; closest = city; }
  }

  if (closest && minDist < 15) {
    return closest.monthly[month];
  }
  return data.default_by_type.suburban;
}

function lightPollutionScore(lat: number, lon: number): number {
  // Approximate based on proximity to major city centers.
  // Returns 0 (worst) to 100 (darkest skies).
  const urbanCenters: [number, number][] = [
    [51.5, -0.1], [48.9, 2.3], [40.7, -74.0], [34.0, -118.2],
    [35.7, 139.7], [40.4, -3.7], [41.9, 12.5], [52.5, 13.4],
    [55.8, 37.6], [39.9, 116.4], [19.1, 72.9], [23.1, 113.3],
    [-23.5, -46.6], [31.2, 121.5], [28.6, 77.2],
  ];

  let minDist = Infinity;
  for (const [clat, clon] of urbanCenters) {
    const d = Math.hypot(clat - lat, clon - lon);
    if (d < minDist) minDist = d;
  }

  if (minDist < 0.5) return 10;
  if (minDist < 1.0) return 25;
  if (minDist < 2.0) return 45;
  if (minDist < 4.0) return 65;
  if (minDist < 8.0) return 80;
  return 92;
}

export interface QualityResult {
  score: number;
  label: string;
  explanation: string;
  moonFactor: number;
  cloudFactor: number;
  lightFactor: number;
}

export function computeQualityScore(
  lat: number,
  lon: number,
  date: Date
): QualityResult {
  const month = date.getMonth();
  const phase = moonPhaseOnDate(date);

  // Moon factor: new moon (phase 0 or 1) = 100, full moon (phase 0.5) = 0
  const moonFactor = Math.round((1 - Math.sin(phase * Math.PI)) * 100);

  // Cloud factor: 0% cloud = 100, 100% cloud = 0
  const cloudPct = nearestCityCloudCover(lat, lon, month);
  const cloudFactor = Math.round(100 - cloudPct);

  // Light pollution factor
  const lightFactor = lightPollutionScore(lat, lon);

  // Weighted average: moon 40%, clouds 40%, light 20%
  const score = Math.round(moonFactor * 0.4 + cloudFactor * 0.4 + lightFactor * 0.2);

  let label: string;
  if (score >= 80) label = "Exceptional";
  else if (score >= 65) label = "Very good";
  else if (score >= 50) label = "Good";
  else if (score >= 35) label = "Fair";
  else label = "Poor";

  const moonDesc = moonFactor > 70
    ? "little moonlight"
    : moonFactor > 40 ? "some moonlight" : "bright moonlight";
  const cloudDesc = cloudFactor > 70
    ? "typically clear skies"
    : cloudFactor > 45 ? "mixed skies"
    : "frequently cloudy skies";
  const lightDesc = lightFactor > 75
    ? "dark rural skies"
    : lightFactor > 45 ? "suburban skies"
    : "light-polluted urban skies";

  const explanation = `${label}: ${moonDesc}, ${cloudDesc}, and ${lightDesc}.`;

  return { score, label, explanation, moonFactor, cloudFactor, lightFactor };
}

export function moonBrightnessLabel(phase: number): string {
  if (phase < 0.05 || phase > 0.95) return "dark (new moon)";
  if (phase < 0.2 || phase > 0.8) return "faint crescent";
  if (phase < 0.35 || phase > 0.65) return "half-lit";
  if (phase < 0.45 || phase > 0.55) return "mostly full";
  return "full and bright";
}
