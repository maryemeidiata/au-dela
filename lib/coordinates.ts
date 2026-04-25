const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

export interface AltAz {
  altitude: number;
  azimuth: number;
}

export interface CartesianSky {
  x: number;
  y: number;
  visible: boolean;
}

function julianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

function greenwichMeanSiderealTime(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545) +
    T * T * 0.000387933 - T * T * T / 38710000;
  return ((gmst % 360) + 360) % 360;
}

export function raDecToAltAz(
  raDeg: number,
  decDeg: number,
  latDeg: number,
  lonDeg: number,
  date: Date
): AltAz {
  const jd = julianDate(date);
  const gmst = greenwichMeanSiderealTime(jd);
  const lst = ((gmst + lonDeg) % 360 + 360) % 360;
  const ha = ((lst - raDeg) % 360 + 360) % 360;

  const haR = ha * DEG;
  const decR = decDeg * DEG;
  const latR = latDeg * DEG;

  const sinAlt = Math.sin(decR) * Math.sin(latR) +
    Math.cos(decR) * Math.cos(latR) * Math.cos(haR);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD;

  const cosAz = (Math.sin(decR) - Math.sin(altitude * DEG) * Math.sin(latR)) /
    (Math.cos(altitude * DEG) * Math.cos(latR));
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz))) * RAD;
  if (Math.sin(haR) > 0) azimuth = 360 - azimuth;

  return { altitude, azimuth };
}

export function raHoursToAltAz(
  raHours: number,
  decDeg: number,
  latDeg: number,
  lonDeg: number,
  date: Date
): AltAz {
  return raDecToAltAz(raHours * 15, decDeg, latDeg, lonDeg, date);
}

export function altAzToCanvas(
  altitude: number,
  azimuth: number,
  cx: number,
  cy: number,
  radius: number
): CartesianSky {
  if (altitude < 0) return { x: 0, y: 0, visible: false };
  const r = (1 - altitude / 90) * radius;
  const az = azimuth * DEG;
  return {
    x: cx + r * Math.sin(az),
    y: cy - r * Math.cos(az),
    visible: true,
  };
}

export function moonPhase(date: Date): {
  phase: number;
  name: string;
  illumination: number;
} {
  const jd = julianDate(date);
  const lunation = (jd - 2451550.1) / 29.530588853;
  const phase = ((lunation % 1) + 1) % 1;
  const illumination = (1 - Math.cos(phase * 2 * Math.PI)) / 2;

  let name: string;
  if (phase < 0.03 || phase > 0.97) name = "New Moon";
  else if (phase < 0.22) name = "Waxing Crescent";
  else if (phase < 0.28) name = "First Quarter";
  else if (phase < 0.47) name = "Waxing Gibbous";
  else if (phase < 0.53) name = "Full Moon";
  else if (phase < 0.72) name = "Waning Gibbous";
  else if (phase < 0.78) name = "Last Quarter";
  else name = "Waning Crescent";

  return { phase, name, illumination };
}

export function moonPhaseOnDate(date: Date): number {
  return moonPhase(date).phase;
}

export function issLatLonToAltAz(
  issLat: number,
  issLon: number,
  observerLat: number,
  observerLon: number
): AltAz {
  const ISS_ALT_KM = 408;
  const EARTH_RADIUS_KM = 6371;

  const dLat = (issLat - observerLat) * DEG;
  const dLon = (issLon - observerLon) * DEG;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(observerLat * DEG) * Math.cos(issLat * DEG) * Math.sin(dLon / 2) ** 2;
  const groundDist = 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));

  const altitude = Math.atan2(ISS_ALT_KM, groundDist) * RAD -
    Math.atan2(groundDist, EARTH_RADIUS_KM) * RAD;

  const y = Math.sin((issLon - observerLon) * DEG) * Math.cos(issLat * DEG);
  const x = Math.cos(observerLat * DEG) * Math.sin(issLat * DEG) -
    Math.sin(observerLat * DEG) * Math.cos(issLat * DEG) * Math.cos((issLon - observerLon) * DEG);
  const azimuth = ((Math.atan2(y, x) * RAD) + 360) % 360;

  return { altitude, azimuth };
}
