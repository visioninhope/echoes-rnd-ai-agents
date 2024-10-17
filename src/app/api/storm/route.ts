import axios from "axios";
import { env } from "@/app/env.mjs";
import { saveToDB } from "@/utils/apiHelper";
import { auth } from "@clerk/nextjs";
import { nanoid } from "ai";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
  const url = request.url;
  const urlArray = url.split("/");
  const { orgSlug } = auth();
  const body = await request.json();

  const response = await axios.post(
    `${env.KEYCLOAK_BASE_URL}/realms/${env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
    new URLSearchParams({
      client_id: env.KEYCLOAK_CLIENT_ID,
      client_secret: env.KEYCLOAK_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  const accessToken = response.data.access_token;

  const stormResponse = await axios.post(
    `${env.STORM_ENDPOINT}`,
    {
      topic: body.topic,
      search_top_k: 5,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const chatId = body.chatId;
  const orgId = body.orgId;
  const userId = body.userId;
  const latestResponse = {
    id: nanoid(),
    role: "assistant" as const,
    content: stormResponse?.data?.content,
    createdAt: new Date(),
    audio: "",
  };

  await saveToDB({
    _chat: [],
    chatId: Number(chatId),
    orgSlug: orgSlug as string,
    latestResponse: latestResponse,
    userId: userId,
    orgId: orgId,
    urlArray: urlArray,
  });
  return NextResponse.json({
    data: stormResponse.data,
  });
};
