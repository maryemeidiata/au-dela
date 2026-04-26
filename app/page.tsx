"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useISSData } from "@/hooks/useISSData";
import { useSkyData } from "@/hooks/useSkyData";
import ISSBanner from "@/components/ISSBanner";
import LoadingSequence from "@/components/LoadingSequence";
import LocationSearch from "@/components/LocationSearch";
import FeaturedMoment from "@/components/FeaturedMoment";
import HighlightsSection from "@/components/sections/HighlightsSection";
import ISSSection from "@/components/sections/ISSSection";
import PlanetsSection from "@/components/sections/PlanetsSection";
import MeteorSection from "@/components/sections/MeteorSection";
import EventsSection from "@/components/sections/EventsSection";

const StarField = dynamic(() => import("@/components/StarField"), { ssr: false });
const SkyMap = dynamic(() => import("@/components/SkyMap"), { ssr: false });

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".section-reveal");
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add("visible");
      }),
      { threshold: 0.1 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  });
}

function countHighlights(
  planets: ReturnType<typeof useSkyData>["planets"],
  passes: ReturnType<typeof useISSData>["passes"]
): number {
  let n = 0;
  if (planets.filter(p => p.visible).length > 0) n += 2;
  if (passes.length > 0) n++;
  n += 2; // moon + Milky Way always worth seeing
  return Math.min(n + 2, 9);
}

export default function AuDelaPage() {
  const [introComplete, setIntroComplete] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [manualLocation, setManualLocation] = useState<{ lat: number; lon: number; cityName: string } | null>(null);

  const geo = useGeolocation();

  const lat = manualLocation?.lat ?? geo.lat ?? 48.8566;
  const lon = manualLocation?.lon ?? geo.lon ?? 2.3522;
  const cityName = manualLocation?.cityName ?? geo.cityName;

  const iss = useISSData(lat, lon);
  const sky = useSkyData(lat, lon);

  useScrollReveal();

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
    setTimeout(() => setContentVisible(true), 100);
  }, []);
  const eventCount = countHighlights(sky.planets, iss.passes);

  return (
    <>
      {/* Fixed star field background */}
      <StarField />

      {/* ISS overhead banner */}
      <ISSBanner position={iss.position} />

      {/* Cinematic intro */}
      <LoadingSequence
        cityName={cityName}
        eventCount={eventCount}
        onComplete={handleIntroComplete}
      />

      {/* Main content */}
      <div
        ref={contentRef}
        style={{
          position: "relative",
          zIndex: 10,
          minHeight: "100vh",
          opacity: contentVisible ? 1 : 0,
          transition: "opacity 0.8s ease",
          paddingTop: iss.position?.isOverhead ? 44 : 0,
        }}
      >
        {/* Nav */}
        <nav
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 32px",
            background: "rgba(6,7,15,0)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontStyle: "italic",
                fontSize: 22,
                color: "#afa9ec",
                letterSpacing: "0.03em",
              }}
            >
              Au-delà
            </span>
            <span style={{ color: "rgba(175,169,236,0.3)", fontSize: 16 }}>✦</span>
          </div>
          <a
            href="/"
            style={{
              fontFamily: "Outfit, sans-serif",
              fontWeight: 300,
              fontSize: 13,
              color: "rgba(175,169,236,0.4)",
              textDecoration: "none",
              letterSpacing: "0.04em",
              transition: "color 0.3s ease",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(175,169,236,0.7)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(175,169,236,0.4)")}
          >
            Portfolio &rarr;
          </a>
        </nav>

        {/* Hero: city name + sky map */}
        <header
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "40px 24px 60px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "Outfit, sans-serif",
              fontWeight: 300,
              fontSize: 13,
              color: "rgba(175,169,236,0.45)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long", day: "numeric", month: "long",
            })}
          </p>
          <h1
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(32px, 5vw, 56px)",
              color: "#e8e6f8",
              lineHeight: 1.2,
              marginBottom: 8,
            }}
            className="text-glow"
          >
            The sky above {cityName}
          </h1>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 48 }}>
            <p
              style={{
                fontFamily: "Outfit, sans-serif",
                fontWeight: 300,
                fontSize: 15,
                color: "rgba(175,169,236,0.5)",
              }}
            >
              {lat.toFixed(2)}&deg; {lat >= 0 ? "N" : "S"},{" "}
              {Math.abs(lon).toFixed(2)}&deg; {lon >= 0 ? "E" : "W"}
            </p>
            <LocationSearch
              currentCity={cityName}
              onSelect={loc => setManualLocation(loc)}
            />
          </div>

          {/* Sky Map */}
          <SkyMap
            lat={lat}
            lon={lon}
            planets={sky.planets}
            moon={sky.moon}
            issPosition={iss.position}
          />

          {/* Live time */}
          <LiveTime />

          {/* Value hook — right below the map */}
          <div style={{ marginTop: 40, width: "100%", maxWidth: 680, padding: "0 16px" }}>
            <FeaturedMoment
              planets={sky.planets}
              moon={sky.moon}
              passes={iss.passes}
              cityName={cityName}
            />
          </div>
        </header>

        {/* Content sections */}
        <main
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "0 24px 100px",
            display: "flex",
            flexDirection: "column",
            gap: 64,
          }}
        >
          <HighlightsSection
            planets={sky.planets}
            moon={sky.moon}
            passes={iss.passes}
          />

          <ISSSection passes={iss.passes} loading={iss.loading} />

          <PlanetsSection
            planets={sky.planets}
            moon={sky.moon}
            loading={sky.loading}
          />

          <MeteorSection lat={lat} lon={lon} />

          <EventsSection lat={lat} lon={lon} />
        </main>

        {/* Footer */}
        <footer
          style={{
            textAlign: "center",
            padding: "32px 24px",
            borderTop: "1px solid rgba(175,169,236,0.07)",
          }}
        >
          <p
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontStyle: "italic",
              fontSize: 15,
              color: "rgba(175,169,236,0.3)",
            }}
          >
            The universe is under no obligation to make sense to you. &mdash; Neil deGrasse Tyson
          </p>
        </footer>
      </div>
    </>
  );
}

function LiveTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    function update() {
      setTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <p
      style={{
        fontFamily: "Outfit, sans-serif",
        fontWeight: 200,
        fontSize: 13,
        color: "rgba(175,169,236,0.35)",
        letterSpacing: "0.1em",
        marginTop: 24,
      }}
    >
      local time {time}
    </p>
  );
}
