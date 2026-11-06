/**
 * Tests for src/util/markdown.js, which turns a tour step's description into
 * the HTML of its dialog.
 *
 * The real markdown.js is bundled with esbuild. DOMPurify needs a DOM, so
 * test/support/dompurify-stub.js stands in for it and returns the HTML
 * unchanged: these tests check the converter's own output, before it is
 * sanitised.
 *
 * Run with `npm test`.
 */
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const markdownPath = path.join(root, 'src', 'util', 'markdown.js');
const stubPath = path.join(here, 'support', 'dompurify-stub.js');

let md;
let readme;

before(async () => {
    const outfile = path.join(
        await mkdtemp(path.join(os.tmpdir(), 'onboard-qs-test-')),
        'markdown.mjs'
    );
    await esbuild.build({
        entryPoints: [markdownPath],
        bundle: true,
        format: 'esm',
        platform: 'node',
        outfile,
        logLevel: 'silent',
        plugins: [
            {
                name: 'dompurify-stub',
                setup(build) {
                    build.onResolve({ filter: /^dompurify$/ }, () => ({ path: stubPath }));
                },
            },
        ],
    });
    md = (await import(pathToFileURL(outfile).href)).markdownToHtml;
    readme = await readFile(path.join(root, 'README.md'), 'utf8');
});

/**
 * The first fenced code block after a heading in the README.
 *
 * @param {string} heading - The heading line, e.g. '### Raw HTML'.
 * @param {string} language - The fence's language, e.g. 'html'.
 * @returns {string} The block's content.
 */
function readmeExample(heading, language) {
    const section = readme.slice(readme.indexOf(`\n${heading}\n`));
    return section.split('```' + language + '\n')[1].split('\n```')[0];
}

// The demo apps' image step, as the tour has it
const DEMO_IMG =
    '<img src="https://raw.githubusercontent.com/ptarmiganlabs/onboard.qs/main/docs/screenshots/onboard-qs_developer-ux_5.png" alt="The Onboard.qs tour editor" style="display:block;max-width:100%;max-height:240px;margin:4px auto;border:1px solid #ddd;border-radius:4px" />';

// Two rows of the SE demo app's profitability table, as the tour has it
const DEMO_TABLE = [
    '<table style="width:100%;border-collapse:collapse;margin:4px 0 8px">',
    '<tr style="border-bottom:1px solid #ccc"><th style="text-align:left">Kategori</th><th style="text-align:right">Försäljning, MSEK</th><th style="text-align:right">Marginal</th></tr>',
    '<tr><td>Programvarulicenser</td><td style="text-align:right">19,7</td><td style="text-align:right"><strong>59 %</strong></td></tr>',
    '</table>',
].join('\n');

// Raw HTML blocks: #317

test("the README's Raw HTML example comes out as written (#317)", () => {
    const example = readmeExample('### Raw HTML', 'html');
    const html = md(example);

    assert.doesNotMatch(html, /<br>/);
    // The div, the image, the table and the video, each exactly as written
    for (const block of example.split('\n\n').filter((b) => !/^<(?:span|a)\b/.test(b))) {
        assert.ok(html.includes(block), `missing or changed:\n${block}`);
    }
    // Only the lines that go on with text after their tag are paragraphs
    assert.deepEqual(html.match(/<p>[\s\S]*?<\/p>/g), [
        '<p><span style="color: red; font-weight: bold;">Important!</span></p>',
        '<p><a href="https://help.qlik.com" target="_blank">Qlik Help →</a></p>',
    ]);
});

test('an indented SVG keeps its shapes (#317)', () => {
    const svg = [
        '<svg width="200" height="40" viewBox="0 0 200 40">',
        '  <rect x="0" y="0" width="120" height="40" fill="#2a9d8f"/>',
        '  <rect x="120" y="0" width="80" height="40" fill="#e76f51"/>',
        '</svg>',
    ].join('\n');
    assert.equal(md(svg), svg);
});

