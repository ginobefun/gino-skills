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

const RETWEET_BUTTON_SELECTOR = '[data-testid="retweet"]';
const EDITOR_SELECTOR = '[data-testid="tweetTextarea_0"]';
const SUBMIT_SELECTOR = '[data-testid="tweetButton"]';

async function main(): Promise<void> {
  const { flags, positional } = parseArgs(process.argv.slice(2));

  if (flags.has('help') || flags.has('h')) {
    console.log(`Quote a tweet on X (Twitter)

Usage:
  npx -y bun x-quote.ts <tweet-url> [--submit] [comment]

Options:
  --submit    Actually post (default: preview only)
  --help      Show this help

Examples:
  npx -y bun x-quote.ts https://x.com/user/status/123 "Great insight!"
  npx -y bun x-quote.ts https://x.com/user/status/123 "I agree!" --submit
`);
    process.exit(0);
  }

  const submit = flags.has('submit');

  let tweetUrl: string | undefined;
  const commentParts: string[] = [];
  for (const p of positional) {
    const url = extractTweetUrl(p);
    if (url && !tweetUrl) {
      tweetUrl = url;
    } else {
      commentParts.push(p);
    }
  }

  const comment = commentParts.join(' ').trim() || undefined;

  if (!tweetUrl) {
    console.error('Error: Please provide a tweet URL.');
    process.exit(1);
  }

  const session = await launchChrome({ url: tweetUrl });

  try {
    console.log(`[x-quote] Opening tweet: ${tweetUrl}`);
    await sleep(3000);

    // Wait for retweet button (indicates tweet loaded)
    const retweetFound = await waitForElement(session, RETWEET_BUTTON_SELECTOR, {
      label: 'Retweet button',
    });
    if (!retweetFound) {
      throw new Error('Tweet not found or not logged in. Please log in to X first.');
    }

    // Click retweet button to open menu
    console.log('[x-quote] Opening retweet menu...');
    await clickElement(session, RETWEET_BUTTON_SELECTOR);
    await sleep(1000);

    // Click "Quote" option (second menu item)
    console.log('[x-quote] Selecting quote option...');
    const quoteOptionSelector = '[data-testid="Dropdown"] [role="menuitem"]:nth-child(2)';
    const quoteFound = await waitForElement(session, quoteOptionSelector, {
      timeoutMs: 10_000,
      label: 'Quote menu option',
    });
    if (!quoteFound) throw new Error('Quote option not found in menu.');

    await clickElement(session, quoteOptionSelector);
    await sleep(2000);

    // Wait for quote compose editor
    const editorFound = await waitForElement(session, EDITOR_SELECTOR, {
      timeoutMs: 10_000,
      label: 'Quote editor',
    });
    if (!editorFound) throw new Error('Quote compose editor did not open.');

    // Type comment
    if (comment) {
      console.log('[x-quote] Typing comment...');
      await typeText(session, EDITOR_SELECTOR, comment);
      await sleep(500);
    }

    if (submit) {
      console.log('[x-quote] Submitting quote post...');
      await clickElement(session, SUBMIT_SELECTOR);
      await sleep(2000);
      console.log('[x-quote] Quote post submitted!');
    } else {
      console.log('[x-quote] Quote composed (preview mode). Add --submit to post.');
      console.log('[x-quote] Browser will stay open for 30 seconds for preview...');
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
