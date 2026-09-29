# Desktop Metaphor Portfolio - Code Wiki

A dynamic, interactive portfolio website built with Vue 3, TypeScript, Vite, and Tailwind CSS. This project mimics a classic desktop operating system environment within the browser, serving as an interactive showcase of projects, skills, and professional experience.

## Key Concepts

- **OS Metaphor** — The entire site is rendered as a desktop environment. Content is not scrolled linearly; instead, it is opened in draggable, resizable, floating windows.
- **State-Driven UI** — The core of the application relies heavily on Pinia stores (`useSystemStore`, `useWindowsStore`) to globally manage active windows, z-indexes, focus, taskbar position, and the overall system theme.
- **Data-Driven Programs** — The internal portfolio content (About Me, Projects, Skills Stack) is decoupled from the UI. Content is loaded dynamically from static JSON files (`src/assets/data/`) and injected into the windowed "programs".

## Entry Points

- [`src/main.ts`](../../src/main.ts) — The Vue application bootstrapper. Instantiates Pinia (state), Vue-i18n (localization), imports the global CSS, and mounts the root `App.vue`.
- [`src/App.vue`](../../src/App.vue) — The absolute root component. Acts as a simple wrapper that renders the primary `<Desktop />` component.

## High-Level Architecture

The architecture mimics a traditional operating system stack. The `Desktop` component acts as the root canvas. It renders `DesktopIcon` components (the shortcuts), `WindowWrapper` components (the active application windows), and the `Taskbar` (the system tray and start menu). 

Application state (which windows are open, minimized, focused, and where they are placed) is centrally managed by the Pinia `windowsStore`. The visual configuration (taskbar position, background theme, language) is managed by the `systemStore`. The actual portfolio content is loaded into specific "program" components (like `ProjectViewer.vue`) that are dynamically instantiated inside a `WindowWrapper`.

See [architecture.md](architecture.md).

## Module Map

| Module | Purpose |
|---|---|
| [`stores`](modules/stores.md) | Pinia state management for the OS (Windows & System). |
| [`components/window`](modules/window.md) | The core dragging, resizing, and snapping engine for OS windows. |
| [`components/taskbar`](modules/taskbar.md) | System tray, Start Menu, and active window application tracking. |
| [`components/desktop`](modules/desktop.md) | The root canvas and draggable desktop shortcuts. |
| [`components/programs`](modules/programs.md) | The internal applications (About, Projects, Stack) that render the portfolio data. |

## Getting Started

See [getting-started.md](getting-started.md).