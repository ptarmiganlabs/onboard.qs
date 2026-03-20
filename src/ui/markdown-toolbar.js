/**
 * Tabbed Markdown editor component for Onboard.qs.
 *
 * Creates a GitHub-style Write/Preview tabbed UI with a formatting toolbar.
 * Reused by the tour editor and the standalone Markdown editor dialog so
 * that all Markdown editing surfaces share a consistent UX.
 *
 * Usage:
 *   const { container, textarea } = createTabbedMarkdownEditor({ ... });
 *   parentEl.appendChild(container);
 *
 * @module ui/markdown-toolbar
 */

import { markdownToHtml } from '../util/markdown';
import {
    attachMarkdownShortcuts,
    applyBold,
    applyItalic,
    applyCode,
    applyLink,
    applyOrderedList,
    applyUnorderedList,
    applyBlockquote,
    applyHeading3,
    applyHeading4,
    applyHorizontalRule,
} from '../util/markdown-shortcuts';

// ---------------------------------------------------------------------------
// Toolbar button definitions
// ---------------------------------------------------------------------------

/**
 * @type {Array<{label: string, title: string, action: string, style?: string} | {type: 'separator'}>}
 */
const TOOLBAR_BUTTONS = [
    { label: 'B', title: 'Bold (Cmd/Ctrl+B)', action: 'bold', style: 'font-weight:700' },
    { label: 'I', title: 'Italic (Cmd/Ctrl+I)', action: 'italic', style: 'font-style:italic' },
    {
        label: '<>',
        title: 'Code (Cmd/Ctrl+E)',
        action: 'code',
        style: 'font-family:monospace;font-size:11px',
    },
    { label: '🔗', title: 'Link (Cmd/Ctrl+K)', action: 'link' },
    { type: 'separator' },
    { label: 'H3', title: 'Heading 3', action: 'h3', style: 'font-size:11px;font-weight:700' },
    { label: 'H4', title: 'Heading 4', action: 'h4', style: 'font-size:11px;font-weight:600' },
    { type: 'separator' },
    { label: '•', title: 'Bullet list', action: 'ul' },
    { label: '1.', title: 'Numbered list', action: 'ol', style: 'font-size:11px' },
    { label: '❝', title: 'Blockquote', action: 'blockquote' },
    { type: 'separator' },
    { label: '—', title: 'Horizontal rule', action: 'hr' },
];

// ---------------------------------------------------------------------------
// Action dispatcher
// ---------------------------------------------------------------------------

/**
 * Dispatch a formatting action to the appropriate function from
 * the shared markdown-shortcuts module.
 *
 * @param {HTMLTextAreaElement} textarea - Target textarea.
 * @param {string} action - One of the known action names.
 */
