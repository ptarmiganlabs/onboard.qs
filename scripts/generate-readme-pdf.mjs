import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mdToPdf } from 'md-to-pdf';
import puppeteer from 'puppeteer';

const require = createRequire(import.meta.url);

/** Chromium flags that let Puppeteer run in CI containers. */
const LAUNCH_OPTIONS = { args: ['--no-sandbox', '--disable-setuid-sandbox'] };

/** A fenced code block whose language is mermaid; group 1 is the diagram source. */
const MERMAID_BLOCK = /^```mermaid[ \t]*\r?\n([\s\S]*?)^```[ \t]*$/gm;

/** Centres a drawn diagram and keeps it on one page. */
const DIAGRAM_CSS =
    '.readme-diagram { margin: 1em 0; text-align: center; break-inside: avoid; } .readme-diagram svg { max-width: 100%; height: auto; }';

/** The room a diagram has on an A4 page inside the 20 mm margins, in CSS pixels, with space left for a heading. */
const MAX_DIAGRAM = { width: 640, height: 880 };

/**
 * Give a drawn diagram a fixed size that fits on one page.
 *
 * Mermaid makes each SVG as wide as the page, so a tall flowchart grows taller than an A4 page.
 * This sizes the SVG from its viewBox instead, scaled down to fit both ways, never up.
 *
 * @param {string} svg - The SVG Mermaid drew.
 * @returns {string} The same SVG with a width and height that fit on a page.
 */
function fitToPage(svg) {
    const viewBox = /viewBox="([-\d.]+)[ ,]+([-\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)"/.exec(svg);
    if (!viewBox) {
        return svg;
    }
    const [width, height] = [Number(viewBox[3]), Number(viewBox[4])];
    const scale = Math.min(1, MAX_DIAGRAM.width / width, MAX_DIAGRAM.height / height);
    const size = `width="${Math.round(width * scale)}" height="${Math.round(height * scale)}"`;
    return svg.replace(/<svg([^>]*?)\swidth="[^"]*"/, `<svg$1 ${size}`);
}

/**
 * Replace each fenced mermaid code block in the Markdown with the diagram drawn as an inline SVG.
 *
 * GitHub draws Mermaid itself, but md-to-pdf would print the source as a code block. The
 * diagrams are drawn with Mermaid in a headless Chromium, the same Puppeteer md-to-pdf uses. Each
 * SVG goes on one line, inside a `<div>`, so that Markdown keeps it as one HTML block.
 *
 * @param {string} markdown - The README text.
 * @returns {Promise<{ markdown: string, count: number }>} The text with the diagrams drawn, and how many there were.
 */
async function renderMermaidBlocks(markdown) {
    const sources = [...markdown.matchAll(MERMAID_BLOCK)].map((match) => match[1]);
    if (sources.length === 0) {
        return { markdown, count: 0 };
    }

    const browser = await puppeteer.launch(LAUNCH_OPTIONS);
    try {
        const page = await browser.newPage();
        await page.setContent(
            '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>'
        );
        await page.addScriptTag({ path: require.resolve('mermaid/dist/mermaid.min.js') });
        const svgs = await page.evaluate(async (diagrams) => {
            /* global mermaid */
            mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'default' });
            const drawn = [];
            for (const [index, diagram] of diagrams.entries()) {
                const { svg } = await mermaid.render(`readme-diagram-${index + 1}`, diagram);
                drawn.push(svg);
            }
            return drawn;
        }, sources);

        let next = 0;
        const rendered = markdown.replace(MERMAID_BLOCK, () => {
            const svg = fitToPage(svgs[next++]).replace(/\r?\n/g, ' ');
            return `<div class="readme-diagram">${svg}</div>`;
        });
        return { markdown: rendered, count: sources.length };
    } finally {
        await browser.close();
    }
}

/**
 * Generate a PDF version of README.md for inclusion in the distribution ZIP.
 *
 * Uses md-to-pdf (Puppeteer-based) with --no-sandbox to work in CI environments. Mermaid
 * diagrams are drawn first, so the PDF shows them as pictures rather than as their source.
 *
 * @returns {Promise<void>} Resolves when the PDF has been written.
 */
async function main() {
    const inputPath = resolve('README.md');
    const outputPath = resolve('README.pdf');

    console.log(`Generating PDF from ${inputPath}…`);

    const { markdown, count } = await renderMermaidBlocks(await readFile(inputPath, 'utf8'));
    if (count > 0) {
        console.log(`Drew ${count} Mermaid diagram(s)`);
    }

    const pdf = await mdToPdf(
        // As content rather than a path, with relative image paths resolved from the repository root.
        { content: markdown },
        {
            basedir: resolve('.'),
            css: DIAGRAM_CSS,
            launch_options: LAUNCH_OPTIONS,
            pdf_options: {
                format: 'A4',
                margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
            },
        }
    );

    if (pdf.content) {
        await writeFile(outputPath, pdf.content);
        console.log(`Successfully created ${outputPath}`);
    } else {
        throw new Error('PDF generation produced no content');
    }
}

main().catch((err) => {
    console.error('PDF generation failed:', err);
    process.exit(1);
});
