# Portfolio OS — Agent Instructions

An interactive, desktop operating system (OS) metaphor portfolio built to prove advanced frontend capabilities (window physics, global state management, responsive constraints). 
**Stack:** Vue 3 (Composition API), TypeScript, Vite, Tailwind CSS v4, Pinia, Vue-i18n.
**Repository:** https://github.com/tk4500/portifolio.git

## Project Layout

- `src/components/desktop/` — The root canvas and draggable desktop shortcuts.
- `src/components/window/` — `WindowWrapper.vue` handles all dragging, resizing, snapping, and boundaries.
- `src/components/taskbar/` — The system tray, active window grouping, and Start Menu.
- `src/components/programs/` — The actual data-driven applications (About, Projects, Stack) rendered inside windows.
- `src/stores/` — Pinia state (`useWindowsStore.ts` for window bounds/z-index, `useSystemStore.ts` for global theme/layout).
- `src/assets/data/` — JSON files providing the content for the programs.
- `docs/` — Architecture decisions (ADRs) and the Code Wiki.

## Dev Environment

Node.js v18+ required.
- Install dependencies: `npm install`
- Start dev server: `npm run dev`

## Build & Test

- **Build:** `npm run build` (Runs `vue-tsc -b && vite build`)
- **Preview:** `npm run preview`
- **Lint:** *(No explicit linter command in package.json; rely on `vue-tsc` during build)*

## Conventions

- **State-Driven UI:** All window mutations (minimize, maximize, snap, focus) must go through `useWindowsStore`. Components watch this state to update inline styles.
- **Web-Native Compromise (ADR-001):** Desktop icons use single-click (not double-click) to match web expectations.
- **Responsive Architecture:** Do not build mobile dragging. Viewports `<768px` automatically force windows to `100vw`/`100vh` and disable resizing/dragging to avoid touch friction.
- **Split Typography:** Use `font-sans` (system UI fonts) for OS shell elements (taskbar, titlebars, menus). Use `Cabinet Grotesk` (via `main.css`) for the content *inside* the windows.
- **Data Decoupling:** Portfolio content is kept in `src/assets/data/*.json`. Do not hardcode bio/project text in the Vue components.

## Pitfalls

- **Iframe Event Swallowing:** When dragging or resizing a window, iframes (like in `IframeViewer.vue`) will swallow pointer events and break the drag. `WindowWrapper.vue` uses an invisible `z-10` overlay during these states to prevent this. Do not remove it.
- **Iframe Infinite Recursion:** Rendering the live portfolio inside itself triggers browser memory protections (resulting in an `about:blank` screen). `IframeViewer` bypasses this by appending a randomized `?inception_depth=` query parameter to trick the browser.
- **Taskbar Offsets:** `WindowWrapper.vue` dynamically reads the taskbar position (top, bottom, left, right) to inject `48px` offsets during maximization. Do not use hardcoded `top: 0` without checking `systemStore.taskbarPosition`.