import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { mdToPdf } from 'md-to-pdf';

/**
 * Generate a PDF version of README.md for inclusion in the distribution ZIP.
 *
 * Uses md-to-pdf (Puppeteer-based) with --no-sandbox to work in CI environments.
 *
 * @returns {Promise<void>} Resolves when the PDF has been written.
 */
async function main() {
    const inputPath = resolve('README.md');
    const outputPath = resolve('README.pdf');

    console.log(`Generating PDF from ${inputPath}…`);

    const pdf = await mdToPdf(
        { path: inputPath },
        {
            launch_options: {
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            },
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
