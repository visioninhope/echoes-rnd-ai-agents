import { env } from "@/app/env.mjs";
import { db } from "@/lib/db";
import { chats, Chat as ChatSchema } from "@/lib/db/schema";
import { ChatEntry, ChatLog } from "@/lib/types";
import { saveAudioMessage, summarizeChat } from "@/utils/apiHelper";
import { nanoid } from "ai";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import * as z from "zod";

export const maxDuration = 180;

const bodyobj = z.object({
  text: z.string().min(1).optional(),
  messageId: z.string().min(1).optional(),
  orgId: z.string().min(1),
  chatId: z.string().min(1),
  index: z.coerce.number().min(0).optional(),
  messages: z.any().optional(),
});

const MAX_CHUNK_LENGTH = 4000; // Slightly less than 4095 to be safe

function chunkText(text: string): string[] {
  const paragraphs = text.split("\n\n");
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > MAX_CHUNK_LENGTH) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }
      if (paragraph.length > MAX_CHUNK_LENGTH) {
        // If a single paragraph is too long, split it into sentences
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > MAX_CHUNK_LENGTH) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            currentChunk += " " + sentence;
          }
        }
      } else {
        currentChunk = paragraph;
      }
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

async function generateAudioForChunk(
  openai: OpenAI,
  chunk: string,
): Promise<Buffer> {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: chunk,
    response_format: "mp3",
  });

  return Buffer.from(await mp3.arrayBuffer());
}

async function concatenateAudioBuffers(
  audioBuffers: Buffer[],
): Promise<Buffer> {
  // Simple concatenation of MP3 buffers
  // Note: This may not work perfectly for all MP3 files and may require a more sophisticated approach
  return Buffer.concat(audioBuffers as unknown as Uint8Array[]);
}

export async function POST(request: NextRequest) {
  const b = await request.json();
  const searchParams = await request.nextUrl.searchParams;
  const summarize = searchParams.get("summarize");
  console.log("summarize", summarize, b);
  const body = bodyobj.parse(b);

  const text = body.text;
  let messageId = body.messageId;
  const orgId = body.orgId;
  const chatId = body.chatId;
  const messages: ChatEntry[] = body.messages;

  const openai = new OpenAI({
    apiKey: env.OPEN_AI_API_KEY,
  });

  if (text && messageId && body.index) {
    console.log("got into if");
    // handling audio for a single message
    const chunks = chunkText(text);
    const audioBuffers = await Promise.all(
      chunks.map((chunk) => generateAudioForChunk(openai, chunk)),
    );

    const finalBuffer = await concatenateAudioBuffers(audioBuffers);

    // fetching the chat
    let chatlog: ChatLog = { log: [] };
    let fetchedChat: ChatSchema[] = [];
    fetchedChat = await db
      .select()
      .from(chats)
      .where(eq(chats.id, Number(chatId)))
      .all();

    const msg = fetchedChat[0]?.messages;
    if (fetchedChat.length === 1 && msg) {
      chatlog = JSON.parse(msg as string) as ChatLog;
    }

    // find the message according to the index if no messageId is given
    let message: ChatEntry | undefined;
    if (!messageId) {
      message = chatlog.log[body.index];
      // update all the messages of chatlog.log to have an id using nanoid()
      chatlog.log = chatlog.log.map((msg) => {
        msg.id = msg.id ? msg.id : nanoid();
        return msg;
      });
    } else {
      // finding the message with the given id if not found return last message from log
      message = chatlog.log.find((msg) => msg.id === messageId);
      if (!message) {
        message = chatlog.log[chatlog.log.length - 1];
        message.id = messageId;
      }
    }

    messageId = messageId ? messageId : chatlog.log[body.index].id;

    const audioUrl = await saveAudioMessage({
      buffer: finalBuffer,
      chatId,
      messageId,
    });
    message.audio = audioUrl;

    await db
      .update(chats)
      .set({
        messages: JSON.stringify({ log: chatlog.log } as ChatLog),
        updatedAt: new Date(),
      })
      .where(eq(chats.id, Number(chatId)))
      .run();
    return new NextResponse(
      JSON.stringify({ audioUrl: audioUrl, updatedMessages: chatlog.log }),
    );
  } else {
    // summarize and generate audio for all messages
    const summary: string = await summarizeChat(messages);
    const chunks = chunkText(summary);
    const audioBuffers = await Promise.all(
      chunks.map((chunk) => generateAudioForChunk(openai, chunk)),
    );

    const finalBuffer = await concatenateAudioBuffers(audioBuffers);

    const messageId = "summary"; // as it is the summary of the whole chat
    const audioUrl = await saveAudioMessage({
      buffer: finalBuffer,
      chatId,
      messageId,
    });

    // update the db to save audio url for corresponding chat
    await db
      .update(chats)
      .set({
        audio: audioUrl,
        updatedAt: new Date(),
      })
      .where(eq(chats.id, Number(chatId)))
      .run();

    return new NextResponse(JSON.stringify({ audioUrl: audioUrl }));
  }
}
