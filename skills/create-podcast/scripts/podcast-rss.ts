#!/usr/bin/env bun
/**
 * Generate/update podcast RSS feed from episode metadata.
 *
 * Usage:
 *   bun run podcast-rss.ts --metadata metadata.json --feed podcast.xml --base-url https://cdn.example.com/podcast
 *   bun run podcast-rss.ts --metadata metadata.json --feed podcast.xml --base-url https://cdn.example.com/podcast --upload
 *
 * Options:
 *   --metadata <path>     Episode metadata JSON file (required)
 *   --feed <path>         RSS feed XML file path (created if not exists)
 *   --base-url <url>      Base URL for media files
 *   --upload              Upload updated feed to R2 after generation
 *   --help                Show help
 *
 * Metadata JSON format:
 *   {
 *     "date": "2026-03-08",
 *     "title": "BestBlogs 早报 | 2026-03-08",
 *     "description": "今日关键词: AI Coding, Claude 4...",
 *     "duration": 632,
 *     "audioFile": "podcast/2026-03-08/podcast.mp3",
 *     "audioSize": 7584000,
 *     "keywords": ["AI Coding", "Claude 4"],
 *     "items": [{ "rank": 1, "title": "...", "source": "..." }]
 *   }
 */

import { readFileSync, writeFileSync, existsSync, realpathSync } from "fs";
import { join } from "path";

interface EpisodeMetadata {
  date: string;
  title: string;
  description: string;
  duration: number;
  audioFile: string;
  audioSize: number;
  keywords: string[];
  series?: string; // "daily" | "weekly" | "article" — defaults to "daily"
  slug?: string; // for article series, e.g. "claude-code-deep-dive"
  items: { rank: number; title: string; source: string }[];
}

interface CliArgs {
  metadata: string | null;
  feed: string;
  baseUrl: string;
  upload: boolean;
  help: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    metadata: null,
    feed: "podcast.xml",
    baseUrl: "",
    upload: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--metadata":
        result.metadata = args[++i];
        break;
      case "--feed":
        result.feed = args[++i];
        break;
      case "--base-url":
        result.baseUrl = args[++i]?.replace(/\/$/, "") || "";
        break;
      case "--upload":
        result.upload = true;
        break;
      case "--help":
        result.help = true;
        break;
    }
  }

  return result;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatPubDate(dateStr: string): string {
  // Convert "2026-03-08" to RFC 2822 format
  const date = new Date(`${dateStr}T09:00:00+08:00`);
  return date.toUTCString();
}

/**
 * Build a unique GUID for the episode.
 * Supports multiple series: daily, weekly, article.
 * Backward compatible with existing "bestblogs-daily-{date}" GUIDs.
 */
function buildGuid(meta: EpisodeMetadata): string {
  const series = meta.series || "daily";
  if (series === "article" && meta.slug) {
    return `bestblogs-article-${meta.slug}`;
  }
  return `bestblogs-${series}-${meta.date}`;
}

function buildEpisodeItem(meta: EpisodeMetadata, baseUrl: string): string {
  const audioUrl = `${baseUrl}/${meta.audioFile}`;
  const description = buildEpisodeDescription(meta);

  return `    <item>
      <title>${escapeXml(meta.title)}</title>
      <description><![CDATA[${description}]]></description>
      <pubDate>${formatPubDate(meta.date)}</pubDate>
      <enclosure url="${escapeXml(audioUrl)}" length="${meta.audioSize}" type="audio/mpeg"/>
      <itunes:duration>${formatDuration(meta.duration)}</itunes:duration>
      <itunes:episode>${dateToEpisodeNumber(meta.date)}</itunes:episode>
      <itunes:keywords>${meta.keywords.map(escapeXml).join(", ")}</itunes:keywords>
      <guid isPermaLink="false">${buildGuid(meta)}</guid>
    </item>`;
}

function buildEpisodeDescription(meta: EpisodeMetadata): string {
  const lines = [`${meta.description}\n\n今日内容:\n`];
  for (const item of meta.items) {
    lines.push(`${item.rank}. ${item.title} — ${item.source}`);
  }
  lines.push("\n\nBestBlogs.dev - 遇见更好的技术阅读");
  return lines.join("\n");
}

