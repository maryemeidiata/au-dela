"use client";
import { useEffect, useRef } from "react";
import GlassCard from "@/components/ui/GlassCard";
import type { PlanetData, MoonData } from "@/hooks/useSkyData";
import { PLANET_COLORS } from "@/lib/astronomy-api";

interface Props { planets: PlanetData[]; moon: MoonData | null; loading: boolean }

function PlanetOrb({ id, size = 48 }: { id: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const color = PLANET_COLORS[id] ?? "#ffffff";
    const cx = size / 2, cy = size / 2, r = size * 0.38;

    ctx.clearRect(0, 0, size, size);

    // Outer glow
    const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 2);
    const base = color;
    glow.addColorStop(0, base + "60");
    glow.addColorStop(1, base + "00");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2, 0, Math.PI * 2);
    ctx.fill();

    // Body gradient
    const disc = ctx.createRadialGradient(cx - r * 0.28, cy - r * 0.28, 0, cx, cy, r);
    disc.addColorStop(0, "#ffffff");
    disc.addColorStop(0.25, base);
    disc.addColorStop(1, base + "cc");
    ctx.fillStyle = disc;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Saturn rings
    if (id === "saturn") {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = "#e8d5a0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 2.2, r * 0.55, 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }, [id, size]);

  return <canvas ref={ref} width={size} height={size} style={{ display: "block" }} />;
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
              minWidth: 150,
              maxWidth: 170,
              flexShrink: 0,
              padding: "16px 18px",
              opacity: p.visible ? 1 : 0.45,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <PlanetOrb id={p.id} size={52} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 17, color: "#afa9ec", fontWeight: 400 }}>
                  {p.name}
                </div>
                {p.visible ? (
                  <>
                    <div style={{ fontSize: 12, color: "rgba(175,169,236,0.6)", marginTop: 4 }}>
                      {p.altitudeLabel}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(175,169,236,0.45)", marginTop: 3 }}>
                      facing {p.compassDirection}
                    </div>
                    {p.magnitude !== null && (
                      <div style={{ fontSize: 11, color: "rgba(175,169,236,0.4)", marginTop: 3 }}>
                        mag {p.magnitude.toFixed(1)}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: "rgba(175,169,236,0.35)", marginTop: 4 }}>
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
