import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS, FONTS } from "../../types";
import { SpringIn } from "../../utils";

export const KeyMetricHighlight: React.FC<{
  label: string;
  value: number;
  unit?: string;
  delay?: number;
}> = ({ label, value, unit = "", delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const underlineProgress = spring({
    frame: frame - delay - 8,
    fps,
    config: { damping: 200 },
  });

  return (
    <SpringIn delay={delay} style={{ display: "inline-block" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          gap: 8,
          position: "relative",
          paddingBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 28,
            fontWeight: 700,
            color: COLORS.inkBlue,
          }}
        >
          {value}
          {unit}
        </span>
        <span
          style={{
            fontFamily: FONTS.sans,
            fontSize: 16,
            color: COLORS.charcoal,
          }}
        >
          {label}
        </span>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: `${underlineProgress * 100}%`,
            height: 3,
            backgroundColor: COLORS.amber,
            borderRadius: 1.5,
          }}
        />
      </div>
    </SpringIn>
  );
};
