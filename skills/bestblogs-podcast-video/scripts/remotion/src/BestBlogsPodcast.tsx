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
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import type { VideoData, VideoItem, DeepSlide } from "./types";
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

// --- Deep Dive Slide Layouts ---

/**
 * KenBurnsImage: applies a slow zoom (1.0 → 1.05) over the slide duration.
 */
const KenBurnsImage: React.FC<{
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
 * CoverSlide: large image + title + source overlay at bottom.
 * Used for the first slide introducing the article.
 */
const CoverSlide: React.FC<{
  slide: DeepSlide;
  item: VideoItem;
  slideDuration: number;
}> = ({ slide, item, slideDuration }) => {
  const imageSource = slide.image || item.images[0] || null;
  const isTop1 = item.rank === 1;

  if (!imageSource) {
    // No image: centered title on cream background
    return (
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.cream,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
        }}
      >
        <SpringIn>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 24,
              color: isTop1 ? COLORS.amber : COLORS.inkBlue,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {String(item.rank).padStart(2, "0")}
          </div>
        </SpringIn>
        <SpringIn delay={6}>
          <div
            style={{
              fontFamily: FONTS.serif,
              fontSize: 52,
              color: COLORS.inkBlue,
              lineHeight: 1.3,
              fontWeight: "bold",
              textAlign: "center",
              maxWidth: 1200,
            }}
          >
            {slide.text}
          </div>
        </SpringIn>
        {slide.subText && (
          <SpringIn delay={14}>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 22,
                color: COLORS.midGray,
                marginTop: 24,
                textAlign: "center",
              }}
            >
              {slide.subText}
            </div>
          </SpringIn>
        )}
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      {/* Full-bleed image with Ken Burns */}
      <KenBurnsImage src={imageSource} slideDuration={slideDuration} />

      {/* Dark gradient overlay at bottom */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
        }}
      />

      {/* Text content pinned to bottom */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 72,
        }}
      >
        <SpringIn>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 20,
              color: isTop1 ? COLORS.amber : "rgba(255,255,255,0.7)",
              marginBottom: 12,
            }}
          >
            {String(item.rank).padStart(2, "0")}
          </div>
        </SpringIn>
        <SpringIn delay={6}>
          <div
            style={{
              fontFamily: FONTS.serif,
              fontSize: 48,
              color: "#ffffff",
              lineHeight: 1.3,
              fontWeight: "bold",
              maxWidth: 1100,
            }}
          >
            {slide.text}
          </div>
        </SpringIn>
        {slide.subText && (
          <SpringIn delay={14}>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 22,
                color: "rgba(255,255,255,0.75)",
                marginTop: 16,
              }}
            >
              {slide.subText}
            </div>
          </SpringIn>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * ProblemSlide: centered text on light blue background. No image.
 * Used to highlight the core problem or context of the article.
 */
const ProblemSlide: React.FC<{ slide: DeepSlide }> = ({ slide }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.lightBlue,
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
            fontFamily: FONTS.serif,
            fontSize: 42,
            color: COLORS.inkBlue,
            lineHeight: 1.55,
            textAlign: "center",
            maxWidth: 1100,
            fontWeight: "bold",
          }}
        >
          {slide.text}
        </div>
      </SpringIn>
      {slide.subText && (
        <SpringIn delay={10}>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 24,
              color: COLORS.midGray,
              marginTop: 32,
              textAlign: "center",
            }}
          >
            {slide.subText}
          </div>
        </SpringIn>
      )}
    </AbsoluteFill>
  );
};

/**
 * PointSlide: split layout — image on left (60%), point text on right.
 * Falls back to full-width text with left border accent when no image.
 */
