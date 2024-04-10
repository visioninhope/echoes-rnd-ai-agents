import { ChatLog, ChatType } from "@/lib/types";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Chat as ChatSchema, chats } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs";
import RoomWrapper from "@/components/room";
import { AblyChannelProvider } from "@/components/ablyprovider";
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
  if (!sessionClaims?.org_slug) {
    console.log('redirecting to "/"');
    redirect("/");
  }

  let chatlog: ChatLog = { log: [] };
  // let tldrawSnapshot: SnapShot = { tldraw_snapshot: [] }
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
      .limit(1)
      .all();
  }
  const msg = fetchedChat[0]?.messages;
  console.log("msg", msg);
  if (fetchedChat.length === 1 && msg) {
    // if (fetchedChat[0]?.type as ChatType === "tldraw") {
    //   tldrawSnapshot = JSON.parse(msg as string) as SnapShot
    //   console.log("tldrawlog", tldrawSnapshot);
    // }
    // else {
    chatlog = JSON.parse(msg as string) as ChatLog;
    // console.log("chatlog", chatlog);
    // }
  }
  // console.log("chatlogData", chatlog.log);

  return (
    <AblyChannelProvider clientId={`room_${params.chatid}`}>
      <RoomWrapper
        orgId={sessionClaims.org_id ? sessionClaims.org_id : ""}
        chat={chatlog.log}
        chatId={params.chatid}
        uid={userId as string}
        username={fullname}
        chatAvatarData={fetchedChat[0]}
        org_slug={sessionClaims?.org_slug} // here uid contains org_slug
        chatTitle={fetchedChat[0]?.title as string}
        imageUrl={fetchedChat[0]?.image_url as string}
        type={fetchedChat[0]?.type as ChatType}
        confidential={fetchedChat[0]?.confidential}
      ></RoomWrapper>
    </AblyChannelProvider>
  );
}
