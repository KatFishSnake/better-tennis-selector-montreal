import { ImageResponse } from "next/og";

export const alt = "Better tennis booking for Montreal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "linear-gradient(135deg, #fefce8 0%, #fafafa 60%, #f5f5f4 100%)",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 28,
          color: "#525252",
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        Montréal · Loisirs
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div style={{ fontSize: 220, lineHeight: 1 }}>🎾</div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: -2,
            lineHeight: 1,
            color: "#0a0a0a",
          }}
        >
          Better tennis booking
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 500,
            color: "#737373",
            lineHeight: 1.1,
          }}
        >
          Find open courts faster than loisirs.montreal.ca
        </div>
      </div>
    </div>,
    { ...size },
  );
}
