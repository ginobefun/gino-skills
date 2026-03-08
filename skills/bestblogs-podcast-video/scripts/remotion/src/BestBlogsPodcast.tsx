import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Img,
  spring,
} from "remotion";
import { Audio } from "@remotion/media";
import type { VideoData, VideoItem } from "./types";
import { COLORS, FONTS } from "./types";

// --- Utility Components ---

/**
 * SpringIn: spring-based entrance animation (opacity + translateY).
 * Uses spring() for natural motion instead of linear interpolate.
 */
const SpringIn: React.FC<{
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
 * SceneWrapper: wraps each scene with enter/exit fade for smooth transitions.
 * Fade-in over first 0.4s, fade-out over last 0.3s.
 */
const SceneWrapper: React.FC<{
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

// --- Scene Components ---

const BrandIntro: React.FC<{
  brandName: string;
  date: string;
  durationInFrames: number;
}> = ({ brandName, date, durationInFrames }) => {
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
              fontSize: 64,
              color: COLORS.inkBlue,
              letterSpacing: "0.05em",
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
              fontSize: 28,
              color: COLORS.midGray,
              marginTop: 20,
            }}
          >
            {date}
          </div>
        </SpringIn>
      </AbsoluteFill>
    </SceneWrapper>
  );
};

const KeywordsScene: React.FC<{
  keywords: string[];
  durationInFrames: number;
}> = ({ keywords, durationInFrames }) => {
  return (
    <SceneWrapper durationInFrames={durationInFrames}>
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.cream,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        {keywords.map((kw, i) => (
          <SpringIn key={kw} delay={i * 6}>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 22,
                color: COLORS.inkBlue,
                border: `1.5px solid ${COLORS.inkBlue}`,
                borderRadius: 20,
                padding: "8px 24px",
                backgroundColor: "transparent",
              }}
            >
              {kw}
            </div>
          </SpringIn>
        ))}
      </AbsoluteFill>
    </SceneWrapper>
  );
};

const DeepDiveScene: React.FC<{
  item: VideoItem;
  durationInFrames: number;
}> = ({ item, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isTop1 = item.rank === 1;
  const accentColor = isTop1 ? COLORS.amber : COLORS.inkBlue;

  // Phase timing: header appears first, then image, then points sequentially
  const imageDelay = Math.round(0.6 * fps);
  const pointsStartDelay = Math.round(1.5 * fps);
  const pointInterval = Math.round(1.2 * fps);

  return (
    <SceneWrapper durationInFrames={durationInFrames}>
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.cream,
          padding: 80,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header: rank + title + source */}
        <SpringIn>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            {isTop1 && (
              <div
                style={{
                  width: 4,
                  height: 80,
                  backgroundColor: COLORS.amber,
                  borderRadius: 2,
                  flexShrink: 0,
                }}
              />
            )}
            <div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 24,
                  color: accentColor,
                  marginBottom: 8,
                }}
              >
                {String(item.rank).padStart(2, "0")}
              </div>
              <div
                style={{
                  fontFamily: FONTS.serif,
                  fontSize: isTop1 ? 48 : 44,
                  color: COLORS.inkBlue,
                  lineHeight: 1.3,
                  fontWeight: "bold",
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 20,
                  color: COLORS.midGray,
                  marginTop: 12,
                }}
              >
                {item.source}
                {item.author ? ` · ${item.author}` : ""} · 评分 {item.score}
              </div>
            </div>
          </div>
        </SpringIn>

        {/* Image area */}
        {item.images.length > 0 && (
          <SpringIn delay={imageDelay} style={{ marginTop: 40, flex: 1 }}>
            <div
              style={{
                width: "100%",
                height: 400,
                borderRadius: 4,
                overflow: "hidden",
                backgroundColor: COLORS.lightBlue,
              }}
            >
              <Img
                src={staticFile(item.images[0])}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          </SpringIn>
        )}

        {/* Points - appear sequentially with spring animation */}
        {item.points && (
          <div style={{ marginTop: 40, flex: 1 }}>
            {item.points.map((point, i) => (
              <SpringIn
                key={i}
                delay={pointsStartDelay + i * pointInterval}
                style={{ marginBottom: 20 }}
              >
                <div
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 28,
                    color: COLORS.charcoal,
                    lineHeight: 1.6,
                    paddingLeft: 20,
                    borderLeft: `2px solid ${COLORS.lightGray}`,
                  }}
                >
                  {point}
                </div>
              </SpringIn>
            ))}
          </div>
        )}

        {/* Quote */}
        {item.quote && (
          <SpringIn
            delay={
              pointsStartDelay +
              (item.points?.length || 0) * pointInterval +
              Math.round(0.5 * fps)
            }
            style={{ marginTop: 40 }}
          >
            <div
              style={{
                fontFamily: FONTS.serif,
                fontSize: 26,
                color: COLORS.inkBlue,
                fontStyle: "italic",
                lineHeight: 1.5,
                padding: "20px 30px",
                backgroundColor: COLORS.lightBlue,
                borderRadius: 4,
              }}
            >
              &ldquo;{item.quote}&rdquo;
            </div>
          </SpringIn>
        )}
      </AbsoluteFill>
    </SceneWrapper>
  );
};

