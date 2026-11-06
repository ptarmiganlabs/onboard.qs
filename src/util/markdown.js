/**
 * Minimal Markdown-to-HTML converter for tour step descriptions.
 *
 * Supports:
 *   - **bold** and *italic*
 *   - [links](url)
 *   - ![images](url "optional title")
 *   - `inline code`
 *   - Line breaks (blank line → paragraph, single newline → <br>)
 *   - Unordered lists (- item or * item)
 *   - Ordered lists (1. item)
 *   - Headings (### h3 to ###### h6; h1/h2 intentionally omitted for popovers)
 *   - > blockquotes
 *   - --- horizontal rules
 *   - Raw HTML, including embedded videos (`<video>`, `<iframe>`, `<source>`)
 *
 * Raw HTML blocks work as in CommonMark: a line that starts with a
 * block-level tag such as `<div>` or `<table>`, or that holds nothing but
 * one tag, starts a block that runs to the next blank line. The converter
 * adds no paragraphs and no line breaks inside it.
 *
 * This is intentionally minimal, with no dependency besides DOMPurify, to
 * keep the bundle small. For full Markdown, consider replacing it with
 * `marked` or `snarkdown`.
 */

import DOMPurify from 'dompurify';

/**
 * Strip all HTML tags and attributes from a string, returning plain text.
 * Uses DOMPurify with an empty allowlist for robust sanitization.
 *
 * @param {string} text - Potentially unsafe string.
 * @returns {string} Plain text with all HTML removed.
 */
export function stripHtml(text) {
    if (!text) return '';
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

// The block-level tag names CommonMark 0.31.2 lists for HTML blocks
const BLOCK_TAGS =
    'address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|' +
    'details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|' +
    'h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|nav|noframes|ol|' +
    'optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|' +
    'track|ul';

// An open tag and a close tag, as CommonMark defines raw HTML
const ATTRIBUTE = String.raw`\s+[A-Za-z_:][\w.:-]*(?:\s*=\s*(?:[^\s"'=<>\x60]+|'[^']*'|"[^"]*"))?`;
const OPEN_TAG = String.raw`<[A-Za-z][A-Za-z0-9-]*(?:${ATTRIBUTE})*\s*\/?>`;
const CLOSE_TAG = String.raw`<\/[A-Za-z][A-Za-z0-9-]*\s*>`;

/**
 * The lines that start an HTML block, and the line that ends each kind
 * (CommonMark 0.31.2, section 4.6). A block without `end` runs until a blank
 * line. A line holding just one tag can't interrupt a paragraph.
 */
const HTML_BLOCKS = [
    {
        start: /^<(?:pre|script|style|textarea)(?:\s|>|$)/i,
        end: /<\/(?:pre|script|style|textarea)>/i,
        verbatim: true,
    },
    { start: /^<!--/, end: /-->/, verbatim: true },
    { start: new RegExp(String.raw`^<\/?(?:${BLOCK_TAGS})(?:\s|\/?>|$)`, 'i') },
    {
        start: new RegExp(
            String.raw`^(?!<\/?(?:pre|script|style|textarea)\b)(?:${OPEN_TAG}|${CLOSE_TAG})\s*$`,
            'i'
        ),
        notInParagraph: true,
    },
];

const RULE = /^(?:[-*_]){3,}\s*$/;
const HEADING = /^(#{3,6})\s+(.+)$/;
const QUOTE = /^>\s+(.+)$/;
const BULLET = /^[*-]\s+(.+)$/;
const NUMBERED = /^(\d+)\.\s+(.+)$/;

/**
 * Convert the inline Markdown in a block's text.
 *
 * @param {string} text - The block's text.
 * @param {boolean} breaks - Whether a single newline becomes <br>.
 * @returns {string} HTML.
 */
function inline(text, breaks) {
    // Escape HTML entities (but preserve already-written HTML tags for power users)
    // We only escape & and angle brackets that are NOT part of existing HTML tags
    text = text.replace(/&(?!#?\w+;)/g, '&amp;').replace(/<(?![/a-zA-Z!])/g, '&lt;');

    // Collapse multi-line HTML tags into single lines so that the <br> replacement
    // later does not inject <br> inside opening tags and break them.
    text = text.replace(/<[a-zA-Z][^>]*\n[^>]*>/g, (match) => match.replace(/\n\s*/g, ' '));

    // Images: ![alt](src "title") — title is optional
    text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, alt, src, title) => {
        const titleAttr = title ? ` title="${title}"` : '';
        return `<img src="${src}" alt="${alt}"${titleAttr} style="max-width:100%;height:auto;" />`;
    });

    // Links: [text](url)
    text = text.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener">$1</a>'
    );

    // Inline code: `code`
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold: **text** or __text__
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italic: *text* or _text_
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    text = text.replace(/(?<![a-zA-Z0-9])_(.+?)_(?![a-zA-Z0-9])/g, '<em>$1</em>');

    // A single newline becomes <br>, except before a line that starts with a tag
    return breaks ? text.replace(/\n(?!\s*<)/g, '<br>') : text;
}

/**
 * Convert Markdown to HTML, block by block. The result is not sanitised.
 *
 * @param {string} md - Markdown source text.
 * @returns {string} HTML.
 */
function renderBlocks(md) {
    const lines = md.replace(/\r\n?/g, '\n').split('\n');
    const html = [];
    let paragraph = [];
    let i;

    /**
     * End the paragraph being collected, if there is one.
     */
    const endParagraph = () => {
        if (paragraph.length) html.push(`<p>${inline(paragraph.join('\n'), true)}</p>`);
        paragraph = [];
    };

    /**
     * Take the run of lines, from the current one on, that match a pattern.
     * Leaves `i` at the last of them.
     *
     * @param {RegExp} pattern - Pattern for one line.
     * @returns {Array<string[]>} The match for each line.
     */
    const run = (pattern) => {
        const found = [];
        for (let m; i < lines.length && (m = pattern.exec(lines[i])); i++) found.push(m);
        i--;
        return found;
    };

    for (i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) {
            endParagraph();
            continue;
        }
        // Any indentation is fine: there are no indented code blocks
        const block = HTML_BLOCKS.find(
            (b) => b.start.test(line.trimStart()) && !(b.notInParagraph && paragraph.length)
        );
        let m;
        if (block) {
            endParagraph();
            const first = i;
            if (block.end) while (!block.end.test(lines[i]) && i + 1 < lines.length) i++;
            else while (i + 1 < lines.length && lines[i + 1].trim()) i++;
            const raw = lines.slice(first, i + 1).join('\n');
            html.push(block.verbatim ? raw : inline(raw, false));
        } else if (RULE.test(line)) {
            endParagraph();
            html.push('<hr>');
        } else if ((m = HEADING.exec(line))) {
            endParagraph();
            html.push(`<h${m[1].length}>${inline(m[2], false)}</h${m[1].length}>`);
        } else if (QUOTE.test(line)) {
            endParagraph();
            const quote = run(QUOTE).map((q) => q[1]);
            html.push(`<blockquote>${inline(quote.join('\n'), true)}</blockquote>`);
        } else if (BULLET.test(line)) {
            endParagraph();
            const items = run(BULLET).map((li) => `<li>${inline(li[1], false)}</li>`);
            html.push(`<ul>${items.join('')}</ul>`);
        } else if (NUMBERED.test(line)) {
            endParagraph();
            const items = run(NUMBERED).map((li) => `<li>${inline(li[2], false)}</li>`);
            html.push(`<ol>${items.join('')}</ol>`);
        } else {
            paragraph.push(line);
        }
    }
    endParagraph();
    return html.join('\n');
}