test('a blank line inside a flex container adds no paragraphs (#317)', () => {
    assert.equal(
        md('<div style="display:flex;gap:8px">\n<div>One</div>\n\n<div>Two</div>\n</div>'),
        '<div style="display:flex;gap:8px">\n<div>One</div>\n<div>Two</div>\n</div>'
    );
});

test('a <pre> block runs to its end tag, blank lines and all (#317)', () => {
    const pre = '<pre>\nline 1\n\n  **not bold**\n</pre>';
    assert.equal(md(pre), pre);
});

test('an HTML comment runs to its end, blank lines and all (#317)', () => {
    assert.equal(md('<!-- one\n\ntwo -->\nText'), '<!-- one\n\ntwo -->\n<p>Text</p>');
});

test('a comment can also end with --!>, as browsers accept', () => {
    assert.equal(
        md('<!-- one\n\ntwo --!>\n\n**Text**'),
        '<!-- one\n\ntwo --!>\n<p><strong>Text</strong></p>'
    );
    assert.equal(md('A <!-- note --!> comment'), '<p>A <!-- note --!> comment</p>');
});

test('Markdown between blank lines inside an HTML element is converted (#317)', () => {
    assert.equal(
        md('<div class="tip">\n\n- one\n- two\n\n</div>'),
        '<div class="tip">\n<ul><li>one</li><li>two</li></ul>\n</div>'
    );
});

test('Markdown block syntax straight inside an HTML block stays as written (#317)', () => {
    assert.equal(
        md('<div class="tip">\n- one\n- two\n</div>'),
        '<div class="tip">\n- one\n- two\n</div>'
    );
});

test('a block-level tag ends the paragraph above it, indented or not (#317)', () => {
    assert.equal(
        md('Our numbers:\n    <table>\n    <tr><td>1</td></tr>\n    </table>'),
        '<p>Our numbers:</p>\n    <table>\n    <tr><td>1</td></tr>\n    </table>'
    );
});

test('a line that starts with an indented tag gets no <br> before it (#317)', () => {
    assert.equal(
        md(
            'Sales by region:\n  <svg width="10" height="10">\n  <rect width="10" height="10"/>\n  </svg>'
        ),
        '<p>Sales by region:\n  <svg width="10" height="10">\n  <rect width="10" height="10"/>\n  </svg></p>'
    );
});

test("the README's Complete Example adds no <br> inside its <small> block (#317)", () => {
    const html = md(readmeExample('### Complete Example', 'markdown'));
    assert.ok(
        html.endsWith(
            '<hr>\n<small style="color: #888;">\n  Data source: SAP BW · Updated daily at 06:00 UTC\n</small>'
        ),
        html
    );
});

test("the demo profitability tour's table comes out as written", () => {
    const text = `Sett över hela perioden ser produktkategorierna ut så här:\n\n${DEMO_TABLE}\n\n*Tabellen är vanlig HTML: stegtexter kan blanda Markdown och HTML.*`;
    assert.equal(
        md(text),
        `<p>Sett över hela perioden ser produktkategorierna ut så här:</p>\n${DEMO_TABLE}\n<p><em>Tabellen är vanlig HTML: stegtexter kan blanda Markdown och HTML.</em></p>`
    );
});

test("the demo organisation tour's image line is an HTML block of its own", () => {
    const text = [
        'You can build your own the same way:',
        '',
        '1. In edit mode, drag **Onboard.qs** onto a sheet from *Custom objects*.',
        '2. Click **Edit Tours** on the object to open the tour editor.',
        '',
        DEMO_IMG,
        '',
        'Tours can be exported to a file.',
    ].join('\n');
    assert.equal(
        md(text),
        [
            '<p>You can build your own the same way:</p>',
            '<ol><li>In edit mode, drag <strong>Onboard.qs</strong> onto a sheet from <em>Custom objects</em>.</li><li>Click <strong>Edit Tours</strong> on the object to open the tour editor.</li></ol>',
            DEMO_IMG,
            '<p>Tours can be exported to a file.</p>',
        ].join('\n')
    );
});

