"use client";
import React, { Dispatch, SetStateAction } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdownmeu";

import { Button } from "@/components/button";
import { Cpu, Layers, PenTool, Settings } from "lucide-react";
import { ChatType } from "@/lib/types";
import { BookOpenText } from "@phosphor-icons/react";

export interface InputBarActionProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  chattype?: ChatType;
  setChatType?: Dispatch<SetStateAction<ChatType>>;
  isHome?: boolean;
}

const ModelSwitcher = React.forwardRef<HTMLButtonElement, InputBarActionProps>(
  (
    { chattype = "chat", setChatType, className, isHome = false, ...props },
    ref,
  ) => {
    const Comp =
      chattype === "advanced" ? (
        <Layers className="h-4 w-4" />
      ) : chattype === "chat" ? (
        <Cpu className="h-4 w-4" />
      ) : chattype === "tldraw" ? (
        <PenTool className="h-4 w-4" />
      ) : chattype === "storm" ? (
        <BookOpenText className="h-4 w-4" />
      ) : (
        <Settings className="h-4 w-4" />
      );

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            {...props}
            className={className}
            ref={ref}
            size="icon"
            variant="outline"
          >
            {Comp}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuRadioGroup
              value={chattype}
              onValueChange={(value) => setChatType?.(value as ChatType)}
            >
              <DropdownMenuRadioItem value="advanced">
                Advanced
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="chat">Simple</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="ella">Ella</DropdownMenuRadioItem>
              {isHome ? (
                <DropdownMenuRadioItem value="storm">
                  Article
                </DropdownMenuRadioItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuLabel inset>AIModels</DropdownMenuLabel>
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);

ModelSwitcher.displayName = "ModelSwitcher";

export default ModelSwitcher;
