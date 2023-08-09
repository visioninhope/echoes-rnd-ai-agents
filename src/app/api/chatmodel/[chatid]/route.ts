import { ChatOpenAI } from "langchain/chat_models/openai";
import { StreamingTextResponse, LangChainStream } from "ai";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
  BaseMessage,
} from "langchain/schema";
import { env } from "@/app/env.mjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { ChatEntry, ChatLog } from "@/lib/types";
import { auth } from "@clerk/nextjs";
import { generateTitle } from "../../generateTitle/[chatid]/[orgid]/route";
import { Client } from "langsmith";
import { LangChainTracer } from "langchain/callbacks";
export const revalidate = 0; // disable cache
import { get_encoding, encoding_for_model } from "tiktoken";
import { NextResponse } from "next/server";

export const jsonToLangchain = (
  chatData: ChatEntry[],
  system?: string,
): BaseMessage[] => {
  let ret: BaseMessage[] = [];
  if (system) {
    ret.push(new SystemMessage(system));
  }

  chatData.forEach((item: ChatEntry) => {
    if (item.hasOwnProperty("role")) {
      if (item.role === "user") {
        ret.push(new HumanMessage(item.content));
      } else if (item.role === "assistant") {
        ret.push(new AIMessage(item.content));
      }
    }
  });
  return ret;
};

export async function POST(
  request: Request,
  params: { params: { chatid: string } },
) {
  const body = await request.json();
  const { userId } = auth();

  const _chat = body.messages;
  const isFast = body.isFast;
  let orgId = "";
  orgId = body.orgId;

  let id = params.params.chatid as any;
  // exceptional case
  if (_chat.length === 0) {
    console.error(
      "somehow got the length 0, this shouldn't happen if validating messages length before calling the api",
    );
    return;
  }
  const systemPrompt =
    "You are Echoes, an AI intended for biotech research and development. You are a friendly, critical, analytical AI system. You are fine-tuned and augmented with tools and data sources by Technoculture, Inc.> We prefer responses with headings, subheadings.When dealing with questions without a definite answer, think step by step before answering the question.";
  const msgs = jsonToLangchain(_chat, systemPrompt);
  console.log("msgs", msgs[0]);
  const encoding = get_encoding("cl100k_base");
  const enc = encoding_for_model("gpt-4");
  const txt = enc.encode(
    msgs.reduce((initial, msg) => initial + msg.content, systemPrompt),
    "all",
  );
  console.log("txt legth", txt.length);

  if (txt.length > 8000) {
    // _chat.push(latestReponse);
    // const msg = new AIMessage("THIS CHAT IS COMPLETED");
    const popped = _chat.pop(); // removing the latest prompt from conversation
    const msg = {
      content: "THIS CHAT IS COMPLETED",
      name: popped.name,
      role: "user",
    };
    console.log("popped", popped);
    _chat.push(msg); // pushing the final message to identify that the chat is completed
    console.log("pushed", msg);
    await db
      .update(chats)
      .set({
        messages: JSON.stringify({ log: _chat }),
        updatedAt: new Date(),
      })
      .where(eq(chats.id, Number(id)))
      .run();
    console.log("db updated");
    return NextResponse.json(
      { ...msg },
      {
        status: 400,
      },
    );
  }

  const { stream, handlers } = LangChainStream({
    onCompletion: async (fullResponse: string) => {
      const latestReponse = { role: "assistant", content: fullResponse };
      if (orgId !== "") {
        // it means it is the first message in a specific chat id
        // Handling organization chat inputs
        if (_chat.length === 1) {
          console.log("got in 1 length case");
          _chat.push(latestReponse);
          const title = await generateTitle(_chat as ChatEntry[]);
          // popping up because inserted the prompt for generating the title so removing the title prompt
          _chat.pop();
          console.log("generated title", title);
          await db
            .update(chats)
            .set({
              messages: JSON.stringify({ log: _chat } as ChatLog),
              title: title,
            })
            .where(eq(chats.id, Number(id)))
            .run();
        } else {
          _chat.push(latestReponse);
          await db
            .update(chats)
            .set({
              messages: JSON.stringify({ log: _chat }),
              updatedAt: new Date(),
            })
            .where(eq(chats.id, Number(id)))
            .run();
        }
      }
      // handling user's personal chat
      //  else {
      //   // it means it is the first message in a specific chat id
      //   if (_chat.length === 1) {
      //     _chat.push(latestReponse);
      //     await db.insert(chats).values({
      //       user_id: String(userId),
      //       messages: JSON.stringify({ log: _chat } as ChatLog),
      //     });
      //   } else {
      //     _chat.push(latestReponse);
      //     await db
      //       .update(chats)
      //       .set({ messages: JSON.stringify({ log: _chat }) })
      //       .where(eq(chats.id, Number(id)));
      //   }
      // }
    },
  });

  const client = new Client({
    apiUrl: "https://api.smith.langchain.com",
    apiKey: env.LANGSMITH_API_KEY,
  });

  const tracer = new LangChainTracer({
    projectName: "echoes",
    client,
  });

  // change model type based on isFast variable and OPEN_AI_API_KEY as well
  const chatmodel: ChatOpenAI = new ChatOpenAI({
    modelName: isFast ? "gpt-4" : "gpt-3.5-turbo-16k",
    temperature: 0.5,
    topP: 0.5,
    openAIApiKey: env.OPEN_AI_API_KEY,
    streaming: true,
  });
  chatmodel.call(msgs, {}, [handlers, tracer]);
  return new StreamingTextResponse(stream);
}
