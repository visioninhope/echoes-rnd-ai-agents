import { NextRequest } from "next/server";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { env } from "@/app/env.mjs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const assistantId = searchParams.get("assistantId");

  if (!assistantId) {
    return NextResponse.json({ error: "No id provided" }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey: env.OPEN_AI_API_KEY });

  try {
    const response = await openai.beta.assistants.del(assistantId);
    console.log(response);

    return NextResponse.json(response);
  } catch (e) {
    console.log(e);
    return NextResponse.json({ error: e });
  }
}
