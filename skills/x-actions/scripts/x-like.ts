import process from 'node:process';
import {
  clickElement,
  extractTweetUrl,
  launchChrome,
  parseArgs,
  sleep,
  waitForElement,
} from './cdp-lib.js';

async function main(): Promise<void> {
  const { flags, positional } = parseArgs(process.argv.slice(2));

  if (flags.has('help') || flags.has('h')) {
    console.log(`Like or unlike a tweet on X (Twitter)

Usage:
  npx -y bun x-like.ts <tweet-url> [--unlike] [--submit]

Options:
  --unlike    Unlike instead of like
  --submit    Actually execute (default: preview only)
  --help      Show this help

Examples:
  npx -y bun x-like.ts https://x.com/user/status/123
  npx -y bun x-like.ts https://x.com/user/status/123 --submit
  npx -y bun x-like.ts https://x.com/user/status/123 --unlike --submit
`);
    process.exit(0);
  }

  const unlike = flags.has('unlike');
  const submit = flags.has('submit');
  const tweetUrl = positional.map((p) => extractTweetUrl(p)).find(Boolean);

  if (!tweetUrl) {
    console.error('Error: Please provide a tweet URL.');
    process.exit(1);
  }

  const session = await launchChrome({ url: tweetUrl });

  try {
    console.log(`[x-like] Opening tweet: ${tweetUrl}`);
    await sleep(3000);

    const targetTestId = unlike ? 'unlike' : 'like';
    const actionLabel = unlike ? 'Unlike' : 'Like';
    const selector = `[data-testid="${targetTestId}"]`;

    const found = await waitForElement(session, selector, { label: `${actionLabel} button` });
    if (!found) {
      // Check if the opposite state exists
      const oppositeTestId = unlike ? 'like' : 'unlike';
      const oppositeExists = await waitForElement(session, `[data-testid="${oppositeTestId}"]`, {
        timeoutMs: 3000,
        label: `${unlike ? 'Like' : 'Unlike'} button`,
      });
      if (oppositeExists) {
        console.log(`[x-like] Tweet is already ${unlike ? 'not liked' : 'liked'}.`);
        return;
      }
      throw new Error('Tweet not found or not logged in. Please log in to X first.');
    }

    if (submit) {
      console.log(`[x-like] ${actionLabel}ing tweet...`);
      await clickElement(session, selector);
      await sleep(1500);
      console.log(`[x-like] ${actionLabel} done!`);
    } else {
      console.log(`[x-like] ${actionLabel} ready (preview mode). Add --submit to execute.`);
      console.log('[x-like] Browser will stay open for 15 seconds for preview...');
      await sleep(15_000);
    }
  } finally {
    await session.close();
  }
}

await main().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
