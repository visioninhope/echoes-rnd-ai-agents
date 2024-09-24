"use client";
import { useState, useEffect, useCallback } from "react";
import { ChatType } from "@/lib/types";
import InputBar from "@/components/inputBar";
import { Message, useChat } from "ai/react";
import Startnewchatbutton from "@/components/startnewchatbutton";
import ChatMessageCombinator from "@/components/chatmessagecombinator";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import PersistenceExample from "@/components/tldraw";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "./ui/use-toast";
import { getUserIdList } from "./chatusersavatars";
import { useDropzone } from "react-dropzone";
import { X } from "lucide-react";
import { useImageState } from "@/store/tlDrawImage";
import { useQueryState } from "next-usequerystate";
import { nanoid } from "ai";

interface ChatProps {
  orgId: string;
  uid: string;
  dbChat: Message[];
  chatId: string;
  username: string;
  org_slug: string;
  chatTitle: string;
  imageUrl: string;
  type: ChatType;
  confidential: number | null;
  onClickOpenChatSheet?: boolean;
  snapShot: Message[];
}

export default function Chat(props: ChatProps) {
  // const { toast} = useToast()
  const {
    tldrawImageUrl,
    tlDrawImage,
    setTlDrawImage,
    settldrawImageUrl,
    onClickOpenChatSheet,
  } = useImageState();
  const [isChatCompleted, setIsChatCompleted] = useState<boolean>(false);
  const [calculatedMessages, setCalculatedMessages] = useState<Message[][]>([]);
  // const { presenceData, updateStatus } = usePresence(`channel_${props.chatId}`);
  const [dropZoneActive, setDropzoneActive] = useState<boolean>(false);
  const [image, setImage] = useState<File[]>([]); // Initialize state
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageName, setImageName] = useState<string>("");
  const queryClient = useQueryClient();
  const [isNewChat, setIsNewChat] = useQueryState("new");
  const [isFromClipboard, setIsFromClipboard] = useQueryState("clipboard");
  const [incomingModel] = useQueryState("model");
  const [incomingInput] = useQueryState("input");
  const [chattype, setChattype] = useState<ChatType>(
    props?.type || incomingModel || "chat",
  );

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]?.type.startsWith("image/")) {
      setImage(acceptedFiles);
      setImageUrl(URL.createObjectURL(acceptedFiles[0]));
      setImageName(JSON.stringify(acceptedFiles[0].name));
      setDropzoneActive(true);
    } else {
      {
        image
          ? null
          : toast({
              description: (
                <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                  <code className="text-white">
                    Please select a image file.
                  </code>
                </pre>
              ),
            });
      }
    }
  }, []);
  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
    },
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
  });

  const chatFetcher = async () => {
    const res = await axios.get(`/api/chats/${props.chatId}`);
    const chats = res.data.chats;
    console.log("chatsfetch front", chats);
    return chats.log as Message[];
  };
  const {
    data: chatsData,
    isLoading: isChatsLoading,
    isError,
  } = useQuery({
    queryKey: ["chats", props.chatId],
    queryFn: chatFetcher,
    initialData: props.dbChat,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (tldrawImageUrl) {
      setDropzoneActive(true);
      setImageUrl(tldrawImageUrl);
      setImage(tlDrawImage);
    }
  }, [tlDrawImage]);

  useEffect(() => {
    if (!onClickOpenChatSheet) {
      settldrawImageUrl("");
      setTlDrawImage("");
    }
  }, [onClickOpenChatSheet]);

  // components/MessageList.tsx

  // let updatedChatsData: Message[] = [];
  // if ( chatsData[0]?.content.startsWith('{"store":')) {
  //   updatedChatsData = chatsData.slice(1);
  // } else {
  //   updatedChatsData = chatsData;
  // }
  //  console.log("updatedChatsData", updatedChatsData);
  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    append,
    setMessages,
    isLoading,
    data,
  } = useChat({
    api:
      chattype === "ella"
        ? `/api/chatmodel/${props.chatId}`
        : `/api/chatmodel-o1preview/${props.chatId}`,
    initialMessages: chatsData,
    body: {
      orgId: props.orgId,
      name: props.username,
      userId: props.uid,
      chattype: chattype,
    },
    onError: (error) => {
      console.log("got the error", error);
      setIsChatCompleted(true);
    },
    onResponse(response) {
      console.log("got the response", response);
    },
    onFinish(message) {
      console.log("got the finish", message);
    },
    sendExtraMessageFields: true,
  });
  console.log("messages", messages);

  //TODO: handle user incoming from dashboard when invoked a chat
  useEffect(() => {
    if (isNewChat === "true" && incomingInput) {
      //TODO: use types for useQueryState
      if (incomingInput && chattype !== "tldraw") {
        const newMessage = {
          id: nanoid(),
          role: "user",
          content: incomingInput,
          name: `${props.username},${props.uid}`,
          audio: "",
        } as Message;
        append(newMessage);
      }
      setIsFromClipboard("false");
      setIsNewChat("false");
    }
  }, [isFromClipboard, isNewChat]);

  useEffect(() => {
    let mainArray: Message[][] = [];
    let subarray: Message[] = [];

    if (messages && messages.length) {
      messages.forEach((message, index) => {
        if (message.role === "user") {
          if (index === 0) {
            subarray.push(message as Message);
          } else {
            mainArray.push(subarray);
            subarray = [];
            subarray.push(message as Message);
          }
        } else if (index === messages.length - 1) {
          subarray.push(message as Message);
          mainArray.push(subarray);
        } else {
          subarray.push(message as Message);
        }
      });
      setCalculatedMessages(mainArray);
    }
  }, [messages]);
  const confidentialFetcher = async () => {
    const res = await axios.get(`/api/chats/${props.chatId}/confidential`);
    const confidential = res.data.confidential;
    return confidential as number;
  };

  const { data: confidentiality } = useQuery({
    queryKey: ["confidential", props.chatId],
    queryFn: confidentialFetcher,
    initialData: props.confidential,
    refetchOnWindowFocus: false,
  });

  const userIds = getUserIdList(
    props.type === "tldraw" ? props.snapShot : props.dbChat,
  );

  const {
    mutate: toogleConfidentiality,
    isLoading: isTooglingConfidentiality,
  } = useMutation({
    mutationFn: async ({ confidential }: { confidential: boolean }) => {
      // toogle confidentiality
      const res = await axios.patch(`/api/chats/${props.chatId}/confidential`, {
        confidential,
      });
      return res.data;
    },
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries(["confidential", props.chatId]);
      await queryClient.invalidateQueries(["chatcards"]);
      toast({
        title: data.message,
      });
    },
    onError(error: any) {
      toast({
        title: `${error.response.data.message}`,
      });
    },
  });
  return (
    <div className="flex flex-col gap-1 mx-auto">
      {props.type === "tldraw" && !props.onClickOpenChatSheet ? (
        <div className=" w-[calc(100dvw-40px)] h-[calc(100dvh-128px)]">
          <PersistenceExample
            org_slug={props.org_slug}
            org_id={props.orgId}
            dbChat={props.snapShot}
            username={props.username}
            chatId={props.chatId}
            uid={props.uid}
          />
        </div>
      ) : (
        // {preferences.showSubRoll && <PersistenceExample />}
        <>
          <section onDrop={(acceptedFiles: any) => onDrop(acceptedFiles)}>
            <div className={`min-h-[400px] max-h-[auto]`} {...getRootProps()}>
              <input {...getInputProps()} />
              <ChatMessageCombinator
                onClickOpenChatSheet={props.onClickOpenChatSheet}
                calculatedMessages={calculatedMessages}
                messages={messages}
                chatId={props.chatId}
                orgId={props.orgId}
                name={props.username}
                uid={props.uid}
                setMessages={setMessages}
                chatTitle={props.chatTitle}
                imageUrl={props.imageUrl}
                isChatCompleted={isChatCompleted}
                setIsChatCompleted={setIsChatCompleted}
                append={append}
                isLoading={isLoading}
                shouldShowConfidentialToggler={userIds.includes(props.uid)}
                confidential={confidentiality}
                toogleConfidentiality={toogleConfidentiality}
                isTooglingConfidentiality={isTooglingConfidentiality}
              />
            </div>
          </section>
          {/* </div> */}

          {dropZoneActive ? (
            <>
              {" "}
              <div
                className=" w-[200px] flex flex-col rounded-md p-4 relative text-primary"
                onClick={() => {
                  setInput("");
                  setDropzoneActive(false);
                  settldrawImageUrl("");
                  setTlDrawImage("");
                }}
              >
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-auto rounded-md relative inset-0 hover:opacity-40 cursor-pointer"
                />
                <X className="absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] pointer-events-none" />
              </div>
            </>
          ) : null}

          {isChatCompleted && (
            <div>
              <Startnewchatbutton
                org_slug={props.org_slug}
                org_id={props.orgId}
              />
            </div>
          )}
          <InputBar
            onDrop={onDrop}
            getInputProps={getInputProps}
            getRootProps={getRootProps}
            onClickOpenChatSheet={props.onClickOpenChatSheet}
            onClickOpen={open}
            dropZoneImage={image}
            dropZoneActive={dropZoneActive}
            setDropzoneActive={setDropzoneActive}
            chatId={props.chatId}
            orgId={props.orgId}
            messages={messages}
            setMessages={setMessages}
            username={props.username}
            userId={props.uid}
            chattype={chattype}
            setChattype={setChattype}
            value={input}
            onChange={handleInputChange}
            setInput={setInput}
            append={append}
            isChatCompleted={isChatCompleted}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
}