test('video and iframe embeds come out as written', () => {
    const video =
        '<video width="400" controls>\n    <source src="/content/Default/demo.mp4" type="video/mp4" />\n</video>';
    const iframe =
        '<iframe width="400" height="225" src="https://www.youtube.com/embed/VIDEO_ID" allowfullscreen>\n</iframe>';
    assert.equal(md(`${video}\n\n${iframe}`), `${video}\n${iframe}`);
});

// Markdown and HTML tags: #318

test('Markdown rules leave attribute values alone (#318)', () => {
    for (const html of [
        '<img src="https://example.com/img/_flags_/se.png">',
        '<img src="https://cdn.example.com/__assets__/logo.png">',
        '<div style="width:calc(100% * 0.5);height:calc(10px * 2)"></div>',
    ]) {
        assert.equal(md(html), html);
    }
    assert.equal(
        md('Docs: <a href="https://example.com/a_b_c/`x`" title="*not em*">here</a>'),
        '<p>Docs: <a href="https://example.com/a_b_c/`x`" title="*not em*">here</a></p>'
    );
});

test('Markdown image and link URLs are left alone too (#318)', () => {
    assert.equal(
        md('![Flag](https://example.com/img/_flags_/se.png)'),
        '<p><img src="https://example.com/img/_flags_/se.png" alt="Flag" style="max-width:100%;height:auto;" /></p>'
    );
    assert.equal(
        md('[Assets](https://cdn.example.com/__assets__/)'),
        '<p><a href="https://cdn.example.com/__assets__/" target="_blank" rel="noopener">Assets</a></p>'
    );
});

test('a * or _ with a space on both sides is not emphasis (#318)', () => {
    assert.equal(
        md('Revenue = price * quantity * 12 months'),
        '<p>Revenue = price * quantity * 12 months</p>'
    );
    assert.equal(
        md('** not bold ** and _ not italic _'),
        '<p>** not bold ** and _ not italic _</p>'
    );
});

test('_ inside a word is not emphasis; * inside a word is, as in CommonMark', () => {
    assert.equal(md('snake_case_name and 2*3*4'), '<p>snake_case_name and 2<em>3</em>4</p>');
});

test('emphasis follows CommonMark next to punctuation and when nested (#318)', () => {
    const cases = {
        'pilarna **‹ ›** uppe': 'pilarna <strong>‹ ›</strong> uppe',
        'dess **×** för': 'dess <strong>×</strong> för',
        'strax under **38 %**, men': 'strax under <strong>38 %</strong>, men',
        '**Enterprise**-kunderna': '<strong>Enterprise</strong>-kunderna',
        '*‹ Föregående / Nästa › / Avsluta*': '<em>‹ Föregående / Nästa › / Avsluta</em>',
        'Use _Ctrl+Click_ to select': 'Use <em>Ctrl+Click</em> to select',
        '**Bold and _nested italic_ together**':
            '<strong>Bold and <em>nested italic</em> together</strong>',
        '***both***': '<em><strong>both</strong></em>',
        '*a **b** c*': '<em>a <strong>b</strong> c</em>',
        '**not closed *but this is*': '**not closed <em>but this is</em>',
    };
    for (const [input, output] of Object.entries(cases)) {
        assert.equal(md(input), `<p>${output}</p>`, input);
    }
});

test('emphasis can wrap HTML, and works in the text of an HTML block (#318)', () => {
    assert.equal(
        md('**<span style="color:red">Important</span>**'),
        '<p><strong><span style="color:red">Important</span></strong></p>'
    );
    assert.equal(
        md('<div class="note">**Note:** read this</div>'),
        '<div class="note"><strong>Note:</strong> read this</div>'
    );
});

test('a code span shows the HTML and Markdown in it as text (#318)', () => {
    assert.equal(
        md('Use the `<kbd>` tag, not `**bold**`'),
        '<p>Use the <code>&lt;kbd&gt;</code> tag, not <code>**bold**</code></p>'
    );
    assert.equal(md('``a `tick` inside``'), '<p><code>a `tick` inside</code></p>');
});

