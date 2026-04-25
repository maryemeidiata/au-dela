import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.NASA_API_KEY ?? "DEMO_KEY";
  try {
    const res = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`,
      { next: { revalidate: 86400 } }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch APOD" }, { status: 502 });
  }
}
