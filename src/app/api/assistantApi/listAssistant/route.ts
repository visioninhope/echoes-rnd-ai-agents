import OpenAI from "openai";
import { env } from "@/app/env.mjs";
import { NextResponse } from "next/server";

export async function GET() {
  const openai = new OpenAI({ apiKey: env.OPEN_AI_API_KEY });

  try {
    const response = await openai.beta.assistants.list({
      order: "desc",
      limit: 10,
    });

    const assistants = response.data;

    console.log(assistants);

    return NextResponse.json({ assistants: assistants });
  } catch (e) {
    console.log(e);
    return NextResponse.json({ error: e });
  }
}
