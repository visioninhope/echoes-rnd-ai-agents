import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { env } from "@/app/env.mjs";
import { NextResponse } from "next/server";
import { jsonToLangchain, saveDroppedImage, saveToDB } from "@/utils/apiHelper";
import { z } from "zod";
import { Message } from "ai/react/dist";
import { auth } from "@clerk/nextjs";
import { NextApiResponse } from "next";
import { StreamingTextResponse, LangChainStream } from "ai";
import { systemPrompt, ellaPrompt } from "@/utils/prompts";
import { chattype } from "@/lib/types";
// import { ChatAnthropic } from "langchain/chat_models/anthropic";

export const maxDuration = 60; // This function can run for a maximum of 5 seconds
export const dynamic = "force-dynamic";

const dropZoneInputSchema = z.object({
  imageName: z.string(),
  imageType: z.string(),
  imageSize: z.number(),
  value: z.string(),
  userId: z.string(),
  orgId: z.string(),
  chatId: z.any(),
  id: z.string(),
  imageFile: z.any(),
  messages: z.any(),
  chattype: chattype,
});

export async function POST(request: Request, response: NextApiResponse) {
  const formData = await request.formData();
  const zodMessageString: any = formData.get("zodMessage");
  const file: any = formData.get("file");
  const zodMessageObject = JSON.parse(zodMessageString);

  const zodMessage = dropZoneInputSchema.parse({
    imageName: zodMessageObject.data.imageName,
    imageType: zodMessageObject.data.imageType,
    imageSize: zodMessageObject.data.imageSize,
    value: zodMessageObject.data.value,
    userId: zodMessageObject.data.userId,
    orgId: zodMessageObject.data.orgId,
    chatId: zodMessageObject.data.chatId,
    id: zodMessageObject.data.id,
    imageFile: file,
    messages: zodMessageObject.data.message as Message[],
    chattype: zodMessageObject.data.chattype,
  });

  // console.log("zodMessage:", zodMessage);
  const {
    imageName,
    imageType,
    imageSize,
    value,
    userId,
    orgId,
    chatId,
    id,
    messages,
    imageFile,
    chattype,
  } = zodMessage;
  const { orgSlug } = await auth();

  const _message = messages as unknown as Message[];
  console.log("_message", _message);
  const updatedMessageArray = [..._message]; // Create a copy of the original array

  const url = request.url;
  const urlArray = url.split("/");

  if (!formData || !formData.has("file")) {
    return NextResponse.json(
      { result: "no data received", success: false },
      { status: 400 },
    );
  }
  console.log("imageFile", imageFile);
  const parts = imageFile.name.split(".");
  const extension = parts[parts.length - 1];
  let awsImageUrl = "";
  const initialMessages = messages.slice(0, -1);
  // console.log("intialmessages", initialMessages)
  const msg: any = jsonToLangchain(
    initialMessages,
    chattype === "ella" ? ellaPrompt : systemPrompt,
  );
  const chat = new ChatOpenAI({
    modelName: "gpt-4-vision-preview",
    maxTokens: 1024,
    streaming: true,
    openAIApiKey: env.OPEN_AI_API_KEY,
  });
  if (file && zodMessage && msg) {
    const blob = file as Blob;
    const buffer = Buffer.from(await blob.arrayBuffer());
    const imageBase64 = buffer.toString("base64");
    const { stream, handlers } = LangChainStream({
      onStart: async () => {
        console.log("On start");
        const saveDroppedImag = await saveDroppedImage({
          imageId: id,
          buffer: buffer,
          chatId: chatId,
          imageExtension: extension,
          imageName: file.name,
        });
        awsImageUrl = saveDroppedImag;
        const imageMessage = {
          id: id,
          role: "user",
          subRole: "input-image",
          content: awsImageUrl,
        } as Message;
        const lastIndex = updatedMessageArray.length - 1;
        updatedMessageArray.splice(lastIndex, 0, imageMessage);
        // console.log("Updated Message Array:", updatedMessageArray);
      },
      onToken: async (fullResponse: string) => {
        console.log("onToken", fullResponse);
      },
      onCompletion: async (fullResponse: string) => {
        console.log("onCompletion", fullResponse);
        const latestReponse = {
          id: id,
          role: "assistant" as const,
          content: fullResponse,
          createdAt: new Date(),
          audio: "",
        };
        const db = await saveToDB({
          _chat: updatedMessageArray,
          chatId: chatId,
          orgSlug: orgSlug as string,
          latestResponse: latestReponse,
          userId: userId,
          orgId: orgId,
          urlArray: urlArray,
        });
        console.log("dbResponce", db);
      },
    });
    const message = new HumanMessage({
      content: [
        {
          type: "text",
          text: value,
        },
        {
          type: "image_url",
          image_url: `data:image/png;base64,${imageBase64}`,
        },
      ],
    });
    // const anthropic = new ChatAnthropic({
    //   anthropicApiKey: env.ANTHROPIC_API_KEY,
    //   streaming: true,
    //   modelName: "claude-3-sonnet-20240229",
    //   callbacks: [handlers]
    // });
    // const str = anthropic.call([...msg, message], {}, [handlers])
    const str = chat
      .call([...msg, message], {}, [handlers])
      .catch(console.error);
    const STR = new StreamingTextResponse(stream);
    if (STR) {
      return new StreamingTextResponse(stream);
    }
  } else {
    return NextResponse.json(
      { result: "Invalid file data", success: false },
      { status: 400 },
    );
  }
}
