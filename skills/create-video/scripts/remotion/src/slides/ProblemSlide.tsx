import { AbsoluteFill } from "remotion";
import type { DeepSlide } from "../types";
import { COLORS, FONTS } from "../types";
import { SpringIn } from "../utils";

export const ProblemSlide: React.FC<{ slide: DeepSlide }> = ({ slide }) => {
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
            fontSize: 42,
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
        <SpringIn delay={10}>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 24,
              color: COLORS.midGray,
              marginTop: 32,
              textAlign: "center",
            }}
          >
            {slide.subText}
          </div>
        </SpringIn>
      )}
    </AbsoluteFill>
  );
};
