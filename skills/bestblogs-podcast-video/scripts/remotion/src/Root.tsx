import { Composition } from "remotion";
import { BestBlogsPodcast } from "./BestBlogsPodcast";
import type { VideoData } from "./types";

const FPS = 30;

// Default props for Remotion Studio preview
const defaultProps: VideoData = {
  date: "2026-03-08",
  keywords: ["AI Coding", "Claude 4", "DeepSeek"],
  brandName: "BestBlogs 早报",
  brandSlogan: "遇见更好的技术阅读",
  audioFile: "",
  totalDuration: 600,
  items: [
    {
      rank: 1,
      type: "deep",
      title: "Claude Code 新特性：从代码补全到项目级自主开发",
      source: "Latent Space",
      author: "swyx",
      score: 96,
      summary:
        "AI 编程助手如何从代码补全进化到项目级自主开发，这是整个 AI Coding 领域最热的话题。",
      points: [
        "Claude Code 的 Agent 模式可以独立处理跨文件重构",
        "关键不是写代码能力，而是理解项目上下文的能力",
        "未来方向：AI 写代码，人类做 Code Review",
      ],
      quote: "它改变的不是编程本身，而是你思考问题的粒度。",
      images: [],
      audioStart: 30,
      audioDuration: 150,
    },
    {
      rank: 2,
      type: "deep",
      title: "DeepSeek V3 开源发布，性能接近 GPT-5",
      source: "机器之心",
      score: 94,
      summary: "DeepSeek V3 在多项基准测试中达到 SOTA 水平。",
      points: ["MoE 架构优化", "中文能力领先"],
      images: [],
      audioStart: 180,
      audioDuration: 140,
    },
    {
      rank: 3,
      type: "deep",
      title: "Anthropic 发布 Model Context Protocol 2.0",
      source: "Anthropic Blog",
      score: 93,
      summary: "MCP 2.0 引入了流式传输和双向通信支持。",
      points: ["流式工具调用", "OAuth 认证"],
      images: [],
      audioStart: 320,
      audioDuration: 130,
    },
    {
      rank: 4,
      type: "quick",
      title: "Google 发布 Gemini 2.5 Flash API 更新",
      source: "Google Developers Blog",
      score: 92,
      oneLiner: "新增多模态输入和更长上下文窗口，价格降低 30%",
      images: [],
      audioStart: 450,
      audioDuration: 18,
    },
    {
      rank: 5,
      type: "quick",
      title: "独立开发者用 AI 三天搭建完整 SaaS",
      source: "Hacker News",
      score: 91,
      oneLiner: "从需求分析到部署上线全程 AI 辅助",
      images: [],
      audioStart: 468,
      audioDuration: 18,
    },
  ],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BestBlogsPodcast"
        component={BestBlogsPodcast}
        durationInFrames={defaultProps.totalDuration * FPS}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
      />
    </>
  );
};
