# Implementation Plan: Mobile Project Interaction Behavior

## Overview

Implement distinct tap and long-press/contextmenu behaviors for project apps in mobile mode:
- **Tap (single quick tap)**: Direct action — open live site, show screenshots, or prompt for GitHub
- **Long-press OR right-click (contextmenu)**: Detailed info modal with description, stack, links, and all metadata

This behavior applies ONLY in mobile mode (`isMobile` computed property). Desktop mode continues using existing window-based logic.

## Architecture Decisions

### Decision 1: Tap vs Context Menu Semantics
- **Tap (single)**: Quick action, immediate result (matches mobile OS conventions: tap = open)
- **Long-press OR right-click**: Detailed information (matches both mobile long-press and desktop right-click = context menu)
- Rationale: Users expect tap to "just work"; context actions (long-press on touch, right-click on mouse) for additional options

### Decision 2: Event Handling Strategy
- **Touch devices**: Use `touchstart` + `touchend` with 500ms threshold for long-press detection
- **Mouse devices**: Use `contextmenu` event (right-click) to trigger info modal
- **Fallback**: Cancel long-press on `touchmove` (user is scrolling, not pressing)
- Rationale: Handles both touch-only phones and desktop testing with mouse

### Decision 2: Screenshot Fallback Strategy
- Priority: Live site > Screenshots > GitHub prompt
- Phone screenshots = portrait-oriented images in `screenshots/` directory
- If no phone-appropriate screenshots exist, treat as "no screenshots"
- Rationale: Avoid landscape/desktop screenshots that don't fit mobile view

### Decision 3: GitHub Prompt Implementation
- Use native `confirm()` dialog: "This project is not live. Open GitHub repository?"
- On confirm: `window.open(project.github, '_blank')`
- Rationale: Simple, native, no new modal component needed

### Decision 4: Info Modal Component
- Reuse existing `ProjectViewer.vue` component
- Pass project data via props (not sessionStorage)
- Render in overlay (similar to long-press dialog pattern)
- Rationale: DRY principle, existing component has all needed features

## Current State Analysis

**Files involved:**
- `src/components/mobile/MobileOS.vue` — Main mobile container
- `src/components/programs/ProjectViewer.vue` — Project detail view
- `src/assets/data/projects.json` — Project metadata

**Current behavior (INCORRECT):**
- Tap opens iframe (live) or ProjectViewer (non-live)
- Long-press shows basic info dialog with tech stack

**What needs to change:**
- Swap tap/long-press handlers
- Add screenshot detection logic
- Add GitHub prompt for projects with no site + no screenshots
- Show full ProjectViewer modal on long-press

## Task List

### Phase 1: Data Structure & Detection (Foundation)

- [ ] **Task 1**: Add screenshot detection utility function
  - Create `hasPhoneScreenshots(project)` helper
  - Check if `project.screenshots` array has portrait images
  - Return boolean
  - **Acceptance criteria:**
    - Function correctly identifies phone screenshots
    - Returns false for empty arrays
    - Returns false for landscape-only screenshots
  - **Verification:**
    - Unit test with sample projects
    - Console log output for each project type
  - **Dependencies:** None
  - **Files:**
    - `src/components/mobile/MobileOS.vue` (add helper function)
  - **Scope:** Small (1 file)

- [ ] **Task 2**: Create project action classifier
  - Create `getProjectAction(project)` helper
  - Returns: `'live-site' | 'screenshots' | 'github-prompt'`
  - Logic: live site exists → 'live-site', has phone screenshots → 'screenshots', else → 'github-prompt'
  - **Acceptance criteria:**
    - Correctly classifies all project types
    - Handles missing/null URLs
    - Handles empty screenshot arrays
  - **Verification:**
    - Test with all 8 projects in projects.json
    - Log classification for each project
  - **Dependencies:** Task 1
  - **Files:**
    - `src/components/mobile/MobileOS.vue` (add helper function)
  - **Scope:** Small (1 file)

### Checkpoint: Foundation
- [ ] All helper functions defined
- [ ] All projects classified correctly
- [ ] No TypeScript errors

### Phase 2: Tap Handler Implementation

