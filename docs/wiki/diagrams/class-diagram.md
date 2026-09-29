# Class Diagram

## Core State Models

```mermaid
classDiagram
    class WindowState {
        +string id
        +string appId
        +string titleKey
        +string component
        +boolean isOpen
        +boolean isMinimized
        +boolean isMaximized
        +string snappedPosition
        +number zIndex
        +number x
        +number y
        +number width
        +number height
        +string icon
    }

    class DesktopIconState {
        +string id
        +string titleKey
        +string icon
        +number x
        +number y
    }

    class SystemState {
        +string taskbarPosition
        +string backgroundColor
        +boolean isStartMenuOpen
        +string theme
        +List~DesktopIconState~ desktopIcons
    }

    class WindowsStore {
        +List~WindowState~ windows
        +number highestZIndex
        +focusWindow(id)
        +updateWindowSize(id, w, h)
        +updateWindowPosition(id, x, y)
    }

    WindowsStore "1" *-- "many" WindowState : manages
    SystemState "1" *-- "many" DesktopIconState : manages
```

## Notes

Because Vue 3 Composition API stores do not strictly utilize ES6 classes, the diagram above models the shape of the TypeScript interfaces and the functional mutations occurring within the Pinia stores. The `WindowState` is the single source of truth that the `WindowWrapper.vue` component watches reactively to update its inline CSS.