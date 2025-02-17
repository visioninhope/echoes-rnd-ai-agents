"use client";

import TextareaAutosize from "react-textarea-autosize";
import {
  ChangeEvent,
  Dispatch,
  FormEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { ChatRequestOptions, CreateMessage, Message, nanoid } from "ai";
import { PaperPlaneTilt, UploadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/button";
import { ChatType, chattype } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import z from "zod";
import { toast } from "./ui/use-toast";
import ModelSwitcher from "./modelswitcher";
// import VadAudio from "./vadAudio";
import VadAudio from "./VadAudio";
import { useDropzone } from "react-dropzone";
import { X } from "lucide-react";
import { parseAsString, useQueryState } from "next-usequerystate";
const isValidImageType = (value: string) =>
  /^image\/(jpeg|png|jpg|webp)$/.test(value);

const Schema = z.object({
  imageName: z.any(),
  imageType: z.string().refine(isValidImageType, {
    message: "File type must be JPEG, PNG, or WEBP image",
    path: ["type"],
  }),
  imageSize: z.number(),
  value: z.string(),
  userId: z.string(),
  orgId: z.string(),
  chatId: z.any(),
  file: z.instanceof(Blob),
  message: z.array(z.any()),
  id: z.string(),
  chattype: chattype,
});
function isJSON(str: any) {
  let obj: any;
  try {
    obj = JSON.parse(str);
  } catch (e) {
    return false;
  }
  if (typeof obj === "number" || obj instanceof Number) {
    return false;
  }
  return !!obj && typeof obj === "object";
}

interface InputBarProps {
  dropZoneImage?: File[];
  value?: string;
  onChange?: (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  username?: string;
  userId?: string;
  append?: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions | undefined,
  ) => Promise<string | null | undefined>;
  setInput?: Dispatch<SetStateAction<string>>;
  isChatCompleted?: boolean;
  chatId?: string;
  messages?: Message[];
  orgId?: string;
  setMessages?: (messages: Message[]) => void;
  isLoading?: boolean;
  chattype?: ChatType;
  setChattype?: Dispatch<SetStateAction<ChatType>>;
  dropZoneActive?: boolean;
  onClickOpen?: any;
  onClickOpenChatSheet?: boolean | any;
  isHome?: boolean;
  submitInput?: () => void;
  imageUrl: string;
  setImageUrl: Dispatch<SetStateAction<string>>;
  imageName: string;
  setImageName: Dispatch<SetStateAction<string>>;
  imageType: string;
  setImageType: Dispatch<SetStateAction<string>>;
  imageSize: string;
  setImageSize: Dispatch<SetStateAction<string>>;
  setDropzoneActive: Dispatch<SetStateAction<boolean>>;
  dropzoneActive: boolean;
  imageExtension: string;
  setImageExtension: Dispatch<SetStateAction<string>>;
}

const InputBar = (props: InputBarProps) => {
  const [isAudioWaveVisible, setIsAudioWaveVisible] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [disableInputs, setDisableInputs] = useState<boolean>(false);
  const [isRagLoading, setIsRagLoading] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const [chatType] = useQueryState("model", parseAsString.withDefault("chat"));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("props.value", props.value);
    if (props.value?.trim() === "") {
      return;
    }
    const ID = nanoid();
    const message: Message = {
      id: ID,
      role: "user",
      content: props.value || "",
      name: `${props.username},${props.userId}`,
      audio: "",
    };
    if (props.dropZoneActive) {
      setDisableInputs(true);
      setIsRagLoading(true);

      console.log("image dropped");
      props?.setInput?.("");
      props?.setDropzoneActive?.(false);

      if (props.dropZoneImage && props.dropZoneImage.length > 0) {
        const zodMessage: any = Schema.safeParse({
          imageName: props.dropZoneImage[0].name,
          imageType: props.dropZoneImage[0].type,
          imageSize: props.dropZoneImage[0].size,
          file: props.dropZoneImage[0],
          value: props.value,
          userId: props.userId,
          orgId: props.orgId,
          chatId: props.chatId,
          message: [...(props.messages || []), message],
          id: ID,
          chattype: props.chattype,
        });
        const imageExtension = props.dropZoneImage[0].name.substring(
          props.dropZoneImage[0].name.lastIndexOf(".") + 1,
        );
        // console.log("zodmessage", zodMessage);
        // console.log("dropzone", props.dropZoneActive);
        if (zodMessage.success) {
          const file = props.dropZoneImage[0];
          const zodMSG = JSON.stringify(zodMessage);
          const formData = new FormData();
          formData.append("zodMessage", zodMSG);
          formData.append("file", file);
          const response = await fetch("/api/imageInput", {
            method: "POST",
            body: formData,
          });
          if (response) {
            console.log("responce", response);
            let assistantMsg = "";
            const reader = response.body?.getReader();
            console.log("reader", reader);
            const decoder = new TextDecoder();
            let charsReceived = 0;
            let content = "";
            reader
              ?.read()
              .then(async function processText({ done, value }) {
                if (done) {
                  setDisableInputs(false);
                  setIsRagLoading(false);
                  console.log("Stream complete");
                  return;
                }
                charsReceived += value.length;
                const chunk = decoder.decode(value, { stream: true });
                assistantMsg += chunk === "" ? `${chunk} \n` : chunk;
                content += chunk === "" ? `${chunk} \n` : chunk;
                // console.log("assistMsg", assistantMsg);
                props?.setMessages?.([
                  ...(props.messages || []),
                  awsImageMessage,
                  message,
                  {
                    ...assistantMessage,
                    content: assistantMsg,
                  },
                ]);
                reader.read().then(processText);
              })
              .then((e) => {
                console.error("error", e);
              });
            const awsImageMessage = {
              role: "user",
              subRole: "input-image",
              content: `${process.env.NEXT_PUBLIC_IMAGE_PREFIX_URL}imagefolder/${props.chatId}/${ID}.${imageExtension}`,
              id: ID,
            } as Message;
            const assistantMessage: Message = {
              id: ID,
              role: "assistant",
              content: content,
            };
          } else {
            console.error(" Response Error :", response);
          }
        } else {
          toast({
            description: (
              <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                <code className="text-white">
                  {zodMessage.error.issues[0].message}
                </code>
              </pre>
            ),
          });
        }
      }
      return;
    }

    if (props.chattype === "rag") {
      setIsRagLoading(true);
      setDisableInputs(true);
      props?.setMessages?.([...(props.messages || []), message]);
      props?.setInput?.("");
      let content = "";
      const id = nanoid();
      const assistantMessage: Message = {
        id,
        role: "assistant",
        content: "",
      };
      let message2 = "";
      try {
        await fetchEventSource(`/api/chatmodel/${props.chatId}}`, {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({
            input: props.value,
            messages: [...(props.messages || []), message],
            userId: props.userId,
            orgId: props.orgId,
            chattype: props.chattype,
            enableStreaming: true,
          }),
          openWhenHidden: true,
          async onopen(response) {
            setDisableInputs(true);
            console.log("events started");
          },
          async onclose() {
            setDisableInputs(false);
            setIsRagLoading(false);
            console.log("event reading closed", message2);
            fetch(`/api/updatedb/${props.chatId}`, {
              method: "POST",
              body: JSON.stringify({
                messages: [
                  ...(props.messages || []),
                  message,
                  {
                    ...assistantMessage,
                    content: content,
                  },
                ],
                orgId: props.orgId,
                usreId: props.userId,
              }),
            }); // TODO: handle echoes is typing
            return;
          },
          async onmessage(event: any) {
            if (event.data !== "[END]" && event.event !== "function_call") {
              message2 += event.data === "" ? `${event.data} \n` : event.data;
              content += event.data === "" ? `${event.data} \n` : event.data;
              props?.setMessages?.([
                ...(props.messages || []),
                message,
                {
                  ...assistantMessage,
                  content: content,
                },
              ]);
            }
          },
          onerror(error: any) {
            console.error("event reading error", error);
          },
        });
        return;
      } catch (error) {
        console.error(error);
        return;
      }
    }
    // if (props.choosenAI === "universal") {
    props?.append?.(message as Message);
    props?.setInput?.("");
  };
  const [image, setImage] = useState<File[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]?.type.startsWith("image/")) {
      setImage(acceptedFiles);
      props.setImageType(acceptedFiles[0].type);
      props.setImageSize(String(acceptedFiles[0].size));
      props.setImageUrl(URL.createObjectURL(acceptedFiles[0]));
      props.setImageName(JSON.stringify(acceptedFiles[0].name));
      props.setImageExtension(acceptedFiles[0].name.split(".").pop() || "");
      props.setDropzoneActive(true);
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

  const [audioId, setAudioId] = useState(0);
  const [transcriptHashTable, setTranscriptHashTable] = useState<{
    [key: number]: string;
  }>({});

  const handleAudioChunk = async (audioChunk: File) => {
    const newAudioId = audioId + 1;
    setAudioId(newAudioId);
    setIsTranscribing(true);
    const f = new FormData();
    f.append("file", audioChunk);
    try {
      const res = await fetch("/api/transcript", {
        method: "POST",
        body: f,
      });

      const data = await res.json();
      setTranscriptHashTable((prev) => ({
        ...prev,
        [newAudioId]: data.text,
      }));
      setIsTranscribing(false);
    } catch (err) {
      console.error("got in error", err);
      setIsTranscribing(false);
    }
  };

  useEffect(() => {
    if (Object.keys(transcriptHashTable).length > 0) {
      props?.setInput?.(Object.values(transcriptHashTable).join(" "));
    }
  }, [transcriptHashTable]);

  //TODO:
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (props.dropZoneActive) {
      props?.setInput?.(e.target.value);
    } else {
      const inputValue = e.target.value;
      navigator.clipboard
        .writeText(inputValue)
        .then(() => {
          console.log("Input value copied to clipboard");
        })
        .catch((err) => {
          console.error("Could not copy text: ", err);
        });
      props?.onChange?.(e);
    }
  };

  const [isBlinking, setIsBlinking] = useState(false); // Control blinking state
  const [displayNumber, setDisplayNumber] = useState(1);

  useEffect(() => {
    let interval: any;
    if (isBlinking) {
      interval = setInterval(() => {
        setDisplayNumber((prev) => (prev === 5 ? 1 : prev + 1));
      }, 100); // Change every 500ms
    }

    return () => clearInterval(interval);
  }, [isBlinking]);

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-grow sm:min-w-[700px]`}
      {...getRootProps()}
    >
      <div
        className="flex flex-col flex-grow bg-linear-900 p-2 pt-2 rounded-sm gap-2 "
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        {/* <AnimatePresence> */}
        {props.dropzoneActive ? (
          <>
            {" "}
            <div
              className=" w-[200px] flex flex-col rounded-md p-4 relative text-primary"
              onClick={() => {
                props.setDropzoneActive(false); //TODO: clear params
                props.setImageUrl("");
                props.setImageName("");
                props.setImageType("");
                props.setImageSize("");
                props.setImageExtension("");
                const url = new URL(window.location.href);
                window.history.replaceState({}, document.title, url.toString());
              }}
            >
              <img
                src={props.imageUrl}
                alt="Preview"
                className="w-full h-auto rounded-md relative inset-0 hover:opacity-40 cursor-pointer"
              />
              <X className="absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] pointer-events-none" />
            </div>
          </>
        ) : null}
        <div className="flex flex-grow w-full">
          <div className="relative w-full">
            <TextareaAutosize
              maxRows={10}
              placeholder={
                isTranscribing
                  ? ""
                  : props.dropZoneActive
                  ? "Ask question about image"
                  : chatType === "storm"
                  ? "Enter the topic"
                  : "Type your message here..."
              }
              autoFocus
              value={
                props.value + (isBlinking ? ".".repeat(displayNumber) : "")
              }
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (props?.isHome) {
                    console.log("home submit");
                    props?.submitInput?.();
                  } else {
                    handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
                  }
                }
              }}
              className="flex-none resize-none rounded-sm grow w-full bg-background border border-secondary text-primary p-2 text-sm disabled:text-muted"
            />
          </div>

          <div></div>
        </div>
        <div className="flex flex-grow">
          <div className="flex flex-grow gap-2">
            <ModelSwitcher
              disabled={
                props.isChatCompleted ||
                isRecording ||
                isTranscribing ||
                disableInputs
              }
              chattype={props.chattype}
              setChatType={props.setChattype}
              isHome={props.isHome}
            />
            <Button
              // disabled={isRecording || isTranscribing || disableInputs}
              // disabled={true}
              onClick={open}
              size="icon"
              variant="secondary"
              type="button"
              className="disabled:text-muted"
            >
              <UploadSimple
                className="h-4 w-4 fill-current"
                color="#618a9e"
                weight="bold"
              />
            </Button>
          </div>
          <div>
            <div className="flex gap-2">
              <VadAudio
                onStartListening={() => {
                  setIsBlinking(true);
                  setIsAudioWaveVisible(true);
                  const newAudioId = audioId + 1;
                  setAudioId(newAudioId);
                  setTranscriptHashTable((prev) => ({
                    ...prev,
                    [newAudioId]: props?.value || "",
                  }));
                  setIsAudioWaveVisible(true);
                }}
                onStopListening={() => {
                  setIsBlinking(false);
                  setTranscriptHashTable({});
                  setIsAudioWaveVisible(false);
                }}
                // disabled={isRecording || isTranscribing || disableInputs}
                onAudioCapture={(file: File) => {
                  // trigger a call to the backend to transcribe the audio
                  handleAudioChunk(file);
                }}
                isHome={props.isHome}
              />
              <Button
                size="icon"
                variant="secondary"
                disabled={
                  props.isChatCompleted ||
                  isRecording ||
                  isTranscribing ||
                  disableInputs
                }
                type="submit"
                onClick={(e) => {
                  if (props?.isHome) {
                    console.log("home submit");
                    props?.submitInput?.();
                  } else {
                    handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
                  }
                }}
                className="disabled:text-muted"
              >
                <PaperPlaneTilt className="h-4 w-4 fill-current" />
              </Button>
            </div>
          </div>
        </div>
        {/* </AnimatePresence> */}
      </div>
    </form>
  );
};

export default InputBar;
