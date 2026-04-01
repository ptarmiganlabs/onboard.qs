import { createWriteStream } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import archiver from 'archiver';

/**
 * Create a ZIP archive of the extension for distribution.
 *
 * @returns {Promise<void>} Resolves when the archive is finalized.
 */
async function main() {
    const pkg = JSON.parse(await readFile('package.json', 'utf-8'));
    const zipName = `${pkg.name}.zip`;
    const output = createWriteStream(zipName);
    const archive = archiver('zip', {
        zlib: { level: 9 },
    });

    output.on('close', () => {
        console.log(`${archive.pointer()} total bytes`);
        console.log(`Successfully created ${zipName}`);
    });

    archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
            console.warn(err);
        } else {
            throw err;
        }
    });

    archive.on('error', (err) => {
        throw err;
    });

    archive.pipe(output);

    // Append files from the extension directory
    archive.glob('**/*', {
        cwd: 'onboard-qs-ext/',
        ignore: ['.*', '**/.*'],
    });

    // Include documentation files in the archive root
    const docFiles = ['README.md', 'README.pdf'];
    for (const file of docFiles) {
        await access(file);
        archive.file(file, { name: file });
    }

    await archive.finalize();
}

main().catch(console.error);
