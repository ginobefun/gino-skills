import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, test } from "bun:test";
import { loadArticleIllustratorConfig } from "./article_illustrator_config";
import { loadConfigWithLegacy } from "./config_loader";
import { loadCoverImageConfig } from "./cover_image_config";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "config-loader-"));
  tempDirs.push(dir);
  return dir;
}

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

test("prefers project config.json over user legacy EXTEND", () => {
  const cwd = makeTempDir();
  const homeDir = makeTempDir();

  writeFile(
    path.join(cwd, ".gino-skills", "image-gen", "config.json"),
    JSON.stringify({ default_provider: "google", default_quality: "2k" }, null, 2),
  );
  writeFile(
    path.join(homeDir, ".gino-skills", "image-gen", "EXTEND.md"),
    "---\ndefault_provider: openai\n---\n",
  );

  const loaded = loadConfigWithLegacy<{ default_provider?: string; default_quality?: string }>({
    skillName: "image-gen",
    cwd,
    homeDir,
    parseLegacy: () => ({ default_provider: "openai" }),
  });

  expect(loaded.source).toBe("project-config");
  expect(loaded.config).toEqual({ default_provider: "google", default_quality: "2k" });
});

test("falls back to legacy current-name EXTEND when config is absent", () => {
  const cwd = makeTempDir();

  writeFile(
    path.join(cwd, ".gino-skills", "post-to-wechat", "EXTEND.md"),
    "---\ndefault_theme: modern\n---\n",
  );

  const loaded = loadConfigWithLegacy<{ default_theme?: string }>({
    skillName: "post-to-wechat",
    cwd,
    parseLegacy: () => ({ default_theme: "modern" }),
  });

  expect(loaded.source).toBe("project-extend");
  expect(loaded.config).toEqual({ default_theme: "modern" });
});

test("supports legacy skill aliases for old namespace migration", () => {
  const cwd = makeTempDir();

  writeFile(
    path.join(cwd, ".gino-skills", "baoyu-markdown-to-html", "EXTEND.md"),
    "---\ndefault_theme: grace\n---\n",
  );

  const loaded = loadConfigWithLegacy<{ default_theme?: string }>({
    skillName: "post-to-wechat",
    legacySkillNames: ["baoyu-markdown-to-html"],
    cwd,
    parseLegacy: () => ({ default_theme: "grace" }),
  });

  expect(loaded.source).toBe("project-legacy-extend");
  expect(loaded.config).toEqual({ default_theme: "grace" });
});

test("throws on invalid json config content", () => {
  const cwd = makeTempDir();

  writeFile(path.join(cwd, ".gino-skills", "image-gen", "config.json"), "{invalid-json");

  expect(() =>
    loadConfigWithLegacy({
      skillName: "image-gen",
      cwd,
      parseLegacy: () => ({}),
    }),
  ).toThrow();
});

test("cover-image loader prefers config.json and parses quick mode", () => {
  const cwd = makeTempDir();

  writeFile(
    path.join(cwd, ".gino-skills", "cover-image", "config.json"),
    JSON.stringify(
      {
        preferred_palette: "elegant",
        quick_mode: true,
        watermark: { enabled: true, content: "@gino" },
      },
      null,
      2,
    ),
  );

  const loaded = loadCoverImageConfig({ cwd, homeDir: makeTempDir() });

  expect(loaded.source).toBe("project-config");
  expect(loaded.config.preferred_palette).toBe("elegant");
  expect(loaded.config.quick_mode).toBe(true);
  expect(loaded.config.watermark?.content).toBe("@gino");
});

test("article-illustrator loader falls back to legacy EXTEND frontmatter", () => {
  const cwd = makeTempDir();

  writeFile(
    path.join(cwd, ".gino-skills", "article-illustrator", "EXTEND.md"),
    [
      "---",
      "version: 1",
      "watermark:",
      "  enabled: true",
      "  content: \"@demo\"",
      "preferred_style:",
      "  name: notion",
      "  description: \"Clean illustrations\"",
      "language: zh",
      "---",
      "",
    ].join("\n"),
  );

  const loaded = loadArticleIllustratorConfig({ cwd, homeDir: makeTempDir() });

  expect(loaded.source).toBe("project-extend");
  expect(loaded.config.preferred_style?.name).toBe("notion");
  expect(loaded.config.preferred_style?.description).toBe("Clean illustrations");
  expect(loaded.config.watermark?.enabled).toBe(true);
  expect(loaded.config.language).toBe("zh");
});
