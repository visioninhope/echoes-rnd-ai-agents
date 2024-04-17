import { ImageResponse } from "next/og";
import logo from "@/assets/logo.png";
// App router includes @vercel/og.
// No need to install it.

export const runtime = "edge";

// Gradient Square Component
function GradientSquare() {
  return (
    <div
      style={{
        width: "60px",
        height: "60px",
        background:
          "linear-gradient(180deg, rgba(0,128,0,1) 0%, rgba(0,255,0,1) 100%)",
        marginBottom: "20px",
      }}
    ></div>
  );
}

function Circle() {
  return (
    <div
      style={{
        width: "85px",
        height: "85px",
        backgroundColor: "green",
        borderRadius: "50%",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "20px",
      }}
    >
      IK
    </div>
  );
}

export async function GET(request: Request) {
  try {
    let title: string | null = "";
    try {
      const urlParams = new URLSearchParams(request.url.split("?")[1]);
      title = urlParams.get("title");
      console.log("title", title);
    } catch (error) {
      console.error("Error parsing URL:", error);
    }
    // const urlParams = new URLSearchParams(request.url.split("?")[1]); // Splitting URL to get query params
    // const title = urlParams.get("title");
    // console.log("title", title);

    // const { searchParams } = new URL(request.url);
    // console.log("searchParams", searchParams);
    // const hasTitle = searchParams.has("title");
    // const title01 = hasTitle
    //   ? searchParams.get("title")?.slice(0, 100)
    //   : "My default title";

    return new ImageResponse(
      (
        <div tw="bg-black bg-cover h-screen w-full flex flex-col  justify-center p-20">
          <div tw="flex flex-col gap-8">
            <h1 tw="text-white mb-2 text-3xl font-serif  font-extrabold w-[42vw]">
              {title
                ? title
                : " The Dual Role of Tween 80 in Biofilm Formation"}
            </h1>
            <h2 tw="text-gray-500 font-normal font-sans text-2xl">
              Inhibition and Enhancement
            </h2>
          </div>
          <div tw="flex justify-between mt-[100px]">
            <span>
              <Circle />
            </span>
            <span>
              <img
                width="85"
                height="85"
                src={`https://www.echoes.team${logo.src}`}
              />
              {/* <GradientSquare /> */}
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
