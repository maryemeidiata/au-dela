"use client";
import { useState, useEffect } from "react";
import { reverseGeocode } from "@/lib/utils";

export interface GeoState {
  lat: number | null;
  lon: number | null;
  cityName: string;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(): GeoState {
  const [state, setState] = useState<GeoState>({
    lat: null, lon: null, cityName: "your location",
    error: null, loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, loading: false, error: "Geolocation not supported" }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const cityName = await reverseGeocode(lat, lon);
        setState({ lat, lon, cityName, error: null, loading: false });
      },
      (err) => {
        // Default to Paris for demo when permission denied
        reverseGeocode(48.8566, 2.3522).then(cityName => {
          setState({ lat: 48.8566, lon: 2.3522, cityName, error: err.message, loading: false });
        });
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  return state;
}
