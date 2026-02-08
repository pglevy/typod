# Typod - Requirements

## Overview

Typod is a static-site podcast player that runs on GitHub Pages. It fetches podcast RSS feeds via a daily GitHub Actions build, merges all episodes into a single chronological list, and renders them as a client-side app. localStorage persists playback state. The primary use case is mobile (phone).

---

## User Story: Browse Episodes

As a listener, I want to see a single chronological list of the latest episodes across all my shows so that I can quickly find something to play.

### Acceptance Criteria

WHEN the app loads
THE SYSTEM SHALL display a single list of episodes from all subscribed feeds, sorted by most recent publication date first

WHEN episodes from different shows have the same publication date
THE SYSTEM SHALL display them in a stable order (e.g., alphabetical by show title)

WHEN the list is displayed
THE SYSTEM SHALL show each episode's title, show name, small artwork, publication date, and duration

WHEN an episode has a description/summary
THE SYSTEM SHALL display a truncated preview with an option to expand

WHEN a podcast feed failed to update during the last build
THE SYSTEM SHALL still include previously cached episodes for that feed (if available) and silently omit the feed if no cached data exists

---

## User Story: Play an Episode

As a listener, I want to play a podcast episode so that I can listen to it.

### Acceptance Criteria

WHEN a user taps an episode
THE SYSTEM SHALL begin audio playback and display a persistent player with play/pause, seek bar, current time, and total duration

WHEN a user is already playing an episode and selects a different one
THE SYSTEM SHALL stop the current episode and begin playing the newly selected one

WHEN a user pauses playback
THE SYSTEM SHALL retain the current position and allow resuming from that point

---

## User Story: Persist Playback State

As a listener, I want my playback position saved so that I can resume where I left off.

### Acceptance Criteria

WHEN audio playback is in progress
THE SYSTEM SHALL save the current episode identifier and playback position to localStorage at regular intervals (every 5 seconds)

WHEN the app loads and a saved playback state exists in localStorage
THE SYSTEM SHALL restore the last-played episode in the player and seek to the saved position without auto-playing

WHEN localStorage is unavailable or corrupt
THE SYSTEM SHALL start fresh without errors

---

## User Story: Daily Feed Refresh

As a listener, I want my feeds refreshed daily so that I always see the latest episodes.

### Acceptance Criteria

WHEN the scheduled GitHub Action runs (once daily)
THE SYSTEM SHALL fetch each RSS feed URL from the configured source (GitHub Gist)

WHEN a feed is successfully fetched
THE SYSTEM SHALL parse the feed and store the latest 10 episodes as static JSON data in the built site

WHEN a feed fetch fails (network error, invalid XML, timeout)
THE SYSTEM SHALL log a warning, skip that feed, and continue processing remaining feeds without failing the build

WHEN the Gist containing the feed list is unreachable
THE SYSTEM SHALL fail the build with a clear error message (this is a fatal configuration error)

---

## User Story: Manage Feed List

As a site owner, I want to manage my podcast subscriptions in a GitHub Gist so that the feed list is separate from the app code.

### Acceptance Criteria

WHEN the build process runs
THE SYSTEM SHALL read the feed list from a GitHub Gist URL provided as a repository environment variable (`FEED_GIST_URL`)

WHEN the Gist contains a plain text file with one RSS feed URL per line
THE SYSTEM SHALL use those URLs as the podcast RSS feed sources (ignoring blank lines and lines starting with `#`)

WHEN the Gist contains no valid URLs
THE SYSTEM SHALL fail the build with a descriptive error message

---

## User Story: Light and Dark Mode

As a listener, I want the app to match my system color scheme so that it is comfortable to read.

### Acceptance Criteria

WHEN the user's system is set to dark mode
THE SYSTEM SHALL render the dark color theme

WHEN the user's system is set to light mode
THE SYSTEM SHALL render the light color theme

WHEN the system color scheme changes while the app is open
THE SYSTEM SHALL reactively switch themes without a page reload

---

## User Story: Fast Initial Load

As a listener, I want the app to load quickly on my phone so that I can start listening without delay.

### Acceptance Criteria

WHEN the app loads
THE SYSTEM SHALL render meaningful content (episode list) without waiting for large image downloads

WHEN podcast artwork images are loading
THE SYSTEM SHALL display a placeholder (CSS background color or neutral tone) until the image is ready

WHEN an image fails to load
THE SYSTEM SHALL display the placeholder indefinitely without layout shift or errors

WHEN the app is used on a mobile device
THE SYSTEM SHALL provide touch-friendly tap targets (minimum 44px) and a layout optimized for narrow screens
