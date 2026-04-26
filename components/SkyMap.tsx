"use client";
import { useEffect, useRef, useCallback, useState, WheelEvent } from "react";
import { raHoursToAltAz, moonPhase } from "@/lib/coordinates";
import { magnitudeToRadius, starColorFromSpectral } from "@/lib/utils";
import { PLANET_COLORS, azimuthToCompass, elevationToPlainLanguage } from "@/lib/astronomy-api";
import type { PlanetData, MoonData } from "@/hooks/useSkyData";
import type { ISSPosition } from "@/hooks/useISSData";
import starsData from "@/data/bright-stars.json";

interface Props {
  lat: number;
  lon: number;
  planets: PlanetData[];
  moon: MoonData | null;
  issPosition: ISSPosition | null;
}

interface TooltipInfo {
  x: number;
  y: number;
  name: string;
  type: string;
  detail: string;
  description: string;
  az: number;
  alt: number;
}

const CONSTELLATION_LINES: [string, string][] = [
  ["betelgeuse","alnilam"],["alnilam","rigel"],["alnilam","alnitak"],
  ["alnitak","mintaka"],["bellatrix","betelgeuse"],["bellatrix","alnilam"],["saiph","alnitak"],
  ["dubhe","merak"],["merak","phecda"],["phecda","alioth"],["alioth","alkaid"],["dubhe","alioth"],
  ["deneb","altair"],
  ["regulus","algieba"],["algieba","denebola"],
  ["aldebaran","elnath"],
  ["sirius","adhara"],["sirius","mirzam"],
  ["antares","dschubba"],["antares","shaula"],["antares","sargas"],
  ["schedar","caph"],["schedar","navi"],["navi","ruchbah"],
  ["castor","pollux"],["castor","alhena"],["pollux","alhena"],
  ["spica","vindemiatrix"],
  ["mirfak","algol"],
];

function altAzToCanvasZoomed(
  alt: number, az: number,
  cx: number, cy: number, R: number, zoom: number
): { x: number; y: number; visible: boolean } {
  const minAlt = 90 - 90 / zoom;
  if (alt < minAlt - 2) return { x: 0, y: 0, visible: false };
  const r = Math.min(((90 - alt) / (90 / zoom)) * R, R * 1.05);
  const azR = az * (Math.PI / 180);
  return {
    x: cx + r * Math.sin(azR),
    y: cy - r * Math.cos(azR),
    visible: r <= R,
  };
}

function drawMoon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, phase: number) {
  const isWaxing = phase < 0.5;
  const illumination = (1 - Math.cos(phase * 2 * Math.PI)) / 2;

  ctx.save();
  // Dark disc
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#1a1a28";
  ctx.fill();

  // Lit portion using clip
  ctx.beginPath();
  if (illumination > 0.97) {
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  } else if (illumination < 0.03) {
    // new moon — just rim
  } else {
    ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, !isWaxing);
    const frac = Math.abs(1 - 2 * (isWaxing ? illumination : 1 - illumination));
    const bx = cx + (isWaxing ? -1 : 1) * r * frac;
    ctx.bezierCurveTo(bx, cy + r, bx, cy - r, cx, cy - r);
    ctx.closePath();
  }
  const grad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, 0, cx, cy, r);
  grad.addColorStop(0, "#fffef0");
  grad.addColorStop(0.6, "#e8e8d0");
  grad.addColorStop(1, "#c8c8b8");
  ctx.fillStyle = grad;
  ctx.fill();

  // Glow
  const glow = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 2.8);
  glow.addColorStop(0, "rgba(220,218,200,0.18)");
  glow.addColorStop(1, "rgba(220,218,200,0)");
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawPlanet(ctx: CanvasRenderingContext2D, px: number, py: number, id: string, name: string, r: number) {
  const color = PLANET_COLORS[id] ?? "#ffffff";
  ctx.save();
  const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 4.5);
  glow.addColorStop(0, color + "55");
  glow.addColorStop(1, color + "00");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(px, py, r * 4.5, 0, Math.PI * 2);
  ctx.fill();

  const disc = ctx.createRadialGradient(px - r * 0.3, py - r * 0.3, 0, px, py, r);
  disc.addColorStop(0, "#ffffff");
  disc.addColorStop(0.3, color);
  disc.addColorStop(1, color + "cc");
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fill();

  if (id === "saturn") {
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "#e8d5a0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(px, py, r * 2.8, r * 0.65, 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = "rgba(204,200,245,0.8)";
  ctx.font = "10px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(name, px, py + r + 13);
  ctx.restore();
}

