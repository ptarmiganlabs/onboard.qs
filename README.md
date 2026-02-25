# Onboard.qs

Interactive onboarding tours for Qlik Sense apps, powered by a Qlik Sense extension.  
Works with both Qlik Sense Cloud and Qlik Sense Enterprise on Windows (client-managed).

Drop this extension onto any Qlik Sense sheet to create guided, step-by-step walkthroughs that highlight objects, explain visualisations, and onboard new users — no coding required.

---

## Documentation & Resources

- Release blog post with overview and demo: [https://ptarmiganlabs.com/interactive-onboarding-tours-for-qlik-sense/](https://ptarmiganlabs.com/interactive-onboarding-tours-for-qlik-sense/)


## Features

- **Visual tour builder** — full-screen modal editor with three-panel layout (tours / steps / details). No need to leave the Sense app to configure tours.
- **Multiple tours per sheet** — define intro tours, advanced walkthroughs, or feature announcements, each with independent settings.
- **Sheet object targeting** — select any object on the current sheet from a dropdown. The extension resolves the correct DOM element at runtime.
- **Custom CSS selector targeting** — target any DOM element (toolbar buttons, header items, other extensions) with a raw CSS selector.
- **Markdown descriptions** — step descriptions support Markdown: **bold**, _italic_, [links](url), ![images](url), lists, blockquotes, inline code, and more. Converted to HTML at render time with a built-in mini parser (~112 lines, zero dependencies).
- **Auto-start with show-once** — tours can launch automatically when the sheet loads and remember (via `localStorage`) whether the user has already seen them.
- **Theme presets & color pickers** — choose from four built-in presets (Default, The Lean Green Machine, Corporate Blue, Corporate Gold) or override every color individually with native Qlik color pickers. Font sizes, border radii, font weight, and font family are all configurable.
- **Configurable appearance** — button label, style (primary/secondary/minimal/outlined/pill), horizontal & vertical alignment, progress indicator, keyboard navigation, overlay colour, stage padding/radius, popover button text.
- **Tour import / export** — export all tours (plus theme and widget settings) to a JSON file, and import them back with three merge modes: Replace Matching, Replace All, or Add to Existing. Great for sharing tours across apps or backing up configurations.
- **Platform abstraction** — selector resolution and DOM helpers are isolated behind a platform layer. Both Qlik Cloud and client-managed (Qlik Sense Enterprise on Windows) are fully supported.
- **Qlik property panel integration** — everything is also accessible from the standard Qlik Sense property panel in edit mode (tours, steps, settings).
- **Lightweight** — production build is ~40 KB zipped. Only runtime dependency is driver.js (~5 KB gzip).

---

## Quick Start

### Prerequisites

- Node.js ≥ 18.10 and npm
- **Qlik Cloud**, or
- **Qlik Sense Enterprise on Windows** (client-managed) — February 2020 or later

### Install & Build

```bash
git clone https://github.com/ptarmiganlabs/onboard.qs.git
cd onboard.qs
npm install
npm run pack:prod          # → onboard-qs.zip (production build)
```

### Deploy to Qlik Sense

**Qlik Cloud:**

1. Open the **Management Console** → Extensions.
2. Click **Add**, upload `onboard-qs.zip`.
3. Open any app, enter edit mode, and drag **Onboard.qs** from the custom objects panel onto a sheet.

**Client-managed (QSEoW):**

1. Open the **Qlik Management Console (QMC)** → Extensions.
2. Click **Import**, select `onboard-qs.zip`.
3. Open any app in the Sense hub, enter edit mode, and drag the **Onboard.qs** extension from the custom objects panel onto a sheet.

### Create Your First Tour

1. With the extension on a sheet, click **Open Tour Editor** (or use the property panel).
2. Click **+ Add Tour**, give it a name.
3. Click **+ Add Step**, select a target object from the dropdown (or switch to **Custom CSS Selector** for non-object elements).
4. Enter a title and description (Markdown supported).
5. Click **Save**. Switch to analysis mode and click **Start Tour**.

---

## Build Commands

| Command             | Description                                                   |
| ------------------- | ------------------------------------------------------------- |
| `npm run pack:dev`  | Development build → `onboard-qs.zip` (with logging)           |
| `npm run pack:prod` | Production build → `onboard-qs.zip` (minified, no debug logs) |
| `npm run build`     | Build only (no zip)                                           |
| `npm run lint`      | ESLint check                                                  |
| `npm run lint:fix`  | ESLint auto-fix                                               |
| `npm run format`    | Format all files with Prettier                                |
| `npm run format:check` | Check formatting without modifying files                   |
| `npm run start`     | nebula serve (local dev mode)                                 |
| `npm run cloc`      | Count lines of code                                           |

---

## Configuration Reference

### Widget Appearance

| Property          | Type     | Default      | Description                                                |
| ----------------- | -------- | ------------ | ---------------------------------------------------------- |
| Show start button      | Boolean  | `true`       | Display a "Start Tour" button in analysis mode                             |
| Button text            | String   | `Start Tour` | Label on the start button (expression-enabled)                             |
| Button style           | Dropdown | `Primary`    | `Primary`, `Secondary`, `Minimal`, `Outlined`, `Pill`                      |
| Horizontal alignment   | Dropdown | `Center`     | `Left`, `Center`, `Right`                                                  |
| Vertical alignment     | Dropdown | `Center`     | `Top`, `Center`, `Bottom`                                                  |

### Tour Settings

| Property       | Type    | Default    | Description                                                                      |
| -------------- | ------- | ---------- | -------------------------------------------------------------------------------- |
| Tour name      | String  | `New Tour` | Display name shown in multi-tour dropdown                                        |
| Auto-start     | Boolean | `false`    | Start the tour automatically on sheet load                                       |
| Show only once | Boolean | `true`     | Skip auto-start if user has already seen this tour version (uses `localStorage`) |
| Tour version   | Integer | `1`        | Increment to reset the "seen" flag for all users                                 |
| Show progress  | Boolean | `true`     | Display "1 of 5" progress indicator in popovers                                  |
| Allow keyboard | Boolean | `true`     | Enable arrow-key / Escape navigation                                             |

### Theme & Styling

| Property              | Type         | Default            | Description                                                                 |
| --------------------- | ------------ | ------------------ | --------------------------------------------------------------------------- |
| Theme preset          | Dropdown     | `The Lean Green Machine` | `Default`, `The Lean Green Machine`, `Corporate Blue`, `Corporate Gold`       |
| Font family           | String       | (from preset)      | CSS font-family value (expression-enabled)                                  |
| Button colors         | Color pickers | (from preset)     | Background, text, hover background, border color                           |
| Button font size      | String (px)  | (from preset)      | Font size in pixels                                                         |
| Button border radius  | String (px)  | (from preset)      | Border radius in pixels                                                     |
| Button font weight    | Dropdown     | (from preset)      | `Normal (400)`, `Medium (500)`, `Semibold (600)`, `Bold (700)`             |
| Popover colors        | Color pickers | (from preset)     | Background, text, title, button bg/text/hover, progress bar               |
| Popover font size     | String (px)  | (from preset)      | Font size in pixels                                                         |
| Popover border radius | String (px)  | (from preset)      | Border radius in pixels                                                     |
| Menu colors           | Color pickers | (from preset)     | Background, text, hover background for the multi-tour dropdown menu        |

All color properties use the native Qlik color-picker component. When you switch presets, all pickers update to the preset's defaults. Individual overrides take precedence over the preset.

### Step Settings

| Property            | Type              | Default        | Description                                                                           |
| ------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------- |
| Target type         | Dropdown          | `Sheet Object` | `Sheet Object`, `Custom CSS Selector`, or `Standalone Dialog (no target)`             |
| Target object       | Dropdown          | —              | Select a visualisation from the current sheet (shown when Target type = Sheet Object) |
| CSS selector        | String            | —              | Any valid CSS selector (shown when Target type = Custom CSS Selector)                 |
| Popover title       | String            | —              | Heading text (expression-enabled)                                                     |
| Popover description | String (Markdown) | —              | Body text with Markdown support                                                       |
| Popover side        | Dropdown          | `Bottom`       | `Top`, `Bottom`, `Left`, `Right`                                                      |
| Popover align       | Dropdown          | `Center`       | `Start`, `Center`, `End`                                                              |
| Disable interaction | Boolean           | `true`         | Prevent clicks on the highlighted element during this step                            |

### Standalone Dialog Size (when Target type = Standalone Dialog)

| Size         | Dimensions         |
| ------------ | ------------------ |
| Dynamic      | Fit content        |
| Small        | 320 × 220 px       |
| Medium       | 480 × 320 px (default) |
| Large        | 640 × 420 px       |
| Extra Large  | 800 × 520 px       |
| Custom       | User-specified width × height |

When **Custom** is selected, two additional fields appear: **Custom width (px)** (default `500`) and **Custom height (px)** (default `350`).

### Tour Overlay & Navigation

The following per-tour properties are configured in both the **property panel** and the **tour editor modal**. They control the driver.js overlay and navigation buttons (expression support for button text is only available in the property panel):

| Property             | Type    | Default               | Description                                                       |
| -------------------- | ------- | --------------------- | ----------------------------------------------------------------- |
| Overlay color        | String  | `rgba(0, 0, 0, 0.6)` | Background color behind the highlighted area                      |
| Overlay opacity      | Integer | `60`                  | Opacity percentage (0–100)                                        |
| Stage padding        | Integer | `8`                   | Padding around the highlighted element (px)                       |
| Stage border radius  | Integer | `5`                   | Border radius of the highlight cutout (px)                        |
| Next button text     | String  | `Next`                | Label for the “Next” navigation button (expression-enabled)       |
| Previous button text | String  | `Previous`            | Label for the “Previous” navigation button (expression-enabled)   |
| Done button text     | String  | `Done`                | Label for the final step’s navigation button (expression-enabled) |---

## Markdown & HTML in Step Descriptions

Step descriptions support **Markdown**, **raw HTML**, and **a mix of both**. The text you enter is processed by a built-in mini Markdown-to-HTML converter ([src/util/markdown.js](src/util/markdown.js)) before being injected into the driver.js popover. Since driver.js renders description content as HTML, raw HTML tags pass through and render natively.

### Supported Markdown Syntax

#### Text Formatting

```markdown
**Bold text** or **also bold**
_Italic text_ or _also italic_
**Bold and _nested italic_ together**
`inline code`
```

Renders as: **Bold text**, _Italic text_, `inline code`.

#### Links

```markdown
[Visit Qlik Community](https://community.qlik.com)
[Open documentation](https://ptarmiganlabs.com/docs)
```

Links open in a new tab (`target="_blank"`) automatically.

#### Images

```markdown
![Sales dashboard overview](https://example.com/screenshot.png)
![Chart explanation](https://example.com/chart.png 'Optional tooltip title')
```

Images are automatically constrained to `max-width: 100%` so they fit within the popover.

##### Embedded Images (Base64)

For self-contained apps with no external image hosting, embed images directly as base64 data URIs:

```markdown
![Screenshot](data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...)
```

To create a base64 data URI: open an image in a browser, use browser DevTools console:

```js
// Drag image to browser tab, then in console:
document.querySelector('img').src; // Copy the data:image/... string
```

Or convert from the command line:

```bash
base64 -i screenshot.png | pbcopy   # macOS — copies to clipboard
```

Then paste as: `![Alt](data:image/png;base64,<pasted string>)`

> **Note:** Base64 images are stored inside the Qlik object properties (in the `.qvf` file). A 100 KB image becomes ~133 KB of text. This is fine for small/medium images but avoid very large files to keep the app responsive.

#### Lists

```markdown
- First item
- Second item
- Third item

1. Step one
2. Step two
3. Step three
```

#### Blockquotes

```markdown
> This filter bar controls all charts on the sheet.
> Select a region to drill down.
```

Blockquotes render with a green accent border to provide visual emphasis.

#### Headings

```markdown
### Section Heading (h3)

#### Sub-heading (h4)

##### Smaller heading (h5)

###### Smallest heading (h6)
```

> h1 and h2 are intentionally omitted — they're too large for popover content.

#### Horizontal Rules

```markdown
---
```

Renders as a thin separator line, useful for dividing sections within a step description.

#### Paragraphs and Line Breaks

- **Double newline** → new paragraph (with spacing)
- **Single newline** → `<br>` line break (no spacing)

```markdown
First paragraph with some context.

Second paragraph after a blank line.
This line is a <br> continuation of the second paragraph.
```

### Raw HTML

Since the converter preserves HTML tags, you can use **any HTML** directly in description fields:

```html
<span style="color: red; font-weight: bold;">Important!</span>

<div style="background: #f0f8ff; padding: 8px; border-radius: 4px;">Custom styled callout box</div>

<img src="/content/Default/onboarding/step1.png" width="250" />

<table>
    <tr>
        <td><b>KPI</b></td>
        <td><b>Target</b></td>
    </tr>
    <tr>
        <td>Revenue</td>
        <td>$1.2M</td>
    </tr>
</table>

<a href="https://help.qlik.com" target="_blank">Qlik Help →</a>

<video width="300" controls>
    <source src="/content/Default/demo.mp4" type="video/mp4" />
</video>
```

### Mixing Markdown and HTML

You can freely combine both in the same description:

```markdown
**Welcome to the Sales Dashboard!**

This chart shows revenue by region. Use the filters below to drill down.

<img src="data:image/png;base64,iVBORw0KGgo..." width="200" />

Key things to note:

- Click any bar to **make a selection**
- Use <kbd>Ctrl+Z</kbd> to undo
- See the [user guide](https://example.com/guide) for details

> <span style="color: #e67e22;">⚠️ Tip:</span> Hover over a bar to see the exact value.
```

### What Gets Escaped

The parser escapes `&` (when not part of an HTML entity) and `<` only when **not** followed by a letter, `/`, or `!`. This means:

| Input                   | Result                                    |
| ----------------------- | ----------------------------------------- |
| `<strong>Bold</strong>` | Preserved as HTML → **Bold**              |
| `<img src="..." />`     | Preserved as HTML → rendered image        |
| `5 < 10`                | Escaped to `5 &lt; 10` → displays as text |
| `AT&T`                  | Escaped to `AT&amp;T` → displays as text  |
| `&copy;`                | Preserved → ©                             |

### Complete Example

A real-world step description combining multiple features:

```markdown
### Revenue by Region

This bar chart shows **quarterly revenue** broken down by sales region.

![Legend](data:image/png;base64,iVBORw0KGgo...)

**How to interact:**

1. Click a bar to select that region
2. All other charts on this sheet will filter accordingly
3. Use _Ctrl+Click_ to select multiple regions

> 💡 **Pro tip:** Right-click any bar for additional options
> including "Exclude" and "Select possible".

---

<small style="color: #888;">
  Data source: SAP BW · Updated daily at 06:00 UTC
</small>
```

---

## Tour Import & Export

Onboard.qs lets you export all tours — including theme and widget settings — to a JSON file, and import them back into the same or a different Qlik app. This is useful for:

- **Sharing** tour configurations across apps or tenants
- **Backing up** tours before making major changes
- **Migrating** from development to production environments

### How It Works

```mermaid
sequenceDiagram
    participant User
    participant TE as Tour Editor
    participant IO as tour-io.js
    participant FS as File System

    Note over User,FS: Export
    User->>TE: Click "Export" button
    TE->>IO: exportToursAndTheme(layout)
    IO->>IO: Serialize tours + theme + widget to JSON
    IO->>FS: Trigger browser download<br/>(onboard-qs-tours.json)

    Note over User,FS: Import
    User->>TE: Click "Import" button
    TE->>IO: importFromFile()
    IO->>FS: Open file picker
    FS-->>IO: Selected JSON file
    IO->>IO: Parse & validate (validateImportData)
    IO-->>TE: Validated { tours, theme, widget }
    TE->>User: Show import dialog<br/>(merge mode + theme toggle)
    User->>TE: Choose merge mode
    TE->>IO: mergeTours(existing, imported, mode)
    IO-->>TE: Merged tours array
    TE->>TE: model.setProperties()
```

### Merge Modes

| Mode              | Behaviour                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| Replace Matching  | Replace tours whose name matches an imported tour; keep all other existing tours; append new ones       |
| Replace All       | Delete all existing tours and replace with the imported set                                             |
| Add to Existing   | Append all imported tours as new entries (duplicates are allowed)                                       |

During import, an optional **Import theme settings** toggle lets you also overwrite the current theme/widget configuration with the values from the import file.

---

## Standalone Dialog Steps

Not every tour step needs to point at a specific element. **Standalone Dialog** steps display a centered popover with no highlighted target — perfect for:

- **Welcome / intro messages** at the start of a tour
- **Summary / conclusion** steps at the end
- **General explanations** about the sheet, app, or data model
- **Instructions** that don't relate to a single object

### How to Create a Standalone Step

1. In the tour editor, click **+ Add Step**.
2. Set **Target Type** to **Standalone Dialog (no target)**.
3. Enter a title and description (Markdown/HTML supported).
4. The step will appear as a centered modal during the tour.

### Example Tour Structure

A typical onboarding tour mixing standalone and targeted steps:

| #   | Target Type         | Title                       | Purpose                               |
| --- | ------------------- | --------------------------- | ------------------------------------- |
| 1   | Standalone Dialog   | Welcome to Sales Analytics! | Intro — explain what the sheet is for |
| 2   | Sheet Object        | Revenue by Region           | Highlight the main KPI chart          |
| 3   | Sheet Object        | Filter Bar                  | Show how to filter data               |
| 4   | Custom CSS Selector | Help Button                 | Point out where to get help           |
| 5   | Standalone Dialog   | You're all set!             | Summary — encourage exploration       |

---

## Targeting Non-Object Elements

The **Custom CSS Selector** target type lets you highlight any DOM element on the page, not just Qlik sheet objects. Examples:

| Target                                 | CSS Selector                                                |
| -------------------------------------- | ----------------------------------------------------------- |
| Help button (Ptarmigan Labs extension) | `#qs-help-button` or inspect the DOM for the exact selector |
| Bookmark button                        | `.qs-toolbar .bookmark-button`                              |
| Sheet title                            | `.sheet-title-container`                                    |
| Any element by ID                      | `#my-custom-id`                                             |

To find the right selector: right-click the element in the browser → **Inspect** → note the class or ID.

---

## Project Structure

```text
onboard.qs/
├── package.json              # Project manifest, scripts, dependencies
├── nebula.config.cjs         # nebula.js / Rollup build configuration
├── eslint.config.js          # ESLint flat config
├── scripts/
│   ├── post-build.mjs        # Token replacement (version, build type)
│   └── zip-extension.mjs     # Zip builder for Sense deployment
└── src/
    ├── index.js              # Supernova entry point (hooks, lifecycle)
    ├── ext.js                # Property panel definition
    ├── object-properties.js  # Default object properties
    ├── data.js               # Data targets (empty — no data binding)
    ├── meta.json             # Extension metadata (name, icon, type)
    ├── style.css             # All CSS: widget, editor, driver.js theme
    ├── platform/
    │   ├── index.js          # Platform detection + selector helper
    │   ├── selectors.js      # Versioned CSS selector registry
    │   ├── client-managed.js # Client-managed Sense DOM helpers
    │   └── cloud.js          # Qlik Cloud adapter
    ├── tour/
    │   ├── tour-runner.js    # driver.js integration: build steps, run/highlight/destroy
    │   ├── tour-storage.js   # localStorage "show once" tracking
    │   └── tour-io.js        # Tour import/export (JSON serialization, merge modes)
    ├── theme/
    │   ├── resolve.js        # Theme resolver (preset + overrides → CSS vars)
    │   └── presets.js        # Built-in theme presets (4 presets)
    ├── ui/
    │   ├── widget-renderer.js # Analysis mode: button, dropdown, auto-start
    │   └── tour-editor.js    # Full-screen modal editor (3-panel layout)
    └── util/
        ├── logger.js         # Build-type-aware console logger
        ├── markdown.js       # Mini Markdown-to-HTML converter
        └── uuid.js           # UUID v4 generator
```

---

## Platform Support

| Platform                                          | Status    |
| ------------------------------------------------- | --------- |
| Qlik Sense Enterprise on Windows (client-managed) | Supported |
| Qlik Cloud                                        | Supported |

Platform detection is **automatic** — the extension checks `window.location.href` at startup to determine whether it is running on Qlik Cloud or client-managed Qlik Sense:

```mermaid
flowchart TD
    A[Extension loaded] --> B{URL contains<br/>qlikcloud.com<br/>or .qlik.com/sense?}
    B -- Yes --> C[Platform = cloud]
    B -- No --> D[Platform = client-managed]
    C --> E[Use Cloud adapter]
    D --> F[Fetch Sense version from<br/>product-info.js]
    F --> G[Use Client-managed adapter]
    E --> H[Unified adapter interface]
    G --> H
```

Both platforms share an identical adapter interface:

| Function | Description |
| --- | --- |
| `getCurrentSheetId()` | Get the active sheet ID (URL parsing + API fallbacks) |
| `getSheetObjects(app)` | List objects on the current sheet via Engine API |
| `getObjectSelector(objectId)` | Get the CSS selector for a Qlik object |
| `isEditMode(options)` | Check if in edit mode |
| `injectCSS(css, id)` | Inject a `<style>` element into the page |

The client-managed adapter additionally detects the running Sense version and maps it to a "code path" for version-specific CSS selector overrides. See [docs/PLATFORM-DETECTION.md](docs/PLATFORM-DETECTION.md) for full details.

---

## How It Works

1. **Edit mode**: The extension renders an "Open Tour Editor" placeholder. Clicking it opens a full-screen modal with three panels — tour list, step list, and detail editor. Alternatively, use the Qlik property panel on the right.

2. **Analysis mode**: The extension renders a start button (or auto-starts). When triggered, it builds a driver.js configuration from the saved tour steps, resolving sheet objects to live DOM elements via CSS class selectors (`.qv-object-{objectId}`), and runs the tour.

3. **Show-once**: When a tour completes or is dismissed, a localStorage key (`onboard-qs:{appId}:{sheetId}:{tourId}:v{version}`) is written. Auto-start checks this key and skips if present.

4. **Markdown**: Step descriptions are converted from Markdown to HTML by a built-in mini parser ([src/util/markdown.js](src/util/markdown.js)) before being passed to driver.js popovers.

### Architecture Overview

The following diagram shows how the major components interact:

```mermaid
flowchart TD
    subgraph "Qlik Sense Host"
        QS[Qlik Sense Web Client]
        EA[Enigma App API]
    end

    subgraph "Onboard.qs Extension"
        EP[index.js<br/>Entry Point]

        subgraph "Platform Layer"
            PI[Platform Detection]
            CM[Client-Managed Adapter]
            CL[Cloud Adapter]
        end

        subgraph "Tour Engine"
            TR[Tour Runner<br/>driver.js]
            TS[Tour Storage<br/>localStorage]
            TI[Tour Import/Export<br/>JSON files]
        end

        subgraph "UI Layer"
            WR[Widget Renderer<br/>Analysis Mode]
            TE[Tour Editor<br/>Edit Mode]
        end

        subgraph "Theme Layer"
            TH[Theme Resolver]
            TP[Theme Presets]
        end
    end

    QS --> EP
    EP --> PI
    PI --> CM
    PI --> CL
    CM --> EA
    CL --> EA
    EP --> WR
    EP --> TE
    TE --> TI
    WR --> TR
    TR --> TS
    EP --> TH
    TH --> TP
```

For a detailed architecture breakdown, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Dependencies

| Package                                   | Purpose                                          | Size       |
| ----------------------------------------- | ------------------------------------------------ | ---------- |
| [driver.js](https://driverjs.com/) ^1.3.1 | Tour engine (highlighting, popovers, animations) | ~5 KB gzip |

All other dependencies are dev-only (build tooling).

---

## License

MIT — see [LICENSE](LICENSE).

---

## Author

[Ptarmigan Labs](https://ptarmiganlabs.com)
