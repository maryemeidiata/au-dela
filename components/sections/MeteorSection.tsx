"use client";
import GlassCard from "@/components/ui/GlassCard";
import QualityScore from "@/components/ui/QualityScore";
import showersData from "@/data/meteor-showers.json";
import { computeQualityScore } from "@/lib/quality-score";
import { formatRelativeDate } from "@/lib/utils";

interface Props { lat: number; lon: number }

interface Shower {
  id: string;
  name: string;
  peak: string;
  start: string;
  end: string;
  zhr: number;
  description: string;
  bestViewing: string;
  parentBody: string;
}

function getUpcomingShowers(): Shower[] {
  const now = new Date();
  return (showersData as Shower[])
    .filter(s => new Date(s.end) > now)
    .sort((a, b) => new Date(a.peak).getTime() - new Date(b.peak).getTime())
    .slice(0, 3);
}

export default function MeteorSection({ lat, lon }: Props) {
  const showers = getUpcomingShowers();
  const featured = showers[0];

  if (!featured) return null;

  const featuredDate = new Date(featured.peak);
  const quality = computeQualityScore(lat, lon, featuredDate);
  const relDate = formatRelativeDate(featuredDate);

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
        Meteor showers
      </h2>

      {/* Featured */}
      <GlassCard style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <div
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontStyle: "italic",
                fontSize: 26,
                color: "#afa9ec",
                fontWeight: 400,
                marginBottom: 4,
              }}
            >
              {featured.name}
            </div>
            <div style={{ fontSize: 13, color: "rgba(175,169,236,0.55)", marginBottom: 12 }}>
              Peak {relDate} &middot;{" "}
              {featuredDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </div>
            <p style={{ fontSize: 13, color: "rgba(232,230,248,0.7)", lineHeight: 1.65, marginBottom: 10 }}>
              {featured.description}
            </p>
            <p style={{ fontSize: 12, color: "rgba(175,169,236,0.5)" }}>
              Up to {featured.zhr} meteors per hour under ideal conditions &middot; from {featured.parentBody}
            </p>
            <p style={{ fontSize: 12, color: "rgba(175,169,236,0.45)", marginTop: 6 }}>
              {featured.bestViewing}
            </p>
          </div>
          <div style={{ minWidth: 180 }}>
            <QualityScore result={quality} />
          </div>
        </div>
      </GlassCard>

      {/* Timeline of next 3 */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {showers.slice(1).map(s => {
          const d = new Date(s.peak);
          const q = computeQualityScore(lat, lon, d);
          return (
            <GlassCard key={s.id} style={{ flex: "1 1 200px", minWidth: 190 }}>
              <div
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  fontSize: 17,
                  color: "#afa9ec",
                  fontWeight: 400,
                  marginBottom: 4,
                }}
              >
                {s.name}
              </div>
              <div style={{ fontSize: 11, color: "rgba(175,169,236,0.45)", marginBottom: 8 }}>
                {formatRelativeDate(d)}
              </div>
              <div style={{ fontSize: 12, color: "rgba(232,230,248,0.6)", lineHeight: 1.5, marginBottom: 8 }}>
                Up to {s.zhr} meteors/hr peak
              </div>
              <QualityScore result={q} compact />
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
}
