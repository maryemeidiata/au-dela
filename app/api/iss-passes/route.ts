import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat") ?? "0";
  const lon = searchParams.get("lon") ?? "0";
  const n   = searchParams.get("n") ?? "5";

  try {
    const url = `http://api.open-notify.org/iss-pass.json?lat=${lat}&lon=${lon}&n=${n}&alt=100`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch ISS passes" }, { status: 502 });
  }
}
