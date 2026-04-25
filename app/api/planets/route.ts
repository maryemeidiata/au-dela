import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const appId     = process.env.ASTRONOMY_APP_ID ?? "";
  const appSecret = process.env.ASTRONOMY_APP_SECRET ?? "";

  if (!appId || !appSecret) {
    return NextResponse.json({ error: "AstronomyAPI credentials not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams({
    latitude:   searchParams.get("latitude")  ?? "0",
    longitude:  searchParams.get("longitude") ?? "0",
    elevation:  searchParams.get("elevation") ?? "0",
    from_date:  searchParams.get("from_date") ?? new Date().toISOString().split("T")[0],
    to_date:    searchParams.get("to_date")   ?? new Date().toISOString().split("T")[0],
    time:       searchParams.get("time")      ?? "00:00:00",
  });

  const credentials = Buffer.from(`${appId}:${appSecret}`).toString("base64");

  try {
    const res = await fetch(
      `https://api.astronomyapi.com/api/v2/bodies/positions?${params}`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 1800 },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
