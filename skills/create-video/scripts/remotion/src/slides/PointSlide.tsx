import { AbsoluteFill } from "remotion";
import type { DeepSlide, VideoItem } from "../types";
import { COLORS, FONTS } from "../types";
import { SpringIn, KenBurnsImage } from "../utils";

export const PointSlide: React.FC<{
  slide: DeepSlide;
  item: VideoItem;
  slideDuration: number;
}> = ({ slide, item, slideDuration }) => {
  const imageSource = slide.image || null;

  if (!imageSource) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.cream,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 120,
        }}
      >
        <SpringIn style={{ width: "100%", maxWidth: 1100 }}>
          <div
            style={{
              borderLeft: `4px solid ${COLORS.amber}`,
              paddingLeft: 40,
            }}
          >
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 36,
                color: COLORS.charcoal,
                lineHeight: 1.6,
              }}
            >
              {slide.text}
            </div>
            {slide.subText && (
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 22,
                  color: COLORS.midGray,
                  marginTop: 20,
                }}
              >
                {slide.subText}
              </div>
            )}
          </div>
        </SpringIn>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream, display: "flex" }}>
      <div style={{ width: "60%", height: "100%", overflow: "hidden" }}>
        <KenBurnsImage src={imageSource} slideDuration={slideDuration} />
      </div>
      <div
        style={{
          width: "40%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 56px 60px 48px",
        }}
      >
        <SpringIn>
          <div
            style={{
              width: 40,
              height: 3,
              backgroundColor: COLORS.amber,
              borderRadius: 2,
              marginBottom: 28,
            }}
          />
        </SpringIn>
        <SpringIn delay={6}>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 30,
              color: COLORS.charcoal,
              lineHeight: 1.6,
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
                fontSize: 20,
                color: COLORS.midGray,
                marginTop: 20,
              }}
            >
              {slide.subText}
            </div>
          </SpringIn>
        )}
      </div>
    </AbsoluteFill>
  );
};
