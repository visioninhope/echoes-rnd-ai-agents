import { NextRequest } from "next/server";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { env } from "@/app/env.mjs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const threadId = searchParams.get("threadId");
  const assistantId = searchParams.get("assistantId");

  if (!threadId)
    return NextResponse.json(
      { error: "No thread id provided" },
      { status: 400 },
    );
  if (!assistantId)
    return NextResponse.json(
      { error: "No assistant id provided" },
      { status: 400 },
    );

  const openai = new OpenAI({ apiKey: env.OPEN_AI_API_KEY });

  try {
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });

    console.log({ run: run });

    return NextResponse.json({ run: run });
  } catch (e) {
    console.log(e);
    return NextResponse.json({ error: e });
  }
}
