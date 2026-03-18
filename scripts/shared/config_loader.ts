import fs from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

export type ConfigSource =
  | "project-config"
  | "user-config"
  | "project-legacy-config"
  | "user-legacy-config"
  | "project-extend"
  | "user-extend"
  | "project-legacy-extend"
  | "user-legacy-extend"
  | "defaults";

export interface LoadedConfig<T> {
  config: Partial<T>;
  source: ConfigSource;
  path: string | null;
}

interface Candidate {
  source: ConfigSource;
  path: string;
  format: "json" | "legacy";
}

export interface LoadConfigOptions<T> {
  skillName: string;
  legacySkillNames?: string[];
  cwd?: string;
  homeDir?: string;
  parseJson?: (data: unknown) => Partial<T>;
  parseLegacy: (content: string) => Partial<T>;
}

function configPath(baseDir: string, skillName: string): string {
  return path.join(baseDir, ".gino-skills", skillName, "config.json");
}

function extendPath(baseDir: string, skillName: string): string {
  return path.join(baseDir, ".gino-skills", skillName, "EXTEND.md");
}

function buildCandidates(skillName: string, legacySkillNames: string[], cwd: string, homeDir: string): Candidate[] {
  const projectCurrentConfig: Candidate = {
    source: "project-config",
    path: configPath(cwd, skillName),
    format: "json",
  };
  const userCurrentConfig: Candidate = {
    source: "user-config",
    path: configPath(homeDir, skillName),
    format: "json",
  };

  const projectLegacyConfig = legacySkillNames.map((legacyName) => ({
    source: "project-legacy-config" as const,
    path: configPath(cwd, legacyName),
    format: "json" as const,
  }));
  const userLegacyConfig = legacySkillNames.map((legacyName) => ({
    source: "user-legacy-config" as const,
    path: configPath(homeDir, legacyName),
    format: "json" as const,
  }));
  const projectCurrentExtend: Candidate = {
    source: "project-extend",
    path: extendPath(cwd, skillName),
    format: "legacy",
  };
  const userCurrentExtend: Candidate = {
    source: "user-extend",
    path: extendPath(homeDir, skillName),
    format: "legacy",
  };
  const projectLegacyExtend = legacySkillNames.map((legacyName) => ({
    source: "project-legacy-extend" as const,
    path: extendPath(cwd, legacyName),
    format: "legacy" as const,
  }));
  const userLegacyExtend = legacySkillNames.map((legacyName) => ({
    source: "user-legacy-extend" as const,
    path: extendPath(homeDir, legacyName),
    format: "legacy" as const,
  }));

  return [
    projectCurrentConfig,
    userCurrentConfig,
    ...projectLegacyConfig,
    ...userLegacyConfig,
    projectCurrentExtend,
    userCurrentExtend,
    ...projectLegacyExtend,
    ...userLegacyExtend,
  ];
}

function defaultJsonParser<T>(data: unknown): Partial<T> {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Config JSON must be an object.");
  }
  return data as Partial<T>;
}

export function loadConfigWithLegacy<T>(options: LoadConfigOptions<T>): LoadedConfig<T> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const homeDir = path.resolve(options.homeDir ?? homedir());
  const legacySkillNames = options.legacySkillNames ?? [];
  const parseJson = options.parseJson ?? defaultJsonParser<T>;

  for (const candidate of buildCandidates(options.skillName, legacySkillNames, cwd, homeDir)) {
    if (!fs.existsSync(candidate.path)) {
      continue;
    }

    const content = fs.readFileSync(candidate.path, "utf8");
    const config =
      candidate.format === "json"
        ? parseJson(JSON.parse(content))
        : options.parseLegacy(content);

    return {
      config,
      source: candidate.source,
      path: candidate.path,
    };
  }

  return {
    config: {},
    source: "defaults",
    path: null,
  };
}
