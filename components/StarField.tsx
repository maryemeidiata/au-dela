"use client";
import { useEffect, useRef } from "react";
import { randomBetween } from "@/lib/utils";

interface Star {
  x: number; y: number; r: number;
  baseOpacity: number; twinkleSpeed: number; twinklePhase: number; color: string;
}
interface ShootingStar {
  x: number; y: number; vx: number; vy: number;
  length: number; opacity: number; life: number; maxLife: number;
}
interface NebulaCloud {
  x: number; y: number; rx: number; ry: number;
  r: number; g: number; b: number;
  opacity: number; angle: number;
  driftX: number; driftY: number;
  pulseSpeed: number; pulsePhase: number;
}

const STAR_COLORS = [
  "#ffffff","#ffffff","#ffffff","#ffffff",
  "#cce4ff","#ddeeff","#e8f0ff","#c8d8ff",
  "#fff8e8","#ffeedd","#f0f0ff",
];

// Vivid nebula color palette — RGB triplets
const NEBULA_PALETTE = [
  [110, 60, 200],   // deep purple
  [60,  80, 210],   // cobalt blue
  [140, 40, 180],   // violet
  [30, 110, 200],   // ocean blue
  [80,  30, 170],   // indigo
  [40, 150, 170],   // teal
  [160, 50, 130],   // magenta-purple
];

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingRef = useRef<ShootingStar[]>([]);
  const nebulaeRef = useRef<NebulaCloud[]>([]);
  const animRef = useRef<number>(0);
  const lastShootRef = useRef<number>(0);
  const nextShootDelayRef = useRef<number>(0);
  const startRef = useRef<number>(Date.now());

  function buildStars(w: number, h: number) {
    starsRef.current = Array.from({ length: 950 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: randomBetween(0.25, 2.5),
      baseOpacity: randomBetween(0.15, 1.0),
      twinkleSpeed: randomBetween(0.2, 2.8),
      twinklePhase: Math.random() * Math.PI * 2,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    }));
  }

  function buildNebulae(w: number, h: number) {
    nebulaeRef.current = Array.from({ length: 6 }, () => {
      const [r, g, b] = NEBULA_PALETTE[Math.floor(Math.random() * NEBULA_PALETTE.length)];
      return {
        x: randomBetween(w * 0.05, w * 0.95),
        y: randomBetween(h * 0.05, h * 0.95),
        rx: randomBetween(w * 0.15, w * 0.38),
        ry: randomBetween(h * 0.10, h * 0.28),
        r, g, b,
        opacity: randomBetween(0.14, 0.26),
        angle: Math.random() * Math.PI,
        driftX: randomBetween(-0.012, 0.012),
        driftY: randomBetween(-0.008, 0.008),
        pulseSpeed: randomBetween(0.0004, 0.0012),
        pulsePhase: Math.random() * Math.PI * 2,
      };
    });
  }

  function drawMilkyWay(ctx: CanvasRenderingContext2D, w: number, h: number, opacity: number) {
    ctx.save();
    ctx.translate(w * 0.5, h * 0.5);
    ctx.rotate(-0.35);
    const bw = w * 0.55, bh = h * 1.65;

    ctx.globalAlpha = opacity * 0.18;
    const outer = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
    outer.addColorStop(0, "rgba(110,120,170,0)");
    outer.addColorStop(0.25, "rgba(140,155,210,0.25)");
    outer.addColorStop(0.5, "rgba(165,175,230,0.35)");
    outer.addColorStop(0.75, "rgba(140,155,210,0.25)");
    outer.addColorStop(1, "rgba(110,120,170,0)");
    ctx.fillStyle = outer;
    ctx.filter = "blur(28px)";
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.filter = "none";

    ctx.globalAlpha = opacity * 0.10;
    const core = ctx.createLinearGradient(-bw * 0.18, 0, bw * 0.18, 0);
    core.addColorStop(0, "rgba(200,210,255,0)");
    core.addColorStop(0.5, "rgba(215,220,255,0.5)");
    core.addColorStop(1, "rgba(200,210,255,0)");
    ctx.fillStyle = core;
    ctx.filter = "blur(16px)";
    ctx.fillRect(-bw * 0.18, -bh / 2, bw * 0.36, bh);
    ctx.filter = "none";
    ctx.restore();
  }

  function drawNebulae(ctx: CanvasRenderingContext2D, t: number, masterAlpha: number) {
    for (const n of nebulaeRef.current) {
      const pulse = Math.sin(t * n.pulseSpeed + n.pulsePhase);
      const alpha = n.opacity * (0.7 + 0.3 * pulse) * masterAlpha;
      const nx = n.x + n.driftX * t * 0.015;
      const ny = n.y + n.driftY * t * 0.015;

      ctx.save();
      ctx.translate(nx, ny);
      ctx.rotate(n.angle + t * 0.00004);
      ctx.scale(1 + 0.05 * Math.sin(t * n.pulseSpeed * 0.8), 1 + 0.03 * Math.cos(t * n.pulseSpeed * 1.2));

      // Two-layer nebula: large soft outer + smaller brighter core
      const outer = ctx.createRadialGradient(0, 0, 0, 0, 0, n.rx);
      outer.addColorStop(0,   `rgba(${n.r},${n.g},${n.b},${(alpha * 0.9).toFixed(3)})`);
      outer.addColorStop(0.35,`rgba(${n.r},${n.g},${n.b},${(alpha * 0.55).toFixed(3)})`);
      outer.addColorStop(0.7, `rgba(${n.r},${n.g},${n.b},${(alpha * 0.18).toFixed(3)})`);
      outer.addColorStop(1,   `rgba(${n.r},${n.g},${n.b},0)`);

      ctx.scale(1, n.ry / n.rx);
      ctx.fillStyle = outer;
      ctx.filter = "blur(14px)";
      ctx.beginPath();
      ctx.arc(0, 0, n.rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.filter = "none";
      ctx.restore();
    }
  }

  function spawnShooter(w: number, h: number) {
    const angle = randomBetween(10, 60) * (Math.PI / 180);
    const speed = randomBetween(9, 20);
    shootingRef.current.push({
      x: randomBetween(w * 0.05, w * 0.75),
      y: randomBetween(h * 0.03, h * 0.45),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      length: randomBetween(50, 140),
      opacity: randomBetween(0.75, 1.0),
      life: 0,
      maxLife: randomBetween(22, 52),
    });
  }

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    nextShootDelayRef.current = randomBetween(18000, 55000);

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      buildStars(canvas.width, canvas.height);
      buildNebulae(canvas.width, canvas.height);
    }
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    function tick() {
      const now = Date.now();
      const elapsed = (now - startRef.current) / 1000;
      const w = canvas.width, h = canvas.height;
      const starAlpha  = Math.min(1, elapsed / 1.5);
      const milkyAlpha = Math.max(0, Math.min(1, (elapsed - 1.5) / 1.0));
      const nebulaAlpha = Math.max(0, Math.min(1, (elapsed - 2.0) / 1.5));
      const t = now;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#06070f";
      ctx.fillRect(0, 0, w, h);

      if (milkyAlpha > 0) drawMilkyWay(ctx, w, h, milkyAlpha);
      if (nebulaAlpha > 0) drawNebulae(ctx, t, nebulaAlpha);

      // Stars
      for (const star of starsRef.current) {
        const twinkle = 0.55 + 0.45 * Math.sin(t * 0.001 * star.twinkleSpeed + star.twinklePhase);
        const opacity = star.baseOpacity * twinkle * starAlpha;
        ctx.save();
        ctx.globalAlpha = opacity;
        if (star.r > 1.5) {
          const g = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.r * 2.5);
          g.addColorStop(0, star.color);
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Shooting stars
      if (starAlpha > 0.9 && frame > 90) {
        if (now - lastShootRef.current > nextShootDelayRef.current) {
          spawnShooter(w, h);
          lastShootRef.current = now;
          nextShootDelayRef.current = randomBetween(18000, 65000);
        }
      }
      shootingRef.current = shootingRef.current.filter(s => {
        s.x += s.vx; s.y += s.vy; s.life++;
        const a = s.opacity * (1 - (s.life / s.maxLife) ** 1.5);
        const g = ctx.createLinearGradient(s.x - s.vx * s.length, s.y - s.vy * s.length, s.x, s.y);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(0.6, `rgba(220,230,255,${(a * 0.45).toFixed(3)})`);
        g.addColorStop(1, `rgba(255,255,255,${a.toFixed(3)})`);
        ctx.save();
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s.x - s.vx * s.length, s.y - s.vy * s.length);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
        ctx.restore();
        return s.life < s.maxLife;
      });

      frame++;
      animRef.current = requestAnimationFrame(tick);
    }
    tick();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", display: "block" }}
    />
  );
}
