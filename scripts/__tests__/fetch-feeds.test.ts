import { describe, it, expect } from 'vitest';
import { parseRssFeed, toSlug, mergeAndSort } from '../fetch-feeds';

const VALID_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>My Test Podcast</title>
    <image><url>https://example.com/art.jpg</url></image>
    <item>
      <guid>ep-1</guid>
      <title>Episode One</title>
      <pubDate>Mon, 03 Feb 2025 14:00:00 GMT</pubDate>
      <itunes:duration>01:15:30</itunes:duration>
      <enclosure url="https://example.com/ep1.mp3" type="audio/mpeg" />
      <description>First episode description.</description>
    </item>
    <item>
      <guid>ep-2</guid>
      <title>Episode Two</title>
      <pubDate>Tue, 04 Feb 2025 14:00:00 GMT</pubDate>
      <itunes:duration>45:00</itunes:duration>
      <enclosure url="https://example.com/ep2.mp3" type="audio/mpeg" />
      <description>Second episode description.</description>
    </item>
  </channel>
</rss>`;

describe('parseRssFeed', () => {
  it('extracts feed title and image URL', () => {
    const feed = parseRssFeed(VALID_RSS);
    expect(feed).not.toBeNull();
    expect(feed!.title).toBe('My Test Podcast');
    expect(feed!.imageUrl).toBe('https://example.com/art.jpg');
  });

  it('extracts episode fields correctly', () => {
    const feed = parseRssFeed(VALID_RSS)!;
    expect(feed.episodes).toHaveLength(2);

    const ep1 = feed.episodes[0];
    expect(ep1.guid).toBe('ep-1');
    expect(ep1.title).toBe('Episode One');
    expect(ep1.pubDate).toBe('2025-02-03T14:00:00.000Z');
    expect(ep1.duration).toBe(4530); // 1*3600 + 15*60 + 30
    expect(ep1.enclosureUrl).toBe('https://example.com/ep1.mp3');
    expect(ep1.description).toBe('First episode description.');
  });

  it('parses MM:SS duration format', () => {
    const feed = parseRssFeed(VALID_RSS)!;
    expect(feed.episodes[1].duration).toBe(2700); // 45*60
  });

  it('limits to 10 episodes', () => {
    const items = Array.from({ length: 15 }, (_, i) => `
      <item>
        <guid>ep-${i}</guid>
        <title>Episode ${i}</title>
        <pubDate>Mon, 03 Feb 2025 14:00:00 GMT</pubDate>
        <enclosure url="https://example.com/ep${i}.mp3" type="audio/mpeg" />
      </item>`).join('');

    const xml = `<?xml version="1.0"?>
      <rss version="2.0"><channel><title>Big Feed</title>${items}</channel></rss>`;

    const feed = parseRssFeed(xml)!;
    expect(feed.episodes).toHaveLength(10);
  });

  it('returns null for malformed XML', () => {
    const feed = parseRssFeed('this is not xml at all <<<>>>');
    // fast-xml-parser may still parse this but there won't be rss.channel
    // Either way, it should not throw
    expect(feed).toBeNull();
  });

  it('returns null for XML without rss channel', () => {
    const feed = parseRssFeed('<?xml version="1.0"?><html><body>Not a feed</body></html>');
    expect(feed).toBeNull();
  });

  it('handles a feed with a single item (not an array)', () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0"><channel><title>Solo</title>
        <item><guid>only-one</guid><title>Only Episode</title>
          <enclosure url="https://example.com/solo.mp3" type="audio/mpeg" />
        </item>
      </channel></rss>`;
    const feed = parseRssFeed(xml)!;
    expect(feed.episodes).toHaveLength(1);
    expect(feed.episodes[0].guid).toBe('only-one');
  });
});

describe('toSlug', () => {
  it('converts a simple title to a slug', () => {
    expect(toSlug('Tech Talks Daily')).toBe('tech-talks-daily');
  });

  it('strips leading/trailing hyphens', () => {
    expect(toSlug('  --Hello World--  ')).toBe('hello-world');
  });

  it('collapses multiple non-alphanumeric chars', () => {
    expect(toSlug("It's a Test! Really?")).toBe('it-s-a-test-really');
  });

  it('handles unicode by removing non-ascii', () => {
    expect(toSlug('Café Podcast')).toBe('caf-podcast');
  });
});

describe('mergeAndSort', () => {
  it('merges episodes from multiple feeds sorted by date descending', () => {
    const feeds = [
      {
        feed: {
          title: 'Feed A',
          imageUrl: null,
          episodes: [
            { guid: 'a1', title: 'A Ep 1', pubDate: '2025-02-01T10:00:00Z', duration: 100, enclosureUrl: '', description: '' },
            { guid: 'a2', title: 'A Ep 2', pubDate: '2025-02-03T10:00:00Z', duration: 200, enclosureUrl: '', description: '' },
          ],
        },
        slug: 'feed-a',
        artworkSrc: null,
      },
      {
        feed: {
          title: 'Feed B',
          imageUrl: null,
          episodes: [
            { guid: 'b1', title: 'B Ep 1', pubDate: '2025-02-02T10:00:00Z', duration: 150, enclosureUrl: '', description: '' },
          ],
        },
        slug: 'feed-b',
        artworkSrc: 'data/artwork/feed-b-96.webp',
      },
    ];

    const result = mergeAndSort(feeds);
    expect(result).toHaveLength(3);
    expect(result[0].guid).toBe('a2'); // Feb 3
    expect(result[1].guid).toBe('b1'); // Feb 2
    expect(result[2].guid).toBe('a1'); // Feb 1
  });

  it('uses feed title as tiebreaker for same-date episodes', () => {
    const feeds = [
      {
        feed: {
          title: 'Zebra Cast',
          imageUrl: null,
          episodes: [
            { guid: 'z1', title: 'Z Ep', pubDate: '2025-02-01T10:00:00Z', duration: null, enclosureUrl: '', description: '' },
          ],
        },
        slug: 'zebra-cast',
        artworkSrc: null,
      },
      {
        feed: {
          title: 'Alpha Pod',
          imageUrl: null,
          episodes: [
            { guid: 'a1', title: 'A Ep', pubDate: '2025-02-01T10:00:00Z', duration: null, enclosureUrl: '', description: '' },
          ],
        },
        slug: 'alpha-pod',
        artworkSrc: null,
      },
    ];

    const result = mergeAndSort(feeds);
    expect(result[0].feedTitle).toBe('Alpha Pod');
    expect(result[1].feedTitle).toBe('Zebra Cast');
  });

  it('denormalizes feed info onto each episode', () => {
    const feeds = [
      {
        feed: {
          title: 'My Show',
          imageUrl: 'https://example.com/art.jpg',
          episodes: [
            { guid: 'e1', title: 'Ep', pubDate: '2025-02-01T10:00:00Z', duration: 60, enclosureUrl: 'https://example.com/e1.mp3', description: 'desc' },
          ],
        },
        slug: 'my-show',
        artworkSrc: 'data/artwork/my-show-96.webp',
      },
    ];

    const result = mergeAndSort(feeds);
    expect(result[0].feedTitle).toBe('My Show');
    expect(result[0].feedSlug).toBe('my-show');
    expect(result[0].artworkSrc).toBe('data/artwork/my-show-96.webp');
  });
});
