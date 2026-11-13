/**
 * Tests for scripts/zip-extension.mjs, run as `npm run zip` runs it, in a temporary folder that
 * holds stand-ins for the extension folder `nebula sense` writes and for README.md.
 *
 * The script used to log a failure and exit 0, and to skip a missing README.md with a warning, so
 * `npm run pack:prod` could pass with a zip that was missing part of the package. Now every
 * failure fails the build.
 *
 * Run with `npm test`.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const zipScript = path.resolve(here, '..', 'scripts', 'zip-extension.mjs');

const PACKAGE = JSON.stringify({ name: 'onboard-qs' });
const EXTENSION = {
    [path.join('onboard-qs-ext', 'onboard-qs.qext')]: '{"name":"onboard-qs"}',
    [path.join('onboard-qs-ext', 'onboard-qs.js')]: 'define([], () => ({}));',
    [path.join('onboard-qs-ext', 'dist', 'onboard-qs.js')]: 'const t = "production";',
};

const folders = [];

after(async () => {
    await Promise.all(folders.map((folder) => rm(folder, { recursive: true, force: true })));
});

/**
 * Run zip-extension.mjs in a new temporary folder that holds the given files.
 *
 * @param {object} files - Each file's content, by its path in the folder.
 *
 * @returns {Promise<{folder: string, status: number, output: string}>} The folder, the exit code
 *     and what the script printed, stdout and stderr together.
 */
async function runZip(files) {
    const folder = await mkdtemp(path.join(os.tmpdir(), 'onboard-qs-zip-'));
    folders.push(folder);
    for (const [file, content] of Object.entries(files)) {
        await mkdir(path.dirname(path.join(folder, file)), { recursive: true });
        await writeFile(path.join(folder, file), content);
    }
    const run = spawnSync(process.execPath, [zipScript], { cwd: folder, encoding: 'utf8' });
    return { folder, status: run.status, output: `${run.stdout}${run.stderr}` };
}

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

test('zips the extension folder and README.md', async () => {
    const { folder, status, output } = await runZip({
        'package.json': PACKAGE,
        'README.md': '# Onboard.qs',
        ...EXTENSION,
    });
    assert.equal(status, 0, output);
    assert.match(output, /Successfully created onboard-qs\.zip/);
    const zip = await readFile(path.join(folder, 'onboard-qs.zip'));
    assert.equal(zip.subarray(0, 4).toString('binary'), 'PK\x03\x04', 'not a zip archive');
    // A zip names its entries in plain text, in each entry's header and in the directory at its end.
    for (const entry of ['onboard-qs.qext', 'onboard-qs.js', 'dist/onboard-qs.js', 'README.md']) {
        assert.ok(zip.includes(Buffer.from(entry)), `the zip holds no ${entry}`);
    }
});

test('fails when there is no extension folder, and writes no zip', async () => {
    const { folder, status, output } = await runZip({
        'package.json': PACKAGE,
        'README.md': '# Onboard.qs',
    });
    assert.equal(status, 1);
    assert.match(output, /FAILED — onboard-qs-ext\/onboard-qs\.qext not found/);
    assert.equal(await exists(path.join(folder, 'onboard-qs.zip')), false);
});

test('fails when README.md is missing', async () => {
    const { status, output } = await runZip({ 'package.json': PACKAGE, ...EXTENSION });
    assert.equal(status, 1);
    assert.match(output, /Zip: FAILED — .*README\.md/);
});

test('fails when package.json cannot be read', async () => {
    const { status, output } = await runZip({ 'README.md': '# Onboard.qs', ...EXTENSION });
    assert.equal(status, 1);
    assert.match(output, /Zip: FAILED — .*package\.json/);
});
