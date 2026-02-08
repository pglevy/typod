# Typod - Implementation Tasks

## Phase 1: Project Scaffolding

- [ ] **Task 1.1**: Initialize project with Vite + TypeScript
  - Expected outcome: `npm create vite` with vanilla-ts template, strict tsconfig, project builds and serves locally
  - Dependencies: None

- [ ] **Task 1.2**: Set up project structure
  - Expected outcome: Create directory layout (`src/`, `src/components/`, `scripts/`), add empty module files matching the design doc structure (`main.ts`, `state.ts`, `player.ts`, `types.ts`, `utils.ts`, `style.css`, `components/player-bar.ts`, `components/episode-row.ts`)
  - Dependencies: Task 1.1

- [ ] **Task 1.3**: Define TypeScript interfaces
  - Expected outcome: `src/types.ts` contains `Episode` and `PlaybackState` interfaces matching the design doc data models
  - Dependencies: Task 1.1

- [ ] **Task 1.4**: Create sample data for development
  - Expected outcome: A `public/data/` directory with a sample `episodes.json` (mixed episodes from 2–3 fake shows, sorted by date) and placeholder artwork PNGs so the app can be developed and tested without running the fetch script
  - Dependencies: Task 1.3

- [ ] **Task 1.5**: Set up test framework
  - Expected outcome: Install Vitest. Add `test` script to `package.json`. Create a trivial passing test to confirm the setup works. Configure to support TypeScript and Node APIs (for testing the build script).
  - Dependencies: Task 1.1

---

## Phase 2: Build Pipeline (Feed Fetcher)

- [ ] **Task 2.1**: Create feed fetch script skeleton
  - Expected outcome: `scripts/fetch-feeds.ts` with a `main()` function that reads `FEED_GIST_URL` from env, fetches the Gist, and parses the JSON array of feed URLs. Fails with clear error if Gist is unreachable or malformed.
  - Dependencies: Task 1.2
  - References: requirements.md (Manage Feed List)

- [ ] **Task 2.2**: Implement RSS parsing
  - Expected outcome: Given an RSS feed URL, fetches XML, parses it with `fast-xml-parser`, and extracts feed metadata (title, imageUrl) + latest 10 episodes into typed objects. Handles timeout (15s) and parse errors gracefully (skip + log).
  - Dependencies: Task 2.1
  - References: requirements.md (Daily Feed Refresh)

- [ ] **Task 2.3**: Implement artwork processing
  - Expected outcome: Downloads feed artwork image, resizes to 48px and 96px WebP using `sharp`, writes to `dist/data/artwork/[slug]-48.webp` and `[slug]-96.webp`. Skips gracefully on failure.
  - Dependencies: Task 2.2

- [ ] **Task 2.4**: Merge, sort, and write output
  - Expected outcome: Script merges all episodes from all feeds into a single array, denormalizing feed title/slug/artwork onto each episode. Sorts by `pubDate` descending (tiebreaker: alphabetical by feed title). Writes `dist/data/episodes.json`.
  - Dependencies: Task 2.2, Task 2.3

- [ ] **Task 2.5**: Test RSS parsing and episode merging
  - Expected outcome: Tests in `scripts/__tests__/fetch-feeds.test.ts` covering: (1) parsing valid RSS XML extracts correct feed title, episode titles, guids, pubDates, durations, and enclosure URLs; (2) only the latest 10 episodes are kept when a feed has more; (3) malformed XML is handled gracefully (returns empty, logs warning); (4) merging episodes from multiple feeds produces a single array sorted by date descending with correct tiebreaker; (5) slug generation produces expected output for various feed titles.
  - Dependencies: Task 2.2, Task 2.4, Task 1.5
  - References: requirements.md (Daily Feed Refresh)

- [ ] **Task 2.6**: Add build script integration
  - Expected outcome: `package.json` has a `fetch-feeds` script that runs the fetch script via `tsx`. Vite build copies `dist/data/` into the final output. Full build command: `npm run fetch-feeds && npm run build`.
  - Dependencies: Task 2.5

---

## Phase 3: GitHub Actions

- [ ] **Task 3.1**: Create GitHub Actions workflow
  - Expected outcome: `.github/workflows/build.yml` with daily cron (22:00 UTC / 5 PM ET), manual dispatch, and push-to-main triggers. Installs deps, runs tests, runs `fetch-feeds`, runs Vite build, deploys to GitHub Pages.
  - Dependencies: Task 2.6
  - References: requirements.md (Daily Feed Refresh)

- [ ] **Task 3.2**: Configure GitHub Pages deployment
  - Expected outcome: Workflow uses `actions/deploy-pages` for deployment. Repository needs Pages enabled with "GitHub Actions" as source (documented in README).
  - Dependencies: Task 3.1

---

## Phase 4: Frontend - Core Structure & Styling

