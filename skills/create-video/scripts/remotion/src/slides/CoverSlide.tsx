import { AbsoluteFill } from "remotion";
import type { DeepSlide, VideoItem } from "../types";
import { COLORS, FONTS } from "../types";
import { SpringIn, KenBurnsImage } from "../utils";

export const CoverSlide: React.FC<{
  slide: DeepSlide;
  item: VideoItem;
  slideDuration: number;
}> = ({ slide, item, slideDuration }) => {
  const imageSource = slide.image || item.images[0] || null;
  const isTop1 = item.rank === 1;

  if (!imageSource) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.cream,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
        }}
      >
        <SpringIn>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 24,
              color: isTop1 ? COLORS.amber : COLORS.inkBlue,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {String(item.rank).padStart(2, "0")}
          </div>
        </SpringIn>
        <SpringIn delay={6}>
          <div
            style={{
              fontFamily: FONTS.serif,
              fontSize: 52,
              color: COLORS.inkBlue,
              lineHeight: 1.3,
              fontWeight: "bold",
              textAlign: "center",
              maxWidth: 1200,
            }}
          >
            {slide.text}
          </div>
        </SpringIn>
        {slide.subText && (
          <SpringIn delay={14}>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 22,
                color: COLORS.midGray,
                marginTop: 24,
                textAlign: "center",
              }}
            >
              {slide.subText}
            </div>
          </SpringIn>
        )}
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      <KenBurnsImage src={imageSource} slideDuration={slideDuration} />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 72,
        }}
      >
        <SpringIn>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 20,
              color: isTop1 ? COLORS.amber : "rgba(255,255,255,0.7)",
              marginBottom: 12,
            }}
          >
            {String(item.rank).padStart(2, "0")}
          </div>
        </SpringIn>
        <SpringIn delay={6}>
          <div
            style={{
              fontFamily: FONTS.serif,
              fontSize: 48,
              color: "#ffffff",
              lineHeight: 1.3,
              fontWeight: "bold",
              maxWidth: 1100,
            }}
          >
            {slide.text}
          </div>
        </SpringIn>
        {slide.subText && (
          <SpringIn delay={14}>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 22,
                color: "rgba(255,255,255,0.75)",
                marginTop: 16,
              }}
            >
              {slide.subText}
            </div>
          </SpringIn>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
