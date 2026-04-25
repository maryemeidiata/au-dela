"use client";
import type { QualityResult } from "@/lib/quality-score";

interface Props {
  result: QualityResult;
  compact?: boolean;
}

const COLOR_MAP: Record<string, string> = {
  Exceptional: "#7bff9e",
  "Very good": "#a0e8af",
  Good: "#afa9ec",
  Fair: "#e8c87a",
  Poor: "#e87a7a",
};

export default function QualityScore({ result, compact }: Props) {
  const color = COLOR_MAP[result.label] ?? "#afa9ec";
  const pct = result.score;

  if (compact) {
    return (
      <span style={{ color, fontSize: 12, fontWeight: 400 }}>
        {result.label} ({result.score}/100)
      </span>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: "50%",
            border: `2px solid ${color}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 400, color,
            flexShrink: 0,
          }}
        >
          {pct}
        </div>
        <div>
          <div style={{ color, fontSize: 14, fontWeight: 400 }}>{result.label} conditions</div>
          <div style={{ color: "rgba(175,169,236,0.55)", fontSize: 12, marginTop: 2 }}>
            Visibility quality
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div style={{ height: 3, borderRadius: 2, background: "rgba(175,169,236,0.1)", overflow: "hidden" }}>
        <div
          style={{
            height: "100%", borderRadius: 2,
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            transition: "width 0.6s ease",
          }}
        />
      </div>

      <p style={{ fontSize: 12, color: "rgba(175,169,236,0.6)", marginTop: 8, lineHeight: 1.5 }}>
        {result.explanation}
      </p>
    </div>
  );
}
