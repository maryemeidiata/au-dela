"use client";
import { useState, useRef } from "react";

interface Result {
  lat: number;
  lon: number;
  cityName: string;
}

interface Props {
  onSelect: (result: Result) => void;
  currentCity: string;
}

export default function LocationSearch({ onSelect, currentCity }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
      );
      const data = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function pick(r: { display_name: string; lat: string; lon: string }) {
    const parts = r.display_name.split(",");
    const cityName = parts[0].trim();
    onSelect({ lat: parseFloat(r.lat), lon: parseFloat(r.lon), cityName });
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        style={{
          background: "none",
          border: "1px solid rgba(175,169,236,0.2)",
          borderRadius: 20,
          padding: "5px 14px",
          color: "rgba(175,169,236,0.5)",
          fontSize: 12,
          fontFamily: "Outfit, sans-serif",
          cursor: "pointer",
          transition: "all 0.2s ease",
          letterSpacing: "0.04em",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(175,169,236,0.5)";
          (e.currentTarget as HTMLButtonElement).style.color = "rgba(175,169,236,0.85)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(175,169,236,0.2)";
          (e.currentTarget as HTMLButtonElement).style.color = "rgba(175,169,236,0.5)";
        }}
      >
        ◎ Change location
      </button>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") search(); if (e.key === "Escape") setOpen(false); }}
          placeholder={`Currently: ${currentCity}`}
          style={{
            background: "rgba(13,14,31,0.85)",
            border: "1px solid rgba(175,169,236,0.3)",
            borderRadius: 20,
            padding: "6px 16px",
            color: "#e8e6f8",
            fontSize: 13,
            fontFamily: "Outfit, sans-serif",
            outline: "none",
            width: 220,
          }}
        />
        <button
          onClick={search}
          disabled={searching}
          style={{
            background: "rgba(97,89,176,0.3)",
            border: "1px solid rgba(175,169,236,0.25)",
            borderRadius: 20,
            padding: "6px 14px",
            color: "#afa9ec",
            fontSize: 12,
            fontFamily: "Outfit, sans-serif",
            cursor: "pointer",
          }}
        >
          {searching ? "..." : "Search"}
        </button>
        <button
          onClick={() => { setOpen(false); setResults([]); }}
          style={{ background: "none", border: "none", color: "rgba(175,169,236,0.4)", cursor: "pointer", fontSize: 16 }}
        >
          ×
        </button>
      </div>

      {results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            background: "rgba(13,14,31,0.97)",
            border: "1px solid rgba(175,169,236,0.2)",
            borderRadius: 12,
            overflow: "hidden",
            zIndex: 100,
            minWidth: 280,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
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
                borderBottom: i < results.length - 1 ? "1px solid rgba(175,169,236,0.08)" : "none",
                padding: "10px 16px",
                color: "rgba(232,230,248,0.8)",
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
  );
}
