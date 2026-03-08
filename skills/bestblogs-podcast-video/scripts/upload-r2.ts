#!/usr/bin/env bun
/**
 * Upload podcast/video files to Cloudflare R2.
 * Extended from image-gen's upload-r2.ts to support audio/video MIME types.
 *
 * Usage:
 *   bun run upload-r2.ts <local-file> <r2-key>
 *   bun run upload-r2.ts podcast.mp3 podcast/2026-03-08/podcast.mp3
 *   bun run upload-r2.ts video.mp4 podcast/2026-03-08/video.mp4
 *   bun run upload-r2.ts --batch dir/ prefix/
 *
 * Environment variables (required):
 *   CLOUDFLARE_ACCOUNT_ID  - Cloudflare account ID
 *   R2_ACCESS_KEY_ID       - R2 access key
 *   R2_SECRET_ACCESS_KEY   - R2 secret key
 *   R2_BUCKET_NAME         - R2 bucket name
 *   R2_PUBLIC_URL          - Public base URL for the bucket
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join, extname } from "path";

const MIME_TYPES: Record<string, string> = {
  // Audio
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".opus": "audio/opus",
  ".m4a": "audio/mp4",
  // Video
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  // Images
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  // RSS
  ".xml": "application/rss+xml",
  // JSON
  ".json": "application/json",
};

function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

function getEnvOrExit(name: string): string {
  const val = process.env[name];
  if (!val) {
    console.error(`Missing environment variable: ${name}`);
    process.exit(1);
  }
  return val;
}

let s3: S3Client;
let BUCKET_NAME: string;
let PUBLIC_URL: string;

function initS3() {
  if (s3) return;
  const accountId = getEnvOrExit("CLOUDFLARE_ACCOUNT_ID");
  BUCKET_NAME = getEnvOrExit("R2_BUCKET_NAME");
  PUBLIC_URL = getEnvOrExit("R2_PUBLIC_URL").replace(/\/$/, "");
  s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: getEnvOrExit("R2_ACCESS_KEY_ID"),
      secretAccessKey: getEnvOrExit("R2_SECRET_ACCESS_KEY"),
    },
  });
}

async function upload(
  localPath: string,
  key: string,
  overwrite: boolean = false
): Promise<string> {
  initS3();
  if (!overwrite) {
    try {
      await s3.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
      console.log(`Already exists: ${PUBLIC_URL}/${key}`);
      return `${PUBLIC_URL}/${key}`;
    } catch {
      // Object doesn't exist, proceed with upload
    }
  }

  const body = readFileSync(localPath);
  const contentType = getMimeType(localPath);

  // Audio/video files get shorter cache (they may be re-generated)
  const isMedia =
    contentType.startsWith("audio/") || contentType.startsWith("video/");
  const cacheControl = isMedia
    ? "public, max-age=86400"
    : "public, max-age=31536000";

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    })
  );

  const url = `${PUBLIC_URL}/${key}`;
  console.log(`Uploaded: ${localPath} -> ${url} (${contentType})`);
  return url;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    console.log(`Upload files to Cloudflare R2

Usage:
  bun run upload-r2.ts <local-file> <r2-key>
  bun run upload-r2.ts --batch <local-dir> <r2-prefix>
  bun run upload-r2.ts --overwrite <local-file> <r2-key>

Examples:
  bun run upload-r2.ts podcast.mp3 podcast/2026-03-08/podcast.mp3
  bun run upload-r2.ts video.mp4 podcast/2026-03-08/video.mp4
  bun run upload-r2.ts podcast.xml podcast/podcast.xml`);
    process.exit(0);
  }

  const overwrite = args[0] === "--overwrite";
  const effectiveArgs = overwrite ? args.slice(1) : args;

  if (effectiveArgs[0] === "--batch") {
    const dir = effectiveArgs[1];
    const prefix = (effectiveArgs[2] || "").replace(/\/$/, "");
    if (!dir || !existsSync(dir)) {
      console.error(`Directory not found: ${dir}`);
      process.exit(1);
    }

    const files = readdirSync(dir).filter((f) => {
      const ext = extname(f).toLowerCase();
      return ext in MIME_TYPES;
    });

    const results: Record<string, string> = {};
    for (const file of files) {
      const localPath = join(dir, file);
      const key = prefix ? `${prefix}/${file}` : file;
      results[file] = await upload(localPath, key, overwrite);
    }

    console.log("\nUpload results:");
    console.log(JSON.stringify(results, null, 2));
  } else {
    const localPath = effectiveArgs[0];
    const key = effectiveArgs[1];
    if (!localPath || !key) {
      console.error("Usage: upload-r2.ts <local-file> <r2-key>");
      process.exit(1);
    }
    if (!existsSync(localPath)) {
      console.error(`File not found: ${localPath}`);
      process.exit(1);
    }
    await upload(localPath, key, overwrite);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