export default function SkyMap({ lat, lon, planets, moon, issPosition }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [size, setSize] = useState(520);
  const [zoom, setZoom] = useState(1);
  const hoveredObjectsRef = useRef<Array<{
    x: number; y: number; r: number;
    name: string; type: string; detail: string; description: string;
    az: number; alt: number;
  }>>([]);

  useEffect(() => {
    function onResize() { setSize(Math.min(window.innerWidth * 0.9, 580)); }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, R = W / 2 - 2;

    ctx.clearRect(0, 0, W, H);
    hoveredObjectsRef.current = [];

    // Sky gradient
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    bg.addColorStop(0, "#0d0e22");
    bg.addColorStop(0.55, "#080a18");
    bg.addColorStop(1, "#06070f");
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.clip();

    const now = new Date();
    const zoomFactor = zoom;

    // Constellation lines
    const starPos = new Map<string, { x: number; y: number }>();
    for (const star of starsData) {
      const { altitude, azimuth } = raHoursToAltAz(star.ra, star.dec, lat, lon, now);
      const pos = altAzToCanvasZoomed(altitude, azimuth, cx, cy, R, zoomFactor);
      if (pos.visible) starPos.set(star.id, { x: pos.x, y: pos.y });
    }

    ctx.globalAlpha = 0.13;
    ctx.strokeStyle = "#afa9ec";
    ctx.lineWidth = 0.6;
    for (const [a, b] of CONSTELLATION_LINES) {
      const pa = starPos.get(a), pb = starPos.get(b);
      if (!pa || !pb) continue;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Stars
    for (const star of starsData) {
      const { altitude, azimuth } = raHoursToAltAz(star.ra, star.dec, lat, lon, now);
      if (altitude < -10) continue;
      const pos = altAzToCanvasZoomed(altitude, azimuth, cx, cy, R, zoomFactor);
      if (!pos.visible) continue;

      const r = magnitudeToRadius(star.mag, 0.85 + (zoomFactor - 1) * 0.2);
      const color = star.color ?? starColorFromSpectral(star.spectral ?? "A");
      const opacityFade = Math.min(1, (altitude + 5) / 15);

      ctx.save();
      ctx.globalAlpha = opacityFade;
      if (r > 1.2) {
        const g = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r * 3);
        g.addColorStop(0, color);
        g.addColorStop(0.4, color);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      hoveredObjectsRef.current.push({
        x: pos.x, y: pos.y, r: Math.max(r * 3, 8),
        name: star.name, type: "Star",
        detail: `Magnitude ${star.mag.toFixed(1)} · ${star.spectral ?? ""} · ${star.constellation ?? ""}`,
        description: `${star.name} is a ${star.spectral ?? ""} star in ${star.constellation ?? "the sky"}.`,
        az: azimuth, alt: altitude,
      });
    }

    // Moon — show even if slightly below horizon
    if (moon) {
      const mPos = altAzToCanvasZoomed(moon.altitude, moon.azimuth, cx, cy, R, zoomFactor);
      if (mPos.visible || moon.altitude > -5) {
        const drawPos = mPos.visible ? mPos
          : altAzToCanvasZoomed(Math.max(moon.altitude, -3), moon.azimuth, cx, cy, R, zoomFactor);
        const alpha = moon.altitude < 0 ? Math.max(0.2, 1 + moon.altitude / 5) : 1;
        const phaseData = moonPhase(now);
        ctx.save();
        ctx.globalAlpha = alpha;
        drawMoon(ctx, drawPos.x, drawPos.y, 14, phaseData.phase);
        ctx.restore();
        hoveredObjectsRef.current.push({
          x: drawPos.x, y: drawPos.y, r: 22,
          name: "Moon",
          type: moon.phaseName,
          detail: `${Math.round(moon.illumination * 100)}% illuminated · ${moon.altitudeLabel} · face ${moon.compassDirection}`,
          description: `The ${moon.phaseName.toLowerCase()} is ${Math.round(moon.illumination * 100)}% lit tonight.`,
          az: moon.azimuth, alt: moon.altitude,
        });
      }
    }

    // Planets
    for (const p of planets) {
      const pos = altAzToCanvasZoomed(p.altitude, p.azimuth, cx, cy, R, zoomFactor);
      if (!pos.visible) continue;
      const r = p.id === "venus" ? 5 : p.id === "jupiter" ? 5.5 : p.id === "saturn" ? 4.5 : 3.5;
      drawPlanet(ctx, pos.x, pos.y, p.id, p.name, r + (zoomFactor - 1) * 0.5);
      hoveredObjectsRef.current.push({
        x: pos.x, y: pos.y, r: (r + 3) * 4,
        name: p.name, type: "Planet",
        detail: `${p.magnitudeLabel} · ${p.altitudeLabel} · face ${p.compassDirection}`,
        description: p.description,
        az: p.azimuth, alt: p.altitude,
      });
    }

    // ISS
    if (issPosition?.isOverhead) {
      const iPos = altAzToCanvasZoomed(issPosition.altitude, issPosition.azimuth, cx, cy, R, zoomFactor);
      if (iPos.visible) {
        const pulse = 0.7 + 0.3 * Math.sin((Date.now() / 800) % (Math.PI * 2));
        ctx.save();
        ctx.globalAlpha = pulse;
        const g = ctx.createRadialGradient(iPos.x, iPos.y, 0, iPos.x, iPos.y, 12);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.4, "#aabfff");
        g.addColorStop(1, "rgba(170,191,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(iPos.x, iPos.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(iPos.x, iPos.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        hoveredObjectsRef.current.push({
          x: iPos.x, y: iPos.y, r: 16,
          name: "ISS", type: "Spacecraft",
          detail: `${issPosition.altitudeLabel} · heading ${issPosition.compass}`,
          description: "408 km up, moving at 7.66 km/s. Seven people live there right now.",
          az: issPosition.azimuth, alt: issPosition.altitude,
        });
      }
    }

    ctx.restore();

    // Border glow
    const border = ctx.createLinearGradient(0, 0, W, H);
    border.addColorStop(0, "rgba(175,169,236,0.6)");
    border.addColorStop(0.5, "rgba(97,89,176,0.4)");
    border.addColorStop(1, "rgba(175,169,236,0.6)");
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();

    const outerGlow = ctx.createRadialGradient(cx, cy, R - 5, cx, cy, R + 28);
    outerGlow.addColorStop(0, "rgba(97,89,176,0.28)");
    outerGlow.addColorStop(1, "rgba(97,89,176,0)");
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, R + 28, 0, Math.PI * 2);
    ctx.arc(cx, cy, R - 5, 0, Math.PI * 2, true);
    ctx.fill();

    // Cardinal labels (adapt to zoom)
    ctx.font = "11px Outfit, sans-serif";
    ctx.fillStyle = "rgba(175,169,236,0.5)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const cardinals: [string, number, number][] = [
      ["N", cx, cy - R + 14], ["S", cx, cy + R - 14],
      ["E", cx + R - 14, cy], ["W", cx - R + 14, cy],
    ];
    for (const [l, x, y] of cardinals) ctx.fillText(l, x, y);

    // Altitude rings at 30° and 60° (only at zoom > 1)
    if (zoomFactor > 1.2) {
      const minAlt = 90 - 90 / zoomFactor;
      [30, 60].forEach(alt => {
        if (alt < minAlt) return;
        const ringR = ((90 - alt) / (90 / zoomFactor)) * R;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(175,169,236,0.07)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(175,169,236,0.3)";
        ctx.font = "9px Outfit, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`${alt}°`, cx + ringR + 4, cy);
        ctx.restore();
      });
    }
  }, [lat, lon, planets, moon, issPosition, zoom]);

  useEffect(() => {
    let frame: number;
    function loop() { draw(); frame = requestAnimationFrame(loop); }
    frame = requestAnimationFrame(loop);
    animFrameRef.current = frame;
    return () => cancelAnimationFrame(frame);
  }, [draw]);

  function handleWheel(e: WheelEvent<HTMLCanvasElement>) {
    e.preventDefault();
    setZoom(z => Math.max(1, Math.min(4, z - e.deltaY * 0.003)));
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scale = canvasRef.current!.width / rect.width;
    const cx = (e.clientX - rect.left) * scale;
    const cy = (e.clientY - rect.top) * scale;
    for (const obj of hoveredObjectsRef.current) {
      if (Math.hypot(obj.x - cx, obj.y - cy) < obj.r) {
        setTooltip({ ...obj, x: e.clientX - rect.left, y: e.clientY - rect.top });
        return;
      }
    }
    setTooltip(null);
  }

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{ position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          style={{
            borderRadius: "50%",
            display: "block",
            cursor: zoom > 1 ? "zoom-out" : "crosshair",
            boxShadow: "0 0 60px rgba(97,89,176,0.3), 0 0 120px rgba(97,89,176,0.1)",
          }}
          onWheel={handleWheel}
          onMouseMove={onMouseMove}
          onMouseLeave={() => setTooltip(null)}
        />

        {/* Zoom controls */}
        <div
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {[{ label: "+", delta: 0.5 }, { label: "−", delta: -0.5 }].map(({ label, delta }) => (
            <button
              key={label}
              onClick={() => setZoom(z => Math.max(1, Math.min(4, z + delta)))}
              style={{
                width: 30, height: 30,
                borderRadius: "50%",
                background: "rgba(13,14,31,0.8)",
                border: "1px solid rgba(175,169,236,0.25)",
                color: "#afa9ec",
                fontSize: 16,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                lineHeight: 1,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(97,89,176,0.4)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(13,14,31,0.8)")}
            >
              {label}
            </button>
          ))}
          {zoom > 1 && (
            <button
              onClick={() => setZoom(1)}
              style={{
                width: 30, height: 30,
                borderRadius: "50%",
                background: "rgba(13,14,31,0.8)",
                border: "1px solid rgba(175,169,236,0.2)",
                color: "rgba(175,169,236,0.55)",
                fontSize: 9,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              1:1
            </button>
          )}
        </div>

        {/* Zoom level indicator */}
        {zoom > 1 && (
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              background: "rgba(13,14,31,0.75)",
              border: "1px solid rgba(175,169,236,0.15)",
              borderRadius: 12,
              padding: "3px 10px",
              fontSize: 11,
              color: "rgba(175,169,236,0.6)",
              fontFamily: "Outfit, sans-serif",
            }}
          >
            {zoom.toFixed(1)}×
          </div>
        )}

        {/* Tooltip */}
        {tooltip && (
          <div
            className="tooltip-card glass"
            style={{
              left: Math.min(tooltip.x + 14, size - 250),
              top: Math.max(tooltip.y - 70, 8),
              padding: "12px 14px",
            }}
          >
            <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 17, color: "#afa9ec", fontStyle: "italic" }}>
              {tooltip.name}
            </div>
            <div style={{ fontSize: 11, color: "#6159b0", marginTop: 2, fontWeight: 400 }}>{tooltip.type}</div>
            <div style={{ fontSize: 12, color: "#ccc8f5", marginTop: 6, lineHeight: 1.5 }}>{tooltip.detail}</div>
            {tooltip.alt >= -5 && (
              <div
                style={{
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: "1px solid rgba(175,169,236,0.1)",
                  fontSize: 12,
                  color: "rgba(175,169,236,0.55)",
                  fontStyle: "italic",
                  fontFamily: "Cormorant Garamond, serif",
                }}
              >
                Step outside, face {azimuthToCompass(tooltip.az)}.{" "}
                {tooltip.alt < 0
                  ? "Just below the horizon."
                  : `Look ${elevationToPlainLanguage(tooltip.alt)}.`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scroll hint */}
      <p style={{ fontSize: 11, color: "rgba(175,169,236,0.3)", letterSpacing: "0.06em" }}>
        scroll to zoom · hover objects for details
      </p>
    </div>
  );
}
