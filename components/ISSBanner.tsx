"use client";
import type { ISSPosition } from "@/hooks/useISSData";

export default function ISSBanner({ position }: { position: ISSPosition | null }) {
  if (!position?.isOverhead) return null;

  return (
    <div className="iss-banner animate-iss">
      <span
        style={{
          fontFamily: "Cormorant Garamond, serif",
          fontStyle: "italic",
          fontSize: 15,
          color: "#afa9ec",
        }}
      >
        The ISS is above you right now
      </span>
      <span
        style={{
          fontFamily: "Outfit, sans-serif",
          fontWeight: 300,
          fontSize: 13,
          color: "rgba(175,169,236,0.6)",
          marginLeft: 12,
        }}
      >
        {position.altitudeLabel} · heading {position.compass}
      </span>
    </div>
  );
}
