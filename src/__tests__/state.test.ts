// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getPlaybackState, savePlaybackState } from '../state';
import type { PlaybackState } from '../types';

const STORAGE_KEY = 'typod_playback';

const sampleState: PlaybackState = {
  episodeGuid: 'ep-123',
  feedSlug: 'my-show',
  position: 145.5,
  updatedAt: '2025-02-08T10:00:00Z',
};

beforeEach(() => {
  localStorage.clear();
});

describe('savePlaybackState', () => {
  it('writes valid JSON to localStorage', () => {
    savePlaybackState(sampleState);
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual(sampleState);
  });
});

describe('getPlaybackState', () => {
  it('returns the saved state correctly', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleState));
    const result = getPlaybackState();
    expect(result).toEqual(sampleState);
  });

  it('returns null when no state is stored', () => {
    const result = getPlaybackState();
    expect(result).toBeNull();
  });

  it('returns null when localStorage contains corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json!!!');
    const result = getPlaybackState();
    expect(result).toBeNull();
  });
});

describe('localStorage unavailable', () => {
  it('getPlaybackState returns null without throwing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('localStorage disabled');
    });
    expect(() => getPlaybackState()).not.toThrow();
    expect(getPlaybackState()).toBeNull();
    vi.restoreAllMocks();
  });

  it('savePlaybackState does not throw', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('localStorage disabled');
    });
    expect(() => savePlaybackState(sampleState)).not.toThrow();
    vi.restoreAllMocks();
  });
});
