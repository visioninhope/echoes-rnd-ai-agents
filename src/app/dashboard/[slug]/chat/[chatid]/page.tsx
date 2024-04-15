import { ChatLog, ChatType } from "@/lib/types";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Chat as ChatSchema, chats } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs";
import RoomWrapper from "@/components/room";
import { AblyChannelProvider } from "@/components/ablyprovider";
import { ResolvingMetadata, Metadata } from "next";

export const dynamic = "force-dynamic",
  revalidate = 0;

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

let chattitle: any = "";
export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // read route params
  const id = params.id;
  const ogurl = new URL("http://localhost:3000/api/og?title=Hello");
  ogurl.searchParams.set("title", chattitle);

  console.log("chattitle in chat id page ", chattitle);
  return {
    title: "Echoes",
    description: "echoes slug",
    openGraph: {
      title: "Echoes",
      description: "Echoes Slug",
      type: "website",
      images: ["api/og?title=Hello id"],
      siteName: "Echoes",
      url: `https://www.echoes.team`,
    },
  };
}

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

  let chatlog: ChatLog = { log: [], tldraw_snapshot: [] };
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
    chatlog = JSON.parse(msg as string) as ChatLog;
    console.log("chatlog", chatlog);
    console.log("chatlogData", chatlog.log);
    chattitle = fetchedChat[0]?.title as string;
    // console.log("chatlogSnapshot", chatlog.tldraw_snapshot);
  }

  return (
    <AblyChannelProvider clientId={`room_${params.chatid}`}>
      <RoomWrapper
        orgId={sessionClaims.org_id ? sessionClaims.org_id : ""}
        chat={chatlog.log}
        snapShot={chatlog.tldraw_snapshot}
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
