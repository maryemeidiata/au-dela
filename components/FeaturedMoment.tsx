"use client";
import type { PlanetData, MoonData } from "@/hooks/useSkyData";
import type { ISSPass } from "@/hooks/useISSData";
import { formatCountdown } from "@/lib/utils";
import { moonPhase } from "@/lib/coordinates";
import { azimuthToCompassFull } from "@/lib/astronomy-api";

interface Props {
  planets: PlanetData[];
  moon: MoonData | null;
  passes: ISSPass[];
  cityName: string;
}

interface Moment {
  label: string;
  headline: string;
  body: string;
  direction: string;
  urgency: "now" | "tonight" | "soon";
}

function buildMoment(
  planets: PlanetData[],
  moon: MoonData | null,
  passes: ISSPass[],
  cityName: string
): Moment | null {
  // ISS pass within 30 minutes — most urgent
  const soonPass = passes.find(p => {
    const ms = p.riseTime.getTime() - Date.now();
    return ms > 0 && ms < 30 * 60 * 1000;
  });
  if (soonPass) {
    const countdown = formatCountdown(soonPass.riseTime);
    return {
      label: "Coming up",
      headline: `The ISS passes over ${cityName} in ${countdown}`,
      body: `Step outside and look toward the ${soonPass.direction.toLowerCase()}. The International Space Station will streak across the sky ${soonPass.maxAltitudeLabel} — a bright, steady light moving faster than any plane, carrying seven people right now. No equipment needed.`,
      direction: `Look toward the ${soonPass.direction.toLowerCase()}`,
      urgency: "soon",
    };
  }

  // Saturn visible — highly photogenic, always a good hook
  const saturn = planets.find(p => p.id === "saturn" && p.visible && p.altitude > 15);
  if (saturn) {
    const dir = azimuthToCompassFull(saturn.azimuth);
    return {
      label: "Visible tonight",
      headline: `Saturn and its rings are up right now`,
      body: `Look toward the ${dir}, ${saturn.altitudeLabel}. Saturn is one of those things that changes people — the moment you see those rings through even a cheap telescope, the scale of the solar system becomes real.`,
      direction: `Look toward the ${dir}`,
      urgency: "tonight",
    };
  }

  // Jupiter visible — bright and impressive
  const jupiter = planets.find(p => p.id === "jupiter" && p.visible && p.altitude > 10);
  if (jupiter) {
    const dir = azimuthToCompassFull(jupiter.azimuth);
    return {
      label: "Visible tonight",
      headline: `Jupiter is the brightest point of light in the ${dir} sky`,
      body: `Look toward the ${dir}, ${jupiter.altitudeLabel}. That intensely bright, non-twinkling light is Jupiter — a world 1,300 times the volume of Earth. With binoculars you can see up to four of its moons as tiny dots in a line. They move visibly night to night.`,
      direction: `Look toward the ${dir}`,
      urgency: "tonight",
    };
  }

  // Venus — always dramatic
  const venus = planets.find(p => p.id === "venus" && p.visible);
  if (venus) {
    const dir = azimuthToCompassFull(venus.azimuth);
    return {
      label: "Visible tonight",
      headline: `Venus blazes in the ${dir} sky`,
      body: `Venus is so bright it can cast faint shadows on a dark night. Look toward the ${dir}, ${venus.altitudeLabel}. It orbits closer to the Sun than we do, so you only ever catch it near the horizon — just after sunset or before sunrise.`,
      direction: `Look toward the ${dir}`,
      urgency: "tonight",
    };
  }

  // Mars visible
  const mars = planets.find(p => p.id === "mars" && p.visible && p.altitude > 10);
  if (mars) {
    const dir = azimuthToCompassFull(mars.azimuth);
    return {
      label: "Visible tonight",
      headline: `Mars glows red in the ${dir} sky`,
      body: `Look toward the ${dir}, ${mars.altitudeLabel}. That reddish, steady point is Mars — the color comes from iron oxide across its entire surface, rust on a planetary scale. It moves noticeably against the stars over weeks.`,
      direction: `Look toward the ${dir}`,
      urgency: "tonight",
    };
  }

  // New moon — great for deep sky
  const phase = moonPhase(new Date());
  if (phase.illumination < 0.15) {
    return {
      label: "Perfect conditions",
      headline: `The Moon is dark. Tonight is for stargazing.`,
      body: `A new moon means no moonlight washing out the sky. From a dark spot tonight you can see the Milky Way as a faint band arching overhead, and thousands more stars than usual. This window lasts only a few nights a month.`,
      direction: `Any direction will do`,
      urgency: "tonight",
    };
  }

  // ISS pass tonight (not imminent)
  const nextPass = passes[0];
  if (nextPass) {
    const countdown = formatCountdown(nextPass.riseTime);
    return {
      label: "Tonight",
      headline: `The ISS flies over ${cityName} in ${countdown}`,
      body: `The International Space Station orbits Earth every 92 minutes at 408 km altitude, moving at 7.66 km/s. It looks like a very bright, steady star moving silently across the sky. Look toward the ${nextPass.direction.toLowerCase()}, ${nextPass.maxAltitudeLabel}. Seven people will be on board.`,
      direction: `Look toward the ${nextPass.direction.toLowerCase()}`,
      urgency: "tonight",
    };
  }

  return null;
}

const URGENCY_COLOR = {
  now:     "#7bff9e",
  soon:    "#afa9ec",
  tonight: "#afa9ec",
};

export default function FeaturedMoment({ planets, moon, passes, cityName }: Props) {
  const moment = buildMoment(planets, moon, passes, cityName);
  if (!moment) return null;

  const color = URGENCY_COLOR[moment.urgency];

  return (
    <div
      style={{
        position: "relative",
        background: "rgba(13,14,31,0.6)",
        border: `1px solid ${color}30`,
        borderRadius: 20,
        padding: "28px 32px",
        backdropFilter: "blur(20px)",
        maxWidth: 680,
        width: "100%",
        boxShadow: `0 0 40px ${color}12, 0 0 80px ${color}08`,
      }}
    >
      {/* Accent line */}
      <div style={{ width: 40, height: 2, background: color, borderRadius: 2, marginBottom: 16, opacity: 0.8 }} />

      <div style={{ fontSize: 11, color: color, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8, fontFamily: "Outfit, sans-serif", opacity: 0.75 }}>
        {moment.label}
      </div>

      <h2
        style={{
          fontFamily: "Cormorant Garamond, serif",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: "clamp(20px, 3.2vw, 30px)",
          color: "#e8e6f8",
          lineHeight: 1.3,
          marginBottom: 14,
        }}
      >
        {moment.headline}
      </h2>

      <p style={{ fontSize: 14, color: "rgba(232,230,248,0.65)", lineHeight: 1.75, marginBottom: 18 }}>
        {moment.body}
      </p>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: `${color}15`,
          border: `1px solid ${color}30`,
          borderRadius: 20,
          padding: "6px 16px",
          fontSize: 12,
          color,
          fontFamily: "Outfit, sans-serif",
          letterSpacing: "0.04em",
        }}
      >
        <span style={{ fontSize: 10 }}>◎</span>
        {moment.direction}
      </div>
    </div>
  );
}
