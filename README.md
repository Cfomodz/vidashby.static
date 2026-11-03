# vidashbyOS: David Ashby's portfolio

The vidashby portfolio as an OS-style desktop: draggable windows, a dock, a working terminal
with a virtual filesystem, and folders you can browse. Built with Next.js and exported as a
static site.

## What's on the desktop

| Where | What it shows |
|-------|---------------|
| **About** (dock) | Overview and stats, featured projects with the filterable GitHub repo index, certifications, the experience timeline, and the System Manual |
| **Projects** folder | One document per featured project |
| **Certifications** folder | Credentials grouped by area, plus education |
| **Résumé** | The full résumé as a document |
| **Portfolio** (Browser) | Project write-ups and the repo index in a tabbed browser |
| **Terminal** (dock) | `about`, `contact`, `resume`, `ls`, `cat`, `tree`, games and a few easter eggs |

## Editing content

Personal content lives in [`src/lib/profile.ts`](./src/lib/profile.ts). The About app, terminal,
browser and SEO metadata all read from it. The long-form documents opened from desktop
folders are Markdown files in [`public/readmes/`](./public/readmes/).

Project images are in `public/assets/projects/`. `public/sales.html` is served as-is at
`/sales.html`.

## Quick start

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The static site is written to `out/`. See [HANDOFF.md](./HANDOFF.md) for deployment and a full
customization map.

## Credits

The OS interface is adapted from [JSOS](https://github.com/JKSNS/JKSNS.github.io) by Jackson
Stephens, licensed under [CC BY-NC 4.0](./LICENSE). Content, branding and several apps were
changed for vidashby.
