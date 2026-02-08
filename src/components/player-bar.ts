import { audioPlayer } from '../player';
import { formatTime } from '../utils';

const PLAY_ICON = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
const PAUSE_ICON = `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

export interface PlayerBarHandle {
  element: HTMLElement;
  show: () => void;
}

export function createPlayerBar(): PlayerBarHandle {
  const bar = document.createElement('div');
  bar.className = 'player-bar';

  const inner = document.createElement('div');
  inner.className = 'player-bar-inner';

  // Top row: play button, info, time
  const top = document.createElement('div');
  top.className = 'player-top';

  const playBtn = document.createElement('button');
  playBtn.className = 'player-play-btn';
  playBtn.innerHTML = PLAY_ICON;
  playBtn.setAttribute('aria-label', 'Play');

  const info = document.createElement('div');
  info.className = 'player-info';

  const epTitle = document.createElement('div');
  epTitle.className = 'player-episode-title';
  epTitle.textContent = '\u00A0';

  const feedTitle = document.createElement('div');
  feedTitle.className = 'player-feed-title';
  feedTitle.textContent = '\u00A0';

  info.appendChild(epTitle);
  info.appendChild(feedTitle);

  const time = document.createElement('div');
  time.className = 'player-time';
  time.textContent = '0:00';

  top.appendChild(playBtn);
  top.appendChild(info);
  top.appendChild(time);

  // Seek bar
  const seek = document.createElement('input');
  seek.type = 'range';
  seek.className = 'player-seek';
  seek.min = '0';
  seek.max = '0';
  seek.value = '0';
  seek.step = '1';
  seek.setAttribute('aria-label', 'Seek');

  inner.appendChild(top);
  inner.appendChild(seek);
  bar.appendChild(inner);

  // --- Interactions ---

  let isSeeking = false;

  playBtn.addEventListener('click', () => {
    if (audioPlayer.isPlaying) {
      audioPlayer.pause();
    } else {
      audioPlayer.resume();
    }
  });

  seek.addEventListener('input', () => {
    isSeeking = true;
    time.textContent = formatTime(Number(seek.value));
  });

  seek.addEventListener('change', () => {
    audioPlayer.seek(Number(seek.value));
    isSeeking = false;
  });

  // --- Event listeners ---

  function updatePlayButton(playing: boolean) {
    playBtn.innerHTML = playing ? PAUSE_ICON : PLAY_ICON;
    playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  }

  audioPlayer.on('play', (episode, _currentTime, _duration) => {
    epTitle.textContent = episode.title;
    feedTitle.textContent = episode.feedTitle;
    updatePlayButton(true);
  });

  audioPlayer.on('pause', () => {
    updatePlayButton(false);
  });

  audioPlayer.on('ended', () => {
    updatePlayButton(false);
  });

  audioPlayer.on('timeupdate', (_episode, currentTime, duration) => {
    if (!isSeeking) {
      seek.max = String(Math.floor(duration));
      seek.value = String(Math.floor(currentTime));
      time.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
    }
  });

  audioPlayer.on('loaded', (episode, currentTime, duration) => {
    epTitle.textContent = episode.title;
    feedTitle.textContent = episode.feedTitle;
    if (duration > 0) {
      seek.max = String(Math.floor(duration));
    }
    seek.value = String(Math.floor(currentTime));
    time.textContent = duration > 0
      ? `${formatTime(currentTime)} / ${formatTime(duration)}`
      : formatTime(currentTime);
    updatePlayButton(false);
  });

  return {
    element: bar,
    show() {
      bar.classList.add('is-visible');
    },
  };
}