test('an evaluated formula description from the demo tours', () => {
    assert.equal(
        md(
            '**Hardware** sold 19.0 MSEK over the period, 17% of all sales.\n\nIts gross margin is **25.8%**, against 37.6% for the business as a whole.\n\n*Everything in this tour, even its name, is calculated from your selection.*'
        ),
        '<p><strong>Hardware</strong> sold 19.0 MSEK over the period, 17% of all sales.</p>\n<p>Its gross margin is <strong>25.8%</strong>, against 37.6% for the business as a whole.</p>\n<p><em>Everything in this tour, even its name, is calculated from your selection.</em></p>'
    );
});

// A stray < and list numbers: #320

test('a < that starts no tag shows as text (#320)', () => {
    assert.equal(
        md('Sales<budget in Q3, so the target was missed.'),
        '<p>Sales&lt;budget in Q3, so the target was missed.</p>'
    );
    assert.equal(md('a<b, 5 < 10 and <3'), '<p>a&lt;b, 5 &lt; 10 and &lt;3</p>');
    assert.equal(
        md('<https://example.com> and <user@example.com>'),
        '<p>&lt;https://example.com> and &lt;user@example.com></p>'
    );
    assert.equal(
        md('<table><tr><td>Sales<budget</td></tr></table>'),
        '<table><tr><td>Sales&lt;budget</td></tr></table>'
    );
});

test('tags, close tags and comments are kept', () => {
    assert.equal(
        md('A <strong>tag</strong>, a stray </b> and a <!-- note --> comment'),
        '<p>A <strong>tag</strong>, a stray </b> and a <!-- note --> comment</p>'
    );
});

test('a < with a tag name and a > later is a tag, as in CommonMark', () => {
    assert.equal(md('x<y and y>z'), '<p>x<y and y>z</p>');
});

test('an ordered list starts at its first number (#320)', () => {
    assert.equal(
        md('2024. Sales grew 12%\n2025. Sales grew 8%'),
        '<ol start="2024"><li>Sales grew 12%</li><li>Sales grew 8%</li></ol>'
    );
    assert.equal(md('1. One\n2. Two'), '<ol><li>One</li><li>Two</li></ol>');
    assert.equal(md('1. One\n\n2. Two'), '<ol><li>One</li></ol>\n<ol start="2"><li>Two</li></ol>');
});

// Line breaks

test('a line that starts with bold, a link or code gets its <br>', () => {
    assert.equal(
        md('**Step 1:** Open the sheet\n**Step 2:** Click a chart'),
        '<p><strong>Step 1:</strong> Open the sheet<br><strong>Step 2:</strong> Click a chart</p>'
    );
    assert.equal(
        md('See\n[the guide](https://example.com)\n`code`'),
        '<p>See<br><a href="https://example.com" target="_blank" rel="noopener">the guide</a><br><code>code</code></p>'
    );
});

test('a line that starts with HTML the author wrote still joins the line above', () => {
    assert.equal(
        md('Press\n<kbd>Ctrl</kbd> + <kbd>Z</kbd>'),
        '<p>Press\n<kbd>Ctrl</kbd> + <kbd>Z</kbd></p>'
    );
});

test("the README's Text Formatting example keeps its lines apart", () => {
    assert.equal(
        md(readmeExample('#### Text Formatting', 'markdown')),
        '<p><strong>Bold text</strong> or <strong>also bold</strong><br><em>Italic text</em> or <em>also italic</em><br><strong>Bold and <em>nested italic</em> together</strong><br><code>inline code</code></p>'
    );
});

// Generated tags

test("an image title can be in single quotes, as in the README's example", () => {
    assert.equal(
        md("![Chart explanation](https://example.com/chart.png 'Optional tooltip title')"),
        '<p><img src="https://example.com/chart.png" alt="Chart explanation" title="Optional tooltip title" style="max-width:100%;height:auto;" /></p>'
    );
});

test('a quote in generated attributes is escaped', () => {
    assert.equal(
        md('![Say "hi"](a.png)'),
        '<p><img src="a.png" alt="Say &quot;hi&quot;" style="max-width:100%;height:auto;" /></p>'
    );
});

