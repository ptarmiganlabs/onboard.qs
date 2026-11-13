/**
 * Zip the extension folder that `nebula sense` wrote, with README.md at the archive root, into
 * `<name>.zip`: the file administrators upload to Qlik Sense.
 *
 * Every failure fails the build: an extension folder without its manifest, entry file or bundle,
 * a missing input, and any error while writing the archive. A failed run removes the zip it
 * started, so no truncated zip is left to upload. The script used to log a failure and exit 0, and
 * to skip a missing README.md with a warning, so `npm run pack:prod` could pass with a zip that was
 * missing part of the package.
 */
import { createWriteStream } from 'node:fs';
import { access, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { ZipArchive } from 'archiver';

/** Files added at the archive root, beside the extension's own. */
const DOC_FILES = ['README.md'];

/**
 * Create a ZIP archive of the extension for distribution.
 *
 * @returns {Promise<void>} Resolves when the archive is written. Rejects when the extension folder
 *     lacks its manifest, entry file or bundle, when an input is missing, or when writing the
 *     archive fails; a zip it started is removed first.
 */
async function main() {
    const pkg = JSON.parse(await readFile('package.json', 'utf-8'));
    const zipName = `${pkg.name}.zip`;
    const extDir = `${pkg.name}-ext`;
    // What Sense needs to load the extension: its manifest, the entry file, and the bundle.
    const required = [`${pkg.name}.qext`, `${pkg.name}.js`, pkg.main].filter(Boolean);
    for (const file of required) {
        try {
            await access(join(extDir, file));
        } catch {
            throw new Error(`${join(extDir, file)} not found. Run "npm run sense" first.`);
        }
    }

    const output = createWriteStream(zipName);
    try {
        await writeZip(output, extDir, zipName);
    } catch (err) {
        // Leave no truncated zip behind to be uploaded by mistake.
        output.destroy();
        await rm(zipName, { force: true });
        throw err;
    }
}

/**
 * Write the extension folder and the doc files into the archive.
 *
 * @param {import('node:fs').WriteStream} output - The stream the zip is written to.
 * @param {string} extDir - The extension folder.
 * @param {string} zipName - The zip's file name, for the log.
 *
 * @returns {Promise<void>} Resolves when the zip is written; rejects on any archiver warning or
 *     error, or an error writing the file.
 */
function writeZip(output, extDir, zipName) {
    return new Promise((resolve, reject) => {
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
