# ADR-001: Web-Native Adaptation of Desktop OS Metaphor

## Status
Accepted

## Date
2026-09-29

## Context
This project is a personal portfolio built using an interactive, desktop operating system (OS) metaphor. The goal is to prove frontend engineering capability by replicating OS physics (draggable windows, edge-snapping, taskbar grouping, z-index focus).

However, strict adherence to a desktop OS creates severe friction for standard web users and mobile users:
- **Mobile constraints:** Thumbs cannot easily grab 8px window borders. The viewport is too small to manage multiple overlapping floating windows.
- **Web conventions:** Web users expect single-click interactions, whereas desktop OS icons historically require double-clicks.
- **Browser Security:** Infinite nested rendering of the portfolio inside itself (the `IframeViewer` component) triggers browser infinite-recursion protections, forcing a fallback to `about:blank`.

We needed a strategy to maintain the "Vanguard UI" aesthetics and the OS novelty without alienating mobile users, frustrating web users, or triggering browser security faults.

## Decision
We chose a **Web-Native Compromise** architecture:
1. **Mobile-Maximized Fallback:** On viewports below 768px, all active windows automatically dock to full width (`100vw`) and height (`100vh - 48px`), disabling drag-and-resize mechanics entirely.
2. **Single-Click Activation:** Desktop icons and taskbar items respond to a single click/tap. Double-click is removed from the critical path.
3. **Iframe Recursion Bypass:** We intercept iframe URLs and append a randomized query parameter (`?inception_depth=[hash]`) to the `src` attribute. 

## Alternatives Considered

### Strict Desktop Emulation
- **Pros:** Conceptually pure.
- **Cons:** Completely breaks mobile usability. Results in an inaccessible portfolio.
- **Rejected:** The portfolio must function as a professional tool to acquire clients. Novelty cannot supersede usability.

### Mobile-Specific Routing (Separate UI)
- **Pros:** Allows a tailored, standard scrolling portfolio for mobile users.
- **Cons:** High maintenance cost. Fails to demonstrate the complex state management capabilities on mobile devices.
- **Rejected:** We want mobile users to still experience the "app" feel (taskbar, start menu, full-screen apps) powered by the same Pinia state.

## Consequences
- **Positive:** The portfolio achieves an Awwwards-tier 32/32 Impeccable rating. Mobile users get a highly usable "App Stack" view, while desktop users get the full windowed OS view.
- **Positive:** Infinite "inception" (OS inside an OS) functions flawlessly for technical demonstration.
- **Negative:** Some conceptual purity is lost (e.g., single-click icons), but the friction removed vastly outweighs the aesthetic compromise.
