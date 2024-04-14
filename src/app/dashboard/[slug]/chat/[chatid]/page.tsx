import { ChatLog, ChatType } from "@/lib/types";
import { db } from "@/lib/db";
import { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";
import { Chat as ChatSchema, chats } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs";
import RoomWrapper from "@/components/room";
import { AblyChannelProvider } from "@/components/ablyprovider";

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
  console.log("params", params);
  console.log("searchParams", searchParams);

  return {
    title: chattitle,
    description:
      "Collaborative Platform for Researchers. Designed for Humans and AIs.",
    openGraph: {
      images: [
        {
          // url: "https//www.echoes.team/api/og?title=Hello brother",
          url: "https://0901.static.prezi.com/preview/v2/hxsohg2f6zal6vcgzqdlh4lsfx6jc3sachvcdoaizecfr3dnitcq_3_0.png", // Must be an absolute URL
          width: 1800,
          height: 1600,
          alt: "My custom alt",
        },
      ],
      locale: "en_US",
      type: "website",
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
