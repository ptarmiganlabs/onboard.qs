/**
 * Curated list of Lui (Qlik Leonardo UI) icons for the button icon picker.
 *
 * Each entry has:
 *  - `value`  — the Lui icon name used as the CSS suffix: `lui-icon--{value}`
 *  - `label`  — a human-readable label shown in the property-panel dropdown;
 *               a Unicode character is prepended where a close visual match
 *               exists so the list is scannable even in a plain-text dropdown.
 *
 * The "(no icon)" entry at index 0 maps to the empty string, which disables
 * icon rendering and preserves backwards-compatible behaviour.
 *
 * Reference: https://qlik-oss.github.io/leonardo-ui/icons.html
 */
export const LUI_ICON_OPTIONS = [
    // ── (empty) ───────────────────────────────────────────────────────────
    { value: '', label: '— (no icon)' },

    // ── Navigation & direction ────────────────────────────────────────────
    { value: 'home', label: '⌂  Home' },
    { value: 'back', label: '←  Back' },
    { value: 'forward', label: '→  Forward' },
    { value: 'arrow-up', label: '↑  Arrow up' },
    { value: 'arrow-down', label: '↓  Arrow down' },
    { value: 'triangle-top', label: '▲  Triangle / Arrow up (filled)' },
    { value: 'triangle-bottom', label: '▼  Triangle / Arrow down (filled)' },
    { value: 'triangle-left', label: '◀  Triangle / Arrow left (filled)' },
    { value: 'triangle-right', label: '▶  Triangle / Arrow right (filled)' },
    { value: 'up-down', label: '↕  Up / Down (toggle)' },
    { value: 'top', label: '⬆  Back to top' },
    { value: 'ascending', label: '⬆  Sort ascending' },
    { value: 'descending', label: '⬇  Sort descending' },
    { value: 'new-tab', label: '↗  Open in new tab' },

    // ── Primary actions ───────────────────────────────────────────────────
    { value: 'play', label: '▶  Play / Start' },
    { value: 'reload', label: '↺  Reload / Refresh' },
    { value: 'add', label: '+  Add' },
    { value: 'plus', label: '+  Plus' },
    { value: 'minus', label: '−  Minus' },
    { value: 'remove', label: '✕  Remove' },
    { value: 'close', label: '✕  Close' },
    { value: 'edit', label: '✏  Edit' },
    { value: 'bin', label: '🗑  Delete / Bin' },
    { value: 'search', label: '🔍  Search' },
    { value: 'zoom-in', label: '🔍  Zoom in' },
    { value: 'zoom-out', label: '🔍  Zoom out' },
    { value: 'copy', label: '⎘  Copy' },
    { value: 'cut', label: '✂  Cut' },
    { value: 'paste', label: '📋  Paste' },
    { value: 'lock', label: '🔒  Lock' },
    { value: 'unlock', label: '🔓  Unlock' },
    { value: 'expand', label: '⤢  Expand' },
    { value: 'collapse', label: '⤡  Collapse' },
    { value: 'upload', label: '↑  Upload' },
    { value: 'export', label: '↑  Export' },
    { value: 'import', label: '↓  Import' },
    { value: 'share', label: '↗  Share' },
    { value: 'link', label: '🔗  Link' },
    { value: 'print', label: '🖨  Print' },
    { value: 'lasso', label: '⊙  Lasso / Select' },
    { value: 'repair', label: '🔧  Repair / Fix' },
    { value: 'split', label: '⊣  Split' },
    { value: 'disconnect', label: '⊘  Disconnect' },
    { value: 'control', label: '⊞  Control' },

    // ── Status & feedback ─────────────────────────────────────────────────
    { value: 'info', label: 'ℹ  Info' },
    { value: 'warning', label: '⚠  Warning (circle)' },
    { value: 'warning-triangle', label: '⚠  Warning (triangle)' },
    { value: 'help', label: '?  Help' },
    { value: 'tick', label: '✓  Tick / Checkmark' },
    { value: 'star', label: '★  Star / Favourite' },
    { value: 'bookmark', label: '🔖  Bookmark' },
    { value: 'view', label: '👁  View' },

    // ── Data & analysis ───────────────────────────────────────────────────
    { value: 'table', label: '⊞  Table' },
    { value: 'grid', label: '⊞  Grid' },
    { value: 'list', label: '☰  List' },
    { value: 'unordered-list', label: '☰  Unordered list' },
    { value: 'filterpane', label: '▼  Filter pane' },
    { value: 'pivot', label: '↺  Pivot table' },
    { value: 'field', label: '≡  Field' },
    { value: 'database', label: '🗄  Database' },
    { value: 'library', label: '📚  Library' },
    { value: 'stream', label: '≈  Stream' },
    { value: 'toggle-left', label: '◀  Toggle left' },
    { value: 'toggle-right', label: '▶  Toggle right' },
    { value: 'toggle-bottom', label: '▼  Toggle bottom' },

    // ── People & identity ─────────────────────────────────────────────────
    { value: 'person', label: '👤  Person / User' },
    { value: 'group', label: '👥  Group' },
    { value: 'key', label: '🔑  Key' },
    { value: 'tag', label: '🏷  Tag' },

    // ── Files & media ─────────────────────────────────────────────────────
    { value: 'file', label: '📄  File' },
    { value: 'folder', label: '📁  Folder' },
    { value: 'image', label: '🖼  Image' },
    { value: 'camera', label: '📷  Camera' },
    { value: 'slide-show', label: '▶  Slideshow' },
    { value: 'photo-library', label: '📚  Photo library' },

    // ── UI & settings ─────────────────────────────────────────────────────
    { value: 'menu', label: '☰  Menu / Hamburger' },
    { value: 'more', label: '…  More options' },
    { value: 'cogwheel', label: '⚙  Cogwheel / Settings' },
    { value: 'settings', label: '⚙  Settings' },
    { value: 'handle', label: '⠿  Handle / Drag' },
    { value: 'application', label: '⊞  Application' },
    { value: 'puzzle', label: '🧩  Puzzle / Plugin' },
    { value: 'cloud', label: '☁  Cloud' },
    { value: 'code', label: '</>  Code' },
    { value: 'palette', label: '🎨  Palette / Colour' },
    { value: 'shapes', label: '⬡  Shapes' },
    { value: 'effects', label: '✦  Effects' },
    { value: 'drop', label: '💧  Drop' },
    { value: 'box', label: '▭  Box' },
    { value: 'high-resolution', label: '⬡  High resolution' },
    { value: 'low-resolution', label: '⬡  Low resolution' },

    // ── Typography (text editing) ─────────────────────────────────────────
    { value: 'text', label: 'T  Text' },
    { value: 'bold', label: 'B  Bold' },
    { value: 'italic', label: 'I  Italic' },
    { value: 'underline', label: 'U  Underline' },
    { value: 'align-left', label: '⬅  Align left' },
    { value: 'align-center', label: '≡  Align center' },
    { value: 'align-right', label: '➡  Align right' },

    // ── Miscellaneous ─────────────────────────────────────────────────────
    { value: 'calendar', label: '📅  Calendar' },
    { value: 'clock', label: '🕐  Clock' },
];
