import { describe, it } from 'jsr:@std/testing/bdd';
import { assertEquals, assertNotEquals } from 'jsr:@std/assert';
import { parseRssFeed, toSlug, mergeAndSort } from '../fetch-feeds.ts';

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
    assertNotEquals(feed, null);
    assertEquals(feed!.title, 'My Test Podcast');
    assertEquals(feed!.imageUrl, 'https://example.com/art.jpg');
  });

  it('extracts episode fields correctly', () => {
    const feed = parseRssFeed(VALID_RSS)!;
    assertEquals(feed.episodes.length, 2);

    const ep1 = feed.episodes[0];
    assertEquals(ep1.guid, 'ep-1');
    assertEquals(ep1.title, 'Episode One');
    assertEquals(ep1.pubDate, '2025-02-03T14:00:00.000Z');
    assertEquals(ep1.duration, 4530); // 1*3600 + 15*60 + 30
    assertEquals(ep1.enclosureUrl, 'https://example.com/ep1.mp3');
    assertEquals(ep1.description, 'First episode description.');
  });

  it('parses MM:SS duration format', () => {
    const feed = parseRssFeed(VALID_RSS)!;
    assertEquals(feed.episodes[1].duration, 2700); // 45*60
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
    assertEquals(feed.episodes.length, 10);
  });

  it('returns null for malformed XML', () => {
    const feed = parseRssFeed('this is not xml at all <<<>>>');
    // fast-xml-parser may still parse this but there won't be rss.channel
    // Either way, it should not throw
    assertEquals(feed, null);
  });

  it('returns null for XML without rss channel', () => {
    const feed = parseRssFeed('<?xml version="1.0"?><html><body>Not a feed</body></html>');
    assertEquals(feed, null);
  });

  it('handles a feed with a single item (not an array)', () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0"><channel><title>Solo</title>
        <item><guid>only-one</guid><title>Only Episode</title>
          <enclosure url="https://example.com/solo.mp3" type="audio/mpeg" />
        </item>
      </channel></rss>`;
    const feed = parseRssFeed(xml)!;
    assertEquals(feed.episodes.length, 1);
    assertEquals(feed.episodes[0].guid, 'only-one');
  });
});

describe('toSlug', () => {
  it('converts a simple title to a slug', () => {
    assertEquals(toSlug('Tech Talks Daily'), 'tech-talks-daily');
  });

  it('strips leading/trailing hyphens', () => {
    assertEquals(toSlug('  --Hello World--  '), 'hello-world');
  });

  it('collapses multiple non-alphanumeric chars', () => {
    assertEquals(toSlug("It's a Test! Really?"), 'it-s-a-test-really');
  });

  it('handles unicode by removing non-ascii', () => {
    assertEquals(toSlug('Café Podcast'), 'caf-podcast');
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
            { guid: 'a1', title: 'A Ep 1', link: null, pubDate: '2025-02-01T10:00:00Z', duration: 100, enclosureUrl: '', description: '' },
            { guid: 'a2', title: 'A Ep 2', link: null, pubDate: '2025-02-03T10:00:00Z', duration: 200, enclosureUrl: '', description: '' },
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
            { guid: 'b1', title: 'B Ep 1', link: null, pubDate: '2025-02-02T10:00:00Z', duration: 150, enclosureUrl: '', description: '' },
          ],
        },
        slug: 'feed-b',
        artworkSrc: 'data/artwork/feed-b-96.webp',
      },
    ];

    const result = mergeAndSort(feeds);
    assertEquals(result.length, 3);
    assertEquals(result[0].guid, 'a2'); // Feb 3
    assertEquals(result[1].guid, 'b1'); // Feb 2
    assertEquals(result[2].guid, 'a1'); // Feb 1
  });

  it('uses feed title as tiebreaker for same-date episodes', () => {
    const feeds = [
      {
        feed: {
          title: 'Zebra Cast',
          imageUrl: null,
          episodes: [
            { guid: 'z1', title: 'Z Ep', link: null, pubDate: '2025-02-01T10:00:00Z', duration: null, enclosureUrl: '', description: '' },
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
            { guid: 'a1', title: 'A Ep', link: null, pubDate: '2025-02-01T10:00:00Z', duration: null, enclosureUrl: '', description: '' },
          ],
        },
        slug: 'alpha-pod',
        artworkSrc: null,
      },
    ];

    const result = mergeAndSort(feeds);
    assertEquals(result[0].feedTitle, 'Alpha Pod');
    assertEquals(result[1].feedTitle, 'Zebra Cast');
  });

  it('denormalizes feed info onto each episode', () => {
    const feeds = [
      {
        feed: {
          title: 'My Show',
          imageUrl: 'https://example.com/art.jpg',
          episodes: [
            { guid: 'e1', title: 'Ep', link: null, pubDate: '2025-02-01T10:00:00Z', duration: 60, enclosureUrl: 'https://example.com/e1.mp3', description: 'desc' },
          ],
        },
        slug: 'my-show',
        artworkSrc: 'data/artwork/my-show-96.webp',
      },
    ];

    const result = mergeAndSort(feeds);
    assertEquals(result[0].feedTitle, 'My Show');
    assertEquals(result[0].feedSlug, 'my-show');
    assertEquals(result[0].artworkSrc, 'data/artwork/my-show-96.webp');
  });
});
