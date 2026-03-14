import { AbsoluteFill } from "remotion";
import { COLORS, FONTS } from "../types";
import { SpringIn, SceneWrapper } from "../utils";

export const BrandIntro: React.FC<{
  title: string;
  date: string;
  durationInFrames: number;
}> = ({ title, date, durationInFrames }) => {
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
        <SpringIn delay={10}>
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
