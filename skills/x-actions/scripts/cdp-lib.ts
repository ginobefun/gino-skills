import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import { mkdir } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

// ─── Chrome Discovery ────────────────────────────────────────────────

const CHROME_CANDIDATES: Record<string, string[]> = {
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ],
  default: [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
  ],
};

function findChrome(): string {
  const override = process.env.X_CHROME_PATH?.trim();
  if (override && fs.existsSync(override)) return override;

  const candidates = CHROME_CANDIDATES[process.platform] ?? CHROME_CANDIDATES.default;
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(
    'Chrome not found. Install Google Chrome or set X_CHROME_PATH environment variable.',
  );
}

function getProfileDir(): string {
  const base = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
  return path.join(base, 'x-browser-profile');
}

// ─── Utilities ───────────────────────────────────────────────────────

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close(() => reject(new Error('Unable to allocate a free TCP port.')));
        return;
      }
      const port = addr.port;
      server.close((err) => (err ? reject(err) : resolve(port)));
    });
  });
}

async function waitForDebugPort(port: number, timeoutMs: number): Promise<string> {
  const start = Date.now();
  let lastError: unknown;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        const data = (await res.json()) as { webSocketDebuggerUrl?: string };
        if (data.webSocketDebuggerUrl) return data.webSocketDebuggerUrl;
      }
    } catch (e) {
      lastError = e;
    }
    await sleep(200);
  }
  throw new Error(
    `Chrome debug port not ready after ${timeoutMs}ms: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

// ─── CDP Connection ──────────────────────────────────────────────────

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout> | null;
};

export class CdpConnection {
  private ws: WebSocket;
  private nextId = 0;
  private pending = new Map<number, PendingRequest>();
  private eventHandlers = new Map<string, Set<(params: unknown) => void>>();
  private defaultTimeoutMs: number;

  private constructor(ws: WebSocket, defaultTimeoutMs: number) {
    this.ws = ws;
    this.defaultTimeoutMs = defaultTimeoutMs;

    this.ws.addEventListener('message', (event) => {
      try {
        const data =
          typeof event.data === 'string'
            ? event.data
            : new TextDecoder().decode(event.data as ArrayBuffer);
        const msg = JSON.parse(data) as {
          id?: number;
          method?: string;
          params?: unknown;
          result?: unknown;
          error?: { message?: string };
        };

        if (msg.method) {
          const handlers = this.eventHandlers.get(msg.method);
          if (handlers) handlers.forEach((h) => h(msg.params));
        }

        if (msg.id) {
          const p = this.pending.get(msg.id);
          if (p) {
            this.pending.delete(msg.id);
            if (p.timer) clearTimeout(p.timer);
            if (msg.error?.message) p.reject(new Error(msg.error.message));
            else p.resolve(msg.result);
          }
        }
      } catch {}
    });

    this.ws.addEventListener('close', () => {
      for (const [id, p] of this.pending.entries()) {
        this.pending.delete(id);
        if (p.timer) clearTimeout(p.timer);
        p.reject(new Error('CDP connection closed.'));
      }
    });
  }

  static async connect(url: string, timeoutMs = 30_000, defaultTimeoutMs = 15_000): Promise<CdpConnection> {
    const ws = new WebSocket(url);
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP connection timeout.')), timeoutMs);
      ws.addEventListener('open', () => { clearTimeout(timer); resolve(); });
      ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP connection failed.')); });
    });
    return new CdpConnection(ws, defaultTimeoutMs);
  }

  on(method: string, handler: (params: unknown) => void): void {
    if (!this.eventHandlers.has(method)) this.eventHandlers.set(method, new Set());
    this.eventHandlers.get(method)!.add(handler);
  }

  async send<T = unknown>(
    method: string,
    params?: Record<string, unknown>,
    opts?: { sessionId?: string; timeoutMs?: number },
  ): Promise<T> {
    const id = ++this.nextId;
    const message: Record<string, unknown> = { id, method };
    if (params) message.params = params;
    if (opts?.sessionId) message.sessionId = opts.sessionId;

    const timeoutMs = opts?.timeoutMs ?? this.defaultTimeoutMs;

    const result = await new Promise<unknown>((resolve, reject) => {
      const timer =
        timeoutMs > 0
          ? setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, timeoutMs)
          : null;
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify(message));
    });

    return result as T;
  }

  close(): void {
    try { this.ws.close(); } catch {}
  }
}

// ─── Chrome Session ──────────────────────────────────────────────────

export interface LaunchOptions {
  url: string;
  timeoutMs?: number;
}

export interface ChromeSession {
  cdp: CdpConnection;
  sessionId: string;
  evaluate<T>(expression: string): Promise<T>;
  close(): Promise<void>;
}

export async function launchChrome(options: LaunchOptions): Promise<ChromeSession> {
  const { url, timeoutMs = 120_000 } = options;
  const chromePath = findChrome();
  const profileDir = getProfileDir();
  await mkdir(profileDir, { recursive: true });

  const port = await getFreePort();
  console.log(`[x-actions] Launching Chrome (profile: ${profileDir})`);

  const chrome = spawn(
    chromePath,
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled',
      '--start-maximized',
      url,
    ],
    { stdio: 'ignore' },
  );

  let cdp: CdpConnection | null = null;

  try {
    const wsUrl = await waitForDebugPort(port, 30_000);
    cdp = await CdpConnection.connect(wsUrl);

    const targets = await cdp.send<{
      targetInfos: Array<{ targetId: string; url: string; type: string }>;
    }>('Target.getTargets');

    let pageTarget = targets.targetInfos.find((t) => t.type === 'page' && t.url.includes('x.com'));
    if (!pageTarget) {
      const { targetId } = await cdp.send<{ targetId: string }>('Target.createTarget', { url });
      pageTarget = { targetId, url, type: 'page' };
    }

    const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', {
      targetId: pageTarget.targetId,
      flatten: true,
    });

    await cdp.send('Page.enable', {}, { sessionId });
    await cdp.send('Runtime.enable', {}, { sessionId });
    await cdp.send('Input.setIgnoreInputEvents', { ignore: false }, { sessionId });

    const session: ChromeSession = {
      cdp,
      sessionId,
      async evaluate<T>(expression: string): Promise<T> {
        const result = await cdp!.send<{ result: { value: T } }>('Runtime.evaluate', {
          expression,
          returnByValue: true,
        }, { sessionId });
        return result.result.value;
      },
      async close(): Promise<void> {
        if (cdp) {
          try { await cdp.send('Browser.close', {}, { timeoutMs: 5_000 }); } catch {}
          cdp.close();
        }
        setTimeout(() => {
          if (!chrome.killed) try { chrome.kill('SIGKILL'); } catch {}
        }, 2_000).unref?.();
        try { chrome.kill('SIGTERM'); } catch {}
      },
    };

    return session;
  } catch (e) {
    // Cleanup on launch failure
    if (cdp) cdp.close();
    try { chrome.kill('SIGTERM'); } catch {}
    throw e;
  }
}

// ─── Page Interaction Helpers ────────────────────────────────────────

export async function waitForElement(
  session: ChromeSession,
  selector: string,
  opts?: { timeoutMs?: number; label?: string },
): Promise<boolean> {
  const timeoutMs = opts?.timeoutMs ?? 120_000;
  const label = opts?.label ?? selector;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const found = await session.evaluate<boolean>(`!!document.querySelector('${selector}')`);
    if (found) return true;
    await sleep(1000);
  }
  console.error(`[x-actions] Element not found: ${label} (timeout ${timeoutMs}ms)`);
  return false;
}

export async function clickElement(session: ChromeSession, selector: string): Promise<void> {
  await session.evaluate<void>(`document.querySelector('${selector}')?.click()`);
}

export async function typeText(session: ChromeSession, selector: string, text: string): Promise<void> {
  // Focus the element
  await session.evaluate<void>(`document.querySelector('${selector}')?.focus()`);
  await sleep(200);
  // Use Input.insertText for reliable text insertion (handles emoji, CJK, etc.)
  await session.cdp.send('Input.insertText', { text }, { sessionId: session.sessionId });
}

export async function elementExists(session: ChromeSession, selector: string): Promise<boolean> {
  return session.evaluate<boolean>(`!!document.querySelector('${selector}')`);
}

export async function navigateTo(session: ChromeSession, url: string): Promise<void> {
  await session.cdp.send('Page.navigate', { url }, { sessionId: session.sessionId });
}

// ─── Common Helpers ──────────────────────────────────────────────────

export function extractTweetUrl(input: string): string | null {
  if (input.match(/(?:x\.com|twitter\.com)\/\w+\/status\/\d+/)) {
    return input.replace(/twitter\.com/, 'x.com').split('?')[0]!;
  }
  return null;
}

export function parseArgs(argv: string[]): {
  flags: Set<string>;
  options: Record<string, string>;
  positional: string[];
  images: string[];
} {
  const flags = new Set<string>();
  const options: Record<string, string> = {};
  const positional: string[] = [];
  const images: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--image' && argv[i + 1]) {
      images.push(argv[++i]!);
    } else if (arg === '--profile' && argv[i + 1]) {
      options.profile = argv[++i]!;
    } else if (arg.startsWith('--')) {
      flags.add(arg.slice(2));
    } else {
      positional.push(arg);
    }
  }

  return { flags, options, positional, images };
}
