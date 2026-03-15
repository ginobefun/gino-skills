import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { COLORS, FONTS } from "../../types";

export const AnimatedCounter: React.FC<{
  label: string;
  value: number;
  unit?: string;
  delay?: number;
}> = ({ label, value, unit = "", delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const animDuration = fps; // 1 second
  const currentValue = interpolate(
    frame - delay,
    [0, animDuration],
    [0, value],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const opacity = interpolate(frame - delay, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ textAlign: "center", opacity }}>
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: 40,
          fontWeight: 700,
          color: COLORS.inkBlue,
          lineHeight: 1.2,
        }}
      >
        {Math.round(currentValue)}
        {unit && (
          <span style={{ fontSize: 22, color: COLORS.midGray, marginLeft: 4 }}>
            {unit}
          </span>
        )}
      </div>
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 14,
          color: COLORS.midGray,
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
};
