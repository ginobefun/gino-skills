import type { DeepSlide, VideoItem } from "../types";
import { CoverSlide } from "./CoverSlide";
import { ProblemSlide } from "./ProblemSlide";
import { PointSlide } from "./PointSlide";
import { QuoteSlide } from "./QuoteSlide";
import { TakeawaySlide } from "./TakeawaySlide";
import { SourceCardSlide } from "./SourceCardSlide";

/**
 * Renders the correct slide layout component based on slide.type.
 */
export const SlideRenderer: React.FC<{
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
