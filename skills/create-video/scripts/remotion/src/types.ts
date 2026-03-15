// --- Avatar & Overlay Configs ---

export interface AvatarConfig {
  enabled: boolean;
  idleImage: string;
  speakingImage: string;
  pointingImage?: string;
  scale?: number;
  opacity?: number;
}

export interface LowerThirdConfig {
  enabled: boolean;
  showProgress: boolean;
}

export interface DataVizElement {
  type: "progress-bar" | "bar-chart" | "counter" | "highlight";
  label: string;
  value: number;
  maxValue?: number;
  unit?: string;
  items?: Array<{ label: string; value: number }>;
}

// --- Slide & Item Types ---

export interface DeepSlide {
  type: "cover" | "problem" | "point" | "quote" | "takeaway" | "source-card";
  text: string;
  subText?: string;
  image?: string;
  durationRatio: number;
  layout?: "full" | "multi-region";
  sidePanel?: string[];
  sectionTitle?: string;
  hideAvatar?: boolean;
  dataViz?: DataVizElement[];
}

export interface VideoItem {
  rank: number;
  type: "deep" | "quick";
  resourceType?: "ARTICLE" | "PODCAST" | "VIDEO" | "TWITTER";
  title: string;
  source: string;
  author?: string;
  score?: number;
  summary?: string;
  points?: string[];
  quote?: string;
  oneLiner?: string;
  images: string[];
  slides?: DeepSlide[];
  audioStart: number;
  audioDuration: number;
  sectionLabel?: string;
}

export type NarrativeStrategy =
  | "standard"        // 策略一：标准精讲 + 速览
  | "deep-focus"      // 策略二：深度聚焦
  | "theme-thread"    // 策略三：主题串联
  | "comparative"     // 策略四：对比分析
  | "trend-signals"   // 策略五：趋势信号
  | "hands-on";       // 策略六：实操拆解

export interface VideoData {
  title: string;
  subtitle?: string;
  date: string;
  keywords: string[];
  strategy?: NarrativeStrategy;
  quickReviewTitle?: string;
  brandName?: string;
  brandSlogan?: string;
  audioFile?: string;
  totalDuration: number;
  items: VideoItem[];
  avatar?: AvatarConfig;
  lowerThird?: LowerThirdConfig;
}

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
