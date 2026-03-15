import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import type { VideoData } from "./types";
import { COLORS } from "./types";
import { BrandIntro } from "./scenes/BrandIntro";
import { KeywordsScene } from "./scenes/KeywordsScene";
import { DeepDiveScene } from "./scenes/DeepDiveScene";
import { QuickReviewIntro, QuickCard } from "./scenes/QuickBrowseScene";
import { BrandOutro } from "./scenes/BrandOutro";

export const ContentVideo: React.FC<VideoData> = (props) => {
  const { fps } = useVideoConfig();

  const deepItems = props.items.filter((i) => i.type === "deep");
  const quickItems = props.items.filter((i) => i.type === "quick");

  const hasKeywords = props.keywords && props.keywords.length > 0;
  const keywordsDuration = hasKeywords ? 4 * fps : 0;

  // Brand intro fills the gap until keywords or first deep item
  const firstDeepStart = deepItems.length > 0
    ? Math.round(deepItems[0].audioStart * fps)
    : 5 * fps;
  const brandIntroDuration = Math.max(
    5 * fps,
    firstDeepStart - keywordsDuration,
  );

  // Deep dive scenes - aligned to audio timestamps
  const deepScenes = deepItems.map((item) => {
    const start = Math.round(item.audioStart * fps);
    const duration = Math.round(item.audioDuration * fps);
    return { item, start, duration };
  });

  // Quick review intro
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

  // Outro
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

  // Use title for brand intro, fallback to brandName
  const introTitle = props.title || props.brandName || "Content Video";

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream }}>
      {/* Audio track */}
      {props.audioFile && <Audio src={staticFile(props.audioFile)} />}

      {/* Scene 1: Brand Intro */}
      <Sequence from={0} durationInFrames={brandIntroDuration} premountFor={fps}>
        <BrandIntro
          title={introTitle}
          subtitle={props.subtitle}
          date={props.date}
          durationInFrames={brandIntroDuration}
        />
      </Sequence>

      {/* Scene 2: Keywords (optional) */}
      {hasKeywords && (
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
      )}

      {/* Scene 3-5: Deep Dives */}
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
      {quickItems.length > 0 && (
        <Sequence
          from={quickIntroStart}
          durationInFrames={quickIntroDuration}
          premountFor={fps}
        >
          <QuickReviewIntro
            title={props.quickReviewTitle}
            count={quickItems.length}
            durationInFrames={quickIntroDuration}
          />
        </Sequence>
      )}

      {/* Scene 7: Quick Cards */}
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
          brandName={props.brandName}
          brandSlogan={props.brandSlogan}
          durationInFrames={outroDuration}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
