import { Button } from "@/components/button";
import Link from "next/link";
import { db } from "@/lib/db";
import { Metadata, ResolvingMetadata } from "next";
import { chats, Chat as ChatSchema } from "@/lib/db/schema";
import { eq, desc, ne, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs";
import ChatCardWrapper from "@/components/chatcardwrapper";
// import Uploadzone from "@/components/uploadzone";

export const dynamic = "force-dynamic",
  revalidate = 0;

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // read route params
  const id = params.id;
  console.log("params", params);
  console.log("searchParams", searchParams);

  // fetch data

  return {
    openGraph: {
      title: "Echoes",
      description: "The React Framework for the Web",
      url: "https://echoes.team",
      siteName: "Echoes",
      images: [
        {
          url: "https//www.echoes.team/api/og?title=Hello brother",
          // url: "https://buffer.com/library/content/images/size/w1200/2023/10/free-images.jpg", // Must be an absolute URL
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
  searchParams,
}: {
  params: { slug: string };
  searchParams: { [key: string]: string };
}) {
  const { slug } = params;
  const { userId, sessionClaims } = auth();

  let orgConversations = [] as ChatSchema[];
  // fetch initial posts to start with
  const isOrgExist = Object.keys(sessionClaims?.organizations as Object).length;

  if (isOrgExist) {
    if (searchParams.hasOwnProperty("chats") && searchParams.chats === "me") {
      orgConversations = await getConversations({
        orgId: String(sessionClaims?.org_id),
        userId: String(userId),
      });
    } else {
      orgConversations = await getConversations({
        orgId: String(sessionClaims?.org_id),
      });
    }
  }

  return (
    <div className="mt-[120px] grid gap-4 grid-cols-1 relative">
      {!isOrgExist ? (
        <div>
          You are not a member in any Organisations.{" "}
          <Button className="mr-2 h-[32px]" variant="secondary" asChild>
            <Link href="https://www.echoes.team/#requestaccess">
              Request Access
            </Link>
          </Button>
        </div>
      ) : (
        <div className="relative">
          <ChatCardWrapper
            initialData={orgConversations}
            org_id={sessionClaims?.org_id}
            uid={userId as string}
            org_slug={sessionClaims?.org_slug as string}
          />
        </div>
      )}
    </div>
  );
}

const getConversations = async ({
  orgId,
  userId,
  offset = 0,
}: {
  orgId: string;
  userId?: string;
  offset?: number;
}): Promise<ChatSchema[]> => {
  if (!userId) {
    let orgConversations = await db
      .select()
      .from(chats)
      .where(
        and(
          eq(chats.user_id, String(orgId)),
          ne(chats.messages, "NULL"),
          eq(chats.confidential, 0),
        ),
      )
      .orderBy(desc(chats.updatedAt))
      .offset(offset)
      .limit(10)
      .all();
    return orgConversations;
  } else {
    let orgConversations = await db
      .select()
      .from(chats)
      .where(
        and(
          eq(chats.user_id, String(orgId)),
          ne(chats.messages, "NULL"),
          eq(chats.creator, userId),
        ),
      )
      .orderBy(desc(chats.updatedAt))
      .offset(offset)
      .limit(10)
      .all();
    return orgConversations;
  }
};
