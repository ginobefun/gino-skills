import process from 'node:process';
import {
  clickElement,
  elementExists,
  extractTweetUrl,
  launchChrome,
  parseArgs,
  sleep,
  waitForElement,
} from './cdp-lib.js';

async function main(): Promise<void> {
  const { flags, positional } = parseArgs(process.argv.slice(2));

  if (flags.has('help') || flags.has('h')) {
    console.log(`Retweet or undo retweet on X (Twitter)

Usage:
  npx -y bun x-retweet.ts <tweet-url> [--undo] [--submit]

Options:
  --undo      Undo retweet
  --submit    Actually execute (default: preview only)
  --help      Show this help

Examples:
  npx -y bun x-retweet.ts https://x.com/user/status/123 --submit
  npx -y bun x-retweet.ts https://x.com/user/status/123 --undo --submit
`);
    process.exit(0);
  }

  const undo = flags.has('undo');
  const submit = flags.has('submit');
  const tweetUrl = positional.map((p) => extractTweetUrl(p)).find(Boolean);

  if (!tweetUrl) {
    console.error('Error: Please provide a tweet URL.');
    process.exit(1);
  }

  const session = await launchChrome({ url: tweetUrl });

  try {
    console.log(`[x-retweet] Opening tweet: ${tweetUrl}`);
    await sleep(3000);

    if (undo) {
      // Undo retweet: look for unretweet button (already retweeted state)
      const retweetedSelector = '[data-testid="unretweet"]';
      const found = await waitForElement(session, retweetedSelector, {
        timeoutMs: 15_000,
        label: 'Unretweet button',
      });
      if (!found) {
        console.log('[x-retweet] Tweet is not retweeted.');
        return;
      }

      if (submit) {
        console.log('[x-retweet] Undoing retweet...');
        await clickElement(session, retweetedSelector);
        await sleep(1000);
        // Click confirm in the menu
        const menuSelector = '[data-testid="unretweetConfirm"]';
        const menuFound = await waitForElement(session, menuSelector, {
          timeoutMs: 5_000,
          label: 'Unretweet confirm',
        });
        if (menuFound) {
          await clickElement(session, menuSelector);
          await sleep(1500);
        }
        console.log('[x-retweet] Unretweet done!');
      } else {
        console.log('[x-retweet] Unretweet ready (preview mode). Add --submit to execute.');
        await sleep(15_000);
      }
    } else {
      // Retweet: look for retweet button (not yet retweeted)
      const retweetSelector = '[data-testid="retweet"]';
      const found = await waitForElement(session, retweetSelector, {
        timeoutMs: 15_000,
        label: 'Retweet button',
      });
      if (!found) {
        // Already retweeted?
        const alreadyRetweeted = await elementExists(session, '[data-testid="unretweet"]');
        if (alreadyRetweeted) {
          console.log('[x-retweet] Tweet is already retweeted.');
          return;
        }
        throw new Error('Tweet not found or not logged in. Please log in to X first.');
      }

      if (submit) {
        console.log('[x-retweet] Clicking retweet...');
        await clickElement(session, retweetSelector);
        await sleep(1000);

        // Click "Repost" (first menu item)
        const menuItemSelector = '[data-testid="retweetConfirm"]';
        const menuFound = await waitForElement(session, menuItemSelector, {
          timeoutMs: 5_000,
          label: 'Repost menu item',
        });
        if (menuFound) {
          await clickElement(session, menuItemSelector);
          await sleep(1500);
        }
        console.log('[x-retweet] Retweet done!');
      } else {
        console.log('[x-retweet] Retweet ready (preview mode). Add --submit to execute.');
        await sleep(15_000);
      }
    }
  } finally {
    await session.close();
  }
}

await main().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
