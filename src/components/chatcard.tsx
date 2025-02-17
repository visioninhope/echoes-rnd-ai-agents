"use client";
import { useState } from "react";
import { Chat } from "@/lib/db/schema";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { buttonVariants } from "@/components/button";
import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
  CardTitle,
} from "@/components/card";
import Chatusers, { getUserIdList } from "@/components/chatusersavatars";
import { CircleNotch } from "@phosphor-icons/react";
import { ChatEntry, ChatLog, ChatType } from "@/lib/types";
import Image from "next/image";
import AudioButton from "@/components//audioButton";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type Props = {
  chat: Chat;
  uid: string;
  org_id: string;
  org_slug: string;
  priority: boolean;
  type: string;
  isHome?: boolean;
};

const getChatType = (type: ChatType) => {
  if (type === "tldraw") {
    return "Tldraw";
  } else if (type === "advanced") {
    return "Advanced";
  } else if (type === "ella") {
    return "Ella";
  } else if (type === "rag") {
    return "Rag";
  } else if (type === "storm") {
    return "Article";
  } else {
    return "Simple Chat";
  }
};

const Chatcard = ({
  chat,
  uid,
  org_id,
  org_slug,
  priority,
  type,
  isHome = false,
}: Props) => {
  const queryClient = useQueryClient();
  const [showLoading, setShowLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState(
    type === "tldraw" ? "/default_tldraw.png" : chat.image_url,
  );

  const generateTitle = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.stopPropagation();
    const chatlog = JSON.parse(chat.messages as string) as ChatLog;
    console.log("chatlog", chatlog.log);
    const msgs = chatlog.log as ChatEntry[];
    const chats = msgs.slice(0, 2);
    const res = await fetch(`/api/generateTitle/${chat.id}/${org_id}`, {
      method: "POST",
      body: JSON.stringify({ chat: chats }),
    });
    const data = await res.json();
    await queryClient.invalidateQueries({
      queryKey: ["projects"],
      exact: true,
      refetchType: "all",
    });
    setTitle(data.title.replace('"', "").replace('"', "").split(":")[0]);
    setDescription(data.title.replace('"', "").replace('"', "").split(":")[1]);
  };

  const generateImage = async (chatTitle: string) => {
    setIsGeneratingImage(() => true);
    const res = await fetch(`/api/generateImage/${chat.id}/${org_id}`, {
      method: "POST",
      body: JSON.stringify({ chatTitle: chatTitle }),
    });
    const data = await res.json();
    setImageUrl(data.url);
    setIsGeneratingImage(() => false);
  };
  const router = useRouter();

  // generate Avatar's of all the users
  // filter all the distinct users from the chat.messages.log => will get all the user's id
  // have to get the user's list and then again filter the users of particular Chat
  // then from the imgUrl on the user object generate the image
  const [title, setTitle] = useState(() => {
    if (chat.title) {
      const trimmed = chat.title?.replace('"', "").replace('"', "");
      let t = trimmed.split(":")[0];
      return t ? t : "";
    } else {
      return "";
    }
  });

  const [description, setDescription] = useState(() => {
    if (chat.title) {
      const trimmed = chat.title?.replace('"', "").replace('"', "");
      let d = trimmed.split(":")[1];
      return d ? d : "";
    } else {
      return "";
    }
  });

  const msg = chat?.messages;
  let chatlog: ChatLog;
  let firstMessage: string;
  let chatTitle: string;
  let userIds: string[];
  try {
    chatlog = JSON.parse(msg as string) as ChatLog;
    firstMessage = chatlog?.log?.[0]?.content;
    chatTitle = chat.title || firstMessage || "No Title";
    userIds = getUserIdList(chatlog?.log || []);
  } catch (err: any) {
    chatTitle = chat.title || "No Title";
    console.error("error in chatcard", err);
  }

  return (
    <div
      className="relative cursor-pointer shadow-sm"
      onClick={() => {
        setShowLoading(true);
        if (!isHome) {
          router.replace(`${chat.id}`);
        } else {
          router.push(`/dashboard/chat/${chat.id}`);
        }
      }}
    >
      <Card className="relative overflow-hidden">
        <CardHeader className="h-44">
          <CardTitle className=" text-md font-bold line-clamp-2">
            {title}{" "}
          </CardTitle>
          <CardDescription className=" text-xs font-semibold text-foreground line-clamp-2">
            {title === "" ? (
              <span>
                No title{" "}
                <button
                  className={buttonVariants({ variant: "outline" })}
                  onClick={generateTitle}
                >
                  Generate
                </button>{" "}
              </span>
            ) : (
              <>{description}</>
            )}
          </CardDescription>
          <Chatusers
            count={2}
            allPresenceIds={userIds! || []}
            chatId={chat.id}
            chatCreatorId={userIds!?.[0] || ""}
          />
        </CardHeader>
        <CardContent className="flex justify-between ">
          <div className="flex gap-2">
            {!imageUrl && (
              <span>
                {/*
                <button
                  className={buttonVariants({ variant: "outline" })}
                  onClick={() => generateImage(chatTitle)}
                >
                  {isGeneratingImage ? (
                    <CircleNotch className="m-1 w-4 h-4 animate-spin" />
                  ) : (
                    <Image2 className="w-4 h-4" />
                  )}
                </button>{" "}
                */}
              </span>
            )}
            {chat.type !== "tldraw" && (
              <AudioButton
                chatId={String(chat.id)} // id to recognise chat
                chatTitle={title}
                description={description}
                id={String(chat.id)} // id for the track
                imageUrl={chat.image_url}
                messages={chatlog!?.log || []}
                summarize={true}
                orgId={org_id}
                audio={chat.audio}
                variant="ghost"
                size="sm"
                className="text-xs h-[32px]"
              />
            )}
            <Link
              onClick={() => setShowLoading(true)}
              href={{
                pathname: isHome
                  ? `/dashboard/chat/${chat.id}`
                  : `/chat/${chat.id}`,
              }}
              key={chat.id}
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "h-[32px]",
              )}
            >
              {showLoading ? (
                <CircleNotch className="m-1 w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className=" m-1 w-4 h-4" />
              )}
            </Link>
          </div>
        </CardContent>
      </Card>
      {imageUrl && (
        <div className="absolute inset-0 rounded-lg opacity-20 dark:hover:opacity-60 hover:opacity-5 mix-blend-darken dark:mix-blend-lighten transition-opacity duration-500">
          <Image
            quality={10}
            src={imageUrl}
            alt="Chat Title Image"
            fill
            sizes="(max-width: 640px) 100vw,
          (max-width: 1024px) 50vw,
           (max-width: 1200px) 33vw, 20vw"
            priority={priority}
            className="absolute rounded-md object-cover bg-cover pointer-events-none "
          />
        </div>
      )}
    </div>
  );
};

export default Chatcard;
