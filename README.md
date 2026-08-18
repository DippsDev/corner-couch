# CornerCouch

A website for an open-bar club, built with Vite.js. It includes stacked full-screen scenes, a booking overlay, and drinks and food menus, with motion handled by GSAP and Lenis.

## Stack

- [Vite](https://vite.dev/)
- [GSAP](https://gsap.com/)
- [Lenis](https://github.com/darkroomengineering/lenis)

## Local development

```bash
npm install
npm run dev
```

The site runs at `http://localhost:5173/`.

## Build

```bash
npm run build
npm run preview
```

Production files are written to `dist/`.

## Deploy

This is a static Vite app. On Vercel, import the repo and use:

- **Build command:** `npm run build`
- **Output directory:** `dist`

## Project layout

| Path | Role |
| --- | --- |
| `index.html` | Page structure, copy, menus, booking form |
| `src/styles.css` | Theme, layout, and responsive styles |
| `src/main.js` | Intro, scroll, menu, booking, date picker, accordion |
| `public/images/` | Photos and placeholder artwork |

Replace the copy in `index.html` and the files in `public/images/` with the venue’s own content.
