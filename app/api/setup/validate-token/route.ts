import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveSetupToken } from "@/lib/config-store";
import { createNotionClient } from "@/lib/notion/client";

const bodySchema = z.object({ token: z.string().min(1) });

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  try {
    const client = createNotionClient(parsed.data.token);
    const user = await client.users.me({});
    const botName = "name" in user && user.name ? user.name : "Notion integration";
    await saveSetupToken(parsed.data.token);
    return NextResponse.json({ ok: true, botName });
  } catch {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }
}
