/**
 * Run one of the build scripts as npm runs it, in a throwaway folder that holds the given files.
 * Shared by test/post-build.test.mjs and test/zip-extension.test.mjs.
 */
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

/** How long a script may run before the test counts it as hung. */
const TIMEOUT_MS = 30_000;

const folders = [];

/**
 * Run a script with Node in a new temporary folder that holds the given files.
 *
 * @param {string} script - Absolute path of the script to run.
 * @param {object} files - Each file's content, by its path in the folder.
 *
 * @returns {Promise<{folder: string, status: number|null, output: string}>} The folder, the exit
 *     code (null when the script was killed after the timeout) and what the script printed, stdout
 *     and stderr together.
 */
export async function runScriptIn(script, files) {
    const folder = await mkdtemp(path.join(os.tmpdir(), 'onboard-qs-script-'));
    folders.push(folder);
    for (const [file, content] of Object.entries(files)) {
        await mkdir(path.dirname(path.join(folder, file)), { recursive: true });
        await writeFile(path.join(folder, file), content);
    }
    const run = spawnSync(process.execPath, [script], {
        cwd: folder,
        encoding: 'utf8',
        timeout: TIMEOUT_MS,
    });
    return { folder, status: run.status, output: `${run.stdout}${run.stderr}` };
}

/**
 * Remove every folder runScriptIn made. Call it from the test file's `after` hook.
 *
 * @returns {Promise<void>} Resolves when the folders are gone.
 */
export async function removeScriptFolders() {
    await Promise.all(
        folders.splice(0).map((folder) => rm(folder, { recursive: true, force: true }))
    );
}