/**
 * Convert a Markdown string to HTML.
 *
 * @param {string} md - Markdown source text.
 * @param {object} [options] - Conversion options.
 * @param {string} [options.allowedUriPatterns] - Comma-separated URL prefixes for
 *   allowed iframe/video/source src attributes. Empty string = allow all.
 * @returns {string} HTML string.
 */
export function markdownToHtml(md, options) {
    if (!md) return '';

    const sanitized = DOMPurify.sanitize(renderBlocks(md).trim(), {
        ADD_TAGS: ['iframe', 'video', 'source'],
        ADD_ATTR: [
            'target',
            'rel',
            'style',
            // video/iframe attributes
            'controls',
            'autoplay',
            'muted',
            'loop',
            'poster',
            'preload',
            'playsinline',
            'allowfullscreen',
            'allow',
            'loading',
            'referrerpolicy',
        ],
    });

    return filterMediaUris(sanitized, options?.allowedUriPatterns);
}

/**
 * Remove iframe, video, and source elements whose src does not match any
 * of the allowed URI prefixes.
 *
 * @param {string} html - Sanitized HTML string.
 * @param {string} allowedUriPatterns - Comma-separated URL prefixes.
 * @returns {string} HTML with non-matching media elements removed.
 */
function filterMediaUris(html, allowedUriPatterns) {
    if (!allowedUriPatterns) return html;

    const prefixes = allowedUriPatterns
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
    if (prefixes.length === 0) return html;

    const container = document.createElement('div');
    container.innerHTML = html;

    container.querySelectorAll('iframe, video, source').forEach((el) => {
        const src = el.getAttribute('src') || '';
        const allowed = prefixes.some((prefix) => src.startsWith(prefix));
        if (!allowed) {
            el.remove();
        }
    });

    // Clean up video elements that lost all their source children
    container.querySelectorAll('video').forEach((video) => {
        if (!video.querySelector('source') && !video.getAttribute('src')) {
            video.remove();
        }
    });

    return container.innerHTML;
}
