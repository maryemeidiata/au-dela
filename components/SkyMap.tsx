"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { raHoursToAltAz, moonPhase } from "@/lib/coordinates";
import { magnitudeToRadius, starColorFromSpectral } from "@/lib/utils";
import {
  PLANET_COLORS, PLANET_DETAILS,
  azimuthToCompassFull, elevationToPlainLanguage,
} from "@/lib/astronomy-api";
import { drawPlanetFull } from "@/lib/planet-renderer";
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

interface HoverTarget {
  x: number; y: number; r: number;
  name: string; type: string; detail: string;
  az: number; alt: number;
  planetId?: string;
}

interface TooltipInfo extends HoverTarget {
  screenX: number; screenY: number;
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

function altAzToCanvas(
  alt: number, az: number,
  cx: number, cy: number, R: number, zoom: number
): { x: number; y: number; visible: boolean } {
  const minAlt = 90 - 90 / zoom;
  if (alt < minAlt - 3) return { x: 0, y: 0, visible: false };
  const r = Math.min(((90 - alt) / (90 / zoom)) * R, R * 1.02);
  const azR = az * (Math.PI / 180);
  return { x: cx + r * Math.sin(azR), y: cy - r * Math.cos(azR), visible: r <= R };
}

function drawMoon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, phase: number) {
  const isWaxing = phase < 0.5;
  const illumination = (1 - Math.cos(phase * 2 * Math.PI)) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#1a1a28";
  ctx.fill();
  ctx.beginPath();
  if (illumination > 0.97) {
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  } else if (illumination > 0.03) {
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


// ─── Planet Detail Modal ──────────────────────────────────────────────────────

function PlanetModal({
  planet,
  onClose,
}: {
  planet: PlanetData;
  onClose: () => void;
}) {
  const details = PLANET_DETAILS[planet.id];
  const color = PLANET_COLORS[planet.id] ?? "#afa9ec";

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(6,7,15,0.75)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px",
        animation: "fadeIn 0.25s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "rgba(10,11,26,0.97)",
          border: `1px solid ${color}30`,
          borderRadius: 20,
          maxWidth: 560,
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "32px 28px",
          boxShadow: `0 0 60px ${color}18, 0 20px 80px rgba(0,0,0,0.7)`,
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "none", border: "none",
            color: "rgba(175,169,236,0.35)", fontSize: 20,
            cursor: "pointer", lineHeight: 1, padding: 4,
            transition: "color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(175,169,236,0.75)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(175,169,236,0.35)")}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
          {details && (
            <span style={{ fontSize: 28, color, opacity: 0.7 }}>{details.symbol}</span>
          )}
          <h2 style={{
            fontFamily: "Cormorant Garamond, serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 32,
            color: "#e8e6f8",
            lineHeight: 1,
          }}>
            {planet.name}
          </h2>
        </div>
        <p style={{
          fontSize: 13,
          color: "rgba(175,169,236,0.45)",
          fontFamily: "Outfit, sans-serif",
          marginBottom: 20,
        }}>
          {planet.description}
        </p>

        {/* Current position */}
        <div style={{
          background: `${color}12`,
          border: `1px solid ${color}25`,
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 24,
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
        }}>
          <Stat label="Direction" value={`Face ${azimuthToCompassFull(planet.azimuth)}`} color={color} />
          <Stat label="Elevation" value={elevationToPlainLanguage(planet.altitude)} color={color} />
          {planet.magnitude !== null && (
            <Stat label="Brightness" value={planet.magnitudeLabel} color={color} />
          )}
          {planet.distanceAU !== null && (
            <Stat label="Distance" value={`${planet.distanceAU.toFixed(2)} AU from Earth`} color={color} />
          )}
        </div>

        {details ? (
          <>
            {/* Physical facts */}
            <Section title="At a glance" color={color}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                <Fact label="Diameter" value={details.diameter} />
                <Fact label="Distance from Sun" value={details.distanceFromSun} />
                <Fact label="Day length" value={details.dayLength} />
                <Fact label="Year length" value={details.yearLength} />
                <Fact label="Moons" value={details.moons === 0 ? "None" : `${details.moons}`} />
                <Fact label="Gravity" value={details.gravity} />
                <Fact label="Temperature" value={details.temperature} />
                <Fact label="Atmosphere" value={details.atmosphere} />
              </div>
            </Section>

            {/* Missions */}
            <Section title="Exploration history" color={color}>
              {details.missions.map((m, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{
                    display: "flex", alignItems: "baseline", gap: 8,
                    marginBottom: 3,
                  }}>
                    <span style={{
                      fontFamily: "Outfit, sans-serif",
                      fontWeight: 500,
                      fontSize: 13,
                      color: "#ccc8f5",
                    }}>{m.name}</span>
                    <span style={{
                      fontSize: 11,
                      color: "rgba(175,169,236,0.4)",
                      fontFamily: "Outfit, sans-serif",
                    }}>{m.year}</span>
                  </div>
                  <p style={{
                    fontSize: 13,
                    color: "rgba(232,230,248,0.55)",
                    lineHeight: 1.55,
                    margin: 0,
                    fontFamily: "Outfit, sans-serif",
                  }}>{m.note}</p>
                </div>
              ))}
            </Section>

            {/* Fun facts */}
            <Section title="Things worth knowing" color={color}>
              {details.funFacts.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <span style={{ color, opacity: 0.5, fontSize: 12, marginTop: 2, flexShrink: 0 }}>✦</span>
                  <p style={{
                    fontSize: 13,
                    color: "rgba(232,230,248,0.6)",
                    lineHeight: 1.6,
                    margin: 0,
                    fontFamily: "Outfit, sans-serif",
                  }}>{f}</p>
                </div>
              ))}
            </Section>
          </>
        ) : (
          <p style={{ fontSize: 13, color: "rgba(175,169,236,0.4)", fontFamily: "Outfit, sans-serif" }}>
            No detailed data available for this object.
          </p>
        )}
      </div>
    </div>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 20, height: 1.5, background: color, opacity: 0.5, borderRadius: 1 }} />
        <span style={{
          fontSize: 10,
          color,
          opacity: 0.6,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontFamily: "Outfit, sans-serif",
        }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color, opacity: 0.5, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "Outfit, sans-serif", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: "#ccc8f5", fontFamily: "Outfit, sans-serif" }}>{value}</div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10, color: "rgba(175,169,236,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "Outfit, sans-serif", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color: "rgba(232,230,248,0.65)", fontFamily: "Outfit, sans-serif", lineHeight: 1.4 }}>{value}</div>
    </div>
  );
}

