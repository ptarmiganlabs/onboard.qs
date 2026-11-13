/**
 * Zip the extension folder that `nebula sense` wrote, with README.md at the archive root, into
 * `<name>.zip`: the file administrators upload to Qlik Sense.
 *
 * Every failure fails the build: no extension folder or manifest, a missing input, and any error
 * while writing the archive. The script used to log a failure and exit 0, and to skip a missing
 * README.md with a warning, so `npm run pack:prod` could pass with a zip that was missing part of
 * the package.
 */
import { createWriteStream } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ZipArchive } from 'archiver';

/** Files added at the archive root, beside the extension's own. */
const DOC_FILES = ['README.md'];

/**
 * Create a ZIP archive of the extension for distribution.
 *
 * @returns {Promise<void>} Resolves when the archive is written. Rejects when the extension folder
 *     or its manifest is missing, when an input is missing, or when writing the archive fails.
 */
async function main() {
    const pkg = JSON.parse(await readFile('package.json', 'utf-8'));
    const zipName = `${pkg.name}.zip`;
    const extDir = `${pkg.name}-ext`;
    const qext = join(extDir, `${pkg.name}.qext`);
    try {
        await access(qext);
    } catch {
        throw new Error(`${qext} not found. Run "npm run sense" first.`);
    }

    await new Promise((resolve, reject) => {
        const output = createWriteStream(zipName);
        const archive = new ZipArchive({ zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`${archive.pointer()} total bytes`);
            console.log(`Successfully created ${zipName}`);
            resolve();
        });
        output.on('error', reject);
        // archiver reports a missing input only as a warning, and carries on: the zip would lack
        // that file and the build would pass. So a warning fails the build, like an error.
        archive.on('warning', reject);
        archive.on('error', reject);

        archive.pipe(output);
        archive.glob('**/*', { cwd: extDir, ignore: ['.*', '**/.*'] });
        for (const file of DOC_FILES) archive.file(file, { name: file });
        archive.finalize().catch(reject);
    });
}

main().catch((err) => {
    console.error(`Zip: FAILED — ${err?.message ?? err}`);
    process.exit(1);
});