- [ ] **Task 3**: Implement tap handler for live sites
  - Tap opens iframe with project URL
  - Set `currentApp.value = 'iframe'`
  - Store URL and title in sessionStorage
  - **Acceptance criteria:**
    - Tapping live project opens iframe
    - Correct URL loads
    - Title displays correctly
  - **Verification:**
    - Manual test: tap "Portfolio OS" project
    - Iframe opens with live site
    - Back button returns to home
  - **Dependencies:** Task 2
  - **Files:**
    - `src/components/mobile/MobileOS.vue` (modify `openApp` function)
  - **Scope:** Small (1 file)

- [ ] **Task 4**: Implement tap handler for screenshot projects
  - Create screenshot gallery component or use existing viewer
  - Tap opens fullscreen screenshot carousel
  - Show all project screenshots
  - **Acceptance criteria:**
    - Tapping project with screenshots shows gallery
    - All screenshots visible
    - Can swipe through images
    - Close button returns to home
  - **Verification:**
    - Manual test: tap "Telegram Mirror" project (has 6 screenshots)
    - Gallery opens with all images
    - Swipe navigation works
  - **Dependencies:** Task 2
  - **Files:**
    - `src/components/mobile/MobileOS.vue` (add screenshot gallery)
    - `src/components/programs/ScreenshotGallery.vue` (new component)
  - **Scope:** Medium (2 files, new component)

- [ ] **Task 5**: Implement tap handler for GitHub prompt
  - Tap shows native confirm dialog
  - Message: "This project is not live. Open GitHub repository?"
  - On confirm: open GitHub in new tab
  - On cancel: do nothing
  - **Acceptance criteria:**
    - Tapping project with no site/screenshots shows prompt
    - Confirm opens GitHub in new tab
    - Cancel does nothing
    - Dialog text is clear and helpful
  - **Verification:**
    - Manual test: tap project with no live site and no screenshots
    - Confirm dialog appears
    - GitHub opens in new tab when confirmed
  - **Dependencies:** Task 2
  - **Files:**
    - `src/components/mobile/MobileOS.vue` (modify `openApp` function)
  - **Scope:** Small (1 file)

### Checkpoint: Tap Handler
- [ ] All three tap actions work correctly
- [ ] No console errors
- [ ] Smooth transitions between states

### Phase 3: Long-Press Handler Implementation

- [ ] **Task 6**: Implement contextmenu handler for info modal
  - Right-click OR long-press shows full ProjectViewer modal
  - Listen to `@contextmenu` event (right-click) and existing long-press timer
  - Display: description, stack icons, GitHub/live links, screenshots
  - Modal overlay with close button
  - Prevent default browser context menu
  - **Acceptance criteria:**
    - Right-click on any project shows info modal
    - Long-press on touch devices shows info modal
    - All project metadata displays correctly
    - Links work (open in new tabs)
    - Close button dismisses modal
    - Browser context menu is suppressed
  - **Verification:**
    - Manual test: right-click each project type (desktop browser)
    - Manual test: long-press each project type (mobile/touch)
    - Info modal shows correct data
    - All links functional
    - Modal closes properly
  - **Dependencies:** None (existing component)
  - **Files:**
    - `src/components/mobile/MobileOS.vue` (modify contextmenu + long-press handlers)
    - May need to adjust `ProjectViewer.vue` props
  - **Scope:** Small-Medium (1-2 files)

- [ ] **Task 7**: Ensure mobile-only behavior
  - Verify desktop mode uses existing logic
  - Mobile mode uses tap/long-press logic
  - Check `isMobile` computed property guards behavior
  - **Acceptance criteria:**
    - Desktop mode unaffected (windows still work)
    - Mobile mode uses new tap/long-press logic
    - Breakpoint transitions smoothly
  - **Verification:**
    - Test at >768px width (desktop)
    - Test at <768px width (mobile)
    - Resize window across breakpoint
  - **Dependencies:** Tasks 3-6
  - **Files:**
    - `src/components/mobile/MobileOS.vue` (verification only)
  - **Scope:** Small (verification task)

### Checkpoint: Context Menu Handler
- [ ] Right-click shows detailed info
- [ ] Long-press shows detailed info
- [ ] Desktop mode unchanged
- [ ] Mobile/desktop boundary works correctly

### Phase 4: Polish & Edge Cases

