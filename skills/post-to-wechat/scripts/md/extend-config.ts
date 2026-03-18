import { homedir } from "node:os";
import type { ExtendConfig } from "./types.js";
import { loadConfigWithLegacy } from "../../../../scripts/shared/config_loader";

function extractYamlFrontMatter(content: string): string | null {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*$/m);
  return match ? match[1]! : null;
}

function parseExtendYaml(yaml: string): Partial<ExtendConfig> {
  const config: Partial<ExtendConfig> = {};
  for (const line of yaml.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx < 0) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    let value = trimmed.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (value === "null" || value === "") continue;

    if (key === "default_theme") config.default_theme = value;
    else if (key === "default_color") config.default_color = value;
    else if (key === "default_font_family") config.default_font_family = value;
    else if (key === "default_font_size") config.default_font_size = value.endsWith("px") ? value : `${value}px`;
    else if (key === "default_code_theme") config.default_code_theme = value;
    else if (key === "mac_code_block") config.mac_code_block = value === "true";
    else if (key === "show_line_number") config.show_line_number = value === "true";
    else if (key === "cite") config.cite = value === "true";
    else if (key === "count") config.count = value === "true";
    else if (key === "legend") config.legend = value;
    else if (key === "keep_title") config.keep_title = value === "true";
  }
  return config;
}

function coerceString(value: unknown, allowEmpty = false): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return allowEmpty ? "" : null;
  }
  return trimmed;
}

function coerceBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
  }
  return null;
}

function parseJsonConfig(data: unknown): Partial<ExtendConfig> {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("post-to-wechat config.json must contain an object.");
  }

  const raw = data as Record<string, unknown>;
  const fontSize = coerceString(raw.default_font_size);

  return {
    default_theme: coerceString(raw.default_theme),
    default_color: coerceString(raw.default_color),
    default_font_family: coerceString(raw.default_font_family),
    default_font_size: fontSize ? (fontSize.endsWith("px") ? fontSize : `${fontSize}px`) : null,
    default_code_theme: coerceString(raw.default_code_theme),
    mac_code_block: coerceBoolean(raw.mac_code_block),
    show_line_number: coerceBoolean(raw.show_line_number),
    cite: coerceBoolean(raw.cite),
    count: coerceBoolean(raw.count),
    legend: coerceString(raw.legend),
    keep_title: coerceBoolean(raw.keep_title),
  };
}

function parseLegacyConfig(content: string): Partial<ExtendConfig> {
  const yaml = extractYamlFrontMatter(content);
  return yaml ? parseExtendYaml(yaml) : {};
}

export function loadExtendConfig(): Partial<ExtendConfig> {
  return loadConfigWithLegacy<ExtendConfig>({
    skillName: "post-to-wechat",
    legacySkillNames: ["baoyu-markdown-to-html"],
    cwd: process.cwd(),
    homeDir: homedir(),
    parseJson: parseJsonConfig,
    parseLegacy: parseLegacyConfig,
  }).config;
}
