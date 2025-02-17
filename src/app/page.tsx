"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Button, buttonVariants } from "@/components/button";
import Link from "next/link";
import { Widget } from "@typeform/embed-react";
import Image from "next/image";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Key, LayoutDashboard } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import InputBar from "@/components/inputBar2";
import { ChatType } from "@/lib/types";
import { parseAsString, useQueryState } from "next-usequerystate";
import ChatCardWrapper from "@/components/chatcardwrapper";
import { OrgChatToggler } from "@/components/chatSidebar";
import AudioPlayer from "@/components/audioplayer";
import Search from "@/components/search";
import { SearchButton } from "./dashboard/layout";
import useSearchDialogState from "@/store/searchDialogStore";

const handleSmoothScroll = (): void => {
  if (typeof window !== "undefined") {
    const hashId = window.location.hash;

    console.log({ location: window.location, hashId });

    if (hashId) {
      const element = document.querySelector(hashId);
      console.log({ element });

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      }
    }
  }
};

const footerAnimationStates = {
  visible: { opacity: 1, y: 0, transition: { duration: 1 } },
  hidden: { opacity: 0, y: -50 },
};

export default function Home() {
  const [input, setInput] = useState("");
  const router = useRouter();
  const controls = useAnimation();
  const [ref, inView] = useInView();
  useEffect(() => {
    if (inView) {
      controls.start("visible");
    } else {
      controls.start("hidden");
    }
  }, [controls, inView]);
  const [chatType, setChattype] = useQueryState(
    "model",
    parseAsString.withDefault("chat"),
  );
  const [imageUrl, setImageUrl] = useQueryState(
    "imageUrl",
    parseAsString.withDefault(""),
  );
  const [imageName, setImageName] = useQueryState(
    "imageName",
    parseAsString.withDefault(""),
  );
  const [imageType, setImageType] = useQueryState(
    "imageType",
    parseAsString.withDefault(""),
  );
  const [imageSize, setImageSize] = useQueryState(
    "imageSize",
    parseAsString.withDefault(""),
  );
  const [imageExtension, setImageExtension] = useQueryState(
    "imageExtension",
    parseAsString.withDefault(""),
  );
  const [dropzoneActive, setDropzoneActive] = useState<boolean>(false);

  const { isSignedIn, orgId, orgSlug, userId } = useAuth();
  // if (isSignedIn) {
  //   redirect("/dashboard/user");
  // }

  const handleInputChange = (e: any) => {
    setInput(e.target.value);
    navigator.clipboard.writeText(e.target.value);
  };

  const handleSubmit = async () => {
    if (input.trim() === "") return;

    try {
      const res = await fetch(`/api/generateNewChatId/${orgId}`, {
        method: "POST",
        body:
          chatType === "storm"
            ? JSON.stringify({ type: chatType || "chat", title: input })
            : JSON.stringify({ type: chatType || "chat" }),
      });
      const data = await res.json();

      if (dropzoneActive) {
        const queryParams = new URLSearchParams(window.location.search);
        const params: { [key: string]: string } = {};
        queryParams.forEach((value, key) => {
          params[key] = value;
        });
        const params2 = {
          ...params,
          new: "true",
          clipboard: "true",
          model: chatType,
          input: input,
        };
        const queryParamsString = new URLSearchParams(params2).toString();

        router.push(`/dashboard/chat/${data.newChatId}?${queryParamsString}`);
      } else {
        router.push(
          `/dashboard/chat/${data.newChatId}?new=true&clipboard=true&model=${chatType}&input=${input}`,
        );
      }
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };
  const { showSearchDialog, toggleSearchDialog } = useSearchDialogState();

  return (
    <div>
      <AnimatePresence onExitComplete={handleSmoothScroll}>
        <div className="h-screen relative">
          <Header className="bg-background/10 backdrop-blur-sm">
            <Button
              className="mr-4 h-[32px]"
              variant="secondary"
              asChild
            ></Button>
            {isSignedIn ? (
              <>
                <AudioPlayer />
                <SearchButton onClick={toggleSearchDialog}>
                  <span className="hidden sm:inline">Search</span>
                </SearchButton>
                <Search orgSlug={orgSlug as string} />
              </>
            ) : null}
          </Header>
          <div className="absolute top-0 w-full y-0 flex flex-col flex-grow h-screen justify-center items-center gap-2 text-center">
            <div className="absolute inset-0 -z-5">
              <Image
                src="/isometric.png"
                alt="image of echoes being used"
                className="w-full h-full object-cover dark:mix-blend-soft-light opacity-30 brightness-125"
                fill={true}
                quality={5}
              />
            </div>
            <div className="z-10 flex flex-col items-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Hello Innovator,
              </h1>
              <h1 className="text-2xl text-popover-foreground flex-wrap w-72 text-center">
                Let's hyper-accelerate your research.
              </h1>
              <div className="grid md:grid-col-2 gap-4 sm:grid-col-1 p-4">
                {isSignedIn && orgId && orgSlug ? (
                  <div className="w-full md:min-w-[400px] lg:min-w-[600px] xl:min-w-[800px] ">
                    <InputBar
                      imageExtension={imageExtension}
                      setImageExtension={setImageExtension}
                      dropzoneActive={dropzoneActive}
                      setDropzoneActive={setDropzoneActive}
                      imageUrl={imageUrl}
                      setImageUrl={setImageUrl}
                      imageName={imageName}
                      setImageName={setImageName}
                      imageType={imageType}
                      setImageType={setImageType}
                      imageSize={imageSize}
                      setImageSize={setImageSize}
                      isHome={true}
                      value={input}
                      onChange={handleInputChange}
                      setInput={setInput}
                      submitInput={handleSubmit}
                      orgId={orgId as string}
                      chattype={chatType as ChatType}
                      setChattype={
                        setChattype as Dispatch<SetStateAction<ChatType>>
                      }
                    />
                    <div className="flex flex-col gap-y-4">
                      <OrgChatToggler orgId={orgId} orgSlug={orgSlug} />
                      <div className="w-full md:w-[400px] lg:w-[600px] xl:w-[800px] h-[500px] overflow-y-scroll scrollbar-hide self-center">
                        <ChatCardWrapper
                          isHome={true}
                          org_id={orgId}
                          org_slug={orgSlug!}
                          uid={userId}
                          initialData={[]}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/dashboard"
                    className={buttonVariants({ variant: "default" })}
                  >
                    <LayoutDashboard className="mr-2 w-4 h-4" />
                    Dashboard
                  </Link>
                )}
                {isSignedIn || (
                  <Link
                    className={buttonVariants({ variant: "secondary" })}
                    href="/#requestaccess"
                  >
                    <Key className="mr-2 w-4 h-4" />
                    Request Access
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </AnimatePresence>

      {isSignedIn || (
        <AnimatePresence onExitComplete={handleSmoothScroll}>
          <div
            className="h-screen flex flex-col justify-center items-center bg-gradient-to-b dark:from-slate-950 dark:via-black dark:to-black -z-20 from-zinc-50 via-zinc-200 to-zinc-200"
            id="requestaccess"
          >
            <Widget id="H4H0D2hi" className="w-min-72 w-3/4 h-3/4 -z-2" />
          </div>
        </AnimatePresence>
      )}

      <div className="md:p-20 p-12 dark:bg-slate-950 bg-zinc-100 border border-t-1 dark:border-slate-900 border-zinc-200">
        <motion.div
          ref={ref}
          animate={controls}
          initial="hidden"
          variants={footerAnimationStates}
          className="grid md:grid-cols-3 sm:grid-cols-1 gap-4 sm:gap-8"
        >
          <div className="p-4 flex flex-col space-y-4">
            <h1 className="font-bold mb-4">Trusted By Innovators</h1>
            <Link
              href="https://technoculture.io"
              className="text-sm text-popover-foreground"
            >
              Technoculture, Inc.
            </Link>
            <Link
              href="https://exrna.com"
              className="text-sm text-popover-foreground"
            >
              ExRNA Therapeutics
            </Link>
            <Link
              href="https://vvbiotech.com"
              className="text-sm text-popover-foreground"
            >
              VV Biotech
            </Link>
          </div>

          <div className="p-4 flex flex-col space-y-4">
            <h1 className="font-bold mb-4">Built With</h1>
            <Link
              href="https://openai.com/"
              className="text-sm text-popover-foreground"
            >
              OpenAI
            </Link>
            <Link
              href="https://anyscale.com/"
              className="text-sm text-popover-foreground"
            >
              Anyscale
            </Link>
            <Link
              href="https://search.projectpq.ai/"
              className="text-sm text-popover-foreground"
            >
              pqai
            </Link>
          </div>
          <div className="p-4 flex flex-col space-y-2">
            <h1 className="font-bold mb-4">Integrations</h1>
            <Link
              href="https://openoligo.com/"
              className="text-sm text-popover-foreground"
            >
              OpenOligo
            </Link>
          </div>
          <div className="p-4 col-span-1 md:col-span-3 justify-end">
            <hr className="mb-8 border-slate-900" />
            <div className="flex justify-between">
              <h1 className="text-sm text-popover-foreground">
                © 2023 Technoculture Research
              </h1>
              <h1 className="text-xl text-popover-foreground">🇮🇳</h1>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
