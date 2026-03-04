import fs from 'node:fs';
import process from 'node:process';
import {
  clickElement,
  extractTweetUrl,
  launchChrome,
  parseArgs,
  sleep,
  typeText,
  waitForElement,
} from './cdp-lib.js';
import { copyImageToClipboard, pasteToApp } from './clipboard-lib.js';

const REPLY_BUTTON_SELECTOR = '[data-testid="reply"]';
const EDITOR_SELECTOR = '[data-testid="tweetTextarea_0"]';
const SUBMIT_SELECTOR = '[data-testid="tweetButton"]';

async function main(): Promise<void> {
  const { flags, positional, images } = parseArgs(process.argv.slice(2));

  if (flags.has('help') || flags.has('h')) {
    console.log(`Reply to a tweet on X (Twitter)

Usage:
  npx -y bun x-reply.ts <tweet-url> [--image <path>]... [--submit] <text>

Options:
  --image <path>   Add image (can be repeated, max 4)
  --submit         Actually post (default: preview only)
  --help           Show this help

Examples:
  npx -y bun x-reply.ts https://x.com/user/status/123 "Great post!"
  npx -y bun x-reply.ts https://x.com/user/status/123 "Nice!" --image pic.png --submit
`);
    process.exit(0);
  }

  const submit = flags.has('submit');

  // Separate tweet URL from text
  let tweetUrl: string | undefined;
  const textParts: string[] = [];
  for (const p of positional) {
    const url = extractTweetUrl(p);
    if (url && !tweetUrl) {
      tweetUrl = url;
    } else {
      textParts.push(p);
    }
  }

  const text = textParts.join(' ').trim() || undefined;

  if (!tweetUrl) {
    console.error('Error: Please provide a tweet URL.');
    process.exit(1);
  }
  if (!text && images.length === 0) {
    console.error('Error: Provide reply text or at least one image.');
    process.exit(1);
  }

  const session = await launchChrome({ url: tweetUrl });

  try {
    console.log(`[x-reply] Opening tweet: ${tweetUrl}`);
    await sleep(3000);

    // Wait for reply button
    const replyFound = await waitForElement(session, REPLY_BUTTON_SELECTOR, {
      label: 'Reply button',
    });
    if (!replyFound) {
      throw new Error('Tweet not found or not logged in. Please log in to X first.');
    }

    // Click reply button to open reply editor
    console.log('[x-reply] Opening reply editor...');
    await clickElement(session, REPLY_BUTTON_SELECTOR);
    await sleep(2000);

    // Wait for editor
    const editorFound = await waitForElement(session, EDITOR_SELECTOR, {
      timeoutMs: 10_000,
      label: 'Reply editor',
    });
    if (!editorFound) throw new Error('Reply editor did not open.');

    // Type text
    if (text) {
      console.log('[x-reply] Typing reply...');
      await typeText(session, EDITOR_SELECTOR, text);
      await sleep(500);
    }

    // Paste images
    for (const imagePath of images) {
      if (!fs.existsSync(imagePath)) {
        console.warn(`[x-reply] Image not found: ${imagePath}`);
        continue;
      }

      console.log(`[x-reply] Pasting image: ${imagePath}`);
      await copyImageToClipboard(imagePath);
      await sleep(500);

      await session.evaluate<void>(
        `document.querySelector('${EDITOR_SELECTOR}')?.focus()`,
      );
      await sleep(200);

      const pasteSuccess = pasteToApp('Google Chrome');
      if (!pasteSuccess) {
        console.log('[x-reply] Paste script failed, trying CDP fallback...');
        const modifiers = process.platform === 'darwin' ? 4 : 2;
        await session.cdp.send('Input.dispatchKeyEvent', {
          type: 'keyDown', key: 'v', code: 'KeyV', modifiers, windowsVirtualKeyCode: 86,
        }, { sessionId: session.sessionId });
        await session.cdp.send('Input.dispatchKeyEvent', {
          type: 'keyUp', key: 'v', code: 'KeyV', modifiers, windowsVirtualKeyCode: 86,
        }, { sessionId: session.sessionId });
      }

      console.log('[x-reply] Waiting for image upload...');
      await sleep(4000);
    }

    if (submit) {
      console.log('[x-reply] Submitting reply...');
      await clickElement(session, SUBMIT_SELECTOR);
      await sleep(2000);
      console.log('[x-reply] Reply submitted!');
    } else {
      console.log('[x-reply] Reply composed (preview mode). Add --submit to post.');
      console.log('[x-reply] Browser will stay open for 30 seconds for preview...');
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
