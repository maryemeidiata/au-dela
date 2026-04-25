"use client";
import GlassCard from "@/components/ui/GlassCard";
import type { PlanetData, MoonData } from "@/hooks/useSkyData";
import type { ISSPass } from "@/hooks/useISSData";
import { moonPhase } from "@/lib/coordinates";
import { formatCountdown } from "@/lib/utils";

interface Highlight {
  icon: string;
  title: string;
  body: string;
}

interface Props {
  planets: PlanetData[];
  moon: MoonData | null;
  passes: ISSPass[];
}

function buildHighlights(planets: PlanetData[], moon: MoonData | null, passes: ISSPass[]): Highlight[] {
  const items: Highlight[] = [];

  // Best planet
  const visible = planets.filter(p => p.visible && p.altitude > 15);
  const best = visible.find(p => ["saturn", "jupiter", "venus", "mars"].includes(p.id));
  if (best) {
    const descriptions: Record<string, string> = {
      saturn: `Saturn is well-placed in the ${best.compassDirection} tonight. Its rings are tilted toward Earth right now, making this one of the best times to spot them with even a small telescope.`,
      jupiter: `Jupiter dominates the sky tonight from the ${best.compassDirection}, outshining everything around it. Binoculars will reveal its four brightest moons as tiny dots in a line.`,
      venus: `Venus blazes in the ${best.compassDirection} sky tonight. It is so bright it can cast faint shadows, and it never strays far enough from the Sun to be visible all night.`,
      mars: `Mars glows with a distinctive reddish tint in the ${best.compassDirection} sky. That color comes from iron oxide on its ancient surface, rust on a planetary scale.`,
    };
    items.push({
      icon: "✦",
      title: best.name,
      body: descriptions[best.id] ?? `${best.name} is visible tonight, ${best.altitudeLabel} toward the ${best.compassDirection}.`,
    });
  }

  // Moon
  if (moon) {
    const pct = Math.round(moon.illumination * 100);
    const moonBody = moon.phase < 0.05 || moon.phase > 0.95
      ? `A new moon tonight means the sky is as dark as it gets. An ideal night for any kind of stargazing, especially faint objects.`
      : moon.phase > 0.45 && moon.phase < 0.55
      ? `A full moon tonight will light up the sky considerably. Most faint objects will be washed out, but the Moon itself is beautiful and worth observing.`
      : `The ${moon.phaseName} is ${pct}% illuminated tonight, ${moon.altitudeLabel} in the ${moon.compassDirection}. ${pct < 50 ? "Conditions are decent for deeper sky objects." : "The moonlight will affect viewing of faint objects."}`;
    items.push({ icon: "◯", title: moon.phaseName, body: moonBody });
  }

  // ISS pass
  const nextPass = passes[0];
  if (nextPass) {
    const countdown = formatCountdown(nextPass.riseTime);
    items.push({
      icon: "◈",
      title: "ISS flyover coming up",
      body: `The International Space Station will pass overhead in ${countdown}. It will reach ${nextPass.maxAltitudeLabel}, heading ${nextPass.direction}. Bright enough to spot easily, no equipment needed.`,
    });
  }

  // Fallback
  if (items.length === 0) {
    items.push({
      icon: "✦",
      title: "The night sky awaits",
      body: "Step outside and let your eyes adjust to the dark for 15 minutes. The Milky Way may be visible from your location tonight as a faint band of light arching overhead.",
    });
  }

  // Always add a general note
  const phaseData = moonPhase(new Date());
  if (phaseData.illumination < 0.3 && items.length < 4) {
    items.push({
      icon: "∘",
      title: "Dark skies",
      body: "The Moon sets early tonight, leaving excellent conditions for the Milky Way and faint deep-sky objects after midnight. A good night to be outside.",
    });
  }

  return items.slice(0, 4);
}

export default function HighlightsSection({ planets, moon, passes }: Props) {
  const highlights = buildHighlights(planets, moon, passes);

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
        Tonight&apos;s highlights
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {highlights.map((h, i) => (
          <GlassCard key={i}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18, color: "#6159b0", flexShrink: 0, marginTop: 2 }}>{h.icon}</span>
              <div>
                <div
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    fontSize: 18,
                    color: "#afa9ec",
                    marginBottom: 6,
                    fontWeight: 400,
                  }}
                >
                  {h.title}
                </div>
                <p style={{ fontSize: 13, color: "rgba(232,230,248,0.7)", lineHeight: 1.6 }}>
                  {h.body}
                </p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
