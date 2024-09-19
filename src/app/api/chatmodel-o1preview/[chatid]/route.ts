import { Message, nanoid, StreamingTextResponse } from "ai";
import { jsonToLangchain, OPEN_AI_MODELS, saveToDB } from "@/utils/apiHelper";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { env } from "@/app/env.mjs";
import { chattype } from "@/lib/types";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const revalidate = 0; // disable cache

export const maxDuration = 60;

export async function POST(
  request: Request,
  params: { params: { chatid: string } },
) {
  const body = await request.json();
  const { orgSlug } = await auth();
  console.log("orgSlug", orgSlug);

  const _chat = body.messages as Message[];
  let orgId = body.orgId;
  const userId = body.userId;
  const url = request.url;
  const urlArray = url.split("/");

  let id = params.params.chatid;
  if (_chat.length === 0) {
    console.error("Chat length is 0, this shouldn't happen");
    return NextResponse.json({ error: "Invalid chat length" }, { status: 400 });
  }

  const msgs = jsonToLangchain(_chat);
  // getting chat type
  let model: string = OPEN_AI_MODELS.o1Preview;
  const chatType = chattype.parse(body.chattype);

  if (chatType === "chat") {
    model = OPEN_AI_MODELS.o1Mini;
  }

  //TODO: update chattype to database
  try {
    await db
      .update(chats)
      .set({
        type: chatType,
      })
      .where(eq(chats.id, Number(id)))
      .run();
  } catch (err: any) {
    console.error("updating chattype failed for chatid", id);
  }
  const openai_chat_model = new ChatOpenAI({
    modelName: model,
    openAIApiKey: env.OPEN_AI_API_KEY,
    maxRetries: 1,
  });
  // openAIChatModel(model, false);

  const response = await openai_chat_model.call(msgs);

  const latestResponse = {
    id: nanoid(),
    role: "assistant" as const,
    content: response.content,
    createdAt: new Date(),
    audio: "",
  };

  if (orgId !== "") {
    await saveToDB({
      _chat: _chat,
      chatId: Number(id),
      orgSlug: orgSlug as string,
      latestResponse: latestResponse,
      userId: userId,
      orgId: orgId,
      urlArray: urlArray,
    });
  }

  // readable stream from response.content
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(response.content));
      controller.close();
    },
  });
  return new StreamingTextResponse(stream);
}
