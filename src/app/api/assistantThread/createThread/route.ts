import OpenAI from "openai";
import { NextResponse } from "next/server";
import { env } from "@/app/env.mjs";

export async function GET() {
  const openai = new OpenAI({ apiKey: env.OPEN_AI_API_KEY });

  try {
    const thread = await openai.beta.threads.create();
    console.log(thread);

    return NextResponse.json({ thread: thread });
  } catch (e) {
    console.log(e);
    return NextResponse.json({ error: e });
  }
}
