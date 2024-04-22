import { NextRequest } from "next/server";
import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const assistantId = searchParams.get("assistantId");

  if (!assistantId)
    return NextResponse.json({ error: "No id provided" }, { status: 400 });

  const openai = new OpenAI();

  try {
    const assistantFiles = await openai.beta.assistants.files.list(assistantId);

    console.log(assistantFiles);

    return NextResponse.json({ assistantFiles });
  } catch (e) {
    console.log(e);
    return NextResponse.json({ error: e });
  }
}
