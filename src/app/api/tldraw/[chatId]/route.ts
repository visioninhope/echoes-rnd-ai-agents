import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { Message, nanoid } from "ai";
import { eq } from "drizzle-orm";
import { ChatLog } from "@/lib/types";

export async function POST(
  req: Request,
  params: { params: { chatId: string } },
) {
  const { chatId } = params.params;
  const body = await req.json();
  const content = body.content;
  const name = body.name;
  console.log("name", name);

  // const _chat = [{
  //   content,
  //   createdAt: new Date(),
  //   id: nanoid(),
  //   role: "user",
  //   name,
  // } as Message
  // ]

  // console.log("snapShot", _chat);

  const fetchedChat = await db
    .select()
    .from(chats)
    .where(eq(chats.id, Number(chatId)))
    .limit(1)
    .all();

  const msg: any = fetchedChat[0].messages;
  const chatlog = JSON.parse(msg as string) as ChatLog;

  // if (fetchedChat.length === 1 && msg) {
  //   // console.log("if",fetchedChat)
  //   const messages = JSON.parse(msg);
  //   // console.log("message.log", messages.log[0])
  //   if (messages.tldraw_snapshot[0].content.startsWith('{"store":')) {
  //     messages.tldraw_snapshot[0] = _chat;
  //   }
  //   await db
  //     .update(chats)
  //     .set({
  //       messages: JSON.stringify(messages),
  //       updatedAt: new Date(),
  //     })
  //     .where(eq(chats.id, Number(chatId)))
  //     .run();
  // } else {
  const _chat = [
    {
      content,
      createdAt: new Date(),
      id: nanoid(),
      role: "user",
      name,
    } as Message,
  ];
  // console.log("else")

  if (fetchedChat.length === 1) {
    await db
      .update(chats)
      .set({
        messages: JSON.stringify({
          log: chatlog && chatlog.log ? chatlog.log : [],
          tldraw_snapshot: _chat,
        }),
        updatedAt: new Date(),
      })
      .where(eq(chats.id, Number(chatId)))
      .run();
  }

  return new Response(JSON.stringify({ success: true }));
}
