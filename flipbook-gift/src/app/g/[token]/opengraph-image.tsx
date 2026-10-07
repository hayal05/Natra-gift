import { ImageResponse } from "next/og";
import { pgStore } from "../../../../server/pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "A wrapped digital gift from NatraGift";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const gift = await pgStore.byPrivateToken(token);
  const recipient = gift?.recipientName?.trim() || "you";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fff8ef 0%, #fff1df 100%)",
          fontFamily: "Arial, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 42,
            left: 58,
            fontSize: 34,
            fontWeight: 800,
            color: "#ff6900",
            letterSpacing: "-1px",
          }}
        >
          NatraGift
        </div>

        <div
          style={{
            width: 470,
            height: 310,
            borderRadius: 26,
            background: "linear-gradient(145deg, #ff6900 0%, #f45100 100%)",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 28px 55px rgba(113, 55, 15, 0.24)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 0,
              height: 0,
              borderLeft: "235px solid transparent",
              borderRight: "235px solid transparent",
              borderTop: "170px solid #ff8a38",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 62,
              height: "100%",
              background: "rgba(255,255,255,0.92)",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              width: "100%",
              height: 58,
              transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.92)",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 92,
              height: 92,
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              background: "#fff",
              border: "7px solid #ff6900",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 46,
              fontWeight: 900,
              color: "#ff6900",
            }}
          >
            ♥
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: 78,
            top: 172,
            width: 390,
            display: "flex",
            flexDirection: "column",
            color: "#2b211b",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 700, color: "#8b6b55" }}>
            A special gift for
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 58,
              lineHeight: 1.05,
              fontWeight: 850,
              letterSpacing: "-2px",
            }}
          >
            {recipient}
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 25,
              lineHeight: 1.35,
              color: "#6f5a4a",
            }}
          >
            Open your wrapped surprise ♥
          </div>
        </div>
      </div>
    ),
    size,
  );
}
