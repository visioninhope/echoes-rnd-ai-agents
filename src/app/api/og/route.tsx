import { ImageResponse } from "next/og";

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
        width: "60px",
        height: "60px",
        backgroundColor: "blue", // Assuming a blue background for the circle
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
    const urlParams = new URLSearchParams(request.url.split("?")[1]); // Splitting URL to get query params
    const title = urlParams.get("title");
    console.log("title01", title);
    // const { searchParams } = new URL(request.url);
    // console.log("searchParams", searchParams)
    // const hasTitle = searchParams.has("title");
    // const title = hasTitle
    //   ? searchParams.get("title")?.slice(0, 100)
    //   : "My default title";

    return new ImageResponse(
      (
        // Main Design Component
        <div
          style={{
            backgroundColor: "black",
            backgroundSize: "150px 150px",
            height: "100vh",
            width: "100%",
            display: "flex",
            padding: "80px",
            flexDirection: "column",
            flexWrap: "nowrap",
          }}
        >
          <h1
            style={{
              color: "white",
              marginBottom: "2px",
              fontSize: "2.5rem",
              width: "50vw",
              fontFamily: "serif",
              fontWeight: "900",
            }}
          >
            {title ? title : " The Dual Role of Tween 80 in Biofilm Formation"}
          </h1>
          <h2
            style={{
              color: "grey",
              fontWeight: "normal",
              fontFamily: "sans-serif",
              fontSize: "2rem",
            }}
          >
            Inhibition and Enhancement
          </h2>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "30vh",
            }}
          >
            <span>
              <Circle />
            </span>
            <span>
              {/* <img
                width="40"
                height="40"
                src={"https://ik.imagekit.io/echoes/echoes_logo.png"}
                style={{
                  borderRadius: 128,
                }}
              /> */}
              <GradientSquare />
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
