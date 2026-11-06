# Onboard.qs — Architecture Overview

This document describes the high-level architecture of the **Onboard.qs** Qlik Sense extension.

## What it does

Onboard.qs adds interactive, step-by-step onboarding tours to any Qlik Sense app. App developers configure tours in edit mode using a rich modal editor; end-users see a "Start Tour" button (or auto-started tours) in analysis mode. Tours highlight Qlik objects on the sheet with popovers powered by [driver.js](https://driverjs.com/).

## High-level component map

```mermaid
graph TD
    subgraph "Qlik Sense Host"
        QS[Qlik Sense Web Client]
        EA[Enigma App API]
    end

    subgraph "Onboard.qs Extension"
        EP[index.js<br/>Supernova Entry Point]

        subgraph "Platform Layer"
            PI[platform/index.js<br/>Detection & Routing]
            CM[platform/client-managed.js<br/>Client-Managed Adapter]
            CL[platform/cloud.js<br/>Cloud Adapter]
            SE[platform/selectors.js<br/>CSS Selector Registry]
        end

        subgraph "Tour Engine"
            TR[tour/tour-runner.js<br/>driver.js Integration]
            TS[tour/tour-storage.js<br/>localStorage Tracking]
            TI[tour/tour-io.js<br/>Import/Export]
        end

        subgraph "UI Layer"
            WR[ui/widget-renderer.js<br/>Analysis Mode Widget]
            TE[ui/tour-editor.js<br/>Edit Mode Modal Editor]
        end

        subgraph "Theme Layer"
            TH[theme/resolve.js<br/>Preset + Override Resolver]
            TP[theme/presets.js<br/>Built-in Theme Presets]
        end

        subgraph "Utilities"
            LG[util/logger.js]
            MD[util/markdown.js]
            UU[util/uuid.js]
            XS[util/extension-state.js<br/>Shared State]
            TB[util/tab-switcher.js<br/>Tab Container Support]
        end

        subgraph "Configuration"
            EX[ext/index.js<br/>Property Panel]
            OP[object-properties.js<br/>Default QAE Properties]
            ST[style.css<br/>All CSS]
        end
    end

    QS --> EP
    EP --> PI
    PI --> CM
    PI --> CL
    CM --> SE
    CL --> SE
    CM --> EA
    CL --> EA
    EP --> WR
    EP --> TE
    EP --> TH
    TH --> TP
    WR --> TR
    TR --> TS
    TE --> TR
    TE --> TI
    TR --> TB
    TB --> XS
    TB --> SE
    EP --> TB
    TR --> PI
```

## Module responsibilities

| Module                       | Responsibility                                                                                                                                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.js`                   | Nebula/Stardust supernova entry point. Hooks into Qlik lifecycle (`useLayout`, `useApp`, etc.), detects platform once, delegates rendering.                                                                                                  |
| `platform/index.js`          | Detects whether running on Cloud or client-managed (URL-based). Resolves the correct adapter and Sense version.                                                                                                                              |
| `platform/client-managed.js` | Client-managed Qlik Sense adapter: sheet ID detection (URL → Qlik API → DOM), Engine API sheet objects, Sense version detection, version-range-to-code-path mapping.                                                                         |
| `platform/cloud.js`          | Qlik Cloud adapter: standalone implementation (no delegation to client-managed). Same interface, maintained independently.                                                                                                                   |
| `platform/selectors.js`      | Single-source-of-truth CSS selector registry. Maps `(platform, codePath)` → selector functions.                                                                                                                                              |
| `theme/resolve.js`           | Theme resolver. Merges a preset's defaults with per-property overrides from the layout, producing a flat map of CSS custom-property name → value. Also provides `applyThemeToElement()`, `buildPopoverThemeCSS()`, and `injectThemeStyle()`. |
| `theme/presets.js`           | Built-in theme presets (Default, The Lean Green Machine, Corporate Blue, Corporate Gold). Each preset defines all color, size, and font values.                                                                                              |
| `tour/tour-runner.js`        | Transforms tour config into driver.js steps, launches tours, handles highlight preview.                                                                                                                                                      |
| `tour/tour-storage.js`       | localStorage-based tracking of "has user seen this tour version".                                                                                                                                                                            |
| `tour/tour-io.js`            | Tour import/export: serializes tours + theme + widget to JSON, imports with validation, supports three merge modes (Replace Matching, Replace All, Add to Existing).                                                                         |
| `ui/widget-renderer.js`      | Renders the analysis-mode UI: "Start Tour" button, multi-tour dropdown, auto-start logic.                                                                                                                                                    |
| `ui/tour-editor.js`          | Full-screen modal editor for creating/editing tours and steps in edit mode.                                                                                                                                                                  |
| `ext/index.js`               | Qlik property panel definition. Provides a hybrid approach (property panel + modal editor).                                                                                                                                                  |
| `object-properties.js`       | Default QAE properties for new extension instances.                                                                                                                                                                                          |
| `util/logger.js`             | Build-aware logger (`debug` suppressed in production). Exposes `BUILD_TYPE` and `PACKAGE_VERSION`.                                                                                                                                           |
| `util/markdown.js`           | Minimal Markdown-to-HTML converter for tour step descriptions, with raw HTML blocks as in CommonMark.                                                                                                                                        |
| `util/uuid.js`               | UUID v4 generator for tour/step IDs.                                                                                                                                                                                                         |
| `style.css`                  | All CSS: widget, editor, buttons, driver.js theme overrides, Cloud z-index fixes, hover menu hiding.                                                                                                                                         |

## Data flow: analysis mode

```mermaid
sequenceDiagram
    participant QS as Qlik Sense
    participant EP as index.js
    participant PI as platform/index.js
    participant AD as Adapter (CM/Cloud)
    participant TB as tab-switcher.js
    participant WR as widget-renderer.js
    participant TR as tour-runner.js
    participant DJ as driver.js

    QS->>EP: component() called
    EP->>PI: getPlatformAdapter()
    PI-->>EP: adapter module
    EP->>PI: detectPlatform()
    PI->>AD: getSenseVersion() [client-managed only]
    AD-->>PI: { version, releaseLabel }
    PI-->>EP: { type, version, codePath }
    EP->>AD: injectCSS(driverCSS)
    EP->>TB: buildTabContainerMap(app, adapter)
    Note over TB: Scan sheet for sn-tabbed-container objects,<br/>populate extensionState.tabContainerMap
    EP->>AD: getCurrentSheetId()
    EP->>WR: renderWidget(element, layout, context)
    Note over WR: User clicks "Start Tour"
    WR->>TR: runTour(tourConfig, options)
    TR->>PI: getObjectSelectorSync(platform, objectId, codePath)
    PI-->>TR: CSS selector string
    TR->>TB: ensureTabVisible(objectId) [if in tab container]
    Note over TB: Click tab button + wait for DOM element
    TR->>DJ: driver(config).drive()
    DJ-->>QS: Overlay + popovers on Qlik objects
```

## Data flow: tour import/export

```mermaid
sequenceDiagram
    participant TE as tour-editor.js
    participant IO as tour-io.js
    participant FS as File System
    participant MD as Enigma Model

    Note over TE,FS: Export Flow
    TE->>IO: exportToursAndTheme(layout)
    IO->>IO: Serialize {tours, theme, widget} + metadata
    IO->>FS: Trigger download (onboard-qs-tours.json)

    Note over TE,FS: Import Flow
    TE->>IO: importFromFile()
    IO->>FS: Open file picker
    FS-->>IO: JSON file contents
    IO->>IO: validateImportData(parsed)
    IO-->>TE: { tours, theme, widget }
    Note over TE: Show import dialog (merge mode + theme toggle)
    TE->>IO: mergeTours(existing, imported, mode)
    IO-->>TE: Merged tours array
    Note over TE: Editor shows the merged tours,<br/>nothing is saved yet
    TE->>MD: model.setProperties(updated) [when Save is clicked]
```

## Data flow: edit mode

```mermaid
sequenceDiagram
    participant QS as Qlik Sense
    participant EP as index.js
    participant WR as widget-renderer.js
    participant TE as tour-editor.js
    participant AD as Adapter
    participant MD as Enigma Model

    QS->>EP: component() [readOnly=false]
    EP->>WR: renderEditPlaceholder(element, layout)
    Note over EP: User clicks "Edit Tours"<br/>(the click handler is in index.js)
    EP->>TE: openTourEditorFor({app, model, layout})
    TE->>AD: getSheetObjects(app)
    AD-->>TE: [{id, title, type}, ...]
    TE->>TE: openTourEditor({layout, model, app, sheetObjects})
    Note over TE: User edits tours/steps
    TE->>MD: model.getProperties(), then setProperties(updatedProps)
    MD-->>QS: Layout updated → component re-renders
```

## Extension lifecycle

```mermaid
stateDiagram-v2
    [*] --> Loading: Extension mounted
    Loading --> EditMode: options.readOnly === false, rendered at once
    Loading --> PlatformDetected: options.readOnly === true, detectPlatform() resolves
    PlatformDetected --> AnalysisMode

    EditMode --> EditPlaceholder: renderEditPlaceholder()
    EditPlaceholder --> TourEditor: "Edit Tours" clicked
    TourEditor --> EditPlaceholder: Modal closed

    AnalysisMode --> Widget: renderWidget()
    Widget --> AutoStart: autoStart, not yet auto-started this visit, showOnce off or not seen
    Widget --> TourRunning: User clicks button
    AutoStart --> TourRunning: After 500ms, unless another tour is running
    TourRunning --> Widget: Tour completed/closed
```

Edit mode doesn't wait for platform detection: `index.js` renders the placeholder straight away. When `options.readOnly` isn't set yet, an `/edit` URL counts as edit mode.

The auto-start rule in full: a tour with **Auto-start** on starts by itself at most once per visit to the sheet. With **Show only once** off it does so on every visit, and with it on only until the user has seen the tour's current version. See [When a tour starts by itself](../README.md#when-a-tour-starts-by-itself) in the README, and [Auto-start tours](TOUR-SYSTEM.md#auto-start-tours) for how a visit is tracked.

## File tree

```
src/
├── index.js                  # Supernova entry point
├── object-properties.js      # Default QAE properties
├── style.css                 # All CSS
├── data.js                   # Data targets (empty)
├── meta.json                 # nebula sense metadata
├── ext/
│   ├── index.js              # Property panel definition
│   ├── tours-section.js      # Tours section, target-object dropdown (getObjectList)
│   ├── widget-section.js     # Widget Appearance section
│   ├── theme-section.js      # Theme & Styling section
│   ├── theme-helpers.js      # Color keys and preset helpers for the theme section
│   ├── security-section.js   # Security section (URI allowlist)
│   ├── about-section.js      # About section
│   └── lui-icons.js          # Lui icons for the button icon picker
├── platform/
│   ├── index.js              # Platform detection & routing
│   ├── client-managed.js     # Client-managed adapter
│   ├── cloud.js              # Cloud adapter (standalone)
│   └── selectors.js          # CSS selector registry
├── tour/
│   ├── tour-runner.js        # driver.js integration
│   ├── tour-helpers.js       # startTour(), auto-start and sheet visits
│   ├── tour-storage.js       # localStorage tracking
│   └── tour-io.js            # Tour import/export (JSON, merge modes)
├── theme/
│   ├── resolve.js            # Theme resolver (preset + overrides → CSS vars)
│   └── presets.js            # Built-in theme presets (4)
├── ui/
│   ├── widget-renderer.js    # Analysis mode widget
│   ├── toolbar-injector.js   # Tour button in the Sense toolbar
│   ├── tour-editor.js        # Edit mode modal editor
│   ├── confirm-discard.js    # Unsaved-changes confirmation dialog
│   ├── markdown-editor-dialog.js # Property panel's Markdown editor dialog
│   └── markdown-toolbar.js   # Tabbed Write/Preview Markdown editor
└── util/
    ├── css-selector.js       # Checks for step CSS selectors
    ├── dialog-size.js        # Dialog-size presets for steps
    ├── expressions.js        # Qlik expression values (=expr ↔ qStringExpression)
    ├── extension-state.js    # Shared state (model and app refs, tabContainerMap)
    ├── logger.js             # Build-aware logging
    ├── markdown.js           # Minimal MD→HTML
    ├── markdown-shortcuts.js # Markdown keyboard shortcuts
    ├── sanitize.js           # Lui icon name sanitizer
    ├── tab-switcher.js       # Tab container auto-switching
    ├── uuid.js               # UUID v4 generator
    └── visibility.js         # Show conditions of tours and steps
```
