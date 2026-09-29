# Sequence Diagrams

## Workflow: Spawning a New Window

This workflow occurs when a user single-clicks a Desktop Icon or selects an app from the Start Menu.

```mermaid
sequenceDiagram
    participant User
    participant DesktopIcon
    participant WindowsStore
    participant Desktop
    participant WindowWrapper
    
    User->>DesktopIcon: Single click (or touch)
    DesktopIcon->>WindowsStore: registerOrOpenWindow({appId, ...})
    
    alt Window already exists (and not multi-instance)
        WindowsStore->>WindowsStore: un-minimize & focusWindow(id)
    else New Window
        WindowsStore->>WindowsStore: push to `windows` array
    end
    
    WindowsStore-->>Desktop: Reactive state update
    Desktop->>WindowWrapper: Mount component (v-for win in activeWindows)
    WindowWrapper->>User: Renders dragging boundaries and content slot
```

## Workflow: Infinite Iframe Inception

This workflow occurs when a user opens the "Portfólio OS" project inside the `ProjectViewer` to see a live preview of the OS within the OS.

```mermaid
sequenceDiagram
    participant User
    participant ProjectViewer
    participant IframeViewer
    participant Browser
    
    User->>ProjectViewer: Click "Live Preview" button
    ProjectViewer->>IframeViewer: Mount with url="https://portifolio.tarcisio.site/"
    
    IframeViewer->>IframeViewer: parsed.searchParams.set('inception_depth', randomHash)
    Note right of IframeViewer: Bypasses Chrome/Safari infinite recursion blocking
    
    IframeViewer->>Browser: Render <iframe src="url?inception_depth=x8f2">
    Browser-->>User: Inner OS loads successfully
```