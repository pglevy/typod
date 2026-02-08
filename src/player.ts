import type { Episode, PlaybackState } from './types';
import { savePlaybackState } from './state';

type PlayerEventType = 'play' | 'pause' | 'timeupdate' | 'ended' | 'loaded';
type PlayerListener = (episode: Episode, currentTime: number, duration: number) => void;

class AudioPlayer {
  private audio: HTMLAudioElement;
  private currentEpisode: Episode | null = null;
  private listeners: Map<PlayerEventType, Set<PlayerListener>> = new Map();
  private saveInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.audio = document.createElement('audio');
    this.audio.preload = 'metadata';

    this.audio.addEventListener('timeupdate', () => {
      if (this.currentEpisode) {
        this.emit('timeupdate', this.currentEpisode, this.audio.currentTime, this.audio.duration || 0);
      }
    });

    this.audio.addEventListener('ended', () => {
      if (this.currentEpisode) {
        this.emit('ended', this.currentEpisode, this.audio.currentTime, this.audio.duration || 0);
        this.stopSaveInterval();
      }
    });
  }

  play(episode: Episode): void {
    if (this.currentEpisode?.guid !== episode.guid) {
      this.audio.src = episode.enclosureUrl;
      this.currentEpisode = episode;
    }
    this.audio.play();
    this.emit('play', episode, this.audio.currentTime, this.audio.duration || 0);
    this.startSaveInterval();
  }

  loadWithoutPlaying(episode: Episode, position: number): void {
    this.audio.src = episode.enclosureUrl;
    this.currentEpisode = episode;
    this.audio.currentTime = position;
    this.emit('loaded', episode, position, this.audio.duration || 0);

    this.audio.addEventListener('loadedmetadata', () => {
      this.audio.currentTime = position;
      this.emit('loaded', episode, position, this.audio.duration || 0);
    }, { once: true });
  }

  pause(): void {
    this.audio.pause();
    if (this.currentEpisode) {
      this.emit('pause', this.currentEpisode, this.audio.currentTime, this.audio.duration || 0);
      this.saveState();
    }
    this.stopSaveInterval();
  }

  resume(): void {
    if (this.currentEpisode) {
      this.audio.play();
      this.emit('play', this.currentEpisode, this.audio.currentTime, this.audio.duration || 0);
      this.startSaveInterval();
    }
  }

  seek(seconds: number): void {
    this.audio.currentTime = seconds;
    if (this.currentEpisode) {
      this.saveState();
    }
  }

  get isPlaying(): boolean {
    return !this.audio.paused;
  }

  get episode(): Episode | null {
    return this.currentEpisode;
  }

  get currentTime(): number {
    return this.audio.currentTime;
  }

  get duration(): number {
    return this.audio.duration || 0;
  }

  on(event: PlayerEventType, listener: PlayerListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  private emit(event: PlayerEventType, episode: Episode, currentTime: number, duration: number): void {
    this.listeners.get(event)?.forEach((listener) => listener(episode, currentTime, duration));
  }

  private saveState(): void {
    if (!this.currentEpisode) return;
    const state: PlaybackState = {
      episodeGuid: this.currentEpisode.guid,
      feedSlug: this.currentEpisode.feedSlug,
      position: this.audio.currentTime,
      updatedAt: new Date().toISOString(),
    };
    savePlaybackState(state);
  }

  private startSaveInterval(): void {
    this.stopSaveInterval();
    this.saveInterval = setInterval(() => this.saveState(), 5000);
  }

  private stopSaveInterval(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
  }
}

export const audioPlayer = new AudioPlayer();
