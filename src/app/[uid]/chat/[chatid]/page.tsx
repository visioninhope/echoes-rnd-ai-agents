import Chat from "@/components/chat";
import { ChatLog } from "@/lib/types";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Chat as ChatSchema, chats } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Button } from "@/components/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar";
import Chatusers from "@/components/chatusersavatars";
export const dynamic = "force-dynamic",
  revalidate = 0;

export default async function Page({
  params,
}: {
  params: { uid: string; chatid: string };
}) {
  const { userId, sessionClaims } = auth();

  const user = await currentUser();
  console.log("user", user?.firstName, user?.lastName);
  const fullname = ((user?.firstName as string) +
    " " +
    user?.lastName) as string;
  if (
    !params.uid ||
    !params.chatid ||
    !userId ||
    sessionClaims?.org_slug !== params.uid
  ) {
    console.log('redirecting to "/"');
    redirect("/");
  }

  let chatlog: ChatLog = { log: [] };
  let fetchedChat: ChatSchema[] = [];

  if (sessionClaims.org_id) {
    fetchedChat = await db
      .select()
      .from(chats)
      .where(
        and(
          eq(chats.id, Number(params.chatid)),
          eq(chats.user_id, sessionClaims.org_id),
        ),
      )
      .limit(1);
  }
  const msg = fetchedChat[0]?.messages;
  if (fetchedChat.length === 1 && msg) {
    chatlog = JSON.parse(msg as string) as ChatLog;
  }

  return (
    <div className="flex-col h-full justify-between">
      <div className="flex space-between mb-2">
        <div className="flex items-center">
          <Button variant="outline" className="mr-2" asChild>
            <Link href={`/${userId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Chatusers chat={fetchedChat[0]} />

          {/* <Button variant="outline" className="mr-2">
            <PlusIcon className="h-4 w-4" />
          </Button> */}
        </div>

        <div className="grow" />
      </div>
      <div></div>
      <Chat
        orgId={sessionClaims.org_id ? sessionClaims.org_id : ""}
        chat={chatlog}
        chatId={params.chatid}
        uid={userId}
        username={fullname}
      />
    </div>
  );
}
