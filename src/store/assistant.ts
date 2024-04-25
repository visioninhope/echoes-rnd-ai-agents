import { create } from "zustand";
import { persist } from "zustand/middleware";

type AssistantState = {
  assistantId: string;
  threadId: string; // New state
  setAssistantId: (id: string) => void;
  setThreadId: (id: string) => void; // New setter function
};

export const useAssistantState = create<AssistantState>()(
  persist(
    (set, get) => ({
      assistantId: "",
      threadId: "", // Initialize to an empty string
      setAssistantId: (id: string) => {
        set({ assistantId: id });
      },
      setThreadId: (id: string) => {
        set({ threadId: id });
      },
    }),
    {
      name: "assistant-state",
    },
  ),
);
