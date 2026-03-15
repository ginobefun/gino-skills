import { AbsoluteFill } from "remotion";
import { COLORS, FONTS } from "../types";
import { SpringIn, SceneWrapper } from "../utils";

export const BrandIntro: React.FC<{
  title: string;
  subtitle?: string;
  date: string;
  durationInFrames: number;
}> = ({ title, subtitle, date, durationInFrames }) => {
  return (
    <SceneWrapper durationInFrames={durationInFrames}>
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.cream,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SpringIn>
          <div
            style={{
              fontFamily: FONTS.serif,
              fontSize: 64,
              color: COLORS.inkBlue,
              letterSpacing: "0.05em",
              fontWeight: "bold",
            }}
          >
            {title}
          </div>
        </SpringIn>
        {subtitle && (
          <SpringIn delay={8}>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 30,
                color: COLORS.charcoal,
                marginTop: 16,
                maxWidth: 1000,
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </div>
          </SpringIn>
        )}
        <SpringIn delay={subtitle ? 14 : 10}>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 28,
              color: COLORS.midGray,
              marginTop: 20,
            }}
          >
            {date}
          </div>
        </SpringIn>
      </AbsoluteFill>
    </SceneWrapper>
  );
};
