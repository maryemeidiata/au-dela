"use client";
import GlassCard from "@/components/ui/GlassCard";
import QualityScore from "@/components/ui/QualityScore";
import eventsData from "@/data/special-events.json";
import { computeQualityScore } from "@/lib/quality-score";
import { formatRelativeDate } from "@/lib/utils";

interface Props { lat: number; lon: number }

interface Event {
  id: string;
  name: string;
  date: string;
  type: string;
  description: string;
  why_special: string;
  visibility_notes: string;
}

const TYPE_ICONS: Record<string, string> = {
  opposition: "◉",
  eclipse_lunar: "◯",
  eclipse_solar: "⊙",
  meteor_shower: "✦",
  elongation: "◈",
  comet: "☄",
};

export default function EventsSection({ lat, lon }: Props) {
  const now = new Date();
  const cutoff = new Date(now.getTime() + 90 * 86400000);

  const upcoming = (eventsData as Event[])
    .filter(e => {
      const d = new Date(e.date);
      return d >= now && d <= cutoff;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (upcoming.length === 0) return null;

  return (
    <section className="section-reveal">
      <h2
        style={{
          fontFamily: "Cormorant Garamond, serif",
          fontStyle: "italic",
          fontSize: 28,
          color: "#e8e6f8",
          marginBottom: 6,
          fontWeight: 400,
        }}
      >
        Upcoming space events
      </h2>
      <p style={{ fontSize: 13, color: "rgba(175,169,236,0.45)", marginBottom: 20 }}>
        Next 90 days &middot; sorted by date
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {upcoming.map(event => {
          const d = new Date(event.date);
          const quality = computeQualityScore(lat, lon, d);
          const icon = TYPE_ICONS[event.type] ?? "✦";
          const relDate = formatRelativeDate(d);

          return (
            <GlassCard key={event.id} style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 20, color: "#6159b0", flexShrink: 0, marginTop: 1 }}>{icon}</span>
                <div>
                  <div
                    style={{
                      fontFamily: "Cormorant Garamond, serif",
                      fontSize: 18,
                      color: "#afa9ec",
                      fontWeight: 400,
                      lineHeight: 1.3,
                    }}
                  >
                    {event.name}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(175,169,236,0.45)", marginTop: 3 }}>
                    {relDate} &middot;{" "}
                    {d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 13, color: "rgba(232,230,248,0.65)", lineHeight: 1.6, marginBottom: 10 }}>
                {event.description}
              </p>

              <p
                style={{
                  fontSize: 12,
                  color: "rgba(175,169,236,0.5)",
                  lineHeight: 1.5,
                  marginBottom: 14,
                  fontStyle: "italic",
                  fontFamily: "Cormorant Garamond, serif",
                }}
              >
                {event.why_special}
              </p>

              <div
                style={{
                  borderTop: "1px solid rgba(175,169,236,0.1)",
                  paddingTop: 12,
                }}
              >
                <QualityScore result={quality} compact />
                <p style={{ fontSize: 11, color: "rgba(175,169,236,0.35)", marginTop: 6 }}>
                  {event.visibility_notes}
                </p>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
}
