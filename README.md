# Typod

A static-site podcast player that runs on GitHub Pages. Fetches RSS feeds daily via GitHub Actions, renders a chronological episode list, and persists playback state in localStorage.

## Setup

```bash
git clone <repo-url>
cd typod
npm install
```

## Development

```bash
npm run dev
```

The dev server serves sample data from `public/data/episodes.json` so you can work on the frontend without fetching real feeds.

## Testing

```bash
npm test           # single run
npm run test:watch # watch mode
```

## Building

### Full build (fetch feeds + build site)

```bash
FEED_GIST_URL=<your-gist-url> npm run build:full
```

### Frontend only (uses existing data)

```bash
npm run build
```

Output goes to `dist/`.

## Feed List Configuration

Create a GitHub Gist containing RSS feed URLs, one per line:

```
https://feeds.example.com/podcast1.xml
https://feeds.example.com/podcast2.xml
```

Lines starting with `#` are treated as comments. Blank lines are ignored.

Use the **raw** Gist URL (click "Raw" on the Gist page).

## GitHub Pages Deployment

1. Push the repo to GitHub
2. Go to **Settings > Pages** and set the source to **GitHub Actions**
3. Add a repository variable: **Settings > Secrets and variables > Actions > Variables** — create `FEED_GIST_URL` with your raw Gist URL
4. The workflow runs daily at 5 PM ET, on push to main, and on manual dispatch

## Architecture

- **Build time**: GitHub Actions fetches RSS feeds, resizes artwork to 48/96px WebP, merges all episodes into a single sorted JSON file
- **Runtime**: Vanilla TypeScript SPA reads the static JSON, renders an episode list, plays audio via `<audio>` element, saves state to localStorage
- **No server**: Everything is static files on GitHub Pages
