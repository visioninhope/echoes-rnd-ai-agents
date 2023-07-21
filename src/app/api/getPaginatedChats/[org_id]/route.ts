import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  params: { params: { org_id: string } },
) {
  // handle if org_id is undefined or null
  const { searchParams } = new URL(request.url);
  let page = Number(searchParams.get("page"));
  const org_id = params.params.org_id;

  if (page === null || isNaN(page)) {
    console.log("page if case", page);
    page = 1;
  }
  console.log("page", page);
  console.log("orgId", org_id);
  // need to improve the logic
  const offset = 4;
  const skip = offset * page;

  let orgConversations = await db
    .select()
    .from(chats)
    .where(eq(chats.user_id, String(org_id)))
    .orderBy(desc(chats.updatedAt))
    .offset(skip)
    .limit(4);

  return NextResponse.json({ conversations: orgConversations });
}
