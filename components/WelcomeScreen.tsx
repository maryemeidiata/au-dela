"use client";
import { useState, useEffect, useRef } from "react";
import { reverseGeocode } from "@/lib/utils";

interface Props {
  onReady: (lat: number, lon: number, cityName: string) => void;
}

export default function WelcomeScreen({ onReady }: Props) {
  const [opacity, setOpacity] = useState(0);
  const [geoPhase, setGeoPhase] = useState<"idle" | "locating">("idle");
  const [geoError, setGeoError] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setOpacity(1)));
    return () => cancelAnimationFrame(id);
  }, []);

  function fadeOut(then: () => void) {
    setOpacity(0);
    setTimeout(then, 650);
  }

  function tryGeo() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported. Search for your city below.");
      return;
    }
    setGeoPhase("locating");
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const city = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        fadeOut(() => onReady(pos.coords.latitude, pos.coords.longitude, city));
      },
      err => {
        setGeoPhase("idle");
        setGeoError(
          err.code === 1
            ? "Location access denied. Search for your city below."
            : "Couldn't detect your location. Search for your city below."
        );
        setTimeout(() => inputRef.current?.focus(), 100);
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
      );
      setResults(await res.json());
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function pick(r: { display_name: string; lat: string; lon: string }) {
    const cityName = r.display_name.split(",")[0].trim();
    fadeOut(() => onReady(parseFloat(r.lat), parseFloat(r.lon), cityName));
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        transition: "opacity 0.65s ease",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "48px 32px",
          maxWidth: 460,
          width: "100%",
        }}
      >
        {/* Wordmark */}
        <p
          style={{
            fontFamily: "Outfit, sans-serif",
            fontWeight: 300,
            fontSize: 12,
            color: "rgba(175,169,236,0.4)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          welcome to
        </p>
        <h1
          className="text-glow"
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(52px, 10vw, 80px)",
            color: "#e8e6f8",
            lineHeight: 1,
            letterSpacing: "0.02em",
            marginBottom: 18,
          }}
        >
          Au-delà
        </h1>
        <p
          style={{
            fontFamily: "Outfit, sans-serif",
            fontWeight: 300,
            fontSize: 14,
            color: "rgba(175,169,236,0.45)",
            letterSpacing: "0.05em",
            marginBottom: 48,
          }}
        >
          Your personal guide to tonight's sky
        </p>

        <div
          style={{
            width: 32,
            height: 1,
            background: "rgba(175,169,236,0.18)",
            margin: "0 auto 40px",
          }}
        />

        <p
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontStyle: "italic",
            fontSize: 22,
            color: "rgba(232,230,248,0.7)",
            marginBottom: 28,
          }}
        >
          Where in the world are you?
        </p>

        {/* Use my location */}
        {geoPhase === "idle" ? (
          <button
            onClick={tryGeo}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(97,89,176,0.22)",
              border: "1px solid rgba(175,169,236,0.32)",
              borderRadius: 28,
              padding: "12px 28px",
              color: "#afa9ec",
              fontSize: 14,
              fontFamily: "Outfit, sans-serif",
              fontWeight: 300,
              cursor: "pointer",
              letterSpacing: "0.04em",
              transition: "all 0.25s ease",
              marginBottom: 20,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(97,89,176,0.42)";
              e.currentTarget.style.borderColor = "rgba(175,169,236,0.6)";
              e.currentTarget.style.color = "#ccc8f5";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(97,89,176,0.22)";
              e.currentTarget.style.borderColor = "rgba(175,169,236,0.32)";
              e.currentTarget.style.color = "#afa9ec";
            }}
          >
            <span style={{ fontSize: 16 }}>◎</span>
            Use my location
          </button>
        ) : (
          <div
            style={{
              fontSize: 13,
              color: "rgba(175,169,236,0.5)",
              fontFamily: "Outfit, sans-serif",
              letterSpacing: "0.06em",
              marginBottom: 20,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#afa9ec",
                animation: "pulse 1.4s ease-in-out infinite",
              }}
            />
            Locating you…
          </div>
        )}

        {geoError && (
          <p
            style={{
              fontSize: 12,
              color: "rgba(230,120,120,0.8)",
              fontFamily: "Outfit, sans-serif",
              marginBottom: 16,
              lineHeight: 1.5,
            }}
          >
            {geoError}
          </p>
        )}

        <p
          style={{
            fontSize: 12,
            color: "rgba(175,169,236,0.28)",
            fontFamily: "Outfit, sans-serif",
            letterSpacing: "0.06em",
            marginBottom: 14,
          }}
        >
          or search for your city
        </p>

        {/* City search */}
        <div style={{ position: "relative", display: "flex", gap: 8, justifyContent: "center" }}>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") search(); }}
            placeholder="Tokyo, Lagos, São Paulo…"
            style={{
              background: "rgba(13,14,31,0.85)",
              border: "1px solid rgba(175,169,236,0.18)",
              borderRadius: 24,
              padding: "10px 18px",
              color: "#e8e6f8",
              fontSize: 13,
              fontFamily: "Outfit, sans-serif",
              outline: "none",
              width: 230,
              transition: "border-color 0.2s ease",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "rgba(175,169,236,0.42)")}
            onBlur={e => (e.currentTarget.style.borderColor = "rgba(175,169,236,0.18)")}
          />
          <button
            onClick={search}
            disabled={searching}
            style={{
              background: "rgba(97,89,176,0.3)",
              border: "1px solid rgba(175,169,236,0.2)",
              borderRadius: 24,
              padding: "10px 18px",
              color: "#afa9ec",
              fontSize: 12,
              fontFamily: "Outfit, sans-serif",
              cursor: searching ? "default" : "pointer",
              letterSpacing: "0.04em",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => { if (!searching) e.currentTarget.style.background = "rgba(97,89,176,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(97,89,176,0.3)"; }}
          >
            {searching ? "…" : "Search"}
          </button>
        </div>

        {results.length > 0 && (
          <div
            style={{
              marginTop: 10,
              background: "rgba(10,11,26,0.98)",
              border: "1px solid rgba(175,169,236,0.14)",
              borderRadius: 14,
              overflow: "hidden",
              maxWidth: 340,
              margin: "10px auto 0",
              boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
            }}
          >
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => pick(r)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  borderBottom: i < results.length - 1 ? "1px solid rgba(175,169,236,0.07)" : "none",
                  padding: "11px 18px",
                  color: "rgba(232,230,248,0.78)",
                  fontSize: 13,
                  fontFamily: "Outfit, sans-serif",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(97,89,176,0.2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                {r.display_name.split(",").slice(0, 3).join(",")}
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
