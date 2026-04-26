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
  color: string; opacity: number; angle: number;
  driftX: number; driftY: number; pulseSpeed: number; pulsePhase: number;
}

const STAR_COLORS = [
  "#ffffff","#ffffff","#ffffff","#ffffff",
  "#cce4ff","#ddeeff","#e8f0ff","#c8d8ff",
  "#fff8e8","#ffeedd","#f0f0ff",
];

const NEBULA_COLORS = [
  "rgba(97,60,176,",
  "rgba(60,80,176,",
  "rgba(120,60,160,",
  "rgba(40,100,180,",
  "rgba(80,40,160,",
  "rgba(60,140,160,",
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
    starsRef.current = Array.from({ length: 950 }, () => {
      const baseOpacity = randomBetween(0.15, 1.0);
      return {
        x: Math.random() * w, y: Math.random() * h,
        r: randomBetween(0.25, 2.5),
        baseOpacity,
        twinkleSpeed: randomBetween(0.2, 2.8),
        twinklePhase: Math.random() * Math.PI * 2,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      };
    });
  }

  function buildNebulae(w: number, h: number) {
    nebulaeRef.current = Array.from({ length: 7 }, () => ({
      x: randomBetween(w * 0.05, w * 0.95),
      y: randomBetween(h * 0.05, h * 0.95),
      rx: randomBetween(w * 0.12, w * 0.35),
      ry: randomBetween(h * 0.08, h * 0.25),
      color: NEBULA_COLORS[Math.floor(Math.random() * NEBULA_COLORS.length)],
      opacity: randomBetween(0.03, 0.09),
      angle: Math.random() * Math.PI,
      driftX: randomBetween(-0.08, 0.08),
      driftY: randomBetween(-0.04, 0.04),
      pulseSpeed: randomBetween(0.0003, 0.001),
      pulsePhase: Math.random() * Math.PI * 2,
    }));
  }

  function drawMilkyWay(ctx: CanvasRenderingContext2D, w: number, h: number, opacity: number) {
    ctx.save();
    const cx = w * 0.5, cy = h * 0.5;
    ctx.translate(cx, cy);
    ctx.rotate(-0.35);
    const bw = w * 0.55, bh = h * 1.65;

    // Outer haze
    ctx.globalAlpha = opacity * 0.14;
    const outer = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
    outer.addColorStop(0, "rgba(110,120,170,0)");
    outer.addColorStop(0.25, "rgba(140,150,200,0.18)");
    outer.addColorStop(0.5, "rgba(165,170,220,0.26)");
    outer.addColorStop(0.75, "rgba(140,150,200,0.18)");
    outer.addColorStop(1, "rgba(110,120,170,0)");
    ctx.fillStyle = outer;
    ctx.filter = "blur(30px)";
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.filter = "none";

    // Dense core
    ctx.globalAlpha = opacity * 0.08;
    const core = ctx.createLinearGradient(-bw * 0.18, 0, bw * 0.18, 0);
    core.addColorStop(0, "rgba(200,210,255,0)");
    core.addColorStop(0.5, "rgba(210,215,255,0.4)");
    core.addColorStop(1, "rgba(200,210,255,0)");
    ctx.fillStyle = core;
    ctx.filter = "blur(18px)";
    ctx.fillRect(-bw * 0.18, -bh / 2, bw * 0.36, bh);
    ctx.filter = "none";
    ctx.restore();
  }

  function drawNebulae(ctx: CanvasRenderingContext2D, t: number) {
    for (const n of nebulaeRef.current) {
      const pulse = Math.sin(t * n.pulseSpeed + n.pulsePhase);
      const alpha = n.opacity * (0.75 + 0.25 * pulse);
      const scaleX = 1 + 0.06 * Math.sin(t * n.pulseSpeed * 0.7 + n.pulsePhase);
      const scaleY = 1 + 0.04 * Math.cos(t * n.pulseSpeed * 0.9 + n.pulsePhase + 1);

      ctx.save();
      ctx.translate(n.x + n.driftX * (t * 0.002), n.y + n.driftY * (t * 0.002));
      ctx.rotate(n.angle + t * 0.00005);
      ctx.scale(scaleX, scaleY);

      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, n.rx);
      g.addColorStop(0, n.color + (alpha * 1.8).toFixed(3) + ")");
      g.addColorStop(0.4, n.color + (alpha * 0.9).toFixed(3) + ")");
      g.addColorStop(1, n.color + "0)");
      ctx.scale(1, n.ry / n.rx);
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.filter = "blur(22px)";
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
      opacity: randomBetween(0.7, 1.0),
      life: 0,
      maxLife: randomBetween(22, 55),
    });
  }

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    nextShootDelayRef.current = randomBetween(20000, 60000);

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
      const starOpacity = Math.min(1, elapsed / 1.5);
      const milkyOpacity = Math.max(0, Math.min(1, (elapsed - 1.5) / 1.0));
      const nebulaOpacity = Math.max(0, Math.min(1, (elapsed - 2.2) / 1.2));
      const t = now;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#06070f";
      ctx.fillRect(0, 0, w, h);

      if (milkyOpacity > 0) drawMilkyWay(ctx, w, h, milkyOpacity);
      if (nebulaOpacity > 0) {
        ctx.globalAlpha = nebulaOpacity;
        drawNebulae(ctx, t);
        ctx.globalAlpha = 1;
      }

      // Stars with twinkle
      for (const star of starsRef.current) {
        const twinkle = 0.55 + 0.45 * Math.sin(t * 0.001 * star.twinkleSpeed + star.twinklePhase);
        const opacity = star.baseOpacity * twinkle * starOpacity;
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
      if (starOpacity > 0.9 && frame > 90) {
        if (now - lastShootRef.current > nextShootDelayRef.current) {
          spawnShooter(w, h);
          lastShootRef.current = now;
          nextShootDelayRef.current = randomBetween(18000, 65000);
        }
      }

      shootingRef.current = shootingRef.current.filter(s => {
        s.x += s.vx; s.y += s.vy; s.life++;
        const a = s.opacity * (1 - (s.life / s.maxLife) ** 1.5);
        const g = ctx.createLinearGradient(
          s.x - s.vx * s.length, s.y - s.vy * s.length, s.x, s.y
        );
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
