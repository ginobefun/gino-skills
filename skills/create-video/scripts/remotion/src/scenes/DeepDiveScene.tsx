import { useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import type { VideoItem, DeepSlide } from "../types";
import { SceneWrapper } from "../utils";
import { SlideRenderer } from "../slides/SlideRenderer";

/**
 * Generates fallback slides from item metadata when slides are not provided.
 */
function buildFallbackSlides(item: VideoItem): DeepSlide[] {
  const slides: DeepSlide[] = [];
  const points = item.points || [];
  const hasQuote = Boolean(item.quote);
  const hasSummary = Boolean(item.summary);

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

/**
 * DeepDiveScene: renders a deep dive item as a sequence of visual slides
 * using TransitionSeries with fade() transitions.
 */
export const DeepDiveScene: React.FC<{
  item: VideoItem;
  durationInFrames: number;
}> = ({ item, durationInFrames }) => {
  const { fps } = useVideoConfig();
  const crossfadeFrames = Math.round(0.8 * fps);

  const slides =
    item.slides && item.slides.length > 0
      ? item.slides
      : buildFallbackSlides(item);

  const numTransitions = Math.max(slides.length - 1, 0);
  const totalSlideFrames = durationInFrames + numTransitions * crossfadeFrames;

  const slideFrames = slides.map((s) =>
    Math.max(
      Math.round(s.durationRatio * totalSlideFrames),
      crossfadeFrames + fps,
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
