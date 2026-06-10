import { NextRequest, NextResponse } from "next/server";
import { atlasConfigSchema } from "@/lib/config";
import { saveAtlasConfig } from "@/lib/config-store";

export async function POST(request: NextRequest) {
  const parsed = atlasConfigSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ issues: parsed.error.issues }, { status: 400 });
  }

  try {
    await saveAtlasConfig(parsed.data);
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "missing_token" }, { status: 401 });
  }
}
