#!/usr/bin/env bun

import path from "node:path";
import process from "node:process";
import { homedir } from "node:os";
import { loadCoverImageConfig } from "../shared/cover_image_config";

type Command = "paths" | "read";

function printResult(payload: Record<string, unknown>): void {
  console.log(JSON.stringify(payload, null, 2));
}

function buildPaths(cwd: string, homeDir: string): Record<string, string> {
  return {
    projectConfig: path.join(cwd, ".gino-skills", "cover-image", "config.json"),
    userConfig: path.join(homeDir, ".gino-skills", "cover-image", "config.json"),
    projectLegacy: path.join(cwd, ".gino-skills", "cover-image", "EXTEND.md"),
    userLegacy: path.join(homeDir, ".gino-skills", "cover-image", "EXTEND.md"),
  };
}

function parseCommand(argv: string[]): Command {
  const command = (argv[0] ?? "read") as Command;
  if (command !== "paths" && command !== "read") {
    throw new Error(`Unknown command: ${command}`);
  }
  return command;
}

try {
  const command = parseCommand(process.argv.slice(2));
  const cwd = process.cwd();
  const homeDir = homedir();

  if (command === "paths") {
    printResult({
      ok: true,
      action: "config.cover_image_state",
      items: [buildPaths(cwd, homeDir)],
      write: null,
      verify: null,
      note: null,
      meta: { command },
    });
    process.exit(0);
  }

  const loaded = loadCoverImageConfig({ cwd, homeDir });
  printResult({
    ok: true,
    action: "config.cover_image_state",
    items: [
      {
        source: loaded.source,
        path: loaded.path,
        config: loaded.config,
      },
    ],
    write: null,
    verify: null,
    note: loaded.source === "defaults" ? "No config found. Run first-time setup to save config.json." : null,
    meta: { command },
  });
  process.exit(0);
} catch (error) {
  const err = error as Error;
  printResult({
    ok: false,
    action: "config.cover_image_state",
    items: [],
    write: null,
    verify: null,
    note: err.message,
    meta: { error: { type: err.name, message: err.message } },
  });
  process.exit(1);
}
