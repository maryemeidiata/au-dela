"use client";
import { useEffect, useRef } from "react";
import GlassCard from "@/components/ui/GlassCard";
import type { PlanetData, MoonData } from "@/hooks/useSkyData";
import { azimuthToCompassFull } from "@/lib/astronomy-api";
import { drawPlanetDisc } from "@/lib/planet-renderer";

interface Props { planets: PlanetData[]; moon: MoonData | null; loading: boolean }

// Saturn needs extra canvas space for the rings
const CANVAS_SIZE: Record<string, number> = { saturn: 130 };
const PLANET_R: Record<string, number>    = { saturn: 22,  default: 30 };

function PlanetOrb({ id }: { id: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const size   = CANVAS_SIZE[id]  ?? 80;
  const r      = PLANET_R[id]     ?? PLANET_R.default;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, size, size);
    drawPlanetDisc(ctx, size / 2, size / 2, r, id);
  }, [id, size, r]);

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      style={{ display: "block", width: size, height: size }}
    />
  );
}

const ORDER = ["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune"];

export default function PlanetsSection({ planets, moon, loading }: Props) {
  const sorted = [...planets].sort((a, b) =>
    ORDER.indexOf(a.id) - ORDER.indexOf(b.id)
  );

  return (
    <section className="section-reveal">
      <h2
        style={{
          fontFamily: "Cormorant Garamond, serif",
          fontStyle: "italic",
          fontSize: 28,
          color: "#e8e6f8",
          marginBottom: 20,
          fontWeight: 400,
        }}
      >
        Planets tonight
      </h2>

      {loading && (
        <p style={{ color: "rgba(175,169,236,0.5)", fontSize: 13 }}>
          Calculating planet positions&hellip;
        </p>
      )}

      <div
        style={{
          display: "flex",
          gap: 14,
          overflowX: "auto",
          paddingBottom: 8,
          scrollbarWidth: "thin",
        }}
      >
        {sorted.map(p => (
          <GlassCard
            key={p.id}
            style={{
              minWidth: 160,
              maxWidth: 185,
              flexShrink: 0,
              padding: "20px 16px 18px",
              opacity: p.visible ? 1 : 0.42,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <PlanetOrb id={p.id} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 18, color: "#afa9ec", fontWeight: 400 }}>
                  {p.name}
                </div>
                {p.visible ? (
                  <>
                    <div style={{ fontSize: 12, color: "rgba(175,169,236,0.62)", marginTop: 5, lineHeight: 1.45 }}>
                      {p.altitudeLabel}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(175,169,236,0.42)", marginTop: 3 }}>
                      toward the {azimuthToCompassFull(p.azimuth)}
                    </div>
                    {p.magnitude !== null && (
                      <div style={{ fontSize: 11, color: "rgba(175,169,236,0.35)", marginTop: 3 }}>
                        mag {p.magnitude.toFixed(1)}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: "rgba(175,169,236,0.32)", marginTop: 5 }}>
                    Not visible tonight
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        ))}

        {/* Moon card */}
        {moon && (
          <GlassCard style={{ minWidth: 150, maxWidth: 170, flexShrink: 0, padding: "16px 18px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 52, height: 52,
                  borderRadius: "50%",
                  background: `conic-gradient(#e8e8d0 0% ${Math.round(moon.illumination * 100)}%, #1a1a28 ${Math.round(moon.illumination * 100)}% 100%)`,
                  boxShadow: "0 0 16px rgba(220,218,200,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, color: "rgba(175,169,236,0.5)",
                }}
              >
                {Math.round(moon.illumination * 100)}%
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 17, color: "#afa9ec", fontWeight: 400 }}>
                  Moon
                </div>
                <div style={{ fontSize: 12, color: "rgba(175,169,236,0.6)", marginTop: 4 }}>
                  {moon.phaseName}
                </div>
                <div style={{ fontSize: 11, color: "rgba(175,169,236,0.45)", marginTop: 3 }}>
                  {moon.altitudeLabel}
                </div>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </section>
  );
}
