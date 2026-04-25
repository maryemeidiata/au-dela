"use client";
import { useEffect, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import type { ISSPass } from "@/hooks/useISSData";
import { formatCountdown, formatLocalTime } from "@/lib/utils";
import { elevationToPlainLanguage, azimuthToCompass } from "@/lib/astronomy-api";

interface Props { passes: ISSPass[]; loading: boolean }

function MiniArc({ maxAz, maxAlt }: { maxAz: number; maxAlt: number }) {
  const size = 72;
  const cx = size / 2, cy = size / 2, r = size * 0.4;
  const startAz = (maxAz - 60 + 360) % 360;
  const endAz   = (maxAz + 60) % 360;

  function azToXY(az: number, alt: number) {
    const rr = r * (1 - alt / 90);
    const a = (az - 90) * (Math.PI / 180);
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  }

  const [sx, sy] = azToXY(startAz, 5);
  const [px, py] = azToXY(maxAz, maxAlt);
  const [ex, ey] = azToXY(endAz, 5);

  const pathD = `M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${px.toFixed(1)} ${py.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      {/* Horizon circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(175,169,236,0.12)" strokeWidth={1} />
      {/* Cardinal labels */}
      <text x={cx} y={cy - r - 4} textAnchor="middle" fill="rgba(175,169,236,0.35)" fontSize={7}>N</text>
      <text x={cx} y={cy + r + 9} textAnchor="middle" fill="rgba(175,169,236,0.35)" fontSize={7}>S</text>
      {/* ISS arc */}
      <path d={pathD} fill="none" stroke="#afa9ec" strokeWidth={1.5} strokeLinecap="round" opacity={0.7} />
      {/* Peak dot */}
      <circle cx={px} cy={py} r={2.5} fill="#afa9ec" />
    </svg>
  );
}

export default function ISSSection({ passes, loading }: Props) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

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
        ISS passes
      </h2>

      {loading && (
        <p style={{ color: "rgba(175,169,236,0.5)", fontSize: 13 }}>Looking for passes overhead&hellip;</p>
      )}

      {!loading && passes.length === 0 && (
        <GlassCard>
          <p style={{ color: "rgba(175,169,236,0.6)", fontSize: 13 }}>
            No ISS passes predicted over your location in the next 24 hours. The ISS orbits Earth every 92 minutes but doesn&apos;t fly over every location every orbit.
          </p>
        </GlassCard>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {passes.slice(0, 3).map((pass, i) => {
          const diffMs = pass.riseTime.getTime() - now;
          const isPast = diffMs < 0;
          const isNow = diffMs < 0 && (now - pass.riseTime.getTime()) < pass.duration * 1000;
          const countdown = isPast ? (isNow ? "Overhead now" : "Passed") : formatCountdown(pass.riseTime);
          const alt = pass.maxAltitude;
          const altLabel = elevationToPlainLanguage(alt);
          const dir = azimuthToCompass(pass.maxAzimuth);
          const mins = Math.round(pass.duration / 60);
          const magLabel = pass.magnitude < -2 ? "very bright, easy to see"
            : pass.magnitude < -1 ? "bright"
            : "moderately bright";

          return (
            <GlassCard key={i} style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <MiniArc maxAz={pass.maxAzimuth} maxAlt={alt} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <div
                      style={{
                        fontFamily: "Cormorant Garamond, serif",
                        fontSize: 22,
                        color: isNow ? "#7bff9e" : "#afa9ec",
                        fontStyle: "italic",
                        fontWeight: 400,
                      }}
                    >
                      {countdown}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(175,169,236,0.5)" }}>
                      {formatLocalTime(pass.riseTime)} &rarr; {formatLocalTime(pass.setTime)}
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: "rgba(232,230,248,0.65)", lineHeight: 1.55 }}>
                    Passes {altLabel}, heading {dir}. Visible for about {mins} minute{mins !== 1 ? "s" : ""}.{" "}
                    {magLabel.charAt(0).toUpperCase() + magLabel.slice(1)}, no equipment needed.
                  </p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
}
