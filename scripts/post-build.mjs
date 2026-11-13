/**
 * Post-build step, run after `nebula build` and `nebula sense`.
 *
 * 1. Fails the build if a build token is left in a bundle, in dist/ or in the extension folder
 *    that `nebula sense` copies it to. Rollup replaces every one while nebula builds
 *    (`replacementStrings` in nebula.config.cjs, scripts/build-tokens.cjs), so one left here means
 *    that the replacement stopped working, and the bundle would stop at the first line that reads
 *    it. It is reported, never patched: a patch here once hid that nebula did not read the
 *    replacement at all (docs/BUILD-AND-DEPLOYMENT.md). No bundle in dist/ fails the build too, so
 *    a check that found nothing to read never passes as one that found nothing wrong.
 * 2. Injects the shared `.qs Library` bundle metadata into the .qext manifest that `nebula sense`
 *    wrote. A missing .qext fails the build.
 *
 * It does not build, replace or zip anything itself.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { TOKEN_NAMES } = require('./build-tokens.cjs');

/** The extension folder that `nebula sense` writes. */
const EXT_DIR = 'onboard-qs-ext';

/** Bundle metadata injected into the .qext file. */
const BUNDLE_METADATA = {
    id: 'dot-qs-library',
    name: '.qs Library',
    description:
        'Extensions from Ptarmigan Labs that enhance the user experience with help capabilities, onboarding tours and more.',
};

/**
 * Collect every .js file in a directory and its subdirectories.
 *
 * @param {string} dir - The directory to read.
 *
 * @returns {Promise<string[]>} The paths of the .js files found; none when the directory is absent.
 */
async function jsFiles(dir) {
    try {
        const files = await readdir(dir, { recursive: true });
        return files.filter((file) => file.endsWith('.js')).map((file) => join(dir, file));
    } catch (err) {
        if (err.code === 'ENOENT') return [];
        throw err;
    }
}

/**
 * Find the build tokens left in some files.
 *
 * @param {string[]} files - The paths of the files to read.
 *
 * @returns {Promise<string[]>} A "file: token" line for each token left in a file.
 */
async function tokensLeft(files) {
    const found = [];
    for (const file of files) {
        const source = await readFile(file, 'utf-8');
        for (const token of TOKEN_NAMES) {
            if (source.includes(token)) found.push(`${file}: ${token}`);
        }
    }
    return found;
}

/**
 * Check the bundles for build tokens left in them, then inject the bundle metadata into the .qext
 * manifest. Exits the process with code 1 when a check fails.
 *
 * @returns {Promise<void>} Resolves when the post-build step is complete.
 */
async function main() {
    const bundles = await jsFiles('dist');
    if (bundles.length === 0) {
        console.error('Post-build: FAILED — no bundle in dist/. Run "npm run build" first.');
        process.exit(1);
    }
    const files = [...bundles, ...(await jsFiles(EXT_DIR))];

    const left = await tokensLeft(files);
    if (left.length > 0) {
        console.error('Post-build: FAILED — build tokens are left in the bundle:');
        for (const line of left) console.error(`  ${line}`);
        console.error(
            '  Rollup replaces them through replacementStrings in nebula.config.cjs ' +
                '(scripts/build-tokens.cjs). Fix the replacement there; this step patches nothing.'
        );
        process.exit(1);
    }
    console.log(`Post-build: checked ${files.length} js file(s), no build token left`);

    // Inject bundle metadata into the .qext manifest
    const qextPath = join(EXT_DIR, 'onboard-qs.qext');
    try {
        const qext = JSON.parse(await readFile(qextPath, 'utf-8'));
        qext.bundle = BUNDLE_METADATA;
        await writeFile(qextPath, JSON.stringify(qext, null, 2) + '\n');
        console.log(`Post-build: Injected bundle metadata into ${qextPath}`);
    } catch (err) {
        console.error(`Error injecting bundle into ${qextPath}:`, err);
        process.exit(1);
    }
}

main().catch((err) => {
    console.error('Post-build script failed:', err);
    process.exit(1);
});
