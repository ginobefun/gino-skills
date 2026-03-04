import fs from 'node:fs';
import process from 'node:process';
import {
  clickElement,
  launchChrome,
  parseArgs,
  sleep,
  typeText,
  waitForElement,
} from './cdp-lib.js';
import { copyImageToClipboard, pasteToApp } from './clipboard-lib.js';

const EDITOR_SELECTOR = '[data-testid="tweetTextarea_0"]';
const SUBMIT_SELECTOR = '[data-testid="tweetButton"]';
const COMPOSE_URL = 'https://x.com/compose/post';

async function main(): Promise<void> {
  const { flags, positional, images } = parseArgs(process.argv.slice(2));

  if (flags.has('help') || flags.has('h')) {
    console.log(`Post a tweet to X (Twitter)

Usage:
  npx -y bun x-post.ts [--image <path>]... [--submit] <text>

Options:
  --image <path>   Add image (can be repeated, max 4)
  --submit         Actually post (default: preview only)
  --help           Show this help

Examples:
  npx -y bun x-post.ts "Hello from CLI!"
  npx -y bun x-post.ts "Check this out" --image ./screenshot.png
  npx -y bun x-post.ts "Post it!" --image a.png --image b.png --submit
`);
    process.exit(0);
  }

  const submit = flags.has('submit');
  const text = positional.join(' ').trim() || undefined;

  if (!text && images.length === 0) {
    console.error('Error: Provide text or at least one image.');
    process.exit(1);
  }

  const session = await launchChrome({ url: COMPOSE_URL });

  try {
    console.log('[x-post] Waiting for editor...');
    await sleep(3000);

    const editorFound = await waitForElement(session, EDITOR_SELECTOR, { label: 'Tweet editor' });
    if (!editorFound) {
      console.log('[x-post] Editor not found. Please log in to X in the browser window.');
      const retryFound = await waitForElement(session, EDITOR_SELECTOR, {
        timeoutMs: 120_000,
        label: 'Tweet editor (after login)',
      });
      if (!retryFound) throw new Error('Timed out waiting for editor. Please log in first.');
    }

    // Type text
    if (text) {
      console.log('[x-post] Typing text...');
      await typeText(session, EDITOR_SELECTOR, text);
      await sleep(500);
    }

    // Paste images
    for (const imagePath of images) {
      if (!fs.existsSync(imagePath)) {
        console.warn(`[x-post] Image not found: ${imagePath}`);
        continue;
      }

      console.log(`[x-post] Pasting image: ${imagePath}`);
      await copyImageToClipboard(imagePath);
      await sleep(500);

      // Focus editor
      await session.evaluate<void>(
        `document.querySelector('${EDITOR_SELECTOR}')?.focus()`,
      );
      await sleep(200);

      // Real paste via OS keystroke (bypasses X anti-automation)
      const pasteSuccess = pasteToApp('Google Chrome');
      if (!pasteSuccess) {
        // CDP fallback
        console.log('[x-post] Paste script failed, trying CDP fallback...');
        const modifiers = process.platform === 'darwin' ? 4 : 2;
        await session.cdp.send('Input.dispatchKeyEvent', {
          type: 'keyDown', key: 'v', code: 'KeyV', modifiers, windowsVirtualKeyCode: 86,
        }, { sessionId: session.sessionId });
        await session.cdp.send('Input.dispatchKeyEvent', {
          type: 'keyUp', key: 'v', code: 'KeyV', modifiers, windowsVirtualKeyCode: 86,
        }, { sessionId: session.sessionId });
      }

      console.log('[x-post] Waiting for image upload...');
      await sleep(4000);
    }

    if (submit) {
      console.log('[x-post] Submitting post...');
      await clickElement(session, SUBMIT_SELECTOR);
      await sleep(2000);
      console.log('[x-post] Post submitted!');
    } else {
      console.log('[x-post] Post composed (preview mode). Add --submit to post.');
      console.log('[x-post] Browser will stay open for 30 seconds for preview...');
      await sleep(30_000);
    }
  } finally {
    await session.close();
  }
}

await main().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
