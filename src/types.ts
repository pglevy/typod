export interface Episode {
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

export interface PlaybackState {
  episodeGuid: string;
  feedSlug: string;
  position: number;
  updatedAt: string;
}
