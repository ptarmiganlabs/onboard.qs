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
        end

        subgraph "UI Layer"
            WR[ui/widget-renderer.js<br/>Analysis Mode Widget]
            TE[ui/tour-editor.js<br/>Edit Mode Modal Editor]
        end

        subgraph "Utilities"
            LG[util/logger.js]
            MD[util/markdown.js]
            UU[util/uuid.js]
        end

        subgraph "Configuration"
            EX[ext.js<br/>Property Panel]
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
    WR --> TR
    TR --> TS
    TE --> TR
    TR --> PI
```

## Module responsibilities

| Module | Responsibility |
|---|---|
| `index.js` | Nebula/Stardust supernova entry point. Hooks into Qlik lifecycle (`useLayout`, `useApp`, etc.), detects platform once, delegates rendering. |
| `platform/index.js` | Detects whether running on Cloud or client-managed (URL-based). Resolves the correct adapter and Sense version. |
| `platform/client-managed.js` | Client-managed Qlik Sense adapter: sheet ID detection (URL → Qlik API → DOM), Engine API sheet objects, Sense version detection, version-range-to-code-path mapping. |
| `platform/cloud.js` | Qlik Cloud adapter: standalone implementation (no delegation to client-managed). Same interface, maintained independently. |
| `platform/selectors.js` | Single-source-of-truth CSS selector registry. Maps `(platform, codePath)` → selector functions. |
| `tour/tour-runner.js` | Transforms tour config into driver.js steps, launches tours, handles highlight preview. |
| `tour/tour-storage.js` | localStorage-based tracking of "has user seen this tour version". |
| `ui/widget-renderer.js` | Renders the analysis-mode UI: "Start Tour" button, multi-tour dropdown, auto-start logic. |
| `ui/tour-editor.js` | Full-screen modal editor for creating/editing tours and steps in edit mode. |
| `ext.js` | Qlik property panel definition. Provides a hybrid approach (property panel + modal editor). |
| `object-properties.js` | Default QAE properties for new extension instances. |
| `util/logger.js` | Build-aware logger (`debug` suppressed in production). Exposes `BUILD_TYPE` and `PACKAGE_VERSION`. |
| `util/markdown.js` | Minimal Markdown-to-HTML converter (~60 lines) for tour step descriptions. |
| `util/uuid.js` | UUID v4 generator for tour/step IDs. |
| `style.css` | All CSS: widget, editor, buttons, driver.js theme overrides, Cloud z-index fixes. |

## Data flow: analysis mode

```mermaid
sequenceDiagram
    participant QS as Qlik Sense
    participant EP as index.js
    participant PI as platform/index.js
    participant AD as Adapter (CM/Cloud)
    participant WR as widget-renderer.js
    participant TR as tour-runner.js
    participant DJ as driver.js

    QS->>EP: component() called
    EP->>PI: detectPlatform()
    PI->>AD: getSenseVersion() [client-managed only]
    AD-->>PI: { version, releaseLabel }
    PI-->>EP: { type, version, codePath }
    EP->>PI: getPlatformAdapter()
    PI-->>EP: adapter module
    EP->>AD: injectCSS(driverCSS)
    EP->>AD: getCurrentSheetId()
    EP->>WR: renderWidget(element, layout, context)
    Note over WR: User clicks "Start Tour"
    WR->>TR: runTour(tourConfig, options)
    TR->>PI: getObjectSelectorSync(platform, objectId, codePath)
    PI-->>TR: CSS selector string
    TR->>DJ: driver(config).drive()
    DJ-->>QS: Overlay + popovers on Qlik objects
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
    Note over WR: User clicks "Edit Tours"
    WR->>AD: getSheetObjects(app)
    AD-->>WR: [{id, title, type}, ...]
    WR->>TE: openTourEditor({layout, model, sheetObjects})
    Note over TE: User edits tours/steps
    TE->>MD: model.setProperties(updatedProps)
    MD-->>QS: Layout updated → component re-renders
```

## Extension lifecycle

```mermaid
stateDiagram-v2
    [*] --> Loading: Extension mounted
    Loading --> PlatformDetected: detectPlatform() resolves
    PlatformDetected --> EditMode: options.readOnly === false
    PlatformDetected --> AnalysisMode: options.readOnly === true

    EditMode --> EditPlaceholder: renderEditPlaceholder()
    EditPlaceholder --> TourEditor: "Edit Tours" clicked
    TourEditor --> EditPlaceholder: Modal closed

    AnalysisMode --> Widget: renderWidget()
    Widget --> AutoStart: tour.autoStart && !seen
    Widget --> TourRunning: User clicks button
    AutoStart --> TourRunning: After 500ms delay
    TourRunning --> Widget: Tour completed/closed
```

## File tree

```
src/
├── index.js                  # Supernova entry point
├── ext.js                    # Property panel definition
├── object-properties.js      # Default QAE properties
├── style.css                 # All CSS
├── data.js                   # Data targets (empty)
├── meta.json                 # nebula sense metadata
├── platform/
│   ├── index.js              # Platform detection & routing
│   ├── client-managed.js     # Client-managed adapter
│   ├── cloud.js              # Cloud adapter (standalone)
│   └── selectors.js          # CSS selector registry
├── tour/
│   ├── tour-runner.js        # driver.js integration
│   └── tour-storage.js       # localStorage tracking
├── ui/
│   ├── widget-renderer.js    # Analysis mode widget
│   └── tour-editor.js        # Edit mode modal editor
└── util/
    ├── logger.js             # Build-aware logging
    ├── markdown.js           # Minimal MD→HTML
    └── uuid.js               # UUID v4 generator
```
