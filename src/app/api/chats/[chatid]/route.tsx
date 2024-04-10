import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { ChatLog } from "@/lib/types";

export async function GET(
  request: Request,
  params: { params: { chatid: string } },
) {
  const chatId = params.params.chatid;
  const fetchedChat = await db
    .select()
    .from(chats)
    .where(eq(chats.id, Number(chatId)))
    .limit(1)
    .all();

  const msg = fetchedChat[0].messages;
  // const tldrawSnapshot = JSON.parse(msg as string) as SnapShot;
  const chatlog = JSON.parse(msg as string) as ChatLog;
  // console.log("tldraw_snapshot", chatlog);
  // if (fetchedChat[0]?.type as ChatType === "tldraw") {
  //   return NextResponse.json({ chats: chatlog ? tldrawSnapshot.tldraw_snapshot : [] });
  // }
  // else {
  return NextResponse.json({ chats: chatlog ? chatlog.log : [] });
  // }
}
