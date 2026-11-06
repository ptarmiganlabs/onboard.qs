/**
 * Tests for src/util/markdown.js with the real DOMPurify, in headless Chrome:
 * what a step's dialog ends up with after sanitising, as the browser builds
 * it. markdown.test.mjs checks the converter's own output, before sanitising.
 *
 * The page is in standards mode, as Sense is, and the description is set
 * with innerHTML, as driver.js does. It uses the puppeteer that md-to-pdf
 * brings in, and the tests are skipped when that or its Chrome isn't there.
 *
 * Run with `npm test`.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const markdownPath = path.join(root, 'src', 'util', 'markdown.js');

let browser;
let page;
let unavailable;
let readme;

before(async () => {
    readme = await readFile(path.join(root, 'README.md'), 'utf8');
    try {
        const { default: puppeteer } = await import('puppeteer');
        browser = await puppeteer.launch({ headless: true });
    } catch (error) {
        unavailable = `headless Chrome isn't available: ${error.message.split('\n')[0]}`;
        return;
    }
    const { outputFiles } = await esbuild.build({
        stdin: {
            contents: `export { markdownToHtml } from ${JSON.stringify(markdownPath)};`,
            resolveDir: root,
        },
        bundle: true,
        format: 'iife',
        globalName: 'onboardMarkdown',
        write: false,
        logLevel: 'silent',
    });
    page = await browser.newPage();
    // Nothing leaves the page: images and iframes in the tests load nothing
    await page.setRequestInterception(true);
    page.on('request', (request) =>
        /^(?:https?|wss?):/.test(request.url()) ? request.abort() : request.continue()
    );
    await page.setContent('<!DOCTYPE html><html><body><div id="description"></div></body></html>');
    await page.addScriptTag({ content: outputFiles[0].text });
});

after(() => browser?.close());

/**
 * Skip a test when there is no Chrome to run it in.
 *
 * @param {object} t - The test context.
 * @returns {boolean} Whether the test can run.
 */
function canRun(t) {
    if (unavailable) t.skip(unavailable);
    return !unavailable;
}

/**
 * Convert a description in the page, sanitised, and set it as a step's
 * dialog does.
 *
 * @param {string} md - The description.
 * @param {object} [options] - markdownToHtml()'s options.
 * @returns {Promise<object>} What the dialog ends up with.
 */
function render(md, options) {
    return page.evaluate(
        (md, options) => {
            const el = document.getElementById('description');
            el.innerHTML = window.onboardMarkdown.markdownToHtml(md, options);
            const all = (selector) => [...el.querySelectorAll(selector)];
            return {
                tags: all('*').map((e) => e.localName),
                text: el.textContent,
                emptyParagraphs: all('p').filter((p) => !p.innerHTML.trim()).length,
                olStarts: all('ol').map((ol) => ol.start),
                links: all('a').map((a) => ({
                    href: a.getAttribute('href'),
                    target: a.getAttribute('target'),
                    rel: a.getAttribute('rel'),
                })),
                images: all('img').map((img) => ({
                    src: img.getAttribute('src'),
                    alt: img.getAttribute('alt'),
                    title: img.getAttribute('title'),
                    onerror: img.getAttribute('onerror'),
                })),
                iframes: all('iframe').map((iframe) => iframe.getAttribute('src')),
                svgRects: all('svg rect').length,
            };
        },
        md,
        options ?? {}
    );
}

test("the README's Raw HTML example builds with no <br> or empty paragraph (#317)", async (t) => {
    if (!canRun(t)) return;
    const example = readme
        .slice(readme.indexOf('\n### Raw HTML\n'))
        .split('```html\n')[1]
        .split('\n```')[0];
    const result = await render(example);
    assert.ok(!result.tags.includes('br'), result.tags.join(' '));
    assert.equal(result.emptyParagraphs, 0);
    assert.deepEqual(
        result.tags.filter((tag) => ['p', 'div', 'img', 'table', 'video'].includes(tag)),
        ['p', 'div', 'img', 'table', 'p', 'video']
    );
});

test('an indented SVG keeps its shapes after sanitising (#317)', async (t) => {
    if (!canRun(t)) return;
    const result = await render(
        '<svg width="200" height="40" viewBox="0 0 200 40">\n  <rect x="0" y="0" width="120" height="40" fill="#2a9d8f"/>\n  <rect x="120" y="0" width="80" height="40" fill="#e76f51"/>\n</svg>'
    );
    assert.equal(result.svgRects, 2);
});

test('attribute values come through as typed (#318)', async (t) => {
    if (!canRun(t)) return;
    const result = await render(
        '<img src="https://example.com/img/_flags_/se.png">\n\n<a href="/x?a=1&copy-2">x</a>'
    );
    assert.deepEqual(
        result.images.map((img) => img.src),
        ['https://example.com/img/_flags_/se.png']
    );
    assert.deepEqual(
        result.links.map((a) => a.href),
        ['/x?a=1&copy-2']
    );
});

test('a stray < shows as text (#320)', async (t) => {
    if (!canRun(t)) return;
    const result = await render('Sales<budget in Q3, so the target was missed.');
    assert.equal(result.text, 'Sales<budget in Q3, so the target was missed.');
});

test('an ordered list keeps its start number after sanitising (#320)', async (t) => {
    if (!canRun(t)) return;
    const result = await render('2024. Sales grew 12%\n2025. Sales grew 8%');
    assert.deepEqual(result.olStarts, [2024]);
});

test('links keep target and rel, and images their alt text and title', async (t) => {
    if (!canRun(t)) return;
    const result = await render(
        "[Docs](https://example.com/docs) and ![Chart](https://example.com/c.png 'The chart')"
    );
    assert.deepEqual(result.links, [
        { href: 'https://example.com/docs', target: '_blank', rel: 'noopener' },
    ]);
    assert.deepEqual(
        result.images.map(({ alt, title }) => ({ alt, title })),
        [{ alt: 'Chart', title: 'The chart' }]
    );
});

test('event handlers are still removed', async (t) => {
    if (!canRun(t)) return;
    const result = await render('<img src="x.png" onerror="alert(1)">');
    assert.deepEqual(result.images, [{ src: 'x.png', alt: null, title: null, onerror: null }]);
});

test('the media allowlist still removes iframes from other sites', async (t) => {
    if (!canRun(t)) return;
    const result = await render(
        '<iframe src="https://elsewhere.example/x"></iframe>\n\n<iframe src="https://www.youtube.com/embed/x"></iframe>',
        { allowedUriPatterns: 'https://www.youtube.com/' }
    );
    assert.deepEqual(result.iframes, ['https://www.youtube.com/embed/x']);
});
