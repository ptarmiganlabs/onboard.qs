/**
 * Tests for scripts/zip-extension.mjs, run as `npm run zip` runs it, in a temporary folder that
 * holds stand-ins for the extension folder `nebula sense` writes and for README.md.
 *
 * The script used to log a failure and exit 0, and to skip a missing README.md with a warning, so
 * `npm run pack:prod` could pass with a zip that was missing part of the package. Now every
 * failure fails the build, and leaves no zip behind.
 *
 * Run with `npm test`.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { removeScriptFolders, runScriptIn } from './support/run-script.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const zipScript = path.resolve(here, '..', 'scripts', 'zip-extension.mjs');

const PACKAGE = JSON.stringify({ name: 'onboard-qs', main: 'dist/onboard-qs.js' });
const QEXT = path.join('onboard-qs-ext', 'onboard-qs.qext');
const ENTRY = path.join('onboard-qs-ext', 'onboard-qs.js');
const BUNDLE = path.join('onboard-qs-ext', 'dist', 'onboard-qs.js');
const EXTENSION = {
    [QEXT]: '{"name":"onboard-qs"}',
    [ENTRY]: 'define([], () => ({}));',
    [BUNDLE]: 'const t = "production";',
};

after(removeScriptFolders);

/**
 * Run zip-extension.mjs in a new temporary folder that holds the given files.
 *
 * @param {object} files - Each file's content, by its path in the folder.
 *
 * @returns {Promise<{folder: string, status: number|null, output: string}>} See runScriptIn.
 */
const runZip = (files) => runScriptIn(zipScript, files);

/**
 * Whether a file exists.
 *
 * @param {string} file - The path to look for.
 *
 * @returns {Promise<boolean>} True when the file is there.
 */
async function exists(file) {
    try {
        await access(file);
        return true;
    } catch {
        return false;
    }
}

/**
 * The names of a zip's entries, read from its central directory.
 *
 * @param {Buffer} zip - The zip file's bytes.
 *
 * @returns {string[]} Each file entry's full name, directories left out.
 */
function entryNames(zip) {
    const names = [];
    for (let at = zip.indexOf('PK\x01\x02', 0, 'binary'); at !== -1; ) {
        const nameLength = zip.readUInt16LE(at + 28);
        const extraLength = zip.readUInt16LE(at + 30);
        const commentLength = zip.readUInt16LE(at + 32);
        const name = zip.toString('utf8', at + 46, at + 46 + nameLength);
        if (!name.endsWith('/')) names.push(name);
        at = zip.indexOf(
            'PK\x01\x02',
            at + 46 + nameLength + extraLength + commentLength,
            'binary'
        );
    }
    return names.sort();
}

test('zips the extension folder and README.md', async () => {
    const { folder, status, output } = await runZip({
        'package.json': PACKAGE,
        'README.md': '# Onboard.qs',
        ...EXTENSION,
    });
    assert.equal(status, 0, output);
    assert.match(output, /Successfully created onboard-qs\.zip/);
    const zip = await readFile(path.join(folder, 'onboard-qs.zip'));
    assert.deepEqual(entryNames(zip), [
        'README.md',
        'dist/onboard-qs.js',
        'onboard-qs.js',
        'onboard-qs.qext',
    ]);
});

test('fails when there is no extension folder, and writes no zip', async () => {
    const { folder, status, output } = await runZip({
        'package.json': PACKAGE,
        'README.md': '# Onboard.qs',
    });
    assert.equal(status, 1);
    assert.ok(output.includes(`FAILED — ${QEXT} not found`), output);
    assert.equal(await exists(path.join(folder, 'onboard-qs.zip')), false);
});

test('fails when the extension folder has no bundle, and writes no zip', async () => {
    const { folder, status, output } = await runZip({
        'package.json': PACKAGE,
        'README.md': '# Onboard.qs',
        [QEXT]: EXTENSION[QEXT],
        [ENTRY]: EXTENSION[ENTRY],
    });
    assert.equal(status, 1);
    assert.ok(output.includes(`FAILED — ${BUNDLE} not found`), output);
    assert.equal(await exists(path.join(folder, 'onboard-qs.zip')), false);
});

test('fails when README.md is missing, and leaves no truncated zip', async () => {
    const { folder, status, output } = await runZip({ 'package.json': PACKAGE, ...EXTENSION });
    assert.equal(status, 1);
    assert.match(output, /Zip: FAILED — .*README\.md/);
    assert.equal(await exists(path.join(folder, 'onboard-qs.zip')), false);
});

test('fails when package.json cannot be read', async () => {
    const { status, output } = await runZip({ 'README.md': '# Onboard.qs', ...EXTENSION });
    assert.equal(status, 1);
    assert.match(output, /Zip: FAILED — .*package\.json/);
});
