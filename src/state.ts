import type { PlaybackState } from './types';

const STORAGE_KEY = 'typod_playback';

export function getPlaybackState(): PlaybackState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlaybackState;
  } catch {
    return null;
  }
}

export function savePlaybackState(state: PlaybackState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable — silently ignore
  }
}
