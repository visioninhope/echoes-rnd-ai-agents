import { NextRequest } from "next/server";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { env } from "@/app/env.mjs";

export async function POST(req: NextRequest) {
  const { message, threadId } = await req.json();

  if (!threadId || !message)
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });

  const openai = new OpenAI({ apiKey: env.OPEN_AI_API_KEY });

  try {
    const threadMessage = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });

    console.log("threadMessage", threadMessage);

    return NextResponse.json({ status: 200, message: threadMessage });
  } catch (e) {
    console.log(e);
    return NextResponse.json({ status: 500, error: e });
  }
}
