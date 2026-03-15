import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS, FONTS } from "../../types";

export const AnimatedProgressBar: React.FC<{
  label: string;
  value: number;
  maxValue?: number;
  unit?: string;
  delay?: number;
}> = ({ label, value, maxValue = 100, unit = "", delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
  });

  const percentage = (value / maxValue) * 100;
  const currentWidth = percentage * progress;

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: FONTS.sans,
            fontSize: 14,
            color: COLORS.charcoal,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 14,
            color: COLORS.inkBlue,
            fontWeight: 600,
          }}
        >
          {Math.round(value * progress)}
          {unit}
        </span>
      </div>
      <div
        style={{
          width: "100%",
          height: 8,
          backgroundColor: COLORS.lightGray,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${currentWidth}%`,
            height: "100%",
            backgroundColor: COLORS.amber,
            borderRadius: 4,
          }}
        />
      </div>
    </div>
  );
};
