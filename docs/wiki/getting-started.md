# Getting Started

## Prerequisites

- Node.js (v18+ recommended)
- `npm` or `yarn`

## Installation

```bash
git clone https://github.com/tk4500/portifolio.git
cd portifolio
npm install
```

## First Run

```bash
npm run dev
```
Open `http://localhost:5173` in your browser. The "About Me" window should automatically open upon initial load.

## Common Workflows

### Modifying the Portfolio Content
The content rendered inside the OS is entirely driven by static JSON files. You do not need to modify Vue components to update your resume.

1. Open `src/assets/data/projects.json` to add new portfolio pieces.
2. Ensure you add both an English (`"en": []`) and Portuguese (`"pt": []`) array.
3. Drop new screenshots into `public/screenshots/<project-name>/` and reference them in the JSON array.

### Changing the OS Theme
1. Click the Start button (🪟) or press `Win / ⌘`.
2. Open the **Settings** (⚙️) app.
3. Toggle between predefined wallpaper gradients, or move the Taskbar to test the responsive layout logic.

## Configuration

- `src/assets/data/` — JSON stores for bio, projects, and stack.
- `.impeccable/config.json` — The workflow configuration for the Impeccable design system (currently set to `"buildPath": "code"`).

## Where to Go Next

- Architecture: [architecture.md](architecture.md)
- Module reference: [README.md#module-map](README.md#module-map)