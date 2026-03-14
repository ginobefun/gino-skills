import { AbsoluteFill } from "remotion";
import { COLORS, FONTS } from "../types";
import { SpringIn, SceneWrapper } from "../utils";

export const KeywordsScene: React.FC<{
  keywords: string[];
  durationInFrames: number;
}> = ({ keywords, durationInFrames }) => {
  return (
    <SceneWrapper durationInFrames={durationInFrames}>
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.cream,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        {keywords.map((kw, i) => (
          <SpringIn key={kw} delay={i * 6}>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 22,
                color: COLORS.inkBlue,
                border: `1.5px solid ${COLORS.inkBlue}`,
                borderRadius: 20,
                padding: "8px 24px",
                backgroundColor: "transparent",
              }}
            >
              {kw}
            </div>
          </SpringIn>
        ))}
      </AbsoluteFill>
    </SceneWrapper>
  );
};
