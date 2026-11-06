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
 *   - Ordered lists (1. item), starting at the first item's number
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

// The elements whose content is text rather than HTML. A block of one runs
// to its end tag, blank lines and all.
const RAW_TEXT = 'pre|script|style|textarea';
// Browsers also take an end tag with spaces before the `>`, such as `</pre >`
const RAW_TEXT_END = new RegExp(String.raw`<\/(?:${RAW_TEXT})\s*>`, 'i');

// An open tag and a close tag, as CommonMark defines raw HTML
const ATTRIBUTE = String.raw`\s+[A-Za-z_:][\w.:-]*(?:\s*=\s*(?:[^\s"'=<>\x60]+|'[^']*'|"[^"]*"))?`;
const OPEN_TAG = String.raw`<[A-Za-z][A-Za-z0-9-]*(?:${ATTRIBUTE})*\s*\/?>`;
const CLOSE_TAG = String.raw`<\/[A-Za-z][A-Za-z0-9-]*\s*>`;

/**
 * The lines that start an HTML block, and the line that ends each kind
 * (CommonMark 0.31.2, section 4.6). A block without `end` runs until a blank
 * line. A line holding just one tag can't interrupt a paragraph. A comment
 * ends at `-->`, or at `--!>`, which browsers accept too.
 */
