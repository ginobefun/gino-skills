import { COLORS, FONTS } from "../types";
import { SpringIn } from "../utils";

export const SidePanel: React.FC<{
  title?: string;
  items: string[];
  activeIndex?: number;
  durationInFrames: number;
}> = ({ title = "要点概览", items, activeIndex, durationInFrames }) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.lightBlue,
        borderLeft: `1px solid ${COLORS.lightGray}`,
        padding: "40px 28px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <SpringIn>
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 18,
            fontWeight: 600,
            color: COLORS.inkBlue,
            marginBottom: 8,
          }}
        >
          {title}
        </div>
        <div
          style={{
            width: 32,
            height: 2,
            backgroundColor: COLORS.amber,
            borderRadius: 1,
            marginBottom: 24,
          }}
        />
      </SpringIn>
      {items.map((item, i) => {
        const isActive = i === activeIndex;
        return (
          <SpringIn key={i} delay={6 + i * 4}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                marginBottom: 16,
                opacity: isActive ? 1 : 0.6,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: isActive ? COLORS.amber : COLORS.midGray,
                  marginTop: 7,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 15,
                  lineHeight: 1.5,
                  color: isActive ? COLORS.amber : COLORS.charcoal,
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {item}
              </span>
            </div>
          </SpringIn>
        );
      })}
    </div>
  );
};
