# Typod

A simple, beautiful podcast player for your personal podcast collection. Built as a static site that runs entirely on GitHub Pages—no server needed, no monthly fees.

**[See it in action →](https://pglevy.github.io/typod/)**

## ✨ Features

- **📱 Mobile-first design** - Clean, responsive interface optimized for phones
- **🎧 Automatic updates** - Fetches your podcast feeds daily and updates the playlist
- **💾 Remembers your spot** - Pick up right where you left off, even after closing your browser
- **⚡ Fast & lightweight** - Static site with optimized images (WebP format)
- **🌓 Light/dark mode** - Automatically matches your system theme preference
- **🔒 Privacy-focused** - All playback data stays in your browser, nothing tracked

## 🚀 Use This Template

Want your own podcast player? Here's how to set it up (no coding required):

### 1. Create Your Repository

1. Click the green **"Use this template"** button at the top of this page
2. Name your repository (e.g., `my-podcasts`)
3. Make it **public** (required for free GitHub Pages)

### 2. Create Your Feed List

1. Go to [gist.github.com](https://gist.github.com) and create a new Gist
2. Add your podcast RSS feed URLs, **one per line**:
   ```
   https://feeds.example.com/podcast1.xml
   https://feeds.example.com/podcast2.xml
   ```
3. Save the Gist (can be public or secret)
4. Copy the Gist ID from the URL (e.g., `https://gist.github.com/YOUR-USERNAME/GIST-ID`) and form the raw URL like this:
   ```
   https://gist.githubusercontent.com/YOUR-USERNAME/GIST-ID/raw/feeds.txt
   ```
   Using this format (without a commit hash) ensures the workflow always fetches the latest version of your feed list.

### 3. Configure GitHub Pages

1. In your repository, go to **Settings → Pages**
2. Under "Source", select **GitHub Actions**

### 4. Add Your Feed URL

1. In your repository, go to **Settings → Secrets and variables → Actions → Variables** tab
2. Click **"New repository variable"**
3. Name: `FEED_GIST_URL`
4. Value: Paste your raw Gist URL from step 2
5. Click **"Add variable"**

### 5. Deploy!

1. Go to the **Actions** tab in your repository
2. Click on **"Build and Deploy"** in the left sidebar
3. Click **"Run workflow"** → **"Run workflow"**
4. Wait 1-2 minutes for it to complete
5. Your player will be live at `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`

🎉 That's it! Your player will now update automatically every day at 5 PM ET.

## ⚙️ Customization

### Change the Update Schedule

The player fetches new episodes daily at **5:00 PM ET** (22:00 UTC). To change this:

1. Edit [`.github/workflows/build.yml`](.github/workflows/build.yml)
2. Find the line with `cron: '0 22 * * *'` (line 5)
3. Update the cron schedule ([crontab.guru](https://crontab.guru) is helpful)
4. Commit and push your changes

### Update Your Feed List

Just edit your Gist and add/remove feed URLs. The next scheduled build (or manual run) will pick up the changes.

### Manual Updates

You can trigger a build anytime:
1. Go to **Actions** tab → **Build and Deploy**
2. Click **"Run workflow"**

---

## 👨‍💻 Development

Want to customize the code? Here's how to run it locally:

### Prerequisites

- [Deno](https://deno.com/) (latest)

### Local Setup

```bash
git clone <your-repo-url>
cd typod
deno install
```

### Development Server

```bash
deno task dev
```

Opens at `http://localhost:5173`. Uses sample data from `public/data/episodes.json`.

### Testing

```bash
deno task test
```

### Fetch Real Feeds Locally

```bash
# Create a .env file with your Gist URL
echo "FEED_GIST_URL=<your-gist-url>" > .env
deno task fetch-feeds
deno task dev
```

### Build for Production

```bash
deno task build
```

Output goes to `dist/`. Preview with `deno task preview`, or serve with `deno task serve`.

## 📐 Architecture

- **Build time**: GitHub Actions fetches RSS feeds, resizes artwork to WebP, merges episodes into a single sorted JSON file
- **Runtime**: Vanilla TypeScript reads the static JSON, renders the episode list, plays audio via HTML5 `<audio>`, saves state to localStorage
- **Stack**: Deno, Vite, TypeScript, Vitest, Sharp (image processing)
- **Styling**: Mobile-first CSS with warm color palette, Source Serif 4 headings

## 📄 License

MIT - feel free to use this for your own podcast player!
