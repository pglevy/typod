import { audioPlayer } from '../player';
import { formatTime, formatDate, stripHtml } from '../utils';
import type { Episode } from '../types';

const PLAY_ICON = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
const PAUSE_ICON = `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
const CHEVRON_DOWN = `<svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>`;

export interface PlayerSheetHandle {
  element: HTMLElement;
  show: () => void;
}

export function createPlayerSheet(): PlayerSheetHandle {
  const sheet = document.createElement('div');
  sheet.className = 'player-sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-label', 'Now playing');

  // Header: pill handle (center) + close button (right)
  const header = document.createElement('div');
  header.className = 'player-sheet-header';

  const handle = document.createElement('div');
  handle.className = 'player-sheet-handle';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'player-sheet-close';
  closeBtn.innerHTML = CHEVRON_DOWN;
  closeBtn.setAttribute('aria-label', 'Close');

  header.appendChild(handle);
  header.appendChild(closeBtn);

  // Scrollable body
  const body = document.createElement('div');
  body.className = 'player-sheet-body';

  const artwork = document.createElement('img');
  artwork.className = 'player-sheet-artwork';
  artwork.alt = '';
  artwork.hidden = true;

  const feedEl = document.createElement('div');
  feedEl.className = 'player-sheet-feed';
  feedEl.textContent = '\u00A0';

  const titleEl = document.createElement('div');
  titleEl.className = 'player-sheet-title';
  titleEl.textContent = '\u00A0';

  const dateEl = document.createElement('div');
  dateEl.className = 'player-sheet-date';

  const seek = document.createElement('input');
  seek.type = 'range';
  seek.className = 'player-sheet-seek';
  seek.min = '0';
  seek.max = '0';
  seek.value = '0';
  seek.step = '1';
  seek.setAttribute('aria-label', 'Seek');

  const timeRow = document.createElement('div');
  timeRow.className = 'player-sheet-time-row';
  const elapsedEl = document.createElement('span');
  elapsedEl.className = 'player-sheet-time-elapsed';
  elapsedEl.textContent = '0:00';
  const totalEl = document.createElement('span');
  totalEl.className = 'player-sheet-time-total';
  totalEl.textContent = '0:00';
  timeRow.appendChild(elapsedEl);
  timeRow.appendChild(totalEl);

  const playBtn = document.createElement('button');
  playBtn.className = 'player-sheet-play-btn';
  playBtn.innerHTML = PLAY_ICON;
  playBtn.setAttribute('aria-label', 'Play');

  const notesEl = document.createElement('div');
  notesEl.className = 'player-sheet-notes';

  body.appendChild(artwork);
  body.appendChild(feedEl);
  body.appendChild(titleEl);
  body.appendChild(dateEl);
  body.appendChild(seek);
  body.appendChild(timeRow);
  body.appendChild(playBtn);
  body.appendChild(notesEl);

  sheet.appendChild(header);
  sheet.appendChild(body);

  // --- Interactions ---

  function hide() {
    sheet.classList.remove('is-open');
  }

  closeBtn.addEventListener('click', hide);

  let isSeeking = false;

  seek.addEventListener('input', () => {
    isSeeking = true;
    elapsedEl.textContent = formatTime(Number(seek.value));
  });

  seek.addEventListener('change', () => {
    audioPlayer.seek(Number(seek.value));
    isSeeking = false;
  });

  playBtn.addEventListener('click', () => {
    if (audioPlayer.isPlaying) {
      audioPlayer.pause();
    } else {
      audioPlayer.resume();
    }
  });

  function updatePlayButton(playing: boolean) {
    playBtn.innerHTML = playing ? PAUSE_ICON : PLAY_ICON;
    playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  }

  function populate(episode: Episode) {
    feedEl.textContent = episode.feedTitle;
    titleEl.textContent = episode.title;
    dateEl.textContent = formatDate(episode.pubDate);
    notesEl.textContent = stripHtml(episode.description);
    if (episode.artworkSrc) {
      artwork.src = episode.artworkSrc;
      artwork.hidden = false;
    } else {
      artwork.hidden = true;
    }
  }

  audioPlayer.on('play', (episode, _ct, _dur) => {
    populate(episode);
    updatePlayButton(true);
  });

  audioPlayer.on('pause', () => updatePlayButton(false));
  audioPlayer.on('ended', () => updatePlayButton(false));

  audioPlayer.on('timeupdate', (_ep, currentTime, duration) => {
    if (!isSeeking) {
      seek.max = String(Math.floor(duration));
      seek.value = String(Math.floor(currentTime));
      elapsedEl.textContent = formatTime(currentTime);
      totalEl.textContent = formatTime(duration);
    }
  });

  audioPlayer.on('loaded', (episode, currentTime, duration) => {
    populate(episode);
    if (duration > 0) {
      seek.max = String(Math.floor(duration));
      totalEl.textContent = formatTime(duration);
    }
    seek.value = String(Math.floor(currentTime));
    elapsedEl.textContent = formatTime(currentTime);
    updatePlayButton(false);
  });

  return {
    element: sheet,
    show() {
      sheet.classList.add('is-open');
    },
  };
}
