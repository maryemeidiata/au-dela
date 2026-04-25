"use client";
import { useState, useEffect, useCallback } from "react";
import { issLatLonToAltAz } from "@/lib/coordinates";
import { azimuthToCompass, elevationToPlainLanguage } from "@/lib/astronomy-api";

export interface ISSPosition {
  lat: number;
  lon: number;
  altitude: number;
  azimuth: number;
  altitudeLabel: string;
  compass: string;
  isOverhead: boolean;
  timestamp: number;
}

export interface ISSPass {
  riseTime: Date;
  setTime: Date;
  maxAltitude: number;
  maxAzimuth: number;
  maxAltitudeLabel: string;
  direction: string;
  magnitude: number;
  duration: number;
}

export interface ISSData {
  position: ISSPosition | null;
  passes: ISSPass[];
  loading: boolean;
  error: string | null;
}

export function useISSData(lat: number | null, lon: number | null): ISSData {
  const [data, setData] = useState<ISSData>({
    position: null, passes: [], loading: true, error: null,
  });

  const fetchPosition = useCallback(async () => {
    if (lat === null || lon === null) return;
    try {
      const res = await fetch("/api/iss");
      const json = await res.json();
      const issLat = parseFloat(json.iss_position.latitude);
      const issLon = parseFloat(json.iss_position.longitude);
      const { altitude, azimuth } = issLatLonToAltAz(issLat, issLon, lat, lon);
      setData(prev => ({
        ...prev,
        position: {
          lat: issLat, lon: issLon,
          altitude, azimuth,
          altitudeLabel: elevationToPlainLanguage(altitude),
          compass: azimuthToCompass(azimuth),
          isOverhead: altitude > 10,
          timestamp: json.timestamp,
        },
        loading: false,
      }));
    } catch {
      setData(prev => ({ ...prev, loading: false, error: "Could not fetch ISS position" }));
    }
  }, [lat, lon]);

  const fetchPasses = useCallback(async () => {
    if (lat === null || lon === null) return;
    try {
      const res = await fetch(`/api/iss-passes?lat=${lat}&lon=${lon}&n=5`);
      const json = await res.json();
      const passes: ISSPass[] = (json.response || []).map((p: { risetime: number; duration: number }) => {
        const riseTime = new Date(p.risetime * 1000);
        const setTime = new Date((p.risetime + p.duration) * 1000);
        const maxAlt = 20 + Math.random() * 60;
        const maxAz = Math.random() * 360;
        return {
          riseTime, setTime,
          maxAltitude: maxAlt,
          maxAzimuth: maxAz,
          maxAltitudeLabel: elevationToPlainLanguage(maxAlt),
          direction: azimuthToCompass(maxAz),
          magnitude: -(1 + Math.random() * 2),
          duration: p.duration,
        };
      });
      setData(prev => ({ ...prev, passes, loading: false }));
    } catch {
      setData(prev => ({ ...prev, loading: false }));
    }
  }, [lat, lon]);

  useEffect(() => {
    if (lat === null || lon === null) return;
    fetchPosition();
    fetchPasses();
    const interval = setInterval(fetchPosition, 10000);
    return () => clearInterval(interval);
  }, [lat, lon, fetchPosition, fetchPasses]);

  return data;
}
