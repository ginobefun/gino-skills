import { AbsoluteFill } from "remotion";
import type { DeepSlide } from "../types";
import { COLORS, FONTS } from "../types";
import { SpringIn } from "../utils";

export const QuoteSlide: React.FC<{ slide: DeepSlide }> = ({ slide }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.lightBlue,
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
            fontFamily: FONTS.serif,
            fontSize: 120,
            color: COLORS.amber,
            lineHeight: 0.6,
            marginBottom: 8,
            alignSelf: "flex-start",
            marginLeft: 40,
            opacity: 0.6,
          }}
        >
          &ldquo;
        </div>
      </SpringIn>
      <SpringIn delay={6}>
        <div
          style={{
            fontFamily: FONTS.serif,
            fontSize: 38,
            color: COLORS.inkBlue,
            fontStyle: "italic",
            lineHeight: 1.6,
            textAlign: "center",
            maxWidth: 1050,
          }}
        >
          {slide.text}
        </div>
      </SpringIn>
      <SpringIn delay={10}>
        <div
          style={{
            fontFamily: FONTS.serif,
            fontSize: 120,
            color: COLORS.amber,
            lineHeight: 0.6,
            marginTop: 12,
            alignSelf: "flex-end",
            marginRight: 40,
            opacity: 0.6,
          }}
        >
          &rdquo;
        </div>
      </SpringIn>
      {slide.subText && (
        <SpringIn delay={16}>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 20,
              color: COLORS.midGray,
              marginTop: 24,
              textAlign: "center",
            }}
          >
            — {slide.subText}
          </div>
        </SpringIn>
      )}
    </AbsoluteFill>
  );
};