const PointSlide: React.FC<{
  slide: DeepSlide;
  item: VideoItem;
  slideDuration: number;
}> = ({ slide, item, slideDuration }) => {
  const imageSource = slide.image || null;

  if (!imageSource) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.cream,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 120,
        }}
      >
        <SpringIn style={{ width: "100%", maxWidth: 1100 }}>
          <div
            style={{
              borderLeft: `4px solid ${COLORS.amber}`,
              paddingLeft: 40,
            }}
          >
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 36,
                color: COLORS.charcoal,
                lineHeight: 1.6,
              }}
            >
              {slide.text}
            </div>
            {slide.subText && (
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 22,
                  color: COLORS.midGray,
                  marginTop: 20,
                }}
              >
                {slide.subText}
              </div>
            )}
          </div>
        </SpringIn>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream, display: "flex" }}>
      {/* Left: image (60%) */}
      <div style={{ width: "60%", height: "100%", overflow: "hidden" }}>
        <KenBurnsImage src={imageSource} slideDuration={slideDuration} />
      </div>

      {/* Right: text (40%) */}
      <div
        style={{
          width: "40%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 56px 60px 48px",
        }}
      >
        <SpringIn>
          <div
            style={{
              width: 40,
              height: 3,
              backgroundColor: COLORS.amber,
              borderRadius: 2,
              marginBottom: 28,
            }}
          />
        </SpringIn>
        <SpringIn delay={6}>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 30,
              color: COLORS.charcoal,
              lineHeight: 1.6,
            }}
          >
            {slide.text}
          </div>
        </SpringIn>
        {slide.subText && (
          <SpringIn delay={14}>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 20,
                color: COLORS.midGray,
                marginTop: 20,
              }}
            >
              {slide.subText}
            </div>
          </SpringIn>
        )}
      </div>
    </AbsoluteFill>
  );
};

/**
 * QuoteSlide: italic serif text centered with decorative quotation marks.
 * Light blue background.
 */
const QuoteSlide: React.FC<{ slide: DeepSlide }> = ({ slide }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.lightBlue,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 120,
      }}
    >
      {/* Decorative opening quote */}
      <SpringIn>
        <div
          style={{
            fontFamily: FONTS.serif,
            fontSize: 120,
            color: COLORS.amber,
            lineHeight: 0.6,
            marginBottom: 8,
            alignSelf: "flex-start",
            marginLeft: 40,
            opacity: 0.6,
          }}
        >
          &ldquo;
        </div>
      </SpringIn>

      <SpringIn delay={6}>
        <div
          style={{
            fontFamily: FONTS.serif,
            fontSize: 38,
            color: COLORS.inkBlue,
            fontStyle: "italic",
            lineHeight: 1.6,
            textAlign: "center",
            maxWidth: 1050,
          }}
        >
          {slide.text}
        </div>
      </SpringIn>

      {/* Decorative closing quote */}
      <SpringIn delay={10}>
        <div
          style={{
            fontFamily: FONTS.serif,
            fontSize: 120,
            color: COLORS.amber,
            lineHeight: 0.6,
            marginTop: 12,
            alignSelf: "flex-end",
            marginRight: 40,
            opacity: 0.6,
          }}
        >
          &rdquo;
        </div>
      </SpringIn>

      {slide.subText && (
        <SpringIn delay={16}>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 20,
              color: COLORS.midGray,
              marginTop: 24,
              textAlign: "center",
            }}
          >
            — {slide.subText}
          </div>
        </SpringIn>
      )}
    </AbsoluteFill>
  );
};

/**
 * TakeawaySlide: dimmed background image (if available) + text overlay.
 * Falls back to cream background with centered text.
 */
