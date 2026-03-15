#!/usr/bin/env bun
/**
 * Fish.audio TTS synthesis script.
 *
 * Modes:
 *   1. Single text: --text "..." --output segment.mp3
 *   2. Script file: --script script.md --output-dir segments/
 *      Splits by <!-- SEGMENT: name --> markers and synthesizes each segment.
 *
 * Environment variables (required):
 *   FISH_AUDIO_API_KEY   - Fish.audio API key
 *   FISH_AUDIO_VOICE_ID  - Cloned voice model ID
 *
 * Options:
 *   --text <string>        Text to synthesize (mode 1)
 *   --script <path>        Script file with SEGMENT markers (mode 2)
 *   --output <path>        Output file path (mode 1)
 *   --output-dir <path>    Output directory for segments (mode 2)
 *   --voice-id <id>        Override FISH_AUDIO_VOICE_ID
 *   --rate <float>         Speech speed, default 1.0
 *   --format <string>      Audio format: mp3 (default), wav, opus
 *   --bitrate <int>        MP3 bitrate, default 192
 *   --merge <path>         After synthesizing segments, merge into this file
 *   --help                 Show help
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, basename, resolve } from "path";

const API_URL = "https://api.fish.audio/v1/tts";

interface Segment {
  name: string;
  text: string;
}

interface CliArgs {
  text: string | null;
  script: string | null;
  output: string | null;
  outputDir: string | null;
  voiceId: string;
  rate: number;
  format: string;
  bitrate: number;
  merge: string | null;
  help: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    text: null,
    script: null,
    output: null,
    outputDir: null,
    voiceId: process.env.FISH_AUDIO_VOICE_ID || "",
    rate: 1.0,
    format: "mp3",
    bitrate: 192,
    merge: null,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--text":
        result.text = args[++i];
        break;
      case "--script":
        result.script = args[++i];
        break;
      case "--output":
        result.output = args[++i];
        break;
      case "--output-dir":
        result.outputDir = args[++i];
        break;
      case "--voice-id":
        result.voiceId = args[++i];
        break;
      case "--rate":
        result.rate = parseFloat(args[++i]);
        break;
      case "--format":
        result.format = args[++i];
        break;
      case "--bitrate":
        result.bitrate = parseInt(args[++i], 10);
        break;
      case "--merge":
        result.merge = args[++i];
        break;
      case "--help":
        result.help = true;
        break;
    }
  }

  return result;
}

function showHelp(): void {
  console.log(`Fish.audio TTS synthesis script

Usage:
  bun run fish-tts.ts --text "Hello world" --output hello.mp3
  bun run fish-tts.ts --script script.md --output-dir segments/
  bun run fish-tts.ts --script script.md --output-dir segments/ --merge podcast.mp3

Options:
  --text <string>        Text to synthesize (single mode)
  --script <path>        Script file with <!-- SEGMENT: name --> markers
  --output <path>        Output file (single mode)
  --output-dir <path>    Output directory (script mode)
  --voice-id <id>        Override FISH_AUDIO_VOICE_ID env var
  --rate <float>         Speech speed (default: 1.0)
  --format <string>      Audio format: mp3, wav, opus (default: mp3)
  --bitrate <int>        MP3 bitrate (default: 192)
  --merge <path>         Merge all segments into single file (requires ffmpeg)
  --help                 Show this help

Environment:
  FISH_AUDIO_API_KEY     Fish.audio API key (required)
  FISH_AUDIO_VOICE_ID    Default voice model ID`);
}

function parseScript(filePath: string): Segment[] {
  const content = readFileSync(filePath, "utf-8");
  const segments: Segment[] = [];
  const markerRegex = /<!--\s*SEGMENT:\s*(\S+)\s*-->/g;

  let lastIndex = 0;
  let lastName = "";
  let match: RegExpExecArray | null;

  while ((match = markerRegex.exec(content)) !== null) {
    if (lastName && lastIndex < match.index) {
      const text = content.slice(lastIndex, match.index).trim();
      if (text) {
        segments.push({ name: lastName, text });
      }
    }
    lastName = match[1];
    lastIndex = match.index + match[0].length;
  }

  // Last segment
  if (lastName) {
    const text = content.slice(lastIndex).trim();
    if (text) {
      segments.push({ name: lastName, text });
    }
  }

  // If no markers found, treat entire content as one segment
  if (segments.length === 0) {
    const text = content.trim();
    if (text) {
      segments.push({ name: "full", text });
    }
  }

  return segments;
}

async function synthesize(
  text: string,
  voiceId: string,
  rate: number,
  format: string,
  bitrate: number
): Promise<ArrayBuffer> {
  const apiKey = process.env.FISH_AUDIO_API_KEY;
  if (!apiKey) {
    console.error("Missing environment variable: FISH_AUDIO_API_KEY");
    process.exit(1);
  }

  const body: Record<string, unknown> = {
    text,
    reference_id: voiceId,
    model: "s2-pro",
    format,
    normalize: true,
    latency: "normal",
    prosody: { speed: rate },
    repetition_penalty: 1.2,
    condition_on_previous_chunks: true,
  };

  if (format === "mp3") {
    body.mp3_bitrate = bitrate;
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Fish.audio API error ${response.status}: ${response.statusText}. ${errorText}`
    );
  }

  return await response.arrayBuffer();
}

async function synthesizeWithRetry(
  text: string,
  voiceId: string,
  rate: number,
  format: string,
  bitrate: number,
  retries: number = 1
): Promise<ArrayBuffer> {
  try {
    return await synthesize(text, voiceId, rate, format, bitrate);
  } catch (err) {
    if (retries > 0 && err instanceof Error && err.message.includes("429")) {
      console.log("  Rate limited, waiting 10s before retry...");
      await new Promise((resolve) => setTimeout(resolve, 10000));
      return synthesizeWithRetry(text, voiceId, rate, format, bitrate, retries - 1);
    }
    if (retries > 0) {
      console.log("  Retrying once...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return synthesizeWithRetry(text, voiceId, rate, format, bitrate, retries - 1);
    }
    throw err;
  }
}

async function mergeSegments(
  outputDir: string,
  segmentNames: string[],
  format: string,
  mergePath: string
): Promise<void> {
  const fileListPath = join(outputDir, "filelist.txt");
  const lines = segmentNames.map(
    (name) => `file '${name}.${format}'`
  );
  writeFileSync(fileListPath, lines.join("\n"));

  // Resolve merge path to absolute so it works with cwd=outputDir
  const absoluteMergePath = resolve(mergePath);

  const proc = Bun.spawn(
    [
      "ffmpeg",
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      "filelist.txt",
      "-af",
      "loudnorm=I=-16:TP=-1.5:LRA=11",
      "-ar",
      "44100",
      "-b:a",
      "192k",
      absoluteMergePath,
    ],
    {
      cwd: outputDir,
      stdout: "pipe",
      stderr: "pipe",
    }
  );

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`FFmpeg merge failed (exit ${exitCode}): ${stderr}`);
  }

  console.log(`Merged ${segmentNames.length} segments -> ${mergePath}`);
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  if (!args.voiceId) {
    console.error(
      "No voice ID specified. Set FISH_AUDIO_VOICE_ID or use --voice-id."
    );
    process.exit(1);
  }

  // Mode 1: Single text
  if (args.text) {
    if (!args.output) {
      console.error("--output is required with --text");
      process.exit(1);
    }

    console.log(
      `Synthesizing ${args.text.length} chars -> ${args.output}`
    );
    const audio = await synthesizeWithRetry(
      args.text,
      args.voiceId,
      args.rate,
      args.format,
      args.bitrate
    );
    writeFileSync(args.output, Buffer.from(audio));
    console.log(`Done: ${args.output} (${(audio.byteLength / 1024).toFixed(0)} KB)`);
    return;
  }

  // Mode 2: Script file
  if (args.script) {
    if (!args.outputDir) {
      console.error("--output-dir is required with --script");
      process.exit(1);
    }

    if (!existsSync(args.script)) {
      console.error(`Script file not found: ${args.script}`);
      process.exit(1);
    }

    mkdirSync(args.outputDir, { recursive: true });

    const segments = parseScript(args.script);
    console.log(`Parsed ${segments.length} segments from ${args.script}`);

    const segmentNames: string[] = [];
    const results: { name: string; chars: number; size: number; status: string }[] = [];

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const outFile = join(args.outputDir, `${seg.name}.${args.format}`);
      console.log(
        `[${i + 1}/${segments.length}] ${seg.name} (${seg.text.length} chars)...`
      );

      try {
        const audio = await synthesizeWithRetry(
          seg.text,
          args.voiceId,
          args.rate,
          args.format,
          args.bitrate
        );
        writeFileSync(outFile, Buffer.from(audio));
        segmentNames.push(seg.name);
        results.push({
          name: seg.name,
          chars: seg.text.length,
          size: audio.byteLength,
          status: "ok",
        });
        console.log(
          `  -> ${outFile} (${(audio.byteLength / 1024).toFixed(0)} KB)`
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({
          name: seg.name,
          chars: seg.text.length,
          size: 0,
          status: `error: ${msg}`,
        });
        console.error(`  ❌ Failed: ${msg}`);
      }
    }

    // Summary
    console.log("\nSynthesis results:");
    for (const r of results) {
      const sizeStr = r.size > 0 ? `${(r.size / 1024).toFixed(0)} KB` : "N/A";
      console.log(`  ${r.status === "ok" ? "✅" : "❌"} ${r.name}: ${r.chars} chars, ${sizeStr}`);
    }

    const successCount = results.filter((r) => r.status === "ok").length;
    console.log(`\n${successCount}/${results.length} segments synthesized.`);

    // Merge if requested
    if (args.merge && segmentNames.length > 0) {
      console.log(`\nMerging segments...`);
      await mergeSegments(args.outputDir, segmentNames, args.format, args.merge);
    }

    // Output JSON summary for downstream use
    const jsonPath = join(args.outputDir, "synthesis-result.json");
    writeFileSync(
      jsonPath,
      JSON.stringify(
        {
          segments: results,
          totalChars: results.reduce((s, r) => s + r.chars, 0),
          totalSize: results.reduce((s, r) => s + r.size, 0),
          successCount,
          totalCount: results.length,
        },
        null,
        2
      )
    );

    return;
  }

  showHelp();
  process.exit(1);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
