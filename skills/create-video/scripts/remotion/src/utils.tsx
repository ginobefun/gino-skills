import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
  Img,
} from "remotion";

/**
 * SpringIn: spring-based entrance animation (opacity + translateY).
 */
export const SpringIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, style = {} }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
  });

  const opacity = progress;
  const translateY = interpolate(progress, [0, 1], [18, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/**
 * SceneWrapper: wraps each scene with enter/exit fade.
 */
export const SceneWrapper: React.FC<{
  children: React.ReactNode;
  durationInFrames: number;
}> = ({ children, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeInDuration = Math.round(0.4 * fps);
  const fadeOutDuration = Math.round(0.3 * fps);
  const fadeOutStart = durationInFrames - fadeOutDuration;

  const enterOpacity = interpolate(frame, [0, fadeInDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const exitOpacity = interpolate(
    frame,
    [fadeOutStart, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill style={{ opacity: Math.min(enterOpacity, exitOpacity) }}>
      {children}
    </AbsoluteFill>
  );
};

/**
 * KenBurnsImage: applies a slow zoom (1.0 → 1.05) over the slide duration.
 */
export const KenBurnsImage: React.FC<{
  src: string;
  slideDuration: number;
  style?: React.CSSProperties;
}> = ({ src, slideDuration, style = {} }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, slideDuration], [1.0, 1.05], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        ...style,
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      />
    </div>
  );
};

/**
 * SlideIn: horizontal slide-in animation (for lower-third bars).
 */
export const SlideIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  direction?: "left" | "right";
  style?: React.CSSProperties;
}> = ({ children, delay = 0, direction = "left", style = {} }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
  });

  const sign = direction === "left" ? -1 : 1;
  const translateX = interpolate(progress, [0, 1], [sign * 80, 0]);

  return (
    <div
      style={{
        opacity: progress,
        transform: `translateX(${translateX}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/**
 * PulseRing: animated ring that pulses outward (for avatar speaking indicator).
 */
export const PulseRing: React.FC<{
  size: number;
  color: string;
  active: boolean;
}> = ({ size, color, active }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!active) return null;

  // 1-second pulse cycle, frame-rate independent
  const cycle = frame % fps;
  const scale = interpolate(cycle, [0, fps], [1, 1.4], {
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(cycle, [0, fps], [0.4, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid ${color}`,
        transform: `scale(${scale})`,
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};
