import React, { useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChatEntry, ChatType } from "@/lib/types";
import Chat from "./chat";
import { useChannel, usePresence } from "ably/react";
import Chatusers, { getUserIdList } from "@/components/chatusersavatars";
import { useImageState } from "@/store/tlDrawImage";

interface Props {
  orgId: string;
  uid: string;
  dbChat: ChatEntry[];
  chatId: string;
  username: string;
  org_slug: string;
  chatTitle: string;
  imageUrl: string;
  type: ChatType;
  confidential: number | null;
}

const ChatSheet: React.FC<Props> = (props) => {
  const messageEndRef = useRef<any>(null);
  const { setOnClickOpenChatSheet, onClickOpenChatSheet, tlDrawImage } =
    useImageState();
  const { channel } = useChannel("room_5", (message) => {
    console.log(message);
  });

  const { presenceData, updateStatus } = usePresence(
    `channel_${props.chatId}`,
    {
      id: props.uid,
      username: props.username,
      isTyping: false,
    },
  );

  const dbIds = getUserIdList(props.dbChat);
  const chatCreatorId = dbIds[0];

  const liveUserIds = presenceData.map((p) => p.data.id);

  const uniqueIds = [...dbIds, ...liveUserIds].filter(
    (v, i, a) => a.indexOf(v) === i,
  );

  const sheetContentRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    if (sheetContentRef.current) {
      sheetContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
    return null;
  };

  return (
    <div>
      <Sheet open={onClickOpenChatSheet} onOpenChange={setOnClickOpenChatSheet}>
        <SheetContent className="scroll-smooth min-w-[280px] overflow-x-hidden ">
          <SheetHeader>
            <SheetTitle>
              <Chatusers
                allPresenceIds={uniqueIds}
                liveUserIds={liveUserIds}
                chatCreatorId={chatCreatorId}
                chatId={props.chatId as unknown as number}
              />
            </SheetTitle>
            <SheetFooter>
              <Chat
                onClickOpenChatSheet={onClickOpenChatSheet}
                type={props.type}
                orgId={props.orgId}
                dbChat={props.dbChat}
                chatId={props.chatId}
                uid={props.uid}
                username={props.username}
                org_slug={props.org_slug}
                chatTitle={props.chatTitle}
                imageUrl={props.imageUrl}
                confidential={props.confidential}
              />
            </SheetFooter>
          </SheetHeader>
          <div className="h-0" ref={sheetContentRef} />
          {scrollToBottom()}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ChatSheet;
