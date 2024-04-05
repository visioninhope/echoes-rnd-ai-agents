import { useQuery } from "@tanstack/react-query";
import {
  Tldraw,
  createTLStore,
  defaultShapeUtils,
  useEditor,
  exportToBlob,
  Editor,
  TLShapeId,
} from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { Message } from "ai";
import axios from "axios";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Button } from "@/components/button";
import { Save } from "lucide-react";
const PERSISTENCE_KEY = "example-3";

interface PersistenceExampleProps {
  initialData?: any;
  org_id: string;
  org_slug: string;
  username: string;
  chatId: string;
  uid: string;
  dbChat: Message[];
  settldrawImage: Dispatch<any>;
  setTldrawImageUrl: Dispatch<any>;
}

export default function PersistenceExample(props: PersistenceExampleProps) {
  const [editor, setEditor] = useState<any>();
  const [url, setUrl] = useState("");
  const [store] = useState(() =>
    createTLStore({ shapeUtils: defaultShapeUtils }),
  );

  const tlDrawFetcher = async () => {
    const res = await axios.get(`/api/chats/${props.chatId}`);
    const chats = res.data.chats as Message[];
    // return chats as Message[];
    return chats.length ? chats[0].content : null;
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
    const parsedSnapshot = JSON.parse(JSON.stringify(store.getSnapshot()));
    const ids: TLShapeId[] = [];
    console.log("ids", ids);
    for (const key in parsedSnapshot.store) {
      if (key.startsWith("shape:")) {
        ids.push(parsedSnapshot.store[key].id);
      }
    }
    const format: any = "png";
    // const name: any = "TldrawImage";
    const exportToBlo = exportToBlob({ editor, format, ids });
    console.log(
      "exportToBlo",
      exportToBlo.then((res) => {
        console.log("res", res);
        const path = `tldraw-${Date.now()}.png`; // Your desired path
        const fileType = "image/png"; // Example file type, adjust as needed
        const filename = `tldraw-${Date.now()}.png`;
        const file = new File([res], filename, { type: fileType });
        setUrl(URL.createObjectURL(file));
        console.log("file", file);
        const fileArray = [file]; // Array containing the File object
        props.settldrawImage(fileArray);
        props.setTldrawImageUrl(URL.createObjectURL(file));
      }),
    );
  };

  return (
    <div className=" relative tldraw__editor tl-theme__dark h-full w-full">
      {url ? (
        <>
          <div>
            <p>Image preview For testing</p>
            <img
              onClick={() => setUrl("")}
              className="cursor-pointer"
              src={url}
              height={100}
              width={100}
            ></img>
          </div>
        </>
      ) : null}
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
      <Button
        onClick={() => handleSave()}
        variant="outline"
        className="absolute top-0 right-0 sm:right-[50%] z-50 sm:translate-x-[50%]"
      >
        <Save className="sm:hidden h-4 w-4" />
        <span className="hidden sm:inline">
          {isAutoSaving ? "auto saving" : isSaving ? "saving" : "save"}
        </span>
      </Button>
      <Button
        onClick={() => handleExport()}
        variant="outline"
        className="absolute top-0 right-0  sm:right-[43%] z-50 sm:translate-x-[50%]"
      >
        <span className="hidden sm:inline">Export</span>
      </Button>
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
  // console.log("editor", editor);
  // const exportImage = exportAs(editor, ids, format, name);
  // console.log("exportImage", exportImage)

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