test('the placeholder character used inside the converter stays text', () => {
    assert.equal(md('a \uFFFC0\uFFFC <b>x</b>'), '<p>a \uFFFD0\uFFFD <b>x</b></p>');
});

// Markdown that works as before

test('a blank line starts a new paragraph, and a single newline is a <br>', () => {
    assert.equal(
        md('First paragraph.\n\nSecond paragraph.\nSame paragraph, new line.'),
        '<p>First paragraph.</p>\n<p>Second paragraph.<br>Same paragraph, new line.</p>'
    );
});

test('a line of spaces counts as a blank line', () => {
    assert.equal(md('One.\n   \nTwo.'), '<p>One.</p>\n<p>Two.</p>');
});

test('headings are h3 to h6; # and ## stay text', () => {
    assert.equal(
        md('### h3\n#### h4\n##### h5\n###### h6\n## h2\n# h1'),
        '<h3>h3</h3>\n<h4>h4</h4>\n<h5>h5</h5>\n<h6>h6</h6>\n<p>## h2<br># h1</p>'
    );
});

test('adjacent quote lines merge into one blockquote', () => {
    assert.equal(
        md('> One line.\n> Another, with a [link](https://example.com).'),
        '<blockquote>One line.<br>Another, with a <a href="https://example.com" target="_blank" rel="noopener">link</a>.</blockquote>'
    );
});

test('---, *** and ___ are horizontal rules', () => {
    assert.equal(md('---\n\n***\n\n___'), '<hr>\n<hr>\n<hr>');
});

test('the text after a rule is a paragraph, with no empty line above it', () => {
    assert.equal(md('Before\n\n---\n\nAfter'), '<p>Before</p>\n<hr>\n<p>After</p>');
    assert.equal(md('Text\n---\nMore'), '<p>Text</p>\n<hr>\n<p>More</p>');
});

test('- and * both start bullet items', () => {
    assert.equal(md('- one\n* two'), '<ul><li>one</li><li>two</li></ul>');
});

test('a list can follow a paragraph line or a heading directly, as the demo tours do', () => {
    assert.equal(
        md(
            'Appen har fyra ark, och varje ark har en egen guide:\n1. Försäljningsöversikt\n2. Organisation'
        ),
        '<p>Appen har fyra ark, och varje ark har en egen guide:</p>\n<ol><li>Försäljningsöversikt</li><li>Organisation</li></ol>'
    );
    assert.equal(
        md('### This tour shows you\n- the buttons along the top\n- where to find more tours'),
        '<h3>This tour shows you</h3>\n<ul><li>the buttons along the top</li><li>where to find more tours</li></ul>'
    );
});

test('& is escaped unless it starts an entity', () => {
    assert.equal(md('AT&T &copy; &#169;'), '<p>AT&amp;T &copy; &#169;</p>');
});

test('images keep their alt text, title and size limit', () => {
    assert.equal(
        md('![Sales](https://example.com/a.png "The chart")'),
        '<p><img src="https://example.com/a.png" alt="Sales" title="The chart" style="max-width:100%;height:auto;" /></p>'
    );
});

test('links open in a new tab', () => {
    assert.equal(
        md('[Qlik Community](https://community.qlik.com)'),
        '<p><a href="https://community.qlik.com" target="_blank" rel="noopener">Qlik Community</a></p>'
    );
});

test('inline code, bold and italics', () => {
    assert.equal(
        md('Run `npm test`, **then** _check_ the *result*.'),
        '<p>Run <code>npm test</code>, <strong>then</strong> <em>check</em> the <em>result</em>.</p>'
    );
});

test('Windows line endings work like \\n', () => {
    assert.equal(md('One\r\nTwo\r\n\r\nThree'), '<p>One<br>Two</p>\n<p>Three</p>');
});

test('empty and blank descriptions give an empty string', () => {
    assert.equal(md(''), '');
    assert.equal(md(' \n\t\n'), '');
});
