export function formatCountdown(targetDate: Date): string {
  const now = Date.now();
  const diff = targetDate.getTime() - now;
  if (diff <= 0) return "now";

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatLocalTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffDays = Math.round((date.getTime() - now.getTime()) / 86400000);

  if (diffDays === 0) return "tonight";
  if (diffDays === 1) return "tomorrow";
  if (diffDays < 7) return `in ${diffDays} days`;
  if (diffDays < 14) return "next week";
  if (diffDays < 60) return `in ${Math.round(diffDays / 7)} weeks`;
  if (diffDays < 365) return `in ${Math.round(diffDays / 30)} months`;
  return `in ${Math.round(diffDays / 365)} year${diffDays > 548 ? "s" : ""}`;
}

export function getSeasonMonth(lat: number, month: number): string {
  const isNorth = lat >= 0;
  const seasons = isNorth
    ? ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"]
    : ["summer", "summer", "autumn", "autumn", "autumn", "winter", "winter", "winter", "spring", "spring", "spring", "summer"];
  return seasons[month];
}

export function reverseGeocode(lat: number, lon: number): Promise<string> {
  return fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
  )
    .then((r) => r.json())
    .then((d) => {
      const a = d.address;
      return a.city || a.town || a.village || a.county || a.country || "your location";
    })
    .catch(() => "your location");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function starColorFromSpectral(spectral: string): string {
  const type = spectral.charAt(0).toUpperCase();
  switch (type) {
    case "O": return "#9bb0ff";
    case "B": return "#aabfff";
    case "A": return "#cad7ff";
    case "F": return "#f8f7ff";
    case "G": return "#fff4ea";
    case "K": return "#ffd2a1";
    case "M": return "#ffb380";
    default: return "#e8e8e8";
  }
}

export function magnitudeToRadius(mag: number, scale = 1): number {
  if (mag < -1) return 3.5 * scale;
  if (mag < 0) return 3.0 * scale;
  if (mag < 1) return 2.5 * scale;
  if (mag < 2) return 2.0 * scale;
  if (mag < 3) return 1.6 * scale;
  if (mag < 4) return 1.2 * scale;
  return 0.8 * scale;
}
