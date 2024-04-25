import OpenAI from "openai";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { env } from "@/app/env.mjs";

const openai = new OpenAI({ apiKey: env.OPEN_AI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { threadId } = await req.json(); // Ensure threadId is being sent in the request body
    const threadMessages = await openai.beta.threads.messages.list(threadId);

    console.log("Thread Messages:", threadMessages.data);
    return NextResponse.json({
      status: 200,
      threadMessages: threadMessages.data,
    });
  } catch (e) {
    console.log("Error:", e);
    return NextResponse.json({ status: 500, error: e });
  }
}
