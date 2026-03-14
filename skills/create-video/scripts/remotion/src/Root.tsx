import { Composition } from "remotion";
import { ContentVideo } from "./ContentVideo";
import type { VideoData } from "./types";

const FPS = 30;

const defaultProps: VideoData = {
  title: "Content Video",
  date: "2026-03-14",
  keywords: ["AI", "Technology"],
  brandName: "BestBlogs.dev",
  brandSlogan: "遇见更好的技术阅读",
  audioFile: "",
  totalDuration: 600,
  items: [
    {
      rank: 1,
      type: "deep",
      title: "Sample Deep Dive Article",
      source: "Example Source",
      author: "Author",
      score: 96,
      summary: "A sample article for preview purposes.",
      points: [
        "First key point about the topic",
        "Second insight with supporting evidence",
        "Third perspective on future implications",
      ],
      quote: "This is a sample quote from the article.",
      images: [],
      audioStart: 30,
      audioDuration: 150,
    },
    {
      rank: 2,
      type: "deep",
      title: "Another Important Topic",
      source: "Tech Blog",
      score: 94,
      summary: "Another sample article.",
      points: ["Key insight one", "Key insight two"],
      images: [],
      audioStart: 180,
      audioDuration: 140,
    },
    {
      rank: 3,
      type: "quick",
      title: "Quick Review Item",
      source: "News Site",
      score: 92,
      oneLiner: "A brief summary of this item",
      images: [],
      audioStart: 320,
      audioDuration: 18,
    },
  ],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ContentVideo"
        component={ContentVideo}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: Math.ceil(props.totalDuration * FPS),
        })}
      />
    </>
  );
};
