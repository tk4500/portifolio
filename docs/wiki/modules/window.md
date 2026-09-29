# Module: `window`

The physical boundary and interaction layer of the OS applications.

## Responsibilities

- Render the window chrome (Title bar, minimize/maximize/close buttons).
- Handle mouse and touch dragging via VueUse's `useDraggable`.
- Calculate resize bounding boxes and dispatch updates to the Pinia store.
- Lock bounds to full-screen on mobile devices.

## Key Files

- [`src/components/window/WindowWrapper.vue`](../../../src/components/window/WindowWrapper.vue) — The primary container for all dynamic OS programs.

## Internal Structure

The `WindowWrapper` uses VueUse's `useDraggable` attached to the `titleBarRef`. During the `onMove` event, it actively intercepts the coordinates. If a window is currently snapped to an edge or maximized, and the user begins dragging the title bar, it instantly unsnaps the window and centers it underneath the user's cursor to mimic native Windows/macOS behavior.

Resize is handled manually through custom `mousedown` and `touchstart` event listeners placed on invisible 20px hit areas (`w-5`, `h-5`) along the right and bottom edges of the window frame.

## Notable Patterns / Gotchas

- **Iframe Event Swallowing:** An invisible `<div class="absolute inset-0 bg-transparent z-10">` overlay is spawned over the window content whenever the window is resizing or out-of-focus. This prevents nested iframes (like the Live Portfolio preview) from swallowing the pointer events required to smoothly drag the window.
- **Taskbar Offset Logic:** The `computedStyle` actively checks `systemStore.taskbarPosition`. If the taskbar is on the top or left, it dynamically injects a `48px` margin into the window's `top` or `left` CSS properties when maximized, ensuring the title bar is never hidden behind the taskbar.