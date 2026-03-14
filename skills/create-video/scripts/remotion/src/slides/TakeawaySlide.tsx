import { AbsoluteFill } from "remotion";
import type { DeepSlide, VideoItem } from "../types";
import { COLORS, FONTS } from "../types";
import { SpringIn, KenBurnsImage } from "../utils";

export const TakeawaySlide: React.FC<{
  slide: DeepSlide;
  item: VideoItem;
  slideDuration: number;
}> = ({ slide, item, slideDuration }) => {
  const imageSource = slide.image || item.images[0] || null;

  if (!imageSource) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.cream,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 120,
        }}
      >
        <SpringIn>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 20,
              color: COLORS.amber,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            核心要点
          </div>
        </SpringIn>
        <SpringIn delay={8}>
          <div
            style={{
              fontFamily: FONTS.serif,
              fontSize: 40,
              color: COLORS.inkBlue,
              lineHeight: 1.55,
              textAlign: "center",
              maxWidth: 1100,
              fontWeight: "bold",
            }}
          >
            {slide.text}
          </div>
        </SpringIn>
        {slide.subText && (
          <SpringIn delay={16}>
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
      <AbsoluteFill style={{ backgroundColor: "rgba(26,54,93,0.72)" }} />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 120,
        }}
      >
        <SpringIn>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 20,
              color: COLORS.amber,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            核心要点
          </div>
        </SpringIn>
        <SpringIn delay={8}>
          <div
            style={{
              fontFamily: FONTS.serif,
              fontSize: 42,
              color: "#ffffff",
              lineHeight: 1.55,
              textAlign: "center",
              maxWidth: 1100,
              fontWeight: "bold",
            }}
          >
            {slide.text}
          </div>
        </SpringIn>
        {slide.subText && (
          <SpringIn delay={16}>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 22,
                color: "rgba(255,255,255,0.75)",
                marginTop: 24,
                textAlign: "center",
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
