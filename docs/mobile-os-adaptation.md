# Mobile OS Adaptation

## Overview

Portfolio OS now features a **native mobile OS experience** on viewports < 768px, switching from the desktop windowing system to a mobile-first interface.

## Mobile Features Implemented

### 1. **One App at a Time (Fullscreen)**
- No windowing system on mobile
- Each app opens in fullscreen mode
- Clean slide-in transitions (300ms cubic-bezier)
- Apps fill entire viewport (respecting safe areas)

### 2. **App Drawer Home Screen**
- iOS-style grid layout (4 columns)
- Rounded app icons (1.25rem border-radius)
- Touch-optimized tap targets (16x16 = 64px minimum)
- Dynamic app generation from projects JSON
- Live projects with URLs become launchable apps
- Visual feedback on tap (scale animation)

### 3. **Bottom Navigation Bar**
- Persistent access to core apps
- 4 primary actions: About, Projects, Contact, Settings
- 80px height + safe-area-inset-bottom
- Frosted glass effect (backdrop-blur-xl)
- Touch-friendly 44x44px tap targets

### 4. **Native Mobile Patterns**
- **Safe Area Support**: Respects notches, home indicators, status bars
- **Touch Optimization**: 
  - `touch-action: manipulation` prevents double-tap zoom
  - `-webkit-tap-highlight-color: transparent` removes blue flash
  - Active states instead of hover states
- **Transitions**: 
  - Slide-in from right when opening apps
  - Fade transitions for home screen
  - 300ms duration matching iOS standards

### 5. **Responsive Detection**
- Breakpoint: `768px` (mobile < 768, desktop >= 768)
- Uses VueUse `useWindowSize()` for reactive detection
- Component-level switching (MobileOS vs Desktop)

## Architecture

```
Desktop.vue
├─ isMobile (computed, < 768px)
├─ <MobileOS v-if="isMobile" />    ← New mobile experience
└─ <Desktop v-else />                ← Existing desktop experience
```

### MobileOS.vue Structure

```vue
<mobile-os>
  ├─ <mobile-app-container>          (When app is open)
  │   ├─ Header (back button, title, menu)
  │   └─ Content (async component)
  │
  └─ <mobile-home>                   (App drawer / home screen)
      ├─ Status bar area (safe-area-inset-top)
      ├─ App grid (4 columns, scrollable)
      └─ Bottom navigation (persistent)
</mobile-os>
```

## Key Differences: Desktop vs Mobile

| Feature | Desktop (>= 768px) | Mobile (< 768px) |
|---------|-------------------|------------------|
| **Window Management** | Multi-window, draggable, resizable | One app at a time, fullscreen |
| **Navigation** | Start Menu + Taskbar | App Drawer + Bottom Nav |
| **Desktop Icons** | Draggable grid with live apps | iOS-style app grid |
| **Interaction** | Mouse, hover states, drag | Touch, tap, swipe |
| **Transitions** | Window fade/scale | Slide in/out |
| **Layout** | Flexible window positions | Full viewport apps |

## Touch Optimizations

### Tap Targets
- **Minimum size**: 44x44px (WCAG AAA: 44px)
- **Spacing**: 24px between targets
- **Visual feedback**: Scale animation (0.95) on active

### Safe Areas
```css
.safe-top {
  padding-top: env(safe-area-inset-top);
}

.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

Enable in `index.html`:
```html
<meta name="viewport" content="viewport-fit=cover">
```

## Component Props

### MobileOS
- No props (self-contained)
- Uses stores: `useSystemStore`, `useWindowsStore`
- Reads data: `projects.json`, `contact.json`, `about.json`

### App Icons
Dynamically generated from:
1. **Core apps**: About, Archive, Stack, Contact
2. **Live projects**: Projects with `url !== ""` in `projects.json`

## Testing Checklist

- [ ] Verify on real iPhone (Safari)
- [ ] Verify on real Android (Chrome)
- [ ] Test portrait and landscape
- [ ] Test notch devices (iPhone X+)
- [ ] Test safe area insets
- [ ] Verify all apps render in fullscreen
- [ ] Test back button navigation
- [ ] Test bottom nav persistence
- [ ] Test app drawer scrolling
- [ ] Verify touch targets (44px minimum)
- [ ] Test with slow 3G throttling

## Known Limitations

1. **Swipe Gestures**: Swipe-to-go-back not implemented (removed for build simplicity)
2. **Landscape Mode**: App drawer uses same 4-column layout (could use 6 columns in landscape)
3. **Tablet Breakpoint**: No dedicated tablet layout (768-1024px uses desktop)
4. **Pull-to-Refresh**: Native browser behavior, not customized
5. **App Transitions**: No app-to-app transitions (only app-to-home)

## Future Enhancements

1. Add swipe-to-go-back gesture
2. Tablet-optimized layout (2-column apps, side nav)
3. Landscape mode optimizations
4. App-switching animation (card stack metaphor)
5. Long-press app icon for quick actions
6. Search in app drawer
7. Recent apps section

## Files Modified

- `src/components/mobile/MobileOS.vue` (new, 254 lines)
- `src/components/desktop/Desktop.vue` (+10 lines, responsive detection)
- Build verified: ✅ TypeScript compilation passes
