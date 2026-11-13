/**
 * Tests for scripts/post-build.mjs, run as `npm run post-build` runs it, in a temporary folder that
 * holds stand-ins for what `nebula build` and `nebula sense` write.
 *
 * Rollup replaces the build tokens while nebula builds. post-build.mjs used to replace them again
 * in the finished bundles, and that hid for as long as the extension existed that Rollup replaced
 * none (docs/BUILD-AND-DEPLOYMENT.md). So it now fails the build on a token left in a bundle, and
 * on no bundle to check, and changes no bundle.
 *
 * Run with `npm test`.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const postBuild = path.resolve(here, '..', 'scripts', 'post-build.mjs');

const QEXT = path.join('onboard-qs-ext', 'onboard-qs.qext');
const BUNDLE = path.join('dist', 'onboard-qs.js');
const EXT_BUNDLE = path.join('onboard-qs-ext', 'dist', 'onboard-qs.js');

const folders = [];

after(async () => {
    await Promise.all(folders.map((folder) => rm(folder, { recursive: true, force: true })));
});

/**
 * Run post-build.mjs in a new temporary folder that holds the given files.
 *
 * @param {object} files - Each file's content, by its path in the folder.
 *
 * @returns {Promise<{folder: string, status: number, output: string}>} The folder, the exit code
 *     and what the script printed, stdout and stderr together.
 */
async function runPostBuild(files) {
    const folder = await mkdtemp(path.join(os.tmpdir(), 'onboard-qs-post-build-'));
    folders.push(folder);
    for (const [file, content] of Object.entries(files)) {
        await mkdir(path.dirname(path.join(folder, file)), { recursive: true });
        await writeFile(path.join(folder, file), content);
    }
    const run = spawnSync(process.execPath, [postBuild], { cwd: folder, encoding: 'utf8' });
    return { folder, status: run.status, output: `${run.stdout}${run.stderr}` };
}

test('fails when dist/ holds no bundle', async () => {
    const { status, output } = await runPostBuild({ [QEXT]: '{}' });
    assert.equal(status, 1);
    assert.match(output, /FAILED — no bundle in dist\//);
});

test('fails on a build token left in a bundle, names each one, and patches nothing', async () => {
    const bundle = 'const t = __BUILD_TYPE__, d = __BUILD_DATE__;';
    const extBundle = 'const v = __PACKAGE_VERSION__;';
    const { folder, status, output } = await runPostBuild({
        [BUNDLE]: bundle,
        [EXT_BUNDLE]: extBundle,
        [QEXT]: '{}',
    });
    assert.equal(status, 1);
    assert.match(output, /FAILED — build tokens are left in the bundle/);
    for (const line of [
        `${BUNDLE}: __BUILD_TYPE__`,
        `${BUNDLE}: __BUILD_DATE__`,
        `${EXT_BUNDLE}: __PACKAGE_VERSION__`,
    ]) {
        assert.ok(output.includes(line), `does not report ${line}`);
    }
    assert.equal(await readFile(path.join(folder, BUNDLE), 'utf8'), bundle);
    assert.equal(await readFile(path.join(folder, EXT_BUNDLE), 'utf8'), extBundle);
    assert.equal(await readFile(path.join(folder, QEXT), 'utf8'), '{}');
});

test('passes bundles with no token left, and adds the bundle metadata to the .qext', async () => {
    const { folder, status, output } = await runPostBuild({
        [BUNDLE]: 'const t = "production";',
        [EXT_BUNDLE]: 'const t = "production";',
        [QEXT]: JSON.stringify({ name: 'onboard-qs', version: '1.0.0' }),
    });
    assert.equal(status, 0, output);
    assert.match(output, /checked 2 js file\(s\), no build token left/);
    const qext = JSON.parse(await readFile(path.join(folder, QEXT), 'utf8'));
    assert.equal(qext.name, 'onboard-qs');
    assert.equal(qext.bundle.id, 'dot-qs-library');
});