const QuickReviewIntro: React.FC<{
  count?: number;
  durationInFrames: number;
}> = ({ count = 7, durationInFrames }) => {
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
            ── 快速速览 ──
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

const QuickCard: React.FC<{
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
            {item.source} · {item.score}
          </div>
        </SpringIn>
      </AbsoluteFill>
    </SceneWrapper>
  );
};

const BrandOutro: React.FC<{
  brandSlogan: string;
  durationInFrames: number;
}> = ({ brandSlogan, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Outro only fades in, no fade out
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
            BestBlogs.dev
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

// --- Main Composition ---

export const BestBlogsPodcast: React.FC<VideoData> = (props) => {
  const { fps } = useVideoConfig();

  const deepItems = props.items.filter((i) => i.type === "deep");
  const quickItems = props.items.filter((i) => i.type === "quick");

  // Audio starts from frame 0 and contains the intro speech.
  // Visual scenes are aligned to audioStart timestamps so video matches audio.
  // Brand intro & keywords overlay the audio intro segment (first ~8s of audio).

  const brandIntroDuration = 5 * fps;
  const keywordsDuration = 3 * fps;

  // Deep dive scenes - aligned to audio timestamps
  const deepScenes = deepItems.map((item) => {
    const start = Math.round(item.audioStart * fps);
    const duration = Math.round(item.audioDuration * fps);
    return { item, start, duration };
  });

  // Quick review intro - appears just before the first quick item
  const firstQuickItem = quickItems[0];
  const quickIntroStart = firstQuickItem
    ? Math.round(firstQuickItem.audioStart * fps) - 3 * fps
    : deepScenes.length > 0
      ? deepScenes[deepScenes.length - 1].start +
        deepScenes[deepScenes.length - 1].duration
      : brandIntroDuration + keywordsDuration;
  const quickIntroDuration = 3 * fps;

  // Quick cards - aligned to audio timestamps
  const quickScenes = quickItems.map((item) => {
    const start = Math.round(item.audioStart * fps);
    const duration = Math.round(item.audioDuration * fps);
    return { item, start, duration };
  });

  // Outro - starts after last quick card ends
  const lastScene =
    quickScenes.length > 0
      ? quickScenes[quickScenes.length - 1]
      : deepScenes.length > 0
        ? deepScenes[deepScenes.length - 1]
        : null;
  const outroStart = lastScene
    ? lastScene.start + lastScene.duration
    : Math.round(props.totalDuration * fps) - 5 * fps;
  const outroDuration = Math.max(
    Math.round(props.totalDuration * fps) - outroStart,
    fps,
  );

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream }}>
      {/* Audio track - starts from frame 0, synced with video */}
      {props.audioFile && <Audio src={staticFile(props.audioFile)} />}

      {/* Scene 1: Brand Intro */}
      <Sequence
        from={0}
        durationInFrames={brandIntroDuration}
        premountFor={fps}
      >
        <BrandIntro
          brandName={props.brandName}
          date={props.date}
          durationInFrames={brandIntroDuration}
        />
      </Sequence>

      {/* Scene 2: Keywords */}
      <Sequence
        from={brandIntroDuration}
        durationInFrames={keywordsDuration}
        premountFor={fps}
      >
        <KeywordsScene
          keywords={props.keywords}
          durationInFrames={keywordsDuration}
        />
      </Sequence>

      {/* Scene 3-5: Deep Dives - synced to audio timestamps */}
      {deepScenes.map(({ item, start, duration }) => (
        <Sequence
          key={item.rank}
          from={start}
          durationInFrames={duration}
          premountFor={fps}
        >
          <DeepDiveScene item={item} durationInFrames={duration} />
        </Sequence>
      ))}

      {/* Scene 6: Quick Review Intro */}
      <Sequence
        from={quickIntroStart}
        durationInFrames={quickIntroDuration}
        premountFor={fps}
      >
        <QuickReviewIntro
          count={quickItems.length}
          durationInFrames={quickIntroDuration}
        />
      </Sequence>

      {/* Scene 7: Quick Cards - synced to audio timestamps */}
      {quickScenes.map(({ item, start, duration }) => (
        <Sequence
          key={item.rank}
          from={start}
          durationInFrames={duration}
          premountFor={fps}
        >
          <QuickCard item={item} durationInFrames={duration} />
        </Sequence>
      ))}

      {/* Scene 8: Brand Outro */}
      <Sequence
        from={outroStart}
        durationInFrames={outroDuration}
        premountFor={fps}
      >
        <BrandOutro
          brandSlogan={props.brandSlogan}
          durationInFrames={outroDuration}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
