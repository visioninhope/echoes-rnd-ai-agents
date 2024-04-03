import {
  TLFrameShape,
  TLShapeId,
  TLSvgOptions,
  PngHelpers,
} from "@tldraw/editor";
import { clampToBrowserMaxCanvasSize } from "./getBrowserCanvasMaxSize";
import { Editor } from "@tldraw/tldraw";

/** @public */
export type TLExportType = "svg" | "png" | "jpeg" | "webp" | "json";

/**
 * Export the given shapes as files.
 *
 * @param editor - The editor instance.
 * @param ids - The ids of the shapes to export.
 * @param format - The format to export as.
 * @param name - Name of the exported file. If undefined a predefined name, based on the selection, will be used.
 * @param opts - Options for the export.
 *
 * @public
 */
export async function exportAs(
  editor: Editor,
  ids: TLShapeId[],
  format: TLExportType = "png",
  name: string | undefined,
  // opts = {} as Partial<TLSvgOptions>
) {
  // If we don't get name then use a predefined one
  if (!name) {
    name = `shapes at ${getTimestamp()}`;
    if (ids.length === 1) {
      const first = editor.getShape(ids[0])!;
      if (editor.isShapeOfType<TLFrameShape>(first, "frame")) {
        name = first.props.name ?? "frame";
      } else {
        name = `${first.id.replace(/:/, "_")} at ${getTimestamp()}`;
      }
    }
  }
  name += `.${format}`;

  const blob = await exportToBlob({ editor, ids, format });
  const file = new File([blob], name, { type: blob.type });
  downloadFile(file);
}

function getTimestamp() {
  const now = new Date();

  const year = String(now.getFullYear()).slice(2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}.${minutes}.${seconds}`;
}

function downloadFile(file: File) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(file);
  console.log("logURL", url);
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
}

export async function getSvgAsImage(
  svgString: string,
  isSafari: boolean,
  options: {
    type: "png" | "jpeg" | "webp";
    quality: number;
    scale: number;
    width: number;
    height: number;
  },
) {
  const { type, quality, scale, width, height } = options;

  let [clampedWidth, clampedHeight] = await clampToBrowserMaxCanvasSize(
    width * scale,
    height * scale,
  );
  clampedWidth = Math.floor(clampedWidth);
  clampedHeight = Math.floor(clampedHeight);
  const effectiveScale = clampedWidth / width;

  const svgUrl = URL.createObjectURL(
    new Blob([svgString], { type: "image/svg+xml" }),
  );

  const canvas = await new Promise<HTMLCanvasElement | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = async () => {
      // safari will fire `onLoad` before the fonts in the SVG are
      // actually loaded. just waiting around a while is brittle, but
      // there doesn't seem to be any better solution for now :( see
      // https://bugs.webkit.org/show_bug.cgi?id=219770
      if (isSafari) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      const canvas = document.createElement("canvas") as HTMLCanvasElement;
      const ctx = canvas.getContext("2d")!;

      canvas.width = clampedWidth;
      canvas.height = clampedHeight;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0, clampedWidth, clampedHeight);

      URL.revokeObjectURL(svgUrl);

      resolve(canvas);
    };

    image.onerror = () => {
      resolve(null);
    };

    image.src = svgUrl;
  });

  if (!canvas) return null;

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(
      (blob) => {
        // if (!blob || debugFlags.throwToBlob.get()) {
        // 	resolve(null)
        // }
        resolve(blob);
      },
      "image/" + type,
      quality,
    ),
  );

  if (!blob) return null;

  if (type === "png") {
    const view = new DataView(await blob.arrayBuffer());
    return PngHelpers.setPhysChunk(view, effectiveScale, {
      type: "image/" + type,
    });
  } else {
    return blob;
  }
}

// async function getSvgString(editor: Editor, ids: TLShapeId[], opts: Partial<TLSvgOptions>) {
// 	const svg = await editor.getSvgString(ids?.length ? ids : [...editor.getCurrentPageShapeIds()], {
// 		scale: 1,
// 		background: editor.getInstanceState().exportBackground,
// 		...opts,
// 	})
// 	if (!svg) {
// 		throw new Error('Could not construct SVG.')
// 	}
// 	return svg
// }

export async function exportToString(
  editor: Editor,
  ids: TLShapeId[],
  format: "svg" | "json" | "png",
  // opts = {} as Partial<TLSvgOptions>
) {
  switch (format) {
    // case 'svg': {
    // 	return (await getSvgString(editor, ids, opts))?.svg
    // }
    case "json": {
      const data = editor.getContentFromCurrentPage(ids);
      const json: any = JSON.stringify(data);
      return json;
    }
    case "png": {
      const data = editor.getContentFromCurrentPage(ids);
      const json: any = JSON.stringify(data);
      return json;
    }
    // default: {
    // 	exhaustiveSwitchError(format)
    // }
  }
}

/**
 * Export the given shapes as a blob.
 * @param editor - The editor instance.
 * @param ids - The ids of the shapes to export.
 * @param format - The format to export as.
 * @param opts - Rendering options.
 * @returns A promise that resolves to a blob.
 * @public
 */
export async function exportToBlob({
  editor,
  ids,
  format,
  opts = {} as Partial<TLSvgOptions>,
}: {
  editor: Editor;
  ids: TLShapeId[];
  format: "svg" | "png" | "jpeg" | "webp" | "json";
  opts?: Partial<TLSvgOptions>;
}): Promise<any> {
  switch (format) {
    // case 'svg':
    // 	return new Blob([await exportToString(editor, ids, 'svg', opts)], { type: 'text/plain' })
    case "json":
      return new Blob([await exportToString(editor, ids, "json")], {
        type: "text/plain",
      });
    case "jpeg":
      return new Blob([await exportToString(editor, ids, "json")], {
        type: "text/plain",
      });

    case "png":
      return new Blob([await exportToString(editor, ids, "json")], {
        type: "text/plain",
      });

    // case 'webp': {
    // 	const svgResult = await getSvgString(editor, ids, opts)
    // 	if (!svgResult) throw new Error('Could not construct image.')
    // 	const image = await getSvgAsImage(svgResult.svg, editor.environment.isSafari, {
    // 		type: format,
    // 		quality: 1,
    // 		scale: 2,
    // 		width: svgResult.width,
    // 		height: svgResult.height,
    // 	})
    // 	if (!image) {
    // 		throw new Error('Could not construct image.')
    // 	}
    // 	return image
    // }
    default: {
      return null;
    }
  }
}

const mimeTypeByFormat = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  json: "text/plain",
  svg: "text/plain",
};

export function exportToBlobPromise(
  editor: Editor,
  ids: TLShapeId[],
  format: "svg" | "png" | "jpeg" | "webp" | "json",
  opts = {} as Partial<TLSvgOptions>,
): { blobPromise: Promise<Blob>; mimeType: string } {
  return {
    blobPromise: exportToBlob({ editor, ids, format, opts }),
    mimeType: mimeTypeByFormat[format],
  };
}
