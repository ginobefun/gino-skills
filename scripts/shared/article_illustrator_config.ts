import { homedir } from "node:os";
import type { LoadedConfig } from "./config_loader";
import { loadConfigWithLegacy } from "./config_loader";
import { coerceBoolean, coerceNumber, coerceString, extractYamlFrontMatter, readSectionScalars, readTopLevelScalar } from "./legacy_frontmatter";

export interface ArticleIllustratorConfig {
  version?: number | null;
  watermark?: {
    enabled?: boolean | null;
    content?: string | null;
    position?: string | null;
    opacity?: number | null;
  };
  preferred_style?: {
    name?: string | null;
    description?: string | null;
  };
  language?: string | null;
  default_output_dir?: string | null;
}

function parseJsonConfig(data: unknown): Partial<ArticleIllustratorConfig> {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("article-illustrator config.json must contain an object.");
  }

  const raw = data as Record<string, unknown>;
  const rawWatermark = raw.watermark && typeof raw.watermark === "object" && !Array.isArray(raw.watermark) ? (raw.watermark as Record<string, unknown>) : undefined;
  const rawPreferredStyle =
    raw.preferred_style && typeof raw.preferred_style === "object" && !Array.isArray(raw.preferred_style)
      ? (raw.preferred_style as Record<string, unknown>)
      : undefined;

  return {
    version: coerceNumber(raw.version),
    watermark: rawWatermark
      ? {
          enabled: coerceBoolean(rawWatermark.enabled),
          content: coerceString(rawWatermark.content),
          position: coerceString(rawWatermark.position),
          opacity: coerceNumber(rawWatermark.opacity),
        }
      : undefined,
    preferred_style: rawPreferredStyle
      ? {
          name: coerceString(rawPreferredStyle.name),
          description: coerceString(rawPreferredStyle.description),
        }
      : undefined,
    language: coerceString(raw.language),
    default_output_dir: coerceString(raw.default_output_dir),
  };
}

function parseLegacyConfig(content: string): Partial<ArticleIllustratorConfig> {
  const yaml = extractYamlFrontMatter(content);
  if (!yaml) {
    return {};
  }

  const watermark = readSectionScalars(yaml, "watermark");
  const preferredStyle = readSectionScalars(yaml, "preferred_style");

  return {
    version: coerceNumber(readTopLevelScalar(yaml, "version")),
    watermark:
      Object.keys(watermark).length > 0
        ? {
            enabled: coerceBoolean(watermark.enabled),
            content: coerceString(watermark.content),
            position: coerceString(watermark.position),
            opacity: coerceNumber(watermark.opacity),
          }
        : undefined,
    preferred_style:
      Object.keys(preferredStyle).length > 0
        ? {
            name: coerceString(preferredStyle.name),
            description: coerceString(preferredStyle.description),
          }
        : undefined,
    language: coerceString(readTopLevelScalar(yaml, "language")),
    default_output_dir: coerceString(readTopLevelScalar(yaml, "default_output_dir")),
  };
}

export function loadArticleIllustratorConfig(options?: { cwd?: string; homeDir?: string }): LoadedConfig<ArticleIllustratorConfig> {
  return loadConfigWithLegacy<ArticleIllustratorConfig>({
    skillName: "article-illustrator",
    cwd: options?.cwd,
    homeDir: options?.homeDir ?? homedir(),
    parseJson: parseJsonConfig,
    parseLegacy: parseLegacyConfig,
  });
}
