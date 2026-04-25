"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { raHoursToAltAz, altAzToCanvas, moonPhase } from "@/lib/coordinates";
import { magnitudeToRadius, starColorFromSpectral } from "@/lib/utils";
import { PLANET_COLORS } from "@/lib/astronomy-api";
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
}

const CONSTELLATION_LINES: [string, string][] = [
  // Orion
  ["betelgeuse","alnilam"],["alnilam","rigel"],["alnilam","alnitak"],
  ["alnitak","mintaka"],["bellatrix","betelgeuse"],["bellatrix","alnilam"],
  ["saiph","alnitak"],
  // Ursa Major (Big Dipper)
  ["dubhe","merak"],["merak","phecda"],["phecda","alioth"],
  ["alioth","alkaid"],["dubhe","alioth"],
  // Lyra
  ["vega","epsilon-lyr"],
  // Cygnus
  ["deneb","altair"],
  // Leo
  ["regulus","algieba"],["algieba","denebola"],
  // Taurus
  ["aldebaran","elnath"],
  // Canis Major
  ["sirius","adhara"],["sirius","mirzam"],["sirius","wezen"],
  // Scorpius
  ["antares","dschubba"],["antares","shaula"],["antares","sargas"],["antares","lesath"],
  // Cassiopeia
  ["schedar","caph"],["schedar","navi"],["navi","ruchbah"],
  // Gemini
  ["castor","pollux"],["castor","alhena"],["pollux","alhena"],
  // Virgo
  ["spica","vindemiatrix"],
  // Sagittarius
  ["kaus-australis","nunki"],
  // Perseus
  ["mirfak","algol"],
];

function drawMoon(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  phase: number
) {
  const illumination = (1 - Math.cos(phase * 2 * Math.PI)) / 2;
  const isWaxing = phase < 0.5;

  ctx.save();

  // Moon disc
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#e8e8d0";
  ctx.globalAlpha = 0.25;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Lit portion
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  gradient.addColorStop(0, "rgba(240,238,220,0.95)");
  gradient.addColorStop(0.7, "rgba(220,218,200,0.8)");
  gradient.addColorStop(1, "rgba(180,178,165,0.6)");

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, !isWaxing);

  if (illumination < 0.05 || illumination > 0.95) {
    if (illumination > 0.95) {
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    } else {
      ctx.closePath();
    }
  } else {
    const halfW = r * Math.abs(1 - 2 * (isWaxing ? illumination : 1 - illumination));
    ctx.bezierCurveTo(
      cx - (isWaxing ? halfW : -halfW), cy + r,
      cx - (isWaxing ? halfW : -halfW), cy - r,
      cx, cy - r
    );
  }
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();

  // Glow
  const glow = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 2.5);
  glow.addColorStop(0, "rgba(220,218,200,0.15)");
  glow.addColorStop(1, "rgba(220,218,200,0)");
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawPlanet(
  ctx: CanvasRenderingContext2D,
  px: number, py: number,
  id: string, name: string, r: number
) {
  const color = PLANET_COLORS[id] ?? "#ffffff";

  // Glow
  const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 4);
  glow.addColorStop(0, color.replace(")", ", 0.4)").replace("rgb", "rgba"));
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(px, py, r * 4, 0, Math.PI * 2);
  ctx.fill();

  // Disc
  const disc = ctx.createRadialGradient(px - r * 0.3, py - r * 0.3, 0, px, py, r);
  disc.addColorStop(0, "#ffffff");
  disc.addColorStop(0.3, color);
  disc.addColorStop(1, color.replace(")", ", 0.7)").replace("rgb", "rgba") || color);
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fill();

  // Saturn rings
  if (id === "saturn") {
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = "#e8d5a0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(px, py, r * 2.8, r * 0.7, 0.3, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Label
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = "#ccc8f5";
  ctx.font = "10px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(name, px, py + r + 12);
  ctx.restore();
}

