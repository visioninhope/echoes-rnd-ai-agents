import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ChatCardWrapper from "./chatcardwrapper";
import { Chat as ChatSchema } from "@/lib/db/schema";
import { AlignLeftIcon } from "lucide-react";

type Props = {
  org_id: string;
  org_slug: string;
  uid: string;
  initialData: ChatSchema[];
};

export default function ChatSidebar({
  org_id,
  org_slug,
  uid,
  initialData,
}: Props) {
  console.log("from chatsidebar", org_id, org_slug, uid, initialData);
  return (
    <Sheet>
      <SheetTrigger>
        <AlignLeftIcon className="text-gray-500" size={32} />
      </SheetTrigger>
      <SheetContent side={"left"}>
        <SheetHeader>
          <SheetTitle>Org Chats</SheetTitle>
        </SheetHeader>
        <div className="h-[calc(100dvh-100px)] overflow-y-auto scrollbar-hide">
          <ChatCardWrapper
            org_id={org_id}
            org_slug={org_slug}
            uid={uid}
            initialData={initialData}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