const HTML_BLOCKS = [
    {
        start: new RegExp(String.raw`^<(?:${RAW_TEXT})(?:\s|>|$)`, 'i'),
        end: RAW_TEXT_END,
        verbatim: true,
    },
    { start: /^<!--/, end: /--!?>/, verbatim: true },
    { start: new RegExp(String.raw`^<\/?(?:${BLOCK_TAGS})(?:\s|\/?>|$)`, 'i') },
    {
        start: new RegExp(
            String.raw`^(?!<\/?(?:${RAW_TEXT})\b)(?:${OPEN_TAG}|${CLOSE_TAG})\s*$`,
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

// Inline, a code span and raw HTML have the same precedence, as in
// CommonMark: whichever starts first wins. The content of a <pre>, <script>,
// <style> or <textarea> element is raw HTML too.
const ATOM = new RegExp(
    [
        String.raw`(?<!\x60)(\x60+)(?!\x60)([\s\S]*?[^\x60])\1(?!\x60)`,
        String.raw`<(${RAW_TEXT})\b[^>]*>[\s\S]*?<\/\3\s*>`,
        String.raw`<!--(?:-?>|[\s\S]*?--!?>)`,
        OPEN_TAG,
        CLOSE_TAG,
    ].join('|'),
    'gi'
);

// Marks HTML set aside while the inline rules run: `\uFFFC` + "h" for HTML
// the author wrote + its index + `\uFFFC`. U+FFFC (object replacement
// character) is a symbol, so emphasis treats it as punctuation, as it treats
// the < and > it stands for. A description can't contain one: renderBlocks()
// replaces it.
const KEPT = /\uFFFC(h?)(\d+)\uFFFC/g;
const BREAK = /\n(?![ \t]*\uFFFCh)/g;
const PUNCTUATION = /[\p{P}\p{S}]/u;
const WHITESPACE = /\s/;

/**
 * Escape text for element content.
 *
 * @param {string} text - Text.
 * @returns {string} The text with &, < and > escaped.
 */
const escapeHtml = (text) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Quote Markdown text, in which & and < are escaped already, for an
 * attribute value.
 *
 * @param {string} text - Text.
 * @returns {string} The text with " escaped too.
 */
const attr = (text) => text.replace(/"/g, '&quot;');

/**
 * Turn the `*` and `_` delimiter runs in one line into <em> and <strong>, by
 * CommonMark's rules (spec 0.31.2, section 6.2, and its "process emphasis"
 * algorithm). A run can open emphasis only next to the text it starts, so
 * `price * quantity * 12` stays as it is, and `_` doesn't work inside a word.
 *
 * @param {string} line - One line, with code spans and tags set aside.
 * @returns {string} The line with emphasis.
 */
function emphasis(line) {
    const runs = [...line.matchAll(/\*+|_+/g)].map((m) => {
        // The start and the end of the line count as whitespace
        const before = line[m.index - 1] ?? ' ';
        const after = line[m.index + m[0].length] ?? ' ';
        const punctBefore = PUNCTUATION.test(before);
        const punctAfter = PUNCTUATION.test(after);
        const left =
            !WHITESPACE.test(after) && (!punctAfter || WHITESPACE.test(before) || punctBefore);
        const right =
            !WHITESPACE.test(before) && (!punctBefore || WHITESPACE.test(after) || punctAfter);
        const star = m[0][0] === '*';
        return {
            index: m.index,
            char: m[0][0],
            size: m[0].length,
            left: m[0].length,
            canOpen: star ? left : left && (!right || punctBefore),
            canClose: star ? right : right && (!left || punctAfter),
            active: true,
            opening: '',
            closing: '',
        };
    });

    for (let c = 0; c < runs.length; c++) {
        const closer = runs[c];
        if (!closer.canClose) continue;
        for (let o = c - 1; o >= 0 && closer.left > 0; o--) {
            const opener = runs[o];
            if (!opener.active || !opener.canOpen || !opener.left || opener.char !== closer.char) {
                continue;
            }
            // The rule of 3
            if (
                (opener.canClose || closer.canOpen) &&
                (opener.size + closer.size) % 3 === 0 &&
                (opener.size % 3 || closer.size % 3)
            ) {
                continue;
            }
            const tag = opener.left >= 2 && closer.left >= 2 ? 'strong' : 'em';
            const used = tag === 'strong' ? 2 : 1;
            opener.left -= used;
            closer.left -= used;
            opener.opening = `<${tag}>${opener.opening}`;
            closer.closing += `</${tag}>`;
            for (let k = o + 1; k < c; k++) runs[k].active = false;
            o++; // the same opener may have characters left for this closer
        }
    }

    let out = '';
    let last = 0;
    for (const run of runs) {
        out += line.slice(last, run.index) + run.closing + run.char.repeat(run.left) + run.opening;
        last = run.index + run.size;
    }
    return out + line.slice(last);
}

/**
 * Convert the inline Markdown in a block's text. Tags and code spans are set
 * aside first, so no Markdown rule ever sees an attribute value or code.
 *
 * @param {string} text - The block's text.
 * @param {boolean} breaks - Whether a single newline becomes <br>.
 * @returns {string} HTML.
 */
function inline(text, breaks) {
    const kept = [];

    /**
     * Set HTML aside until the inline rules are done.
     *
     * @param {string} html - The HTML.
     * @param {boolean} [authored] - Whether the author wrote it, rather than this converter.
     * @returns {string} The placeholder that stands for it.
     */
    const keep = (html, authored) => `\uFFFC${authored ? 'h' : ''}${kept.push(html) - 1}\uFFFC`;

    /**
     * Put the HTML that was set aside back, including HTML inside it.
     *
     * @param {string} s - Text with placeholders.
     * @returns {string} The text with the HTML back in place.
     */
    const restore = (s) => s.replace(KEPT, (_, _h, n) => restore(kept[n]));

    text = text.replace(ATOM, (match, ticks, code) => {
        if (!ticks) return keep(match, true);
        // As in CommonMark: line endings become spaces, and one space is
        // stripped from each end of code that has a space at both ends
        code = code.replace(/\n/g, ' ');
        if (/^ [\s\S]*[^ ][\s\S]* $/.test(code)) code = code.slice(1, -1);
        return keep(`<code>${escapeHtml(code)}</code>`);
    });

    // What is left is text. Escape & unless it starts an entity, and every
    // <: one that starts a tag or a comment has been set aside above
    text = text.replace(/&(?!#?\w+;)/g, '&amp;').replace(/</g, '&lt;');

    // Images: ![alt](src "title"), with an optional title in "" or ''
    text = text.replace(
        /!\[([^\]]*)\]\(([^)\s]+)(?:\s+(?:"([^"]*)"|'([^']*)'))?\)/g,
        (_, alt, src, title1, title2) => {
            const title = title1 ?? title2;
            const titleAttr = title ? ` title="${attr(title)}"` : '';
            return keep(
                `<img src="${attr(src)}" alt="${attr(alt)}"${titleAttr} style="max-width:100%;height:auto;" />`
            );
        }
    );

    // Links: [text](url). The text stays, so emphasis works in it.
    text = text.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        (_, label, href) =>
            keep(`<a href="${attr(href)}" target="_blank" rel="noopener">`) + label + keep('</a>')
    );

    text = text.split('\n').map(emphasis).join('\n');

    // A single newline becomes <br>, except before a line that starts with
    // HTML the author wrote
    return restore(breaks ? text.replace(BREAK, '<br>') : text);
}

/**
 * Convert Markdown to HTML, block by block. The result is not sanitised.
 *
 * @param {string} md - Markdown source text.
 * @returns {string} HTML.
 */
function renderBlocks(md) {
    const lines = md
        .replace(/\r\n?/g, '\n')
        .replace(/\uFFFC/g, '\uFFFD')
        .split('\n');
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
        } else if ((m = NUMBERED.exec(line))) {
            endParagraph();
            // The list starts at its first item's number, as in CommonMark
            const start = Number(m[1]);
            const items = run(NUMBERED).map((li) => `<li>${inline(li[2], false)}</li>`);
            html.push(`<ol${start === 1 ? '' : ` start="${start}"`}>${items.join('')}</ol>`);
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
