import { homedir } from "node:os";
import type { LoadedConfig } from "./config_loader";
import { loadConfigWithLegacy } from "./config_loader";
import { coerceBoolean, coerceNumber, coerceString, extractYamlFrontMatter, readSectionScalars, readTopLevelScalar } from "./legacy_frontmatter";

export interface CoverImageConfig {
  version?: number | null;
  watermark?: {
    enabled?: boolean | null;
    content?: string | null;
    position?: string | null;
    opacity?: number | null;
  };
  preferred_type?: string | null;
  preferred_palette?: string | null;
  preferred_rendering?: string | null;
  preferred_text?: string | null;
  preferred_mood?: string | null;
  default_aspect?: string | null;
  default_output_dir?: string | null;
  quick_mode?: boolean | null;
  language?: string | null;
}

function parseJsonConfig(data: unknown): Partial<CoverImageConfig> {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("cover-image config.json must contain an object.");
  }

  const raw = data as Record<string, unknown>;
  const rawWatermark = raw.watermark && typeof raw.watermark === "object" && !Array.isArray(raw.watermark) ? (raw.watermark as Record<string, unknown>) : undefined;

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
    preferred_type: coerceString(raw.preferred_type),
    preferred_palette: coerceString(raw.preferred_palette),
    preferred_rendering: coerceString(raw.preferred_rendering),
    preferred_text: coerceString(raw.preferred_text),
    preferred_mood: coerceString(raw.preferred_mood),
    default_aspect: coerceString(raw.default_aspect),
    default_output_dir: coerceString(raw.default_output_dir),
    quick_mode: coerceBoolean(raw.quick_mode),
    language: coerceString(raw.language),
  };
}

function parseLegacyConfig(content: string): Partial<CoverImageConfig> {
  const yaml = extractYamlFrontMatter(content);
  if (!yaml) {
    return {};
  }

  const watermark = readSectionScalars(yaml, "watermark");

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
    preferred_type: coerceString(readTopLevelScalar(yaml, "preferred_type")),
    preferred_palette: coerceString(readTopLevelScalar(yaml, "preferred_palette")),
    preferred_rendering: coerceString(readTopLevelScalar(yaml, "preferred_rendering")),
    preferred_text: coerceString(readTopLevelScalar(yaml, "preferred_text")),
    preferred_mood: coerceString(readTopLevelScalar(yaml, "preferred_mood")),
    default_aspect: coerceString(readTopLevelScalar(yaml, "default_aspect")),
    default_output_dir: coerceString(readTopLevelScalar(yaml, "default_output_dir")),
    quick_mode: coerceBoolean(readTopLevelScalar(yaml, "quick_mode")),
    language: coerceString(readTopLevelScalar(yaml, "language")),
  };
}

export function loadCoverImageConfig(options?: { cwd?: string; homeDir?: string }): LoadedConfig<CoverImageConfig> {
  return loadConfigWithLegacy<CoverImageConfig>({
    skillName: "cover-image",
    cwd: options?.cwd,
    homeDir: options?.homeDir ?? homedir(),
    parseJson: parseJsonConfig,
    parseLegacy: parseLegacyConfig,
  });
}