const TakeawaySlide: React.FC<{
  slide: DeepSlide;
  item: VideoItem;
  slideDuration: number;
}> = ({ slide, item, slideDuration }) => {
  const imageSource = slide.image || item.images[0] || null;

  if (!imageSource) {
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
        <SpringIn>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 20,
              color: COLORS.amber,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            核心要点
          </div>
        </SpringIn>
        <SpringIn delay={8}>
          <div
            style={{
              fontFamily: FONTS.serif,
              fontSize: 40,
              color: COLORS.inkBlue,
              lineHeight: 1.55,
              textAlign: "center",
              maxWidth: 1100,
              fontWeight: "bold",
            }}
          >
            {slide.text}
          </div>
        </SpringIn>
        {slide.subText && (
          <SpringIn delay={16}>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 22,
                color: COLORS.midGray,
                marginTop: 24,
                textAlign: "center",
              }}
            >
              {slide.subText}
            </div>
          </SpringIn>
        )}
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      {/* Dimmed background image */}
      <KenBurnsImage src={imageSource} slideDuration={slideDuration} />
      <AbsoluteFill
        style={{ backgroundColor: "rgba(26,54,93,0.72)" }} // inkBlue tint
      />

      {/* Text overlay */}
      <AbsoluteFill
        style={{
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
              fontFamily: FONTS.sans,
              fontSize: 20,
              color: COLORS.amber,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            核心要点
          </div>
        </SpringIn>
        <SpringIn delay={8}>
          <div
            style={{
              fontFamily: FONTS.serif,
              fontSize: 42,
              color: "#ffffff",
              lineHeight: 1.55,
              textAlign: "center",
              maxWidth: 1100,
              fontWeight: "bold",
            }}
          >
            {slide.text}
          </div>
        </SpringIn>
        {slide.subText && (
          <SpringIn delay={16}>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 22,
                color: "rgba(255,255,255,0.75)",
                marginTop: 24,
                textAlign: "center",
              }}
            >
              {slide.subText}
            </div>
          </SpringIn>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * SourceCardSlide: styled card mimicking an article preview / Twitter embed.
 * Shows the original source with a card UI treatment.
 */
const SourceCardSlide: React.FC<{
  slide: DeepSlide;
  item: VideoItem;
  slideDuration: number;
}> = ({ slide, item, slideDuration }) => {
  const imageSource = slide.image || item.images[0] || null;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.lightBlue,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      <SpringIn style={{ width: "100%", maxWidth: 1080 }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            border: `1px solid ${COLORS.lightGray}`,
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          }}
        >
          {/* Card image */}
          {imageSource && (
            <div
              style={{ width: "100%", height: 340, overflow: "hidden" }}
            >
              <KenBurnsImage
                src={imageSource}
                slideDuration={slideDuration}
                style={{ borderRadius: 0 }}
              />
            </div>
          )}

          {/* Card body */}
          <div style={{ padding: "36px 44px 44px" }}>
            <SpringIn delay={8}>
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 18,
                  color: COLORS.midGray,
                  marginBottom: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {item.source}
              </div>
            </SpringIn>
            <SpringIn delay={12}>
              <div
                style={{
                  fontFamily: FONTS.serif,
                  fontSize: 34,
                  color: COLORS.inkBlue,
                  lineHeight: 1.4,
                  fontWeight: "bold",
                  marginBottom: 16,
                }}
              >
                {slide.text}
              </div>
            </SpringIn>
            {slide.subText && (
              <SpringIn delay={18}>
                <div
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 22,
                    color: COLORS.charcoal,
                    lineHeight: 1.6,
                  }}
                >
                  {slide.subText}
                </div>
              </SpringIn>
            )}

            {/* Score badge */}
            <SpringIn delay={22}>
              <div
                style={{
                  marginTop: 24,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: COLORS.amberBg,
                  border: `1px solid ${COLORS.amber}`,
                  borderRadius: 20,
                  padding: "6px 18px",
                }}
              >
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 18,
                    color: COLORS.amber,
                    fontWeight: "bold",
                  }}
                >
                  评分 {item.score}
                </div>
              </div>
            </SpringIn>
          </div>
        </div>
      </SpringIn>
    </AbsoluteFill>
  );
};

// --- Slide Renderer ---

/**
 * Renders the correct slide layout component based on slide.type.
 */
