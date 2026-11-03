# vidashbyOS — Handoff Guide

This is an OS-style portfolio built with Next.js, adapted from JSOS by Jackson Stephens
(CC BY-NC 4.0). Most personal content now comes from one file, `src/lib/profile.ts`; the
tables below list the remaining places to look.

---

## Quick Start

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000`.

---

## What to Personalize

### 1. Your Identity and Content

| File | What to change |
|------|---------------|
| `src/lib/profile.ts` | Name, title, contact links, OS name/version/kernel, stats, featured projects, repo index, certifications, experience, skills, highlights, communities |
| `src/features/apps/about/TabContent.tsx` | Layout of the About tabs and the System Manual (privacy/terms text) |
| `src/lib/seo/metadata.ts` | Site description used for search and social previews |
| `public/assets/profile_picture/pfp.svg` | Avatar (currently a DA monogram) |
| `public/assets/web_assets/` | Favicon, app icons and `og.png` social preview |

### 2. Desktop Folders & Files

| File | What to change |
|------|---------------|
| `src/features/os/desktop/useDesktop.ts` | Desktop icons (Projects, Certifications, Résumé, Portfolio) |
| `src/features/os/filesystem/files.ts` | Folder contents; generated from `profile.ts` slugs |
| `public/readmes/*.md` | Documents opened from the desktop folders and the Résumé icon |
| `src/lib/seo/path-routing.ts` | Static routes (`/about`, `/resume`, `/projects`, `/certifications`) and per-document routes |

Each document has its own pre-rendered URL, for example `/projects/n8n-workflows` and
`/certifications/audit-compliance`. If you add a featured project or certification group to
`profile.ts`, add the matching `public/readmes/<slug>.md` too.

### 3. Dock & Apps

| File | What to change |
|------|---------------|
| `src/features/os/desktop/dock/dock-config.tsx` | Which apps appear in the dock, icons, order |
| `src/features/os/store/types.ts` | `AppID` enum, window sizes, notification copy |
| `src/features/os/window/app-registry.tsx` | Maps AppIDs to React components |
| `src/features/apps/browser/BrowserApp.tsx` | Portfolio browser (project write-ups and repo index) |
| `src/features/apps/terminal/use-terminal-state.ts` | Terminal commands; the VFS is generated from `profile.ts` |

### 4. Wallpapers

| File | What to change |
|------|---------------|
| `public/assets/wallpapers/` | Drop in your own .jpg files |
| `src/features/os/desktop/wallpapers.ts` | Register them with names and dominant colors |
| `src/features/os/store/system-store.ts` | Default wallpaper path |

### 5. System Manual (FAQ)

The System Manual, privacy policy and terms of use are inline in
`src/features/apps/about/TabContent.tsx` (`ManualPanel`).

### 6. Terminal Commands

All commands live in `src/features/apps/terminal/use-terminal-state.ts` in the `COMMAND_REGISTRY` object. Add, remove, or modify any command there.

Games are separate components:
- `src/features/apps/terminal/SnakeGame.tsx`
- `src/features/apps/terminal/TetrisGame.tsx`
- `src/features/apps/terminal/Game2048.tsx`

### 7. Favicon

Replace `public/favicon.ico` with your own. Also update `public/assets/web_assets/favicon-96x96.png` and the references in `app/layout.tsx`.

### 8. Boot Animation

| File | What to change |
|------|---------------|
| `src/features/os/boot/constants.ts` | Boot duration, logo |
| `src/features/os/boot/BootScreen.tsx` | Boot screen appearance |
| `src/features/os/boot/WelcomeOverlay.tsx` | Post-boot welcome screen |

---

## Architecture at a Glance

```
src/
  features/
    apps/           # Each app is a self-contained folder
      about/        # About Me app (profile sidebar + tabs)
      terminal/     # Terminal emulator with VFS, games, easter eggs
      settings/     # System preferences (wallpaper, dock, terminal color)
      folder/       # Finder-style folder viewer
      markdown/     # Markdown file viewer
      browser/      # Portfolio browser (project write-ups, repo index)
    os/
      boot/         # Boot animation sequence
      desktop/      # Desktop, dock, system bar, wallpaper, icons
      window/       # Window management (drag, resize, minimize, fullscreen)
      store/        # Zustand stores (system state, notifications)
      filesystem/   # Virtual filesystem for desktop folders
      notification/ # macOS-style notification pills
  lib/
    profile.ts      # All personal content (single source of truth)
    seo/            # Metadata, structured data, URL routing
    analytics.ts    # Event tracking
```

State management: **Zustand** with `persist` middleware (wallpaper, dock config, and terminal font color survive page reloads via localStorage).

Styling: **Tailwind CSS** with glassmorphism (`bg-black/60 backdrop-blur-xl`) on all windows.

---

## Deployment

This repository uses a static Next.js export. A production build writes the site
to `out/`:

```bash
npm run build
```

### GitHub Pages

The repository includes `.github/workflows/deploy.yml`, which builds the site,
uploads `out/`, and deploys that artifact. GitHub repository settings must match
that workflow:

1. Open **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**. Do not use
   **Deploy from a branch**: branch mode runs the legacy Pages/Jekyll path and can
   render this repository's `README.md` instead of the Next.js application.
3. If you use a custom domain (for example `vidashby.com`), set it here and add a
   `public/CNAME` file containing that hostname so it is included in `out/`.
4. After changing the source, run or re-run **Deploy to GitHub Pages** in the
   Actions tab and verify that its deployed SHA matches the intended release.
5. When GitHub's DNS check completes, enable **Enforce HTTPS**.

After deleting and recreating the GitHub repository, repeat these settings steps;
Pages source selection is repository metadata and is not restored by Git.

For another static host, deploy the contents of `out/` after running:

```bash
npm run build
```

---

## Easter Eggs

Hidden terminal commands (not shown in `help`):
`sl`, `matrix`, `cowsay`, `fortune`, `apt moo`, `rev`, `neofetch`, `ping`, `coffee`, `sudo`, `rm -rf`
