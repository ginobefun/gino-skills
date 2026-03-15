import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { COLORS, FONTS } from "../types";

export const LowerThird: React.FC<{
  sectionTitle: string;
  source: string;
  progress: string;
  durationInFrames: number;
}> = ({ sectionTitle, source, progress, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slide in from left (delay 0.5s)
  const enterProgress = spring({
    frame: Math.max(0, frame - Math.round(0.5 * fps)),
    fps,
    config: { damping: 200 },
  });

  const translateX = interpolate(enterProgress, [0, 1], [-300, 0]);

  // Fade out before scene ends
  const fadeOutStart = durationInFrames - Math.round(0.3 * fps);
  const exitOpacity = interpolate(
    frame,
    [fadeOutStart, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const opacity = Math.min(enterProgress, exitOpacity);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "75%",
          height: 56,
          backgroundColor: "rgba(26, 54, 93, 0.88)",
          borderTop: `2px solid ${COLORS.amber}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 40,
          paddingRight: 32,
          opacity,
          transform: `translateX(${translateX}px)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span
            style={{
              fontFamily: FONTS.sans,
              fontSize: 20,
              color: "#ffffff",
              fontWeight: 500,
            }}
          >
            {sectionTitle}
          </span>
          <span
            style={{
              fontFamily: FONTS.sans,
              fontSize: 16,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {source}
          </span>
        </div>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 16,
            color: COLORS.amber,
          }}
        >
          {progress}
        </span>
      </div>
    </AbsoluteFill>
  );
};