export default function SkyMap({ lat, lon, planets, moon, issPosition }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [hoverDesc, setHoverDesc] = useState<string>("");
  const [size, setSize] = useState(520);
  const hoveredObjectsRef = useRef<Array<{
    x: number; y: number; r: number;
    name: string; type: string; detail: string; description: string;
  }>>([]);

  useEffect(() => {
    function onResize() {
      setSize(Math.min(window.innerWidth * 0.9, 580));
    }
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

    // Sky background
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    bg.addColorStop(0, "#0d0e22");
    bg.addColorStop(0.6, "#080916");
    bg.addColorStop(1, "#06070f");
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.clip();

    const now = new Date();

    // Constellation lines
    const starPositions = new Map<string, { x: number; y: number }>();
    for (const star of starsData as typeof starsData) {
      const { altitude, azimuth } = raHoursToAltAz(star.ra, star.dec, lat, lon, now);
      if (altitude < 0) continue;
      const pos = altAzToCanvas(altitude, azimuth, cx, cy, R);
      if (pos.visible) starPositions.set(star.id, { x: pos.x, y: pos.y });
    }

    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "#afa9ec";
    ctx.lineWidth = 0.6;
    for (const [a, b] of CONSTELLATION_LINES) {
      const pa = starPositions.get(a), pb = starPositions.get(b);
      if (!pa || !pb) continue;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Stars
    for (const star of starsData as typeof starsData) {
      const { altitude, azimuth } = raHoursToAltAz(star.ra, star.dec, lat, lon, now);
      if (altitude < -5) continue;
      const pos = altAzToCanvas(altitude, azimuth, cx, cy, R);
      if (!pos.visible) continue;

      const r = magnitudeToRadius(star.mag, 0.85);
      const color = star.color ?? starColorFromSpectral(star.spectral ?? "A");
      const opacity = Math.min(1, (altitude + 5) / 15);

      ctx.save();
      ctx.globalAlpha = opacity;
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
        name: star.name,
        type: "Star",
        detail: `Magnitude ${star.mag.toFixed(1)} · ${star.spectral ?? ""} · ${star.constellation ?? ""}`,
        description: `${star.name} is a ${star.spectral ?? ""} star in ${star.constellation ?? "the sky"}.`,
      });
    }

    // Moon
    if (moon) {
      const mPos = altAzToCanvas(moon.altitude, moon.azimuth, cx, cy, R);
      if (mPos.visible) {
        const mPhase = moonPhase(now);
        drawMoon(ctx, mPos.x, mPos.y, 14, mPhase.phase);
        hoveredObjectsRef.current.push({
          x: mPos.x, y: mPos.y, r: 22,
          name: "Moon",
          type: mPhase.name,
          detail: `${Math.round(mPhase.illumination * 100)}% illuminated · ${moon.altitudeLabel}`,
          description: "Our nearest neighbor, ${moon.altitudeLabel} in the sky tonight.",
        });
      }
    }

    // Planets
    for (const p of planets) {
      if (!p.visible) continue;
      const pos = altAzToCanvas(p.altitude, p.azimuth, cx, cy, R);
      if (!pos.visible) continue;

      const r = p.id === "venus" ? 5 : p.id === "jupiter" ? 5.5 : 3.5;
      drawPlanet(ctx, pos.x, pos.y, p.id, p.name, r);

      hoveredObjectsRef.current.push({
        x: pos.x, y: pos.y, r: r * 5,
        name: p.name,
        type: "Planet",
        detail: `${p.magnitudeLabel} · ${p.altitudeLabel} · facing ${p.compassDirection}`,
        description: p.description,
      });
    }

    // ISS
    if (issPosition?.isOverhead) {
      const iPos = altAzToCanvas(issPosition.altitude, issPosition.azimuth, cx, cy, R);
      if (iPos.visible) {
        const t = (Date.now() / 1000) % 1;
        const pulse = 0.7 + 0.3 * Math.sin(t * Math.PI * 4);
        ctx.save();
        ctx.globalAlpha = pulse;
        const g = ctx.createRadialGradient(iPos.x, iPos.y, 0, iPos.x, iPos.y, 10);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.3, "#aabfff");
        g.addColorStop(1, "rgba(170,191,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(iPos.x, iPos.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(iPos.x, iPos.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        hoveredObjectsRef.current.push({
          x: iPos.x, y: iPos.y, r: 14,
          name: "International Space Station",
          type: "Spacecraft",
          detail: `${issPosition.altitudeLabel} · heading ${issPosition.compass}`,
          description: "408 km overhead, 7.66 km/s. 7 people live up there right now.",
        });
      }
    }

    // Circle border glow
    ctx.restore();
    const border = ctx.createLinearGradient(0, 0, W, H);
    border.addColorStop(0, "rgba(175,169,236,0.6)");
    border.addColorStop(0.5, "rgba(97,89,176,0.4)");
    border.addColorStop(1, "rgba(175,169,236,0.6)");
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();

    // Outer glow ring
    const outerGlow = ctx.createRadialGradient(cx, cy, R - 5, cx, cy, R + 25);
    outerGlow.addColorStop(0, "rgba(97,89,176,0.25)");
    outerGlow.addColorStop(1, "rgba(97,89,176,0)");
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, R + 25, 0, Math.PI * 2);
    ctx.arc(cx, cy, R - 5, 0, Math.PI * 2, true);
    ctx.fill();

    // Cardinal labels
    ctx.save();
    ctx.font = "11px Outfit, sans-serif";
    ctx.fillStyle = "rgba(175,169,236,0.5)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const labels = [["N", cx, cy - R + 14], ["S", cx, cy + R - 14],
      ["E", cx + R - 14, cy], ["W", cx - R + 14, cy]];
    for (const [l, x, y] of labels) {
      ctx.fillText(l as string, x as number, y as number);
    }
    ctx.restore();
  }, [lat, lon, planets, moon, issPosition]);

  useEffect(() => {
    let frame: number;
    function loop() {
      draw();
      frame = requestAnimationFrame(loop);
    }
    frame = requestAnimationFrame(loop);
    animFrameRef.current = frame;
    return () => cancelAnimationFrame(frame);
  }, [draw]);

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const scale = canvasRef.current!.width / rect.width;
    const cx = mx * scale, cy = my * scale;

    for (const obj of hoveredObjectsRef.current) {
      const d = Math.hypot(obj.x - cx, obj.y - cy);
      if (d < obj.r) {
        setTooltip({ ...obj, x: e.clientX - rect.left, y: e.clientY - rect.top });
        setHoverDesc(obj.description);
        return;
      }
    }
    setTooltip(null);
    setHoverDesc("");
  }

  return (
    <div className="relative flex flex-col items-center">
      <div
        style={{
          width: size, height: size,
          borderRadius: "50%",
          boxShadow: "0 0 60px rgba(97,89,176,0.3), 0 0 120px rgba(97,89,176,0.1)",
          position: "relative",
        }}
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          style={{ borderRadius: "50%", display: "block", cursor: "crosshair" }}
          onMouseMove={onMouseMove}
          onMouseLeave={() => { setTooltip(null); setHoverDesc(""); }}
        />
        {tooltip && (
          <div
            className="tooltip-card glass"
            style={{
              left: Math.min(tooltip.x + 14, size - 240),
              top: Math.max(tooltip.y - 60, 8),
              padding: "12px 14px",
            }}
          >
            <div className="font-serif" style={{ fontSize: 17, color: "#afa9ec", fontStyle: "italic" }}>
              {tooltip.name}
            </div>
            <div style={{ fontSize: 11, color: "#6159b0", marginTop: 2, fontWeight: 400 }}>
              {tooltip.type}
            </div>
            <div style={{ fontSize: 12, color: "#ccc8f5", marginTop: 6, lineHeight: 1.45 }}>
              {tooltip.detail}
            </div>
          </div>
        )}
        {hoverDesc && (
          <div
            style={{
              position: "absolute",
              bottom: 20,
              left: "50%",
              transform: "translateX(-50%)",
              width: "70%",
              textAlign: "center",
              fontFamily: "Cormorant Garamond, serif",
              fontStyle: "italic",
              fontSize: 14,
              color: "rgba(175,169,236,0.75)",
              pointerEvents: "none",
              lineHeight: 1.5,
            }}
          >
            {hoverDesc}
          </div>
        )}
      </div>
    </div>
  );
}
