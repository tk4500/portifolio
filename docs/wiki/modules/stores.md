# Module: `stores`

The global state management layer powering the Desktop OS metaphor.

## Responsibilities

- Centralize all coordinates, bounds, and stacking logic for active windows.
- Manage global OS settings (Taskbar position, wallpaper, dark/light theme).
- Handle localization toggling.

## Key Files

- [`src/stores/useWindowsStore.ts`](../../../src/stores/useWindowsStore.ts) — Manages the array of active windows, z-index sorting, edge snapping, maximization states, and coordinate updates during drag events.
- [`src/stores/useSystemStore.ts`](../../../src/stores/useSystemStore.ts) — Manages the shell layout (Start Menu toggles, taskbar positioning, desktop icon coordinates) and global UI themes.

## Public API

```typescript
// useWindowsStore
function registerOrOpenWindow(newWindow: WindowState)
function closeWindow(id: string)
function minimizeWindow(id: string)
function toggleShowDesktop()
function toggleMaximize(id: string)
function focusWindow(id: string)
function snapWindow(id: string, position: 'left' | 'right')
function updateWindowPosition(id: string, x: number, y: number)
function updateWindowSize(id: string, width: number, height: number)

// useSystemStore
function setTaskbarPosition(position: 'bottom' | 'top' | 'left' | 'right')
function toggleStartMenu()
function updateIconPosition(id: string, x: number, y: number)
```

## Internal Structure

The `useWindowsStore` relies on a reactive array of `WindowState` objects. Z-index is managed globally: whenever a window is focused (`focusWindow`), the store increments a global `highestZIndex` ref and assigns it to that specific window, ensuring it is always painted on top of the DOM. 

## Notable Patterns / Gotchas

- **Edge Snapping State:** If `snappedPosition` is set to `'left'` or `'right'`, the window completely ignores its internal `x`, `y`, `width`, and `height` properties, deferring to the CSS calculated in `WindowWrapper.vue` to fill exactly 50% of the screen.
- **Show Desktop:** The `toggleShowDesktop` function checks if *all* active windows are currently minimized. If so, it restores them. If even one is visible, it minimizes everything.