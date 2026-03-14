import { AbsoluteFill } from "remotion";
import type { DeepSlide, VideoItem } from "../types";
import { COLORS, FONTS } from "../types";
import { SpringIn, KenBurnsImage } from "../utils";

export const SourceCardSlide: React.FC<{
  slide: DeepSlide;
  item: VideoItem;
  slideDuration: number;
}> = ({ slide, item, slideDuration }) => {
  const imageSource = slide.image || item.images[0] || null;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.lightBlue,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      <SpringIn style={{ width: "100%", maxWidth: 1080 }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            border: `1px solid ${COLORS.lightGray}`,
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          }}
        >
          {imageSource && (
            <div style={{ width: "100%", height: 340, overflow: "hidden" }}>
              <KenBurnsImage
                src={imageSource}
                slideDuration={slideDuration}
                style={{ borderRadius: 0 }}
              />
            </div>
          )}
          <div style={{ padding: "36px 44px 44px" }}>
            <SpringIn delay={8}>
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 18,
                  color: COLORS.midGray,
                  marginBottom: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {item.source}
              </div>
            </SpringIn>
            <SpringIn delay={12}>
              <div
                style={{
                  fontFamily: FONTS.serif,
                  fontSize: 34,
                  color: COLORS.inkBlue,
                  lineHeight: 1.4,
                  fontWeight: "bold",
                  marginBottom: 16,
                }}
              >
                {slide.text}
              </div>
            </SpringIn>
            {slide.subText && (
              <SpringIn delay={18}>
                <div
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 22,
                    color: COLORS.charcoal,
                    lineHeight: 1.6,
                  }}
                >
                  {slide.subText}
                </div>
              </SpringIn>
            )}
            {item.score != null && (
              <SpringIn delay={22}>
                <div
                  style={{
                    marginTop: 24,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: COLORS.amberBg,
                    border: `1px solid ${COLORS.amber}`,
                    borderRadius: 20,
                    padding: "6px 18px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 18,
                      color: COLORS.amber,
                      fontWeight: "bold",
                    }}
                  >
                    评分 {item.score}
                  </div>
                </div>
              </SpringIn>
            )}
          </div>
        </div>
      </SpringIn>
    </AbsoluteFill>
  );
};
