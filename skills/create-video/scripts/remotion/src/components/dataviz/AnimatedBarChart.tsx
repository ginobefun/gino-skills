import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { COLORS, FONTS } from "../../types";

export const AnimatedBarChart: React.FC<{
  items: Array<{ label: string; value: number }>;
  unit?: string;
  delay?: number;
}> = ({ items, unit = "", delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const maxValue = Math.max(...items.map((i) => i.value), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => {
        const progress = spring({
          frame: frame - delay - i * 4,
          fps,
          config: { damping: 200 },
        });

        const barWidth = (item.value / maxValue) * 100 * progress;

        return (
          <div key={i}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 13,
                  color: COLORS.charcoal,
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 13,
                  color: COLORS.inkBlue,
                  opacity: progress,
                }}
              >
                {Math.round(item.value * progress)}
                {unit}
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: 6,
                backgroundColor: COLORS.lightGray,
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${barWidth}%`,
                  height: "100%",
                  backgroundColor:
                    i === 0 ? COLORS.amber : COLORS.inkBlue,
                  borderRadius: 3,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
