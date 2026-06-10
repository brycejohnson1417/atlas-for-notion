import { NextRequest, NextResponse } from "next/server";
import { clearCachedData } from "@/lib/cache/data-cache";
import { getEmbedShareKey, isDemoMode } from "@/lib/config";

export async function POST(request: NextRequest) {
  if (isDemoMode() && request.nextUrl.searchParams.get("key") !== getEmbedShareKey()) {
    return NextResponse.json({ error: "bad_key" }, { status: 401 });
  }

  clearCachedData();
  return NextResponse.json({ refreshed: true, fetchedAt: new Date().toISOString() }, { status: 202 });
}
