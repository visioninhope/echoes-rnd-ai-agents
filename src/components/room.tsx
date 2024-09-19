"use client";
import React, { useState } from "react";
import { ChatEntry, ChatType } from "@/lib/types";
import { Chat as ChatSchema } from "@/lib/db/schema";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/button";
import Chatusers, { getUserIdList } from "@/components/chatusersavatars";
import Chat from "@/components/chat";
import { Eye, EyeOff } from "lucide-react";
import usePreferences from "@/store/userPreferences";
import { useChannel, usePresence } from "ably/react";
import ChatSheet from "./chatSheet";
import { useImageState } from "@/store/tlDrawImage";
import ChatSidebar from "./chatSidebar";
import Startnewchatbutton from "./startnewchatbutton";

let chatToMap: any = "";

interface Props {
  orgId: string;
  uid: string;
  chat: ChatEntry[];
  chatId: string;
  username: string;
  chatAvatarData: ChatSchema;
  org_slug: string;
  chatTitle: string;
  imageUrl: string;
  type: ChatType;
  confidential: number | null;
  snapShot: any;
}

const RoomWrapper = (props: Props) => {
  const { setOnClickOpenChatSheet, onClickOpenChatSheet, tlDrawImage } =
    useImageState();

  const [showLoading, setShowLoading] = useState(false);
  const { channel } = useChannel("room_5", (message) => {
    console.log(message);
  });
  console.log("props.Chat", props.chat);

  console.log("props.Chat.tldraw_snapshot", props.snapShot);

  const preferences = usePreferences();
  const { presenceData, updateStatus } = usePresence(
    `channel_${props.chatId}`,
    {
      id: props.uid,
      username: props.username,
      isTyping: false,
    },
  );
  const dbIds = getUserIdList(
    props.type === "tldraw" ? props.snapShot : props.chat,
  );
  const chatCreatorId = dbIds[0];

  const liveUserIds = presenceData.map((p) => p.data.id);

  const uniqueIds = [...dbIds, ...liveUserIds].filter(
    (v, i, a) => a.indexOf(v) === i,
  );

  return (
    <>
      <div className="flex flex-col flex-grow min-h-[calc(100dvh-100px)] justify-between h-full mt-[80px]">
        {" "}
        <div className="flex space-between mb-2">
          <div className="flex items-center gap-2">
            <ChatSidebar
              org_id={props.orgId}
              org_slug={props.org_slug}
              uid={props.uid}
              initialData={props.chat as unknown as ChatSchema[]}
            />
            <Chatusers
              allPresenceIds={uniqueIds}
              liveUserIds={liveUserIds}
              chatCreatorId={chatCreatorId}
              chatId={props.chatId as unknown as number}
            />
          </div>

          <div className="grow" />
          <div className="flex gap-2">
            <Startnewchatbutton
              org_slug={props.org_slug}
              org_id={props.orgId}
            />
            <Button
              onClick={() => preferences.toggleShowSubRoll()}
              variant="outline"
            >
              {preferences.showSubRoll ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            {props.type == "tldraw" ? (
              <div>
                <Button
                  onClick={() => setOnClickOpenChatSheet(true)}
                  variant="outline"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <ChatSheet
                  snapShot={props.snapShot}
                  type={props.type}
                  orgId={props.orgId}
                  dbChat={props.chat}
                  chatId={props.chatId}
                  uid={props.uid}
                  username={props.username}
                  org_slug={props.org_slug}
                  chatTitle={props.chatTitle}
                  imageUrl={props.imageUrl}
                  confidential={props.confidential}
                />
              </div>
            ) : null}
          </div>
        </div>
        <Chat
          type={props.type}
          snapShot={props.snapShot}
          orgId={props.orgId}
          dbChat={props.chat}
          chatId={props.chatId}
          uid={props.uid}
          username={props.username}
          org_slug={props.org_slug}
          chatTitle={props.chatTitle}
          imageUrl={props.imageUrl}
          confidential={props.confidential}
        />
      </div>
    </>
  );
};

export default RoomWrapper;
