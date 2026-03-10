export interface DeepSlide {
  type: "cover" | "problem" | "point" | "quote" | "takeaway" | "source-card";
  text: string;
  subText?: string; // secondary text (source, author, etc.)
  image?: string; // image path relative to Remotion public/
  durationRatio: number; // fraction of total item audioDuration (0-1, all slides sum to 1.0)
}

export interface VideoItem {
  rank: number;
  type: "deep" | "quick";
  resourceType?: "ARTICLE" | "PODCAST" | "VIDEO" | "TWITTER";
  title: string;
  source: string;
  author?: string;
  score: number;
  summary?: string;
  points?: string[];
  quote?: string;
  oneLiner?: string;
  images: string[];
  slides?: DeepSlide[]; // sub-scenes for deep items, each 8-15s
  audioStart: number;
  audioDuration: number;
}

export interface VideoData {
  date: string;
  keywords: string[];
  brandName: string;
  brandSlogan: string;
  audioFile: string;
  totalDuration: number;
  items: VideoItem[];
}

// BestBlogs brand colors
export const COLORS = {
  inkBlue: "#1a365d",
  amber: "#d97706",
  cream: "#fefdfb",
  charcoal: "#374151",
  midGray: "#6b7280",
  lightGray: "#e5e7eb",
  lightBlue: "#f0f4f8",
  amberBg: "rgba(217,119,6,0.06)",
} as const;

export const FONTS = {
  serif: "Georgia, 'Noto Serif SC', serif",
  sans: "-apple-system, 'PingFang SC', 'Noto Sans SC', 'Helvetica Neue', sans-serif",
  mono: "'Inter', 'SF Mono', monospace",
} as const;