- [ ] **Task 4.1**: Implement base styles and theming
  - Expected outcome: `src/style.css` contains CSS custom properties for light/dark mode (matching design doc palette), typography setup with Source Serif 4 (700 weight only), system sans-serif body stack, spacing scale, and base element resets. `prefers-color-scheme` media query switches themes. Mobile-first: default styles target ~375px, `max-width: 600px` centered on wider screens.
  - Dependencies: Task 1.2
  - References: requirements.md (Light and Dark Mode), design.md (Visual Design)

- [ ] **Task 4.2**: Implement localStorage state module
  - Expected outcome: `src/state.ts` exports `getPlaybackState(): PlaybackState | null` and `savePlaybackState(state: PlaybackState): void` with try/catch around all localStorage access. Key: `typod_playback`.
  - Dependencies: Task 1.3
  - References: requirements.md (Persist Playback State)

- [ ] **Task 4.3**: Test localStorage state module
  - Expected outcome: Tests in `src/__tests__/state.test.ts` covering: (1) `savePlaybackState()` writes valid JSON to localStorage under key `typod_playback`; (2) `getPlaybackState()` returns the saved state correctly; (3) `getPlaybackState()` returns `null` when no state is stored; (4) `getPlaybackState()` returns `null` and doesn't throw when localStorage contains corrupt/invalid JSON; (5) both functions handle localStorage being unavailable (e.g., throws on access) without crashing.
  - Dependencies: Task 4.2, Task 1.5
  - References: requirements.md (Persist Playback State)

---

## Phase 5: Frontend - Episode List

- [ ] **Task 5.1**: Build episode row component
  - Expected outcome: `src/components/episode-row.ts` renders a row with 48px artwork (lazy-loaded, placeholder, fade-in on load, error fallback), episode title, show name, date, and duration. Entire row is tappable with min height 64px. Truncated description with expand toggle.
  - Dependencies: Task 4.1
  - References: design.md (Layout, Artwork Handling)

- [ ] **Task 5.2**: Build episode list and main entry point
  - Expected outcome: `src/main.ts` fetches `data/episodes.json`, renders header ("Typod" in Source Serif 4) and a vertical list of episode rows with staggered fade-in (first ~10 rows only). Handles empty state. Includes scroll padding for player bar.
  - Dependencies: Task 5.1, Task 1.4
  - References: requirements.md (Browse Episodes)

---

## Phase 6: Frontend - Audio Player

- [ ] **Task 6.1**: Implement audio player module
  - Expected outcome: `src/player.ts` manages a singleton `<audio>` element. Exports `play(episode)`, `pause()`, `resume()`, `seek(seconds)`. Dispatches custom events for UI updates. Saves to localStorage every 5 seconds during playback.
  - Dependencies: Task 4.2
  - References: requirements.md (Play an Episode, Persist Playback State)

- [ ] **Task 6.2**: Build player bar component
  - Expected outcome: `src/components/player-bar.ts` renders the fixed-bottom player bar (72px). Stacked layout: play/pause button + episode title + time on top line, full-width seek bar below. Backdrop blur. Slide-up animation on first activation.
  - Dependencies: Task 6.1, Task 4.1
  - References: design.md (Layout, Player bar)

- [ ] **Task 6.3**: Wire player to episode list
  - Expected outcome: Tapping an episode row triggers `player.play()`, updates the player bar, and highlights the active row with a left accent border. Play/pause in the bar toggles playback. Seek bar updates in real time.
  - Dependencies: Task 6.2, Task 5.1

- [ ] **Task 6.4**: Implement state restoration on load
  - Expected outcome: On app init, if `getPlaybackState()` returns data, the player bar renders with the saved episode info and seek position. Audio is loaded but NOT auto-played. User must tap play to resume.
  - Dependencies: Task 6.3
  - References: requirements.md (Persist Playback State)

---

## Phase 7: Polish

- [ ] **Task 7.1**: Add utility formatters
  - Expected outcome: `src/utils.ts` with `formatDuration(seconds)` → "45 min" / "1 hr 12 min", `formatDate(isoString)` → "Jan 15", sanitize HTML for episode descriptions.
  - Dependencies: Task 1.2

- [ ] **Task 7.2**: Mobile testing and fixes
  - Expected outcome: Test at 375px (primary), 390px, 428px phone sizes. Verify touch targets are >=44px, player bar is usable one-handed, no horizontal overflow. Test on wider screens to verify max-width centering.
  - Dependencies: Task 6.3

- [ ] **Task 7.3**: Performance audit
  - Expected outcome: Verify no large image downloads (only 48/96px WebP thumbnails), check Lighthouse score on mobile, ensure font loads with swap strategy, confirm lazy loading works.
  - Dependencies: Task 5.2, Task 6.3
  - References: requirements.md (Fast Initial Load)

- [ ] **Task 7.4**: Write README
  - Expected outcome: README documents setup (clone, install, dev server), configuring `FEED_GIST_URL`, Gist format, GitHub Actions setup, and GitHub Pages deployment.
  - Dependencies: Task 3.2
