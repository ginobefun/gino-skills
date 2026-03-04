import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

// ─── Image Copy ──────────────────────────────────────────────────────

const SUPPORTED_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

function resolvePath(filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

function inferMimeType(imagePath: string): string {
  const ext = path.extname(imagePath).toLowerCase();
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp',
  };
  return map[ext] ?? 'application/octet-stream';
}

async function runCommand(
  command: string,
  args: string[],
  opts?: { allowNonZeroExit?: boolean },
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on('data', (chunk) => stdoutChunks.push(Buffer.from(chunk)));
    child.stderr.on('data', (chunk) => stderrChunks.push(Buffer.from(chunk)));
    child.on('error', reject);
    child.on('close', (code) => {
      const result = {
        stdout: Buffer.concat(stdoutChunks).toString('utf8'),
        stderr: Buffer.concat(stderrChunks).toString('utf8'),
        exitCode: code ?? 0,
      };
      if (!opts?.allowNonZeroExit && result.exitCode !== 0) {
        const details = result.stderr.trim() || result.stdout.trim();
        reject(new Error(`Command failed (${command}): exit ${result.exitCode}${details ? `\n${details}` : ''}`));
      } else {
        resolve(result);
      }
    });
  });
}

async function commandExists(command: string): Promise<boolean> {
  const check = process.platform === 'win32' ? 'where' : 'which';
  const result = await runCommand(check, [command], { allowNonZeroExit: true });
  return result.exitCode === 0 && result.stdout.trim().length > 0;
}

async function runCommandWithFileStdin(command: string, args: string[], filePath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    const stderrChunks: Buffer[] = [];
    child.stderr.on('data', (chunk) => stderrChunks.push(Buffer.from(chunk)));
    child.on('error', reject);
    child.on('close', (code) => {
      if ((code ?? 0) !== 0) {
        const details = Buffer.concat(stderrChunks).toString('utf8').trim();
        reject(new Error(`Command failed (${command}): exit ${code}${details ? `\n${details}` : ''}`));
      } else {
        resolve();
      }
    });
    fs.createReadStream(filePath).on('error', reject).pipe(child.stdin);
  });
}

async function withTempDir<T>(prefix: string, fn: (tempDir: string) => Promise<T>): Promise<T> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), prefix));
  try {
    return await fn(tempDir);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

const SWIFT_SOURCE = `import AppKit
import Foundation

func die(_ message: String, _ code: Int32 = 1) -> Never {
  FileHandle.standardError.write(message.data(using: .utf8)!)
  exit(code)
}

if CommandLine.arguments.count < 3 {
  die("Usage: clipboard <image> <path>\\n")
}

let inputPath = CommandLine.arguments[2]
let pasteboard = NSPasteboard.general
pasteboard.clearContents()

guard let image = NSImage(contentsOfFile: inputPath) else {
  die("Failed to load image: \\(inputPath)\\n")
}
if !pasteboard.writeObjects([image]) {
  die("Failed to write image to clipboard\\n")
}
`;

async function copyImageMac(imagePath: string): Promise<void> {
  // Try cached compiled binary first
  const cacheDir = path.join(os.homedir(), '.cache', 'x-actions');
  const binaryPath = path.join(cacheDir, 'clipboard');

  if (fs.existsSync(binaryPath)) {
    const result = await runCommand(binaryPath, ['image', imagePath], { allowNonZeroExit: true });
    if (result.exitCode === 0) return;
    // Binary failed — recompile
  }

  // Compile and cache
  await withTempDir('x-actions-clipboard-', async (tempDir) => {
    const swiftPath = path.join(tempDir, 'clipboard.swift');
    await writeFile(swiftPath, SWIFT_SOURCE, 'utf8');

    // Try to compile to cache dir
    try {
      fs.mkdirSync(cacheDir, { recursive: true });
      await runCommand('swiftc', ['-O', swiftPath, '-o', binaryPath]);
      await runCommand(binaryPath, ['image', imagePath]);
    } catch {
      // Fallback: interpret
      await runCommand('swift', [swiftPath, 'image', imagePath]);
    }
  });
}

async function copyImageLinux(imagePath: string): Promise<void> {
  const mime = inferMimeType(imagePath);
  if (await commandExists('wl-copy')) {
    await runCommandWithFileStdin('wl-copy', ['--type', mime], imagePath);
  } else if (await commandExists('xclip')) {
    await runCommand('xclip', ['-selection', 'clipboard', '-t', mime, '-i', imagePath]);
  } else {
    throw new Error('No clipboard tool found. Install wl-clipboard or xclip.');
  }
}

export async function copyImageToClipboard(imagePath: string): Promise<void> {
  const resolved = resolvePath(imagePath);
  const ext = path.extname(resolved).toLowerCase();
  if (!SUPPORTED_IMAGE_EXTS.has(ext)) {
    throw new Error(`Unsupported image type: ${ext} (supported: ${Array.from(SUPPORTED_IMAGE_EXTS).join(', ')})`);
  }
  if (!fs.existsSync(resolved)) throw new Error(`File not found: ${resolved}`);

  if (process.platform === 'darwin') await copyImageMac(resolved);
  else if (process.platform === 'linux') await copyImageLinux(resolved);
  else throw new Error(`Unsupported platform: ${process.platform}`);
}

// ─── Paste ───────────────────────────────────────────────────────────

function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function pasteMac(targetApp?: string, retries = 3, delayMs = 500): boolean {
  for (let i = 0; i < retries; i++) {
    const script = targetApp
      ? `
        tell application "${targetApp}"
          activate
        end tell
        delay 0.3
        tell application "System Events"
          keystroke "v" using command down
        end tell
      `
      : `
        tell application "System Events"
          keystroke "v" using command down
        end tell
      `;

    const result = spawnSync('osascript', ['-e', script], { stdio: 'pipe' });
    if (result.status === 0) return true;

    if (i < retries - 1) {
      console.error(`[paste] Attempt ${i + 1}/${retries} failed, retrying...`);
      sleepSync(delayMs);
    }
  }
  return false;
}

function pasteLinux(retries = 3, delayMs = 500): boolean {
  const tools = [
    { cmd: 'xdotool', args: ['key', 'ctrl+v'] },
    { cmd: 'ydotool', args: ['key', '29:1', '47:1', '47:0', '29:0'] },
  ];

  for (const tool of tools) {
    const which = spawnSync('which', [tool.cmd], { stdio: 'pipe' });
    if (which.status !== 0) continue;

    for (let i = 0; i < retries; i++) {
      const result = spawnSync(tool.cmd, tool.args, { stdio: 'pipe' });
      if (result.status === 0) return true;
      if (i < retries - 1) sleepSync(delayMs);
    }
    return false;
  }
  console.error('[paste] No supported tool found. Install xdotool or ydotool.');
  return false;
}

export function pasteToApp(appName?: string, retries = 5, delayMs = 500): boolean {
  if (process.platform === 'darwin') return pasteMac(appName, retries, delayMs);
  if (process.platform === 'linux') return pasteLinux(retries, delayMs);
  console.error(`[paste] Unsupported platform: ${process.platform}`);
  return false;
}