// ─── Main SkyMap ─────────────────────────────────────────────────────────────

export default function SkyMap({ lat, lon, planets, moon, issPosition }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);
  const [size, setSize] = useState(520);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const dragRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 });
  const mouseDownPosRef = useRef({ x: 0, y: 0 });
  const hoveredRef = useRef<HoverTarget[]>([]);
  const planetsRef = useRef(planets);
  planetsRef.current = planets;

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
    const baseCx = W / 2, baseCy = H / 2, R = W / 2 - 2;
    const cx = baseCx + pan.x, cy = baseCy + pan.y;
    const now = new Date();

    ctx.clearRect(0, 0, W, H);
    hoveredRef.current = [];

    // ── Background ──────────────────────────────────────────────────────────
    // Deep space gradient
    const bg = ctx.createRadialGradient(baseCx, baseCy * 0.6, 0, baseCx, baseCy, R);
    bg.addColorStop(0, "#10112a");
    bg.addColorStop(0.4, "#0a0c1e");
    bg.addColorStop(0.75, "#080916");
    bg.addColorStop(1, "#05060e");
    ctx.save();
    ctx.beginPath();
    ctx.arc(baseCx, baseCy, R, 0, Math.PI * 2);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.clip();

    // Horizon atmospheric glow (bottom arc)
    const horizonGrad = ctx.createRadialGradient(baseCx, baseCy + R * 0.7, R * 0.1, baseCx, baseCy + R * 0.3, R);
    horizonGrad.addColorStop(0, "rgba(60,50,120,0.22)");
    horizonGrad.addColorStop(0.5, "rgba(40,35,90,0.10)");
    horizonGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = horizonGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle milky way band inside map
    ctx.save();
    ctx.translate(baseCx, baseCy);
    ctx.rotate(-0.4);
    const mw = ctx.createLinearGradient(-R * 0.2, 0, R * 0.2, 0);
    mw.addColorStop(0, "rgba(130,140,200,0)");
    mw.addColorStop(0.5, "rgba(140,150,210,0.07)");
    mw.addColorStop(1, "rgba(130,140,200,0)");
    ctx.fillStyle = mw;
    ctx.filter = "blur(18px)";
    ctx.fillRect(-R * 0.2, -R, R * 0.4, R * 2);
    ctx.filter = "none";
    ctx.restore();

    // ── Constellation lines ─────────────────────────────────────────────────
    const starPos = new Map<string, { x: number; y: number }>();
    for (const star of starsData) {
      const { altitude, azimuth } = raHoursToAltAz(star.ra, star.dec, lat, lon, now);
      const pos = altAzToCanvas(altitude, azimuth, cx, cy, R, zoom);
      if (pos.visible) starPos.set(star.id, { x: pos.x, y: pos.y });
    }
    ctx.globalAlpha = 0.11;
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

    // ── Stars ────────────────────────────────────────────────────────────────
    for (const star of starsData) {
      const { altitude, azimuth } = raHoursToAltAz(star.ra, star.dec, lat, lon, now);
      if (altitude < -10) continue;
      const pos = altAzToCanvas(altitude, azimuth, cx, cy, R, zoom);
      if (!pos.visible) continue;

      // Scale star radius with zoom — objects actually get bigger
      const baseR = magnitudeToRadius(star.mag);
      const r = baseR * (0.55 + zoom * 0.45);
      const color = star.color ?? starColorFromSpectral(star.spectral ?? "A");
      const opacityFade = Math.min(1, (altitude + 5) / 15);

      ctx.save();
      ctx.globalAlpha = opacityFade;
      if (r > 1.0) {
        const g = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r * 3.5);
        g.addColorStop(0, color);
        g.addColorStop(0.35, color);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r * 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      hoveredRef.current.push({
        x: pos.x, y: pos.y, r: Math.max(r * 3.5, 8),
        name: star.name, type: "Star",
        detail: `Magnitude ${star.mag.toFixed(1)} · ${star.spectral ?? ""} · ${star.constellation ?? ""}`,
        az: azimuth, alt: altitude,
      });
    }

    // ── Moon ─────────────────────────────────────────────────────────────────
    if (moon) {
      const mPos = altAzToCanvas(moon.altitude, moon.azimuth, cx, cy, R, zoom);
      if (mPos.visible || moon.altitude > -5) {
        const drawPos = mPos.visible
          ? mPos
          : altAzToCanvas(Math.max(moon.altitude, -3), moon.azimuth, cx, cy, R, zoom);
        const alpha = moon.altitude < 0 ? Math.max(0.2, 1 + moon.altitude / 5) : 1;
        const moonR = 14 * (0.6 + zoom * 0.4);
        const phaseData = moonPhase(now);
        ctx.save();
        ctx.globalAlpha = alpha;
        drawMoon(ctx, drawPos.x, drawPos.y, moonR, phaseData.phase);
        ctx.restore();
        hoveredRef.current.push({
          x: drawPos.x, y: drawPos.y, r: moonR * 2,
          name: "Moon",
          type: moon.phaseName,
          detail: `${Math.round(moon.illumination * 100)}% illuminated · ${moon.altitudeLabel} · face ${azimuthToCompassFull(moon.azimuth)}`,
          az: moon.azimuth, alt: moon.altitude,
        });
      }
    }

    // ── Planets ───────────────────────────────────────────────────────────────
    for (const p of planets) {
      const pos = altAzToCanvas(p.altitude, p.azimuth, cx, cy, R, zoom);
      if (!pos.visible) continue;
      const baseR = p.id === "venus" ? 5 : p.id === "jupiter" ? 5.5 : p.id === "saturn" ? 4.5 : 3.5;
      drawPlanetFull(ctx, pos.x, pos.y, p.id, p.name, baseR, zoom);
      hoveredRef.current.push({
        x: pos.x, y: pos.y,
        r: baseR * (0.55 + zoom * 0.45) * 5,
        name: p.name,
        type: "Planet",
        detail: `${p.magnitudeLabel} · ${p.altitudeLabel} · face ${azimuthToCompassFull(p.azimuth)}`,
        az: p.azimuth, alt: p.altitude,
        planetId: p.id,
      });
    }

    // ── ISS ───────────────────────────────────────────────────────────────────
    if (issPosition?.isOverhead) {
      const iPos = altAzToCanvas(issPosition.altitude, issPosition.azimuth, cx, cy, R, zoom);
      if (iPos.visible) {
        const pulse = 0.7 + 0.3 * Math.sin((Date.now() / 800) % (Math.PI * 2));
        const issR = 12 * (0.7 + zoom * 0.3);
        ctx.save();
        ctx.globalAlpha = pulse;
        const g = ctx.createRadialGradient(iPos.x, iPos.y, 0, iPos.x, iPos.y, issR);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.4, "#aabfff");
        g.addColorStop(1, "rgba(170,191,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(iPos.x, iPos.y, issR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(iPos.x, iPos.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        hoveredRef.current.push({
          x: iPos.x, y: iPos.y, r: issR * 1.5,
          name: "ISS", type: "Spacecraft",
          detail: `${issPosition.altitudeLabel} · heading ${issPosition.compass} — 7 people aboard right now`,
          az: issPosition.azimuth, alt: issPosition.altitude,
        });
      }
    }

    ctx.restore(); // end clip

    // ── Border & glow ─────────────────────────────────────────────────────────
    const border = ctx.createLinearGradient(0, 0, W, H);
    border.addColorStop(0, "rgba(175,169,236,0.5)");
    border.addColorStop(0.5, "rgba(97,89,176,0.35)");
    border.addColorStop(1, "rgba(175,169,236,0.5)");
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(baseCx, baseCy, R, 0, Math.PI * 2);
    ctx.stroke();

    const outerGlow = ctx.createRadialGradient(baseCx, baseCy, R - 5, baseCx, baseCy, R + 30);
    outerGlow.addColorStop(0, "rgba(97,89,176,0.22)");
    outerGlow.addColorStop(1, "rgba(97,89,176,0)");
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(baseCx, baseCy, R + 30, 0, Math.PI * 2);
    ctx.arc(baseCx, baseCy, R - 5, 0, Math.PI * 2, true);
    ctx.fill();

    // ── Cardinal labels ───────────────────────────────────────────────────────
    ctx.font = "11px Outfit, sans-serif";
    ctx.fillStyle = "rgba(175,169,236,0.45)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const cardinals: [string, number, number][] = [
      ["N", baseCx, baseCy - R + 14], ["S", baseCx, baseCy + R - 14],
      ["E", baseCx + R - 14, baseCy], ["W", baseCx - R + 14, baseCy],
    ];
    for (const [l, x, y] of cardinals) ctx.fillText(l, x, y);

    // ── Altitude rings (zoom > 1) ─────────────────────────────────────────────
    if (zoom > 1.2) {
      const minAlt = 90 - 90 / zoom;
      [30, 60].forEach(alt => {
        if (alt < minAlt) return;
        const ringR = ((90 - alt) / (90 / zoom)) * R;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(175,169,236,0.07)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(175,169,236,0.28)";
        ctx.font = "9px Outfit, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`${alt}°`, cx + ringR + 4, cy);
        ctx.restore();
      });
    }
  }, [lat, lon, planets, moon, issPosition, zoom, pan]);

  useEffect(() => {
    let frame: number;
    function loop() { draw(); frame = requestAnimationFrame(loop); }
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [draw]);

  // ── Interaction handlers ────────────────────────────────────────────────────

  function handleWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault();
    setZoom(z => {
      const nz = Math.max(1, Math.min(3, z - e.deltaY * 0.003));
      if (nz <= 1) setPan({ x: 0, y: 0 });
      return nz;
    });
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    if (zoom <= 1) return;
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const d = dragRef.current;
    if (d.active) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const scale = canvasRef.current!.width / rect.width;
      const dx = (e.clientX - d.startX) * scale;
      const dy = (e.clientY - d.startY) * scale;
      const maxPan = (size / 2) * (1 - 1 / zoom) * 1.2;
      setPan({
        x: Math.max(-maxPan, Math.min(maxPan, d.panX + dx)),
        y: Math.max(-maxPan, Math.min(maxPan, d.panY + dy)),
      });
      return;
    }

    const rect = canvasRef.current!.getBoundingClientRect();
    const scale = canvasRef.current!.width / rect.width;
    const mx = (e.clientX - rect.left) * scale;
    const my = (e.clientY - rect.top) * scale;
    for (const obj of hoveredRef.current) {
      if (Math.hypot(obj.x - mx, obj.y - my) < obj.r) {
        setTooltip({ ...obj, screenX: e.clientX - rect.left, screenY: e.clientY - rect.top });
        return;
      }
    }
    setTooltip(null);
  }

  function onMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    dragRef.current.active = false;
    const dx = Math.abs(e.clientX - mouseDownPosRef.current.x);
    const dy = Math.abs(e.clientY - mouseDownPosRef.current.y);
    if (dx < 5 && dy < 5) {
      // It's a click — find clicked object
      const rect = canvasRef.current!.getBoundingClientRect();
      const scale = canvasRef.current!.width / rect.width;
      const mx = (e.clientX - rect.left) * scale;
      const my = (e.clientY - rect.top) * scale;
      for (const obj of hoveredRef.current) {
        if (Math.hypot(obj.x - mx, obj.y - my) < obj.r && obj.planetId) {
          const planet = planetsRef.current.find(p => p.id === obj.planetId);
          if (planet) { setSelectedPlanet(planet); return; }
        }
      }
    }
  }

  const canvasSize = size;

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{ position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          style={{
            borderRadius: "50%",
            display: "block",
            cursor: dragRef.current.active ? "grabbing" : zoom > 1 ? "grab" : "crosshair",
            boxShadow: "0 0 60px rgba(97,89,176,0.28), 0 0 120px rgba(97,89,176,0.10)",
          }}
          onWheel={handleWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={() => { setTooltip(null); dragRef.current.active = false; }}
        />

        {/* Zoom controls */}
        <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          {([{ label: "+", delta: 0.4 }, { label: "−", delta: -0.4 }] as const).map(({ label, delta }) => (
            <button
              key={label}
              onClick={() => setZoom(z => { const nz = Math.max(1, Math.min(3, z + delta)); if (nz <= 1) setPan({ x: 0, y: 0 }); return nz; })}
              style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "rgba(13,14,31,0.8)",
                border: "1px solid rgba(175,169,236,0.22)",
                color: "#afa9ec", fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                lineHeight: 1, transition: "all 0.2s ease",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(97,89,176,0.4)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(13,14,31,0.8)")}
            >
              {label}
            </button>
          ))}
          {zoom > 1 && (
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "rgba(13,14,31,0.8)",
                border: "1px solid rgba(175,169,236,0.18)",
                color: "rgba(175,169,236,0.5)", fontSize: 9, cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              1:1
            </button>
          )}
        </div>

        {zoom > 1 && (
          <div style={{
            position: "absolute", top: 16, left: 16,
            background: "rgba(13,14,31,0.75)",
            border: "1px solid rgba(175,169,236,0.14)",
            borderRadius: 12, padding: "3px 10px",
            fontSize: 11, color: "rgba(175,169,236,0.55)",
            fontFamily: "Outfit, sans-serif",
          }}>
            {zoom.toFixed(1)}×
          </div>
        )}

        {/* Hover tooltip */}
        {tooltip && !selectedPlanet && (
          <div
            className="tooltip-card glass"
            style={{
              left: Math.min(tooltip.screenX + 14, canvasSize - 250),
              top: Math.max(tooltip.screenY - 70, 8),
              padding: "12px 14px",
            }}
          >
            <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 17, color: "#afa9ec", fontStyle: "italic" }}>
              {tooltip.name}
            </div>
            <div style={{ fontSize: 11, color: "#6159b0", marginTop: 2 }}>{tooltip.type}</div>
            <div style={{ fontSize: 12, color: "#ccc8f5", marginTop: 6, lineHeight: 1.5 }}>{tooltip.detail}</div>
            {tooltip.planetId && (
              <div style={{ marginTop: 8, fontSize: 11, color: "rgba(175,169,236,0.4)", fontFamily: "Outfit, sans-serif", letterSpacing: "0.04em" }}>
                click for details →
              </div>
            )}
          </div>
        )}
      </div>

      <p style={{ fontSize: 11, color: "rgba(175,169,236,0.28)", letterSpacing: "0.06em" }}>
        scroll to zoom · hover objects · click planets for details
      </p>

      {/* Planet detail modal */}
      {selectedPlanet && (
        <PlanetModal planet={selectedPlanet} onClose={() => setSelectedPlanet(null)} />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  );
}
