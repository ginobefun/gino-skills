import { AbsoluteFill } from "remotion";
import type { VideoItem } from "../types";
import { COLORS, FONTS } from "../types";
import { SpringIn, SceneWrapper } from "../utils";

export const QuickReviewIntro: React.FC<{
  title?: string;
  count?: number;
  durationInFrames: number;
}> = ({ title = "快速速览", count = 7, durationInFrames }) => {
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
              fontSize: 48,
              color: COLORS.inkBlue,
            }}
          >
            ── {title} ──
          </div>
        </SpringIn>
        <SpringIn delay={10}>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 24,
              color: COLORS.midGray,
              marginTop: 16,
            }}
          >
            {count} 条值得关注
          </div>
        </SpringIn>
      </AbsoluteFill>
    </SceneWrapper>
  );
};

export const QuickCard: React.FC<{
  item: VideoItem;
  durationInFrames: number;
}> = ({ item, durationInFrames }) => {
  return (
    <SceneWrapper durationInFrames={durationInFrames}>
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
              fontFamily: FONTS.mono,
              fontSize: 36,
              color: COLORS.inkBlue,
              marginBottom: 20,
            }}
          >
            {String(item.rank).padStart(2, "0")}
          </div>
        </SpringIn>
        <SpringIn delay={5}>
          <div
            style={{
              fontFamily: FONTS.serif,
              fontSize: 40,
              color: COLORS.inkBlue,
              textAlign: "center",
              lineHeight: 1.4,
              fontWeight: "bold",
              maxWidth: 1200,
            }}
          >
            {item.title}
          </div>
        </SpringIn>
        <SpringIn delay={12}>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 26,
              color: COLORS.charcoal,
              textAlign: "center",
              lineHeight: 1.6,
              marginTop: 24,
              maxWidth: 1000,
            }}
          >
            {item.oneLiner || item.summary}
          </div>
        </SpringIn>
        <SpringIn delay={18}>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 20,
              color: COLORS.midGray,
              marginTop: 20,
            }}
          >
            {item.source}{item.score != null ? ` · ${item.score}` : ""}
          </div>
        </SpringIn>
      </AbsoluteFill>
    </SceneWrapper>
  );
};
