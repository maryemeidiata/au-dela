"use client";
import { useEffect, useRef } from "react";
import { randomBetween } from "@/lib/utils";

interface Star {
  x: number;
  y: number;
  r: number;
  opacity: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  opacity: number;
  life: number;
  maxLife: number;
}

const STAR_COLORS = [
  "#ffffff", "#ffffff", "#ffffff",
  "#cce4ff", "#ddeeff", "#e8f0ff",
  "#fff8e8", "#ffeedd",
  "#f0f0ff",
];

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const animFrameRef = useRef<number>(0);
  const lastShootRef = useRef<number>(0);
  const introOpacityRef = useRef<number>(0);
  const milkyOpacityRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  function buildStars(w: number, h: number) {
    const stars: Star[] = [];
    for (let i = 0; i < 900; i++) {
      const baseOpacity = randomBetween(0.18, 1.0);
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: randomBetween(0.3, 2.5),
        opacity: baseOpacity,
        baseOpacity,
        twinkleSpeed: randomBetween(0.3, 2.5),
        twinklePhase: Math.random() * Math.PI * 2,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      });
    }
    starsRef.current = stars;
  }

  function drawMilkyWay(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    opacity: number
  ) {
    ctx.save();
    ctx.globalAlpha = opacity * 0.18;

    // Main band
    const angle = -0.35;
    const cx = w * 0.5, cy = h * 0.5;
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const bandW = w * 0.55;
    const bandH = h * 1.6;

    const grad = ctx.createLinearGradient(-bandW / 2, 0, bandW / 2, 0);
    grad.addColorStop(0, "rgba(120,130,180,0)");
    grad.addColorStop(0.2, "rgba(140,150,200,0.12)");
    grad.addColorStop(0.4, "rgba(160,170,220,0.22)");
    grad.addColorStop(0.5, "rgba(180,185,230,0.28)");
    grad.addColorStop(0.6, "rgba(160,170,220,0.22)");
    grad.addColorStop(0.8, "rgba(140,150,200,0.12)");
    grad.addColorStop(1, "rgba(120,130,180,0)");

    ctx.fillStyle = grad;
    ctx.filter = "blur(28px)";
    ctx.fillRect(-bandW / 2, -bandH / 2, bandW, bandH);
    ctx.filter = "none";

    // Denser core
    ctx.globalAlpha = opacity * 0.09;
    const coreGrad = ctx.createLinearGradient(-bandW * 0.2, 0, bandW * 0.2, 0);
    coreGrad.addColorStop(0, "rgba(200,210,255,0)");
    coreGrad.addColorStop(0.5, "rgba(220,225,255,0.35)");
    coreGrad.addColorStop(1, "rgba(200,210,255,0)");
    ctx.fillStyle = coreGrad;
    ctx.filter = "blur(18px)";
    ctx.fillRect(-bandW * 0.2, -bandH / 2, bandW * 0.4, bandH);
    ctx.filter = "none";

    ctx.restore();
  }

  function drawShootingStar(
    ctx: CanvasRenderingContext2D,
    s: ShootingStar
  ) {
    const t = s.life / s.maxLife;
    const alpha = s.opacity * (1 - t * t);
    const grad = ctx.createLinearGradient(
      s.x - s.vx * s.length,
      s.y - s.vy * s.length,
      s.x,
      s.y
    );
    grad.addColorStop(0, `rgba(255,255,255,0)`);
    grad.addColorStop(0.7, `rgba(220,230,255,${alpha * 0.5})`);
    grad.addColorStop(1, `rgba(255,255,255,${alpha})`);

    ctx.save();
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(s.x - s.vx * s.length, s.y - s.vy * s.length);
    ctx.lineTo(s.x, s.y);
    ctx.stroke();
    ctx.restore();
  }

  function spawnShootingStar(w: number, h: number) {
    const angle = randomBetween(15, 55) * (Math.PI / 180);
    const speed = randomBetween(8, 18);
    const startX = randomBetween(w * 0.1, w * 0.7);
    const startY = randomBetween(h * 0.05, h * 0.4);
    shootingStarsRef.current.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      length: randomBetween(40, 120),
      opacity: randomBetween(0.7, 1.0),
      life: 0,
      maxLife: randomBetween(25, 55),
    });
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      buildStars(canvas!.width, canvas!.height);
    }
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    function tick() {
      const now = Date.now();
      const elapsed = (now - startTimeRef.current) / 1000;
      const w = canvas!.width, h = canvas!.height;

      // Intro opacity: stars fade in over 1.5s
      introOpacityRef.current = Math.min(1, elapsed / 1.5);
      // Milky way fades in after 1.5s over 1s
      milkyOpacityRef.current = Math.max(0, Math.min(1, (elapsed - 1.5) / 1.0));

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#06070f";
      ctx.fillRect(0, 0, w, h);

      // Milky Way
      if (milkyOpacityRef.current > 0) {
        drawMilkyWay(ctx, w, h, milkyOpacityRef.current);
      }

      // Stars
      const t = now / 1000;
      for (const star of starsRef.current) {
        const twinkle = 0.5 + 0.5 * Math.sin(t * star.twinkleSpeed + star.twinklePhase);
        const opacity = (star.baseOpacity * 0.6 + twinkle * star.baseOpacity * 0.4) * introOpacityRef.current;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = star.color;
        if (star.r > 1.5) {
          // Glow for bright stars
          const g = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.r * 2.5);
          g.addColorStop(0, star.color);
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r * 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Shooting stars
      if (introOpacityRef.current > 0.9) {
        const nextShoot = lastShootRef.current + randomBetween(30000, 90000);
        if (now > nextShoot && frame > 120) {
          spawnShootingStar(w, h);
          lastShootRef.current = now;
        }
      }

      shootingStarsRef.current = shootingStarsRef.current.filter(s => {
        s.x += s.vx;
        s.y += s.vy;
        s.life++;
        drawShootingStar(ctx, s);
        return s.life < s.maxLife;
      });

      frame++;
      animFrameRef.current = requestAnimationFrame(tick);
    }

    tick();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        display: "block",
      }}
    />
  );
}
