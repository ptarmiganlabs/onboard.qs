/**
 * Tests that nebula.config.cjs sets only what nebula reads, and that nebula's own Rollup pipeline
 * replaces every build token.
 *
 * nebula reads the config file's `build` section as its command-line options, and never reads a
 * key it does not know, without a word. `replacement` and a `rollup()` hook sat in the file unread
 * until 2026-11-13, so Rollup replaced no token, scripts/post-build.mjs patched them into the
 * finished bundles, and `npm start`, which named no config file, served a bundle that stopped at
 * its first token (docs/BUILD-AND-DEPLOYMENT.md). So these tests read the options as nebula does:
 * the ones its lib/init-config.js declares, and the few its lib/config.js reads besides. They build
 * nebula's Rollup configuration from the file, to see the replace plugin in it replace each token
 * in src/util/logger.js, and they keep every list of the tokens' names in step with
 * scripts/build-tokens.cjs.
 *
 * The imports from `@nebula.js/cli-build` reach into its lib/ folder, which the package allows: it
 * has no `exports` field. A nebula update that moves them fails these tests, which is the point:
 * the rules here have to be checked again then.
 *
 * Run with `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initConfig from '@nebula.js/cli-build/lib/init-config.js';
import nebulaRollupConfig from '@nebula.js/cli-build/lib/config.js';
import eslintConfig from '../eslint.config.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const require = createRequire(import.meta.url);
const nebulaConfig = require('../nebula.config.cjs');
const pkg = require('../package.json');
const { TOKEN_NAMES, buildTokens } = require('../scripts/build-tokens.cjs');

const loggerPath = path.join(root, 'src', 'util', 'logger.js');

/** What `@nebula.js/cli-build`'s lib/config.js reads from the parsed options without declaring. */
const READ_UNDECLARED = ['replacementStrings', 'reactNative', 'reactNativePath', 'cwd'];

/**
 * The options nebula build declares, read by handing its init-config a stand-in for yargs that
 * keeps the options it is given and ignores the rest.
 *
 * @returns {string[]} The declared option names.
 */
function declaredOptions() {
    const declared = {};
    const yargs = {};
    /**
     * Return the stand-in, as each yargs call returns yargs, so that the calls chain.
     *
     * @returns {object} The stand-in.
     */
    const chain = () => yargs;
    /**
     * Keep the options that nebula declares.
     *
     * @param {object} options - The options, by name.
     *
     * @returns {object} The stand-in.
     */
    const keep = (options) => {
        Object.assign(declared, options);
        return yargs;
    };
    Object.assign(yargs, {
        parserConfiguration: chain,
        options: keep,
        config: chain,
        middleware: chain,
    });
    initConfig(yargs);
    return Object.keys(declared);
}

/**
 * The keys of an object that are build tokens by their shape, sorted.
 *
 * @param {object} [object] - The object to read.
 *
 * @returns {string[]} The token-shaped keys.
 */
function tokensIn(object) {
    return Object.keys(object ?? {})
        .filter((key) => /^__[A-Z][A-Z0-9_]*__$/.test(key))
        .sort();
}

const SORTED_NAMES = [...TOKEN_NAMES].sort();

test('nebula.config.cjs holds only the section nebula build reads', () => {
    assert.deepEqual(Object.keys(nebulaConfig), ['build']);
});

test('nebula.config.cjs sets only options that nebula build reads', () => {
    const declared = declaredOptions();
    // A stand-in that read nothing would let every key through.
    for (const option of ['config', 'mode', 'sourcemap', 'preferBuiltins']) {
        assert.ok(declared.includes(option), `nebula declares no "${option}" option`);
    }
    const read = new Set([...declared, ...READ_UNDECLARED]);
    const unread = Object.keys(nebulaConfig.build).filter((key) => !read.has(key));
    assert.deepEqual(unread, [], `nebula build never reads ${unread.join(', ')}`);
});

test("the replace plugin of nebula's own Rollup configuration replaces every build token", () => {
    const source = readFileSync(loggerPath, 'utf8');
    for (const mode of ['development', 'production']) {
        const { input } = nebulaRollupConfig({
            mode,
            format: 'umd',
            cwd: root,
            argv: { ...nebulaConfig.build, sourcemap: false },
        });
        // nebula nests some plugins in arrays of their own, which Rollup flattens.
        const replace = input.plugins.flat().find((plugin) => plugin?.name === 'replace');
        assert.ok(replace, `nebula runs no replace plugin in a ${mode} build`);

        // The plugin returns null when it replaces nothing, so a broken replacement names each
        // token it leaves rather than failing on the null.
        const code = replace.transform(source, loggerPath)?.code ?? source;
        for (const name of TOKEN_NAMES) {
            assert.ok(!code.includes(name), `${name} is left in a ${mode} build`);
            const value = nebulaConfig.build.replacementStrings[name];
            assert.ok(code.includes(`= ${value};`), `${name} does not become ${value}`);
        }
    }
});

test('every script that runs nebula build or nebula serve names nebula.config.cjs', () => {
    // Without --config, nebula looks for nebula.config.js and, finding none, uses no options.
    const scripts = Object.entries(pkg.scripts).filter(([, command]) =>
        /\bnebula (build|serve)\b/.test(command)
    );
    const names = scripts.map(([name]) => name);
    for (const name of ['build', 'build:dist', 'start']) {
        assert.ok(names.includes(name), `"npm run ${name}" no longer runs nebula build or serve`);
    }
    for (const [name, command] of scripts) {
        assert.match(command, /--config nebula\.config\.cjs\b/, `npm run ${name}`);
    }
});

test('the build tokens have the same names in every list of them', () => {
    assert.deepEqual(SORTED_NAMES, ['__BUILD_DATE__', '__BUILD_TYPE__', '__PACKAGE_VERSION__']);
    assert.deepEqual(Object.keys(nebulaConfig.build.replacementStrings ?? {}).sort(), SORTED_NAMES);
    const eslintGlobals = eslintConfig.flatMap((entry) => tokensIn(entry.languageOptions?.globals));
    assert.deepEqual(eslintGlobals.sort(), SORTED_NAMES);
});

test('the build tokens are all read by src/util/logger.js', () => {
    const logger = readFileSync(loggerPath, 'utf8');
    for (const name of TOKEN_NAMES) {
        assert.ok(logger.includes(`= ${name};`), `src/util/logger.js does not read ${name}`);
    }
});

test('the build tokens become string literals of what the build knows', () => {
    const tokens = buildTokens({ buildType: 'production', buildDate: '13 November 2026, 07:00' });
    const values = Object.fromEntries(
        Object.entries(tokens).map(([name, literal]) => [name, JSON.parse(literal)])
    );
    assert.deepEqual(values, {
        __BUILD_TYPE__: 'production',
        __PACKAGE_VERSION__: pkg.version,
        __BUILD_DATE__: '13 November 2026, 07:00',
    });
});

test('the build type comes from BUILD_TYPE, and is development without it', () => {
    const saved = process.env.BUILD_TYPE;
    try {
        process.env.BUILD_TYPE = 'production';
        assert.equal(buildTokens().__BUILD_TYPE__, '"production"');
        delete process.env.BUILD_TYPE;
        assert.equal(buildTokens().__BUILD_TYPE__, '"development"');
    } finally {
        if (saved === undefined) delete process.env.BUILD_TYPE;
        else process.env.BUILD_TYPE = saved;
    }
});
