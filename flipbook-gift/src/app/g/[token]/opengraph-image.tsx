import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "A wrapped digital gift from NatraGift";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff0df",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 560,
            height: 420,
            borderRadius: 24,
            background: "linear-gradient(145deg, #4caf50 0%, #2f8f2f 100%)",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 32px 60px rgba(40, 70, 30, 0.28)",
            transform: "translateY(35px)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -20,
              left: -12,
              width: 584,
              height: 125,
              borderRadius: 22,
              background: "linear-gradient(180deg, #59bd59 0%, #43a943 100%)",
              boxShadow: "0 10px 18px rgba(30, 70, 25, 0.18)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -110,
              left: 232,
              width: 100,
              height: 610,
              background: "#ff3038",
              transform: "rotate(0deg)",
              boxShadow: "0 0 12px rgba(150, 20, 20, 0.12)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 58,
              left: -12,
              width: 584,
              height: 100,
              background: "#ff3038",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -102,
              left: 190,
              width: 150,
              height: 105,
              border: "30px solid #ff3038",
              borderBottom: "0",
              borderRadius: "90px 90px 0 0",
              transform: "rotate(-18deg)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -102,
              left: 275,
              width: 150,
              height: 105,
              border: "30px solid #ff3038",
              borderBottom: "0",
              borderRadius: "90px 90px 0 0",
              transform: "rotate(18deg)",
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
