import type { Episode } from '../types';
import { formatDuration, formatDate, stripHtml } from '../utils';

export function createEpisodeRow(
  episode: Episode,
  index: number,
  onPlay: (episode: Episode) => void,
): HTMLElement {
  const row = document.createElement('li');
  row.className = 'episode-row';
  row.dataset.guid = episode.guid;

  // Stagger animation for first 10 rows
  if (index < 10) {
    row.style.animationDelay = `${index * 30}ms`;
  } else {
    row.style.animation = 'none';
    row.style.opacity = '1';
  }

  // Artwork
  const artworkDiv = document.createElement('div');
  artworkDiv.className = 'artwork';
  if (episode.artworkSrc) {
    const img = document.createElement('img');
    img.src = episode.artworkSrc;
    img.alt = episode.feedTitle;
    img.width = 48;
    img.height = 48;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('load', () => img.classList.add('loaded'));
    img.addEventListener('error', () => img.remove());
    artworkDiv.appendChild(img);
  }

  // Info container
  const info = document.createElement('div');
  info.className = 'episode-info';

  const title = document.createElement('div');
  title.className = 'episode-title';
  title.textContent = episode.title;

  const meta = document.createElement('div');
  meta.className = 'episode-meta';
  const feedSpan = document.createElement('span');
  feedSpan.className = 'episode-feed-title';
  feedSpan.textContent = episode.feedTitle;
  meta.appendChild(feedSpan);
  const dateDuration = formatDate(episode.pubDate);
  const durationStr = episode.duration ? formatDuration(episode.duration) : null;
  meta.appendChild(document.createTextNode(` · ${dateDuration}${durationStr ? ` · ${durationStr}` : ''}`));

  info.appendChild(title);
  info.appendChild(meta);

  // Description (collapsible)
  const descText = stripHtml(episode.description).trim();
  if (descText) {
    const desc = document.createElement('div');
    desc.className = 'episode-description';
    desc.textContent = descText;

    const actions = document.createElement('div');
    actions.className = 'episode-actions';

    const expandBtn = document.createElement('button');
    expandBtn.className = 'episode-expand-btn';
    expandBtn.textContent = 'more';

    const shareBtn = document.createElement('button');
    shareBtn.className = 'episode-share-btn';
    shareBtn.textContent = 'share';
    shareBtn.hidden = true;
    shareBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = `${window.location.origin}${window.location.pathname}#${encodeURIComponent(episode.guid)}`;
      navigator.clipboard.writeText(url).then(() => {
        shareBtn.textContent = 'copied!';
        setTimeout(() => { shareBtn.textContent = 'share'; }, 1500);
      });
    });

    expandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const expanded = desc.classList.toggle('is-expanded');
      expandBtn.textContent = expanded ? 'less' : 'more';
      shareBtn.hidden = !expanded;
    });

    actions.appendChild(expandBtn);
    actions.appendChild(shareBtn);

    info.appendChild(desc);
    info.appendChild(actions);
  }

  row.appendChild(artworkDiv);
  row.appendChild(info);

  row.addEventListener('click', () => onPlay(episode));

  return row;
}
