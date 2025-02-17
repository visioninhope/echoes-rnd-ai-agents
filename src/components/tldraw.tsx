import { useQuery } from "@tanstack/react-query";
import {
  Tldraw,
  createTLStore,
  defaultShapeUtils,
  useEditor,
  exportToBlob,
  Editor,
  TLShapeId,
} from "tldraw";
import "tldraw/tldraw.css";
import { Message } from "ai";
import axios from "axios";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Save, UploadCloud } from "lucide-react";
import { useImageState } from "@/store/tlDrawImage";
const PERSISTENCE_KEY = "example-3";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PersistenceExampleProps {
  initialData?: any;
  org_id: string;
  org_slug: string;
  username: string;
  chatId: string;
  uid: string;
  dbChat: Message[];
}

export default function PersistenceExample(props: PersistenceExampleProps) {
  const [editor, setEditor] = useState<any>();
  const {
    settldrawImageUrl,
    setTlDrawImage,
    setOnClickOpenChatSheet,
    tlDrawImage,
  } = useImageState();
  const [store] = useState(() =>
    createTLStore({ shapeUtils: defaultShapeUtils }),
  );
  const tlDrawFetcher = async () => {
    const res = await axios.get(`/api/chats/${props.chatId}`);
    const chats = res.data.chats.tldraw_snapshot as Message[];
    // return chats as Message[];
    return chats ? chats[0].content : null;
  };

  const { data, isLoading, isError, error } = useQuery(
    ["tldraw", props.chatId],
    tlDrawFetcher,
    {
      initialData: props.dbChat.length && props.dbChat[0].content,
      refetchOnWindowFocus: false,
      refetchInterval: Infinity,
      onSuccess: (data) => {
        // console.log("data", data);
        if (data) {
          store.loadSnapshot(JSON.parse(data));
        }
      },
    },
  );
  const [timer, setTimer] = useState(0);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (isLoading) {
    return (
      <div className="tldraw__editor">
        <h2>Loading...</h2>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="tldraw__editor">
        <h2>Error!</h2>
        <p>{error as string}</p>
      </div>
    );
  }

  const save = async (
    content: string,
    saving: Dispatch<SetStateAction<boolean>>,
  ) => {
    setTimer(0);
    saving(true);
    const res = await axios.post(`/api/tldraw/${props.chatId}`, {
      content: content,
      name: `${props.username},${props.uid}`,
    });
    setTimer(0);
    saving(false);
  };

  const handleSave = async () => {
    const snapshot = JSON.stringify(store.getSnapshot());
    await save(snapshot, setIsSaving);
  };
  const handleExport = async () => {
    setOnClickOpenChatSheet(true);
    const parsedSnapshot = JSON.parse(JSON.stringify(store.getSnapshot()));
    const ids: TLShapeId[] = [];
    console.log("ids", ids);
    for (const key in parsedSnapshot.store) {
      if (key.startsWith("shape:")) {
        ids.push(parsedSnapshot.store[key].id);
      }
    }
    const format: any = "png";
    const exportToBlo = exportToBlob({ editor, format, ids });
    exportToBlo.then((res) => {
      const fileType = "image/png"; // Example file type, adjust as needed
      const filename = `tldraw-${Date.now()}.png`;
      const file = new File([res], filename, { type: fileType });
      const fileArray = [file];
      setTlDrawImage(fileArray);
      // Array containing the File object
      settldrawImageUrl(URL.createObjectURL(file));
    });
  };

  return (
    <div className=" relative tldraw__editor tl-theme__dark h-full w-full">
      <Tldraw className="tl-theme__dark z-10" inferDarkMode store={store}>
        <InsideOfEditorContext
          setEditor={setEditor}
          timer={timer}
          setTimer={setTimer}
          isAutoSaving={isAutoSaving}
          setIsAutoSaving={setIsAutoSaving}
          isSaving={isSaving}
          save={save}
        />
      </Tldraw>

      <Tabs className="absolute top-0 right-0 sm:right-[45%] z-50 sm:translate-x-[50%] sm:top-0">
        <TabsList>
          <TabsTrigger
            onClick={() => handleSave()}
            value="org"
            className="flex gap-2 items-center"
          >
            <Save className="sm:hidden h-4 w-4" />
            <span className="hidden sm:inline">
              {isAutoSaving ? "auto saving" : isSaving ? "saving" : "save"}
            </span>
          </TabsTrigger>
          <TabsTrigger
            onClick={() => handleExport()}
            value="me"
            className="flex gap-2 items-center"
          >
            <UploadCloud className="sm:hidden h-4 w-4" />
            <span className="hidden sm:inline">
              {tlDrawImage ? "added to chat" : "add to chat"}
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

const InsideOfEditorContext = ({
  timer,
  setTimer,
  isAutoSaving,
  setIsAutoSaving,
  isSaving,
  save,
  setEditor,
}: {
  timer: number;
  setTimer: Dispatch<SetStateAction<number>>;
  isAutoSaving: boolean;
  setIsAutoSaving: Dispatch<SetStateAction<boolean>>;
  isSaving: boolean;
  save: (
    content: string,
    saving: Dispatch<SetStateAction<boolean>>,
  ) => Promise<void>;
  setEditor: Dispatch<SetStateAction<Editor>>;
}) => {
  useEffect(() => {
    if (timer >= 15) {
      return;
    }
    const interval = setInterval(() => {
      if (timer < 15) {
        console.log("interval", timer);
        setTimer((timer) => timer + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const editor = useEditor();

  useEffect(() => {
    setEditor(editor);
    const listener = editor.store.listen((snapshot) => {
      // after every 15 secs, save the snapshot
      if (timer === 15 && !isAutoSaving && !isSaving) {
        const snapshot = JSON.stringify(editor.store.getSnapshot());
        save(snapshot, setIsAutoSaving);
      }
    });
    return () => listener();
  }, [timer]);

  return null;
};