const SlideRenderer: React.FC<{
  slide: DeepSlide;
  item: VideoItem;
  slideDuration: number;
}> = ({ slide, item, slideDuration }) => {
  switch (slide.type) {
    case "cover":
      return <CoverSlide slide={slide} item={item} slideDuration={slideDuration} />;
    case "problem":
      return <ProblemSlide slide={slide} />;
    case "point":
      return <PointSlide slide={slide} item={item} slideDuration={slideDuration} />;
    case "quote":
      return <QuoteSlide slide={slide} />;
    case "takeaway":
      return <TakeawaySlide slide={slide} item={item} slideDuration={slideDuration} />;
    case "source-card":
      return <SourceCardSlide slide={slide} item={item} slideDuration={slideDuration} />;
    default:
      return <ProblemSlide slide={slide} />;
  }
};

// --- Fallback Auto-Generated Slides ---

/**
 * Generates a DeepSlide array automatically from item metadata.
 * Used when item.slides is not provided.
 * Phases: cover → one slide per point → quote → summary (takeaway)
 */
function buildFallbackSlides(item: VideoItem): DeepSlide[] {
  const slides: DeepSlide[] = [];
  const points = item.points || [];
  const hasQuote = Boolean(item.quote);
  const hasSummary = Boolean(item.summary);

  // Always start with a cover slide
  const totalSlots =
    1 + points.length + (hasQuote ? 1 : 0) + (hasSummary ? 1 : 0);
  const baseRatio = 1 / totalSlots;

  slides.push({
    type: "cover",
    text: item.title,
    subText: [item.source, item.author].filter(Boolean).join(" · "),
    image: item.images[0],
    durationRatio: baseRatio,
  });

  points.forEach((point) => {
    slides.push({
      type: "point",
      text: point,
      durationRatio: baseRatio,
    });
  });

  if (hasQuote) {
    slides.push({
      type: "quote",
      text: item.quote!,
      durationRatio: baseRatio,
    });
  }

  if (hasSummary) {
    slides.push({
      type: "takeaway",
      text: item.summary!,
      image: item.images[0],
      durationRatio: baseRatio,
    });
  }

  return slides;
}

// --- DeepDiveScene ---

/**
 * DeepDiveScene: renders a deep dive item as a sequence of visual slides
 * using TransitionSeries with fade() transitions between slides.
 *
 * If item.slides is provided, each slide is rendered according to its type.
 * If item.slides is absent, auto-generates slides from points/quote/summary
 * for backward compatibility.
 */
const DeepDiveScene: React.FC<{
  item: VideoItem;
  durationInFrames: number;
}> = ({ item, durationInFrames }) => {
  const { fps } = useVideoConfig();
  const crossfadeFrames = Math.round(0.8 * fps);

  const slides = item.slides && item.slides.length > 0
    ? item.slides
    : buildFallbackSlides(item);

  // TransitionSeries subtracts transition durations from total timeline.
  // To fill exactly durationInFrames, inflate slide durations to compensate:
  // totalSlideFrames = durationInFrames + (numTransitions * crossfadeFrames)
  const numTransitions = Math.max(slides.length - 1, 0);
  const totalSlideFrames = durationInFrames + numTransitions * crossfadeFrames;

  const slideFrames = slides.map((s) =>
    Math.max(
      Math.round(s.durationRatio * totalSlideFrames),
      crossfadeFrames + fps, // minimum ~1.8s per slide
    ),
  );

  return (
    <SceneWrapper durationInFrames={durationInFrames}>
      <TransitionSeries>
        {slides.flatMap((slide, i) => {
          const elements: React.ReactNode[] = [];

          elements.push(
            <TransitionSeries.Sequence
              key={`slide-${i}`}
              durationInFrames={slideFrames[i]}
            >
              <SlideRenderer
                slide={slide}
                item={item}
                slideDuration={slideFrames[i]}
              />
            </TransitionSeries.Sequence>,
          );

          // Add fade transition between slides (not after the last one)
          if (i < slides.length - 1) {
            elements.push(
              <TransitionSeries.Transition
                key={`transition-${i}`}
                presentation={fade()}
                timing={linearTiming({ durationInFrames: crossfadeFrames })}
              />,
            );
          }

          return elements;
        })}
      </TransitionSeries>
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
