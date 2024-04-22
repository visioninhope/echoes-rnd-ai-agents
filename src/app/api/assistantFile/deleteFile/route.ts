import { NextRequest } from "next/server";
import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const assistantId = searchParams.get("assistantId");
  const fileId = searchParams.get("fileId");

  if (!assistantId)
    return NextResponse.json(
      { error: "No assistant id provided" },
      { status: 400 },
    );

  if (!fileId)
    return NextResponse.json({ error: "No file id provided" }, { status: 400 });

  const openai = new OpenAI();

  try {
    const deletedFile = await openai.beta.assistants.files.del(
      assistantId,
      fileId,
    );

    console.log(deletedFile);

    return NextResponse.json(deletedFile);
  } catch (e) {
    console.log(e);
    return NextResponse.json({ error: e });
  }
}
