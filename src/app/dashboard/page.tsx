import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs";

export const dynamic = "force-dynamic",
  revalidate = 0;

export default async function Page() {
  const { userId, sessionClaims } = auth();
  const org_slug = sessionClaims?.org_slug;
  const org_id = String(sessionClaims?.org_id);
  const data = await db
    .insert(chats)
    .values({
      user_id: org_id,
      type: "chat",
      title: "",
    })
    .run();

  const chatId = data.toJSON().lastInsertRowid;
  console.log("org_slug", org_slug);
  console.log("org_id", org_id);
  console.log("userId", userId);
  console.log("\n\n\n\n\n\n");
  redirect(`/dashboard/${org_slug}/chat/${Number(chatId)}`);
  // redirect(`/dashboard/user`);
}
