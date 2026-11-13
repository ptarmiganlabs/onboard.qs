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
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { removeScriptFolders, runScriptIn } from './support/run-script.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const postBuild = path.resolve(here, '..', 'scripts', 'post-build.mjs');

const QEXT = path.join('onboard-qs-ext', 'onboard-qs.qext');
const BUNDLE = path.join('dist', 'onboard-qs.js');
const EXT_BUNDLE = path.join('onboard-qs-ext', 'dist', 'onboard-qs.js');

after(removeScriptFolders);

/**
 * Run post-build.mjs in a new temporary folder that holds the given files.
 *
 * @param {object} files - Each file's content, by its path in the folder.
 *
 * @returns {Promise<{folder: string, status: number|null, output: string}>} See runScriptIn.
 */
const runPostBuild = (files) => runScriptIn(postBuild, files);

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
