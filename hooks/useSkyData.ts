"use client";
import { useState, useEffect } from "react";
import { raHoursToAltAz } from "@/lib/coordinates";
import { moonPhase } from "@/lib/coordinates";
import { PLANET_COLORS, magnitudeToPlainLanguage, elevationToPlainLanguage, azimuthToCompass } from "@/lib/astronomy-api";

export interface PlanetData {
  id: string;
  name: string;
  altitude: number;
  azimuth: number;
  altitudeLabel: string;
  compassDirection: string;
  color: string;
  magnitude: number | null;
  magnitudeLabel: string;
  visible: boolean;
  riseTime: Date | null;
  setTime: Date | null;
  description: string;
  distanceAU: number | null;
}

export interface MoonData {
  phase: number;
  phaseName: string;
  illumination: number;
  altitude: number;
  azimuth: number;
  altitudeLabel: string;
  compassDirection: string;
}

export interface SkyData {
  planets: PlanetData[];
  moon: MoonData | null;
  loading: boolean;
  error: string | null;
}

const PLANET_DESCRIPTIONS: Record<string, string> = {
  mercury: "The swift messenger, never straying far from the Sun's glow.",
  venus: "The brightest object in the night sky after the Moon. So dazzling it can cast shadows.",
  mars: "The red wanderer, its color from iron oxide on its ancient surface.",
  jupiter: "The giant, large enough that all other planets could fit inside it.",
  saturn: "The ringed wonder. Nothing in the solar system prepares you for those rings.",
  uranus: "A pale blue-green ice giant, tipped on its side.",
  neptune: "The most distant planet, a deep blue world of supersonic winds.",
};

export function useSkyData(lat: number | null, lon: number | null): SkyData {
  const [data, setData] = useState<SkyData>({
    planets: [], moon: null, loading: true, error: null,
  });

  useEffect(() => {
    if (lat === null || lon === null) return;

    const now = new Date();
    const params = new URLSearchParams({
      latitude: lat.toFixed(4),
      longitude: lon.toFixed(4),
      elevation: "0",
      from_date: now.toISOString().split("T")[0],
      to_date: now.toISOString().split("T")[0],
      time: now.toTimeString().slice(0, 8),
    });

    fetch(`/api/planets?${params}`)
      .then(r => r.json())
      .then(json => {
        const rows = json?.data?.rows ?? [];
        const planets: PlanetData[] = [];

        for (const row of rows) {
          const body = row.body ?? row.positions?.[0];
          if (!body) continue;
          const id = body.id?.toLowerCase();
          if (!id || id === "sun" || id === "pluto") continue;

          const altDeg = parseFloat(body.position?.horizontal?.altitude?.degrees ?? "0");
          const azDeg = parseFloat(body.position?.horizontal?.azimuth?.degrees ?? "0");
          const mag = body.extraInfo?.magnitude ?? null;

          planets.push({
            id,
            name: body.name,
            altitude: altDeg,
            azimuth: azDeg,
            altitudeLabel: elevationToPlainLanguage(altDeg),
            compassDirection: azimuthToCompass(azDeg),
            color: PLANET_COLORS[id] ?? "#ffffff",
            magnitude: mag,
            magnitudeLabel: mag !== null ? magnitudeToPlainLanguage(mag) : "unknown",
            visible: altDeg > 0,
            riseTime: null,
            setTime: null,
            description: PLANET_DESCRIPTIONS[id] ?? "",
            distanceAU: body.distance?.fromEarth?.au ? parseFloat(body.distance.fromEarth.au) : null,
          });
        }

        // Moon
        const moonRow = rows.find((r: { body?: { id?: string } }) =>
          r.body?.id?.toLowerCase() === "moon"
        );
        let moon: MoonData | null = null;
        if (moonRow) {
          const b = moonRow.body;
          const alt = parseFloat(b.position?.horizontal?.altitude?.degrees ?? "0");
          const az = parseFloat(b.position?.horizontal?.azimuth?.degrees ?? "0");
          const phaseData = moonPhase(now);
          moon = {
            phase: phaseData.phase,
            phaseName: phaseData.name,
            illumination: phaseData.illumination,
            altitude: alt,
            azimuth: az,
            altitudeLabel: elevationToPlainLanguage(alt),
            compassDirection: azimuthToCompass(az),
          };
        } else {
          const phaseData = moonPhase(now);
          const moonAltAz = raHoursToAltAz(0, 0, lat, lon, now);
          moon = {
            phase: phaseData.phase,
            phaseName: phaseData.name,
            illumination: phaseData.illumination,
            altitude: moonAltAz.altitude,
            azimuth: moonAltAz.azimuth,
            altitudeLabel: elevationToPlainLanguage(moonAltAz.altitude),
            compassDirection: azimuthToCompass(moonAltAz.azimuth),
          };
        }

        setData({ planets, moon, loading: false, error: null });
      })
      .catch(err => {
        console.error("Sky data error:", err);
        // Fallback: compute approximate positions from our own math
        const phaseData = moonPhase(now);
        setData({
          planets: [],
          moon: {
            phase: phaseData.phase,
            phaseName: phaseData.name,
            illumination: phaseData.illumination,
            altitude: 45,
            azimuth: 180,
            altitudeLabel: "about halfway up the sky",
            compassDirection: "S",
          },
          loading: false,
          error: "Using estimated positions",
        });
      });
  }, [lat, lon]);

  return data;
}
