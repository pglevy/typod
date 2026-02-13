import { XMLParser } from 'fast-xml-parser';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParsedFeed {
  title: string;
  imageUrl: string | null;
  episodes: ParsedEpisode[];
}

interface ParsedEpisode {
  guid: string;
  title: string;
  link: string | null;
  pubDate: string;
  duration: number | null;
  enclosureUrl: string;
  description: string;
}

interface OutputEpisode {
  guid: string;
  title: string;
  link: string | null;
  feedTitle: string;
  feedSlug: string;
  artworkSrc: string | null;
  pubDate: string;
  duration: number | null;
  enclosureUrl: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Slug generation
// ---------------------------------------------------------------------------

export function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// Gist fetching
// ---------------------------------------------------------------------------

export async function fetchFeedList(gistUrl: string): Promise<string[]> {
  const res = await fetch(gistUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch feed list from Gist: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  const urls = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));

  if (urls.length === 0) {
    throw new Error('Feed list Gist is empty (no URLs found)');
  }
  return urls;
}

// ---------------------------------------------------------------------------
// RSS parsing
// ---------------------------------------------------------------------------

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

function parseDuration(raw: unknown): number | null {
  if (raw == null) return null;
  const str = String(raw).trim();
  // HH:MM:SS or MM:SS
  const parts = str.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  // Plain seconds
  const n = Number(str);
  return Number.isFinite(n) ? Math.round(n) : null;
}

export function parseRssFeed(xml: string): ParsedFeed | null {
  try {
    const parsed = xmlParser.parse(xml);
    const channel = parsed?.rss?.channel;
    if (!channel) return null;

    const title: string = String(channel.title ?? 'Untitled');
    const imageUrl: string | null =
      channel.image?.url ??
      channel['itunes:image']?.['@_href'] ??
      null;

    const rawItems = channel.item;
    const items: unknown[] = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

    const episodes: ParsedEpisode[] = items.slice(0, 10).map((item: unknown) => {
      const i = item as Record<string, unknown>;
      const enclosure = i.enclosure as Record<string, unknown> | undefined;
      const enclosureUrl = String(enclosure?.['@_url'] ?? '');
      const itemTitle = String(i.title ?? 'Untitled');
      const itemPubDate = i.pubDate ? new Date(String(i.pubDate)).toISOString() : new Date().toISOString();

      // Extract GUID from XML parser object (may be { '#text': 'value' } or plain string)
      let guid = '';
      if (i.guid) {
        const guidObj = i.guid as Record<string, unknown> | string;
        guid = typeof guidObj === 'object' ? String(guidObj['#text'] ?? '') : String(guidObj);
      }
      if (!guid) {
        guid = String(i.link ?? '');
      }
      if (!guid || guid === 'undefined') {
        // Generate a unique identifier from the enclosure URL or title+date
        guid = enclosureUrl || `${itemTitle}|${itemPubDate}`;
      }

      const itemLink = i.link ? String(i.link) : null;

      return {
        guid,
        title: itemTitle,
        link: itemLink,
        pubDate: itemPubDate,
        duration: parseDuration(i['itunes:duration']),
        enclosureUrl,
        description: String(i.description ?? i['itunes:summary'] ?? ''),
      };
    });

    return { title, imageUrl, episodes };
  } catch (err) {
    console.warn('Failed to parse RSS XML:', err);
    return null;
  }
}

export async function fetchAndParseFeed(url: string): Promise<ParsedFeed | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      console.warn(`Feed fetch failed for ${url}: ${res.status}`);
      return null;
    }
    const xml = await res.text();
    return parseRssFeed(xml);
  } catch (err) {
    console.warn(`Feed fetch error for ${url}:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Artwork processing
// ---------------------------------------------------------------------------

async function processArtwork(
  imageUrl: string,
  slug: string,
  outDir: string,
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());

    const sharp = (await import('sharp')).default;
    const artworkDir = path.join(outDir, 'artwork');
    await fs.mkdir(artworkDir, { recursive: true });

    await Promise.all([
      sharp(buffer).resize(48, 48).webp({ quality: 80 }).toFile(path.join(artworkDir, `${slug}-48.webp`)),
      sharp(buffer).resize(96, 96).webp({ quality: 80 }).toFile(path.join(artworkDir, `${slug}-96.webp`)),
    ]);

    return `data/artwork/${slug}-96.webp`;
  } catch (err) {
    console.warn(`Artwork processing failed for ${slug}:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Merge and sort
// ---------------------------------------------------------------------------

export function mergeAndSort(
  feeds: { feed: ParsedFeed; slug: string; artworkSrc: string | null }[],
): OutputEpisode[] {
  const all: OutputEpisode[] = [];

  for (const { feed, slug, artworkSrc } of feeds) {
    for (const ep of feed.episodes) {
      all.push({
        guid: ep.guid,
        title: ep.title,
        link: ep.link,
        feedTitle: feed.title,
        feedSlug: slug,
        artworkSrc,
        pubDate: ep.pubDate,
        duration: ep.duration,
        enclosureUrl: ep.enclosureUrl,
        description: ep.description,
      });
    }
  }

  all.sort((a, b) => {
    const dateCompare = new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.feedTitle.localeCompare(b.feedTitle);
  });

  return all;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const gistUrl = process.env['FEED_GIST_URL'];
  if (!gistUrl) {
    console.error('FEED_GIST_URL environment variable is required');
    process.exit(1);
  }

  const feedList = await fetchFeedList(gistUrl);
  console.log(`Fetched ${feedList.length} feed URLs from Gist`);

  const outDir = path.resolve('public/data');
  await fs.mkdir(outDir, { recursive: true });

  const feedResults: { feed: ParsedFeed; slug: string; artworkSrc: string | null }[] = [];

  for (const url of feedList) {
    console.log(`Fetching feed: ${url}`);
    const feed = await fetchAndParseFeed(url);
    if (!feed) {
      console.warn(`Skipping feed: ${url}`);
      continue;
    }

    const slug = toSlug(feed.title);
    let artworkSrc: string | null = null;
    if (feed.imageUrl) {
      artworkSrc = await processArtwork(feed.imageUrl, slug, outDir);
    }

    feedResults.push({ feed, slug, artworkSrc });
    console.log(`  → ${feed.title} (${feed.episodes.length} episodes)`);
  }

  const episodes = mergeAndSort(feedResults);

  await fs.writeFile(
    path.join(outDir, 'episodes.json'),
    JSON.stringify(episodes, null, 2),
  );

  console.log(`Wrote ${episodes.length} episodes to episodes.json`);
}

const isDirectRun = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/.*\//, ''));
if (isDirectRun) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
