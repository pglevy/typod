import './style.css';
import type { Episode } from './types';
import { createEpisodeRow } from './components/episode-row';
import { createPlayerBar } from './components/player-bar';
import { audioPlayer } from './player';
import { getPlaybackState } from './state';

async function init() {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;

  // Header
  const header = document.createElement('header');
  header.className = 'app-header';
  const title = document.createElement('h1');
  title.className = 'app-title';
  title.textContent = 'Typod';
  header.appendChild(title);
  app.appendChild(header);

  // Episode list container
  const list = document.createElement('ul');
  list.className = 'episode-list';
  app.appendChild(list);

  // Player bar
  const playerBar = createPlayerBar();
  document.body.appendChild(playerBar.element);

  // Fetch episodes
  let episodes: Episode[];
  try {
    const res = await fetch('data/episodes.json');
    episodes = await res.json() as Episode[];
  } catch {
    list.innerHTML = '<li class="empty-state">Could not load episodes.</li>';
    return;
  }

  if (episodes.length === 0) {
    list.innerHTML = '<li class="empty-state">No episodes yet.</li>';
    return;
  }

  // Render episode rows
  const onPlay = (episode: Episode) => {
    audioPlayer.play(episode);
    playerBar.show();
    highlightActive(episode.guid);
  };

  for (let i = 0; i < episodes.length; i++) {
    list.appendChild(createEpisodeRow(episodes[i], i, onPlay));
  }

  // Highlight active episode row
  function highlightActive(guid: string) {
    list.querySelectorAll('.episode-row').forEach((row) => {
      row.classList.toggle('is-active', (row as HTMLElement).dataset.guid === guid);
    });
  }

  // Scroll to episode if URL has a hash fragment
  if (window.location.hash) {
    const guid = decodeURIComponent(window.location.hash.slice(1));
    const target = list.querySelector<HTMLElement>(`.episode-row[data-guid="${CSS.escape(guid)}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const desc = target.querySelector('.episode-description');
      const expandBtn = target.querySelector<HTMLButtonElement>('.episode-expand-btn');
      const shareBtn = target.querySelector<HTMLButtonElement>('.episode-share-btn');
      if (desc && expandBtn) {
        desc.classList.add('is-expanded');
        expandBtn.textContent = 'less';
        if (shareBtn) shareBtn.hidden = false;
      }
    }
  }

  // Restore saved playback state
  const saved = getPlaybackState();
  if (saved) {
    const episode = episodes.find((ep) => ep.guid === saved.episodeGuid);
    if (episode) {
      audioPlayer.loadWithoutPlaying(episode, saved.position);
      playerBar.show();
      highlightActive(episode.guid);
    }
  }

  // Listen for player events to keep highlight in sync
  audioPlayer.on('play', (episode: Episode) => {
    highlightActive(episode.guid);
  });
}

init();