function dateToEpisodeNumber(dateStr: string): number {
  const date = new Date(dateStr);
  const start = new Date("2026-01-01");
  return Math.floor((date.getTime() - start.getTime()) / 86400000) + 1;
}

function buildFeedXml(items: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>BestBlogs 每日早报</title>
    <link>https://bestblogs.dev</link>
    <language>zh-cn</language>
    <description>每天 10 分钟，了解 AI 和技术领域最值得关注的内容。由 BestBlogs.dev 智能筛选，用声音为你讲述。</description>
    <itunes:author>BestBlogs</itunes:author>
    <itunes:owner>
      <itunes:name>BestBlogs</itunes:name>
    </itunes:owner>
    <itunes:category text="Technology"/>
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
${items.join("\n")}
  </channel>
</rss>`;
}

function extractExistingItems(feedXml: string): string[] {
  const items: string[] = [];
  const itemRegex = /<item>[\s\S]*?<\/item>/g;
  let match;
  while ((match = itemRegex.exec(feedXml)) !== null) {
    items.push(`    ${match[0].trim()}`);
  }
  return items;
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    console.log(`Podcast RSS feed generator

Usage:
  bun run podcast-rss.ts --metadata metadata.json --feed podcast.xml --base-url https://cdn.example.com/podcast

Options:
  --metadata <path>     Episode metadata JSON (required)
  --feed <path>         RSS feed file (default: podcast.xml)
  --base-url <url>      Base URL for media files
  --upload              Upload feed to R2
  --help                Show this help`);
    process.exit(0);
  }

  if (!args.metadata) {
    console.error("--metadata is required");
    process.exit(1);
  }

  if (!args.baseUrl) {
    console.error("--base-url is required");
    process.exit(1);
  }

  // Read metadata
  const meta: EpisodeMetadata = JSON.parse(
    readFileSync(args.metadata, "utf-8")
  );
  console.log(`Episode: ${meta.title} (${formatDuration(meta.duration)})`);

  // Build new episode item
  const newItem = buildEpisodeItem(meta, args.baseUrl);

  // Read existing feed or start fresh
  let existingItems: string[] = [];
  if (existsSync(args.feed)) {
    const feedContent = readFileSync(args.feed, "utf-8");
    existingItems = extractExistingItems(feedContent);

    // Check for duplicate
    const guid = buildGuid(meta);
    if (feedContent.includes(guid)) {
      console.log(`Episode ${meta.date} already exists in feed, updating...`);
      existingItems = existingItems.filter((item) => !item.includes(guid));
    }
  }

  // Add new item at the top (most recent first)
  const allItems = [newItem, ...existingItems];

  // Keep last 90 episodes max
  const trimmedItems = allItems.slice(0, 90);

  // Write feed
  const feedXml = buildFeedXml(trimmedItems);
  writeFileSync(args.feed, feedXml);
  console.log(`Feed updated: ${args.feed} (${trimmedItems.length} episodes)`);

  // Upload to R2 if requested
  if (args.upload) {
    const r2Key = "podcast/podcast.xml";
    console.log(`Uploading feed to R2: ${r2Key}`);

    // Use our own upload-r2.ts
    const scriptDir = new URL(".", import.meta.url).pathname;
    const uploadScript = join(scriptDir, "upload-r2.ts");

    const proc = Bun.spawn(
      ["bun", "run", uploadScript, "--overwrite", args.feed, r2Key],
      { stdout: "inherit", stderr: "inherit" }
    );
    await proc.exited;
  }
}

function findSkillDir(skillName: string): string | null {
  const paths = [
    `${process.env.HOME}/.claude/skills/${skillName}`,
    `${process.env.HOME}/.claude/skills/baoyu-${skillName}`,
  ];

  for (const p of paths) {
    if (existsSync(p)) {
      try {
        return realpathSync(p);
      } catch {
        return p;
      }
    }
  }
  return null;
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
