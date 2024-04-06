import { create } from "zustand";
import { persist } from "zustand/middleware";

type ImageState = {
  tldrawImageUrl: string;
  tlDrawImage: any; // New state
  settldrawImageUrl: (image: string) => void;
  setTlDrawImage: (image: any) => void; // New setter function
  onClickOpenChatSheet: boolean;
  setOnClickOpenChatSheet: (value: boolean) => void;
};

export const useImageState = create<ImageState>()(
  persist(
    (set, get) => ({
      tldrawImageUrl: "",
      onClickOpenChatSheet: false,
      tlDrawImage: "", // Initialize to empty string
      settldrawImageUrl: (image: string) => {
        set({ tldrawImageUrl: image });
      },
      setTlDrawImage: (image: any) => {
        set({ tlDrawImage: image });
      },
      setOnClickOpenChatSheet: (value: boolean) => {
        set({ onClickOpenChatSheet: value });
      },
    }),
    {
      name: "image-state",
    },
  ),
);
