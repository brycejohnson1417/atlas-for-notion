import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "demo_mode" }, { status: 403 });
}
