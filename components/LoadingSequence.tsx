"use client";
import { useEffect, useState } from "react";

interface Props {
  cityName: string;
  eventCount: number;
  onComplete: () => void;
}

type Phase = "hidden" | "text-in" | "text-hold" | "text-out" | "done";

export default function LoadingSequence({ cityName, eventCount, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("hidden");
  const [textOpacity, setTextOpacity] = useState(0);
  const [textY, setTextY] = useState(0);

  useEffect(() => {
    // Stars fade in (handled by StarField over 1.5s)
    // Milky way fades in (1.5s – 2.5s, handled by StarField)
    // Text fades in at 3s
    const t1 = setTimeout(() => setPhase("text-in"), 3000);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase === "text-in") {
      setTextOpacity(0);
      setTextY(8);
      let start: number;
      const dur = 1200;
      const raf = requestAnimationFrame(function tick(ts) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
        setTextOpacity(ease);
        setTextY(8 * (1 - ease));
        if (p < 1) requestAnimationFrame(tick);
        else setPhase("text-hold");
      });
      return () => cancelAnimationFrame(raf);
    }

    if (phase === "text-hold") {
      const t = setTimeout(() => setPhase("text-out"), 2200);
      return () => clearTimeout(t);
    }

    if (phase === "text-out") {
      let start: number;
      const dur = 800;
      const raf = requestAnimationFrame(function tick(ts) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        setTextOpacity(1 - p);
        setTextY(-(40 * p));
        if (p < 1) requestAnimationFrame(tick);
        else { setPhase("done"); onComplete(); }
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [phase, onComplete]);

  if (phase === "done") return null;

  const city = cityName && cityName !== "your location" ? cityName : "your sky";
  const count = eventCount > 0 ? eventCount : 7;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: phase === "text-in" || phase === "text-hold" || phase === "text-out"
          ? "auto"
          : "none",
      }}
    >
      <div
        style={{
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
          textAlign: "center",
          padding: "0 32px",
          maxWidth: 700,
        }}
      >
        <p
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(24px, 4vw, 44px)",
            color: "#e8e6f8",
            lineHeight: 1.4,
            letterSpacing: "0.01em",
          }}
          className="text-glow"
        >
          Tonight from {city},
        </p>
        <p
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: "clamp(22px, 3.5vw, 40px)",
            color: "#afa9ec",
            lineHeight: 1.4,
            marginTop: 8,
          }}
        >
          {count} {count === 1 ? "thing is" : "things are"} worth looking up for.
        </p>
      </div>
    </div>
  );
}
