import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  Img,
} from "remotion";
import type { VideoData, VideoItem } from "./types";
import { COLORS, FONTS } from "./types";

const FPS = 30;

// --- Utility Components ---

const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, duration = 15, style = {} }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });
  const translateY = interpolate(frame - delay, [0, duration], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });

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

// --- Scene Components ---

const BrandIntro: React.FC<{ brandName: string; date: string }> = ({
  brandName,
  date,
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.cream,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <FadeIn>
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
      </FadeIn>
      <FadeIn delay={10}>
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
      </FadeIn>
    </AbsoluteFill>
  );
};

const KeywordsScene: React.FC<{ keywords: string[] }> = ({ keywords }) => {
  return (
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
        <FadeIn key={kw} delay={i * 6}>
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
        </FadeIn>
      ))}
    </AbsoluteFill>
  );
};

const DeepDiveScene: React.FC<{ item: VideoItem }> = ({ item }) => {
  const frame = useCurrentFrame();
  const isTop1 = item.rank === 1;
  const accentColor = isTop1 ? COLORS.amber : COLORS.inkBlue;

  // Phase timing within this scene (in frames)
  const headerEnd = 90; // 3s for header
  const pointDuration = 60; // 2s per point

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.cream,
        padding: 80,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header: rank + title + source */}
      <FadeIn>
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
              {item.author ? ` · ${item.author}` : ""} · 评分{" "}
              {item.score}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Image area */}
      {item.images.length > 0 && (
        <FadeIn delay={20} style={{ marginTop: 40, flex: 1 }}>
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
        </FadeIn>
      )}

      {/* Points - appear sequentially */}
      {item.points && (
        <div style={{ marginTop: 40, flex: 1 }}>
          {item.points.map((point, i) => (
            <FadeIn
              key={i}
              delay={headerEnd + i * pointDuration}
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
            </FadeIn>
          ))}
        </div>
      )}

      {/* Quote */}
      {item.quote && (
        <FadeIn
          delay={headerEnd + (item.points?.length || 0) * pointDuration + 30}
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
        </FadeIn>
      )}
    </AbsoluteFill>
  );
};

const QuickReviewIntro: React.FC<{ count?: number }> = ({ count = 7 }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.cream,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <FadeIn>
        <div
          style={{
            fontFamily: FONTS.serif,
            fontSize: 48,
            color: COLORS.inkBlue,
          }}
        >
          ── 快速速览 ──
        </div>
      </FadeIn>
      <FadeIn delay={10}>
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
      </FadeIn>
    </AbsoluteFill>
  );
};

const QuickCard: React.FC<{ item: VideoItem }> = ({ item }) => {
  return (
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
      <FadeIn>
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
      </FadeIn>
      <FadeIn delay={5}>
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
      </FadeIn>
      <FadeIn delay={12}>
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
      </FadeIn>
      <FadeIn delay={18}>
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
      </FadeIn>
    </AbsoluteFill>
  );
};

const BrandOutro: React.FC<{ brandSlogan: string }> = ({ brandSlogan }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.cream,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <FadeIn>
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
      </FadeIn>
      <FadeIn delay={10}>
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
      </FadeIn>
      <FadeIn delay={15}>
        <div
          style={{
            width: 80,
            height: 1,
            backgroundColor: COLORS.lightGray,
            marginTop: 30,
          }}
        />
      </FadeIn>
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
      ? deepScenes[deepScenes.length - 1].start + deepScenes[deepScenes.length - 1].duration
      : brandIntroDuration + keywordsDuration;
  const quickIntroDuration = 3 * fps;

  // Quick cards - aligned to audio timestamps
  const quickScenes = quickItems.map((item) => {
    const start = Math.round(item.audioStart * fps);
    const duration = Math.round(item.audioDuration * fps);
    return { item, start, duration };
  });

  // Outro - starts after last quick card ends
  const lastScene = quickScenes.length > 0
    ? quickScenes[quickScenes.length - 1]
    : deepScenes.length > 0
      ? deepScenes[deepScenes.length - 1]
      : null;
  const outroStart = lastScene
    ? lastScene.start + lastScene.duration
    : Math.round(props.totalDuration * fps) - 5 * fps;
  const outroDuration = Math.round(props.totalDuration * fps) - outroStart;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream }}>
      {/* Audio track - starts from frame 0, synced with video */}
      {props.audioFile && (
        <Audio src={staticFile(props.audioFile)} />
      )}

      {/* Scene 1: Brand Intro - overlays the audio intro */}
      <Sequence from={0} durationInFrames={brandIntroDuration}>
        <BrandIntro brandName={props.brandName} date={props.date} />
      </Sequence>

      {/* Scene 2: Keywords - follows brand intro, still during audio intro */}
      <Sequence from={brandIntroDuration} durationInFrames={keywordsDuration}>
        <KeywordsScene keywords={props.keywords} />
      </Sequence>

      {/* Scene 3-5: Deep Dives - synced to audio timestamps */}
      {deepScenes.map(({ item, start, duration }) => (
        <Sequence
          key={item.rank}
          from={start}
          durationInFrames={duration}
        >
          <DeepDiveScene item={item} />
        </Sequence>
      ))}

      {/* Scene 6: Quick Review Intro */}
      <Sequence from={quickIntroStart} durationInFrames={quickIntroDuration}>
        <QuickReviewIntro count={quickItems.length} />
      </Sequence>

      {/* Scene 7: Quick Cards - synced to audio timestamps */}
      {quickScenes.map(({ item, start, duration }) => (
        <Sequence
          key={item.rank}
          from={start}
          durationInFrames={duration}
        >
          <QuickCard item={item} />
        </Sequence>
      ))}

      {/* Scene 8: Brand Outro */}
      <Sequence from={outroStart} durationInFrames={Math.max(outroDuration, fps)}>
        <BrandOutro brandSlogan={props.brandSlogan} />
      </Sequence>
    </AbsoluteFill>
  );
};