function applyAction(textarea, action) {
    switch (action) {
        case 'bold':
            applyBold(textarea);
            break;
        case 'italic':
            applyItalic(textarea);
            break;
        case 'code':
            applyCode(textarea);
            break;
        case 'link':
            applyLink(textarea);
            break;
        case 'h3':
            applyHeading3(textarea);
            break;
        case 'h4':
            applyHeading4(textarea);
            break;
        case 'ul':
            applyUnorderedList(textarea);
            break;
        case 'ol':
            applyOrderedList(textarea);
            break;
        case 'blockquote':
            applyBlockquote(textarea);
            break;
        case 'hr':
            applyHorizontalRule(textarea);
            break;
        // no default
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a tabbed Markdown editor component (Write / Preview tabs).
 *
 * Returns a container element plus a reference to the textarea so
 * callers can read `.value` or listen for events.
 *
 * @param {object} options - Editor configuration.
 * @param {string} [options.id]          - HTML id for the textarea.
 * @param {string} [options.placeholder] - Textarea placeholder text.
 * @param {number} [options.rows]      - Textarea rows.
 * @param {number} [options.maxLength] - Max characters (0 = unlimited).
 * @param {string} [options.value]    - Initial Markdown text.
 * @param {string} [options.className] - Extra CSS class for the textarea.
 *
 * @returns {{ container: HTMLElement, textarea: HTMLTextAreaElement }} The editor container and textarea reference.
 */
export function createTabbedMarkdownEditor({
    id,
    placeholder,
    rows = 4,
    maxLength = 0,
    value = '',
    className = '',
} = {}) {
    // -- Outer container --
    const container = document.createElement('div');
    container.className = 'oqs-md-tabbed';

    // -- Tab bar (Write | Preview) + toolbar buttons --
    const tabBar = document.createElement('div');
    tabBar.className = 'oqs-md-tabbed-header';

    const tabWrite = document.createElement('button');
    tabWrite.type = 'button';
    tabWrite.className = 'oqs-md-tabbed-tab oqs-md-tabbed-tab--active';
    tabWrite.textContent = 'Write';

    const tabPreview = document.createElement('button');
    tabPreview.type = 'button';
    tabPreview.className = 'oqs-md-tabbed-tab';
    tabPreview.textContent = 'Preview';

    tabBar.appendChild(tabWrite);
    tabBar.appendChild(tabPreview);

    // Toolbar buttons (visible only on Write tab)
    const toolbarGroup = document.createElement('span');
    toolbarGroup.className = 'oqs-md-tabbed-toolbar';

    // -- Body panels --
    const writePanel = document.createElement('div');
    writePanel.className = 'oqs-md-tabbed-panel oqs-md-tabbed-panel--write';

    const textarea = document.createElement('textarea');
    textarea.className = 'oqs-md-tabbed-textarea' + (className ? ' ' + className : '');
    if (id) textarea.id = id;
    if (placeholder) textarea.placeholder = placeholder;
    textarea.rows = rows;
    textarea.value = value;
    textarea.spellcheck = true;
    if (maxLength > 0) textarea.maxLength = maxLength;
    writePanel.appendChild(textarea);

    const previewPanel = document.createElement('div');
    previewPanel.className = 'oqs-md-tabbed-panel oqs-md-tabbed-panel--preview';
    previewPanel.style.display = 'none';

    /**
     * Update the preview panel with rendered Markdown.
     */
    function updatePreview() {
        previewPanel.innerHTML =
            markdownToHtml(textarea.value) ||
            '<p style="color:#9ca3af;font-style:italic">Nothing to preview</p>';
    }

    // Wire toolbar buttons
    for (const def of TOOLBAR_BUTTONS) {
        if (def.type === 'separator') {
            const sep = document.createElement('span');
            sep.className = 'oqs-md-tabbed-toolbar-sep';
            toolbarGroup.appendChild(sep);
            continue;
        }
        const btn = document.createElement('button');
        btn.className = 'oqs-md-tabbed-toolbar-btn';
        btn.type = 'button';
        btn.title = def.title;
        btn.textContent = def.label;
        if (def.style) btn.style.cssText = def.style;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            applyAction(textarea, def.action);
        });
        toolbarGroup.appendChild(btn);
    }

    tabBar.appendChild(toolbarGroup);

    // -- Tab switching --
    tabWrite.addEventListener('click', () => {
        tabWrite.classList.add('oqs-md-tabbed-tab--active');
        tabPreview.classList.remove('oqs-md-tabbed-tab--active');
        writePanel.style.display = '';
        previewPanel.style.display = 'none';
        toolbarGroup.style.visibility = '';
        textarea.focus();
    });

    tabPreview.addEventListener('click', () => {
        tabPreview.classList.add('oqs-md-tabbed-tab--active');
        tabWrite.classList.remove('oqs-md-tabbed-tab--active');
        writePanel.style.display = 'none';
        previewPanel.style.display = '';
        toolbarGroup.style.visibility = 'hidden';
        updatePreview();
    });

    // Keyboard shortcuts
    attachMarkdownShortcuts(textarea);

    // Assemble
    container.appendChild(tabBar);
    container.appendChild(writePanel);
    container.appendChild(previewPanel);

    return { container, textarea };
}
