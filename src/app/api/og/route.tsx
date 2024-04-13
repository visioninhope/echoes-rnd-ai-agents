import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // ?title=<title>
        const hasTitle = searchParams.has('title');
        const title = hasTitle
            ? searchParams.get('title')?.slice(0, 100)
            : 'My default title';
        return new ImageResponse(
            (<div>{title}</div>)
        )

    } catch (e) {
        return new Response("Failed to generate the image", {
            status: 500
        });
    }
}
