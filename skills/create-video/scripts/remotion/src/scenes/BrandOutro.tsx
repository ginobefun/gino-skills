import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { COLORS, FONTS } from "../types";
import { SpringIn } from "../utils";

export const BrandOutro: React.FC<{
  brandName?: string;
  brandSlogan?: string;
  durationInFrames: number;
}> = ({ brandName = "BestBlogs.dev", brandSlogan = "遇见更好的技术阅读", durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeInDuration = Math.round(0.5 * fps);
  const enterOpacity = interpolate(frame, [0, fadeInDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: enterOpacity }}>
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
              fontSize: 52,
              color: COLORS.inkBlue,
              letterSpacing: "0.08em",
              fontWeight: "bold",
            }}
          >
            {brandName}
          </div>
        </SpringIn>
        <SpringIn delay={10}>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 24,
              color: COLORS.midGray,
              marginTop: 20,
            }}
          >
            {brandSlogan}
          </div>
        </SpringIn>
        <SpringIn delay={15}>
          <div
            style={{
              width: 80,
              height: 1,
              backgroundColor: COLORS.lightGray,
              marginTop: 30,
            }}
          />
        </SpringIn>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
