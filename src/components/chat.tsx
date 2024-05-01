"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { AIType, ChatType } from "@/lib/types";
import InputBar from "@/components/inputBar";
import { Message, useChat } from "ai/react";
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
  const sheetContentRef = useRef<HTMLDivElement>(null);
  // const { toast} = useToast()
  const {
    tldrawImageUrl,
    tlDrawImage,
    setTlDrawImage,
    settldrawImageUrl,
    onClickOpenChatSheet,
  } = useImageState();
  const [choosenAI, setChoosenAI] = useState<AIType>("universal");
  const [calculatedMessages, setCalculatedMessages] = useState<Message[][]>([]);
  // const { presenceData, updateStatus } = usePresence(`channel_${props.chatId}`);
  const [dropZoneActive, setDropzoneActive] = useState<boolean>(false);
  const [image, setImage] = useState<File[]>([]); // Initialize state
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageName, setImageName] = useState<string>("");
  const queryClient = useQueryClient();

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
    api: `/api/chatmodel/${props.chatId}`,
    initialMessages: chatsData,
    body: {
      orgId: props.orgId,
      name: props.username,
      userId: props.uid,
      chattype: props.type,
    },
    onError: (error) => {
      console.log("got the error from api", error);
    },
    onResponse(response) {
      console.log("got the response", response);
    },
    onFinish(message) {
      console.log("got the finish", message);
    },
    sendExtraMessageFields: true,
  });

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
  useEffect(() => {
    if (sheetContentRef.current) {
      sheetContentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  const scrollToBottom = () => {
    const isMobile = window.innerWidth <= 500;
    const scrollFunction = () => {
      if (sheetContentRef.current) {
        sheetContentRef.current.scrollIntoView({ behavior: "smooth" });
      }
    };
    if (isMobile) {
      setTimeout(scrollFunction, 1000);
    } else {
      scrollFunction();
    }
    return null;
  };
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
          <InputBar
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
            choosenAI={choosenAI}
            setChoosenAI={setChoosenAI}
            value={input}
            onChange={handleInputChange}
            setInput={setInput}
            append={append}
            isLoading={isLoading}
            chattype={props.type}
          />
        </>
      )}
      <div className="h-0" ref={sheetContentRef} />
      {scrollToBottom()}
    </div>
  );
}
