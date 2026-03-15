import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  staticFile,
  Img,
} from "remotion";
import type { AvatarConfig } from "../types";
import { COLORS } from "../types";
import { PulseRing } from "../utils";

export const PresenterAvatar: React.FC<{
  config: AvatarConfig;
  isSpeaking: boolean;
  durationInFrames: number;
}> = ({ config, isSpeaking, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = config.scale ?? 1.0;
  const targetOpacity = config.opacity ?? 0.85;

  // Fade in over 0.5s
  const fadeInFrames = Math.round(0.5 * fps);
  const opacity = interpolate(frame, [0, fadeInFrames], [0, targetOpacity], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Idle breathing: gentle vertical bobbing (frame-rate independent)
  const breathOffset = Math.sin((frame / fps) * Math.PI) * 3;

  // Speaking: toggle between idle and speaking image every 4 frames
  const showSpeakingFrame = isSpeaking && Math.floor(frame / 4) % 2 === 0;
  const currentImage = showSpeakingFrame
    ? config.speakingImage
    : config.idleImage;

  const renderWidth = 200 * scale;
  const renderHeight = 250 * scale;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 40,
          width: renderWidth,
          height: renderHeight,
          opacity,
          transform: `translateY(${breathOffset}px)`,
          filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.15))",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <PulseRing
          size={renderWidth * 0.6}
          color={COLORS.amber}
          active={isSpeaking}
        />
        <Img
          src={staticFile(currentImage)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "bottom center",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