- [ ] **Task 8**: Add loading states
  - Show spinner while iframe loads
  - Show loading indicator for screenshot gallery
  - Handle slow network gracefully
  - **Acceptance criteria:**
    - Loading spinner appears during iframe load
    - No flash of unstyled content
    - User knows something is happening
  - **Verification:**
    - Test on throttled network (Chrome DevTools)
    - Loading states visible
    - No hanging states
  - **Dependencies:** Tasks 3-4
  - **Files:**
    - `src/components/mobile/MobileOS.vue`
  - **Scope:** Small (1 file)

- [ ] **Task 9**: Handle edge cases
  - Project with no GitHub link (show message)
  - Malformed URLs (graceful failure)
  - Missing screenshot images (show placeholder)
  - **Acceptance criteria:**
    - No console errors for edge cases
    - User sees helpful messages
    - App doesn't crash
  - **Verification:**
    - Test with modified projects.json (remove URLs, screenshots)
    - All cases handled gracefully
  - **Dependencies:** All previous tasks
  - **Files:**
    - `src/components/mobile/MobileOS.vue`
  - **Scope:** Small (1 file)

- [ ] **Task 10**: Update translations
  - Add i18n keys for GitHub prompt
  - Add keys for "no screenshots available"
  - Add keys for info modal labels
  - **Acceptance criteria:**
    - All new text is translatable
    - EN and PT translations provided
    - No hardcoded strings in components
  - **Verification:**
    - Switch language, all text updates
    - No missing translation warnings
  - **Dependencies:** Tasks 5, 6
  - **Files:**
    - `src/locales/en.json`
    - `src/locales/pt.json`
  - **Scope:** Small (2 files)

### Checkpoint: Complete
- [ ] All acceptance criteria met
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Manual QA passed on mobile viewport
- [ ] Ready for user testing

## Task Dependency Graph

```
Task 1 (screenshot detection)
    │
    ├─> Task 2 (action classifier)
    │       │
    │       ├─> Task 3 (tap: live sites)
    │       ├─> Task 4 (tap: screenshots)
    │       └─> Task 5 (tap: GitHub prompt)
    │               │
    │               └─> Task 8 (loading states)
    │                       │
    │                       └─> Task 9 (edge cases)
    │
    └─> Task 6 (long-press: info modal)
            │
            └─> Task 7 (mobile-only behavior)

Task 10 (translations) can be done anytime after Tasks 5-6
```

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Long-press conflicts with scroll | High | Use 500ms threshold; cancel on touch move |
| Right-click conflicts with browser menu | Medium | `event.preventDefault()` on contextmenu |
| Screenshot detection fails for varied formats | Medium | Be conservative: only portrait images count |
| Native confirm() dialog looks ugly | Low | Accept it; consistent with mobile OS patterns |
| ProjectViewer doesn't work in overlay | Medium | Test early; may need modal wrapper component |
| No phone screenshots for any project | Low | All projects have screenshots or live sites in projects.json |

## Open Questions

1. **Screenshot gallery component**: Should we build custom or use a library?
   - Recommendation: Start with simple custom component (just images + close button)
   - Can add swipe later if needed

2. **Phone screenshot definition**: What aspect ratio counts as "phone"?
   - Recommendation: Portrait (height > width) or explicitly named "*-mobile.*"
   
3. **GitHub prompt vs inline message**: Confirm dialog or in-app message?
   - Recommendation: Native confirm() is simpler and matches "open external link" pattern

4. **Info modal vs separate page**: Overlay modal or fullscreen component?
   - Recommendation: Overlay modal, keeps context of home screen visible behind

## Implementation Notes

- Start with Task 1-2 to establish foundation
- Tasks 3-5 can be implemented in any order (independent)
- Task 6 must be tested with real project data (all 8 projects)
- Task 7 is critical: desktop must remain unchanged
- Task 8-9 are polish; can be deferred if time-constrained
- Task 10 should be done before final testing

## Verification Checklist

Before marking complete:
- [ ] Tap live project → opens iframe
- [ ] Tap project with screenshots → shows gallery
- [ ] Tap project with no site/screenshots → GitHub prompt
- [ ] Long-press any project → info modal with all details
- [ ] Desktop mode unchanged
- [ ] All translations present
- [ ] No console errors
- [ ] Build passes
- [ ] User can navigate back from all states

## Success Criteria

The implementation is complete when:
1. All 10 tasks are checked off
2. All checkpoints pass
3. User confirms behavior matches their description
4. No regressions in desktop mode
