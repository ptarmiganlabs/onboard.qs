import js from '@eslint/js';
import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';
import prettierConfig from 'eslint-config-prettier';

export default [
    // Global ignores (must be a standalone config object)
    {
        ignores: ['dist/**', 'node_modules/**', '*.zip'],
    },

    // Base recommended rules
    js.configs.recommended,

    // JSDoc recommended rules
    jsdoc.configs['flat/recommended'],

    // Project-specific rules
    {
        plugins: {
            jsdoc,
        },
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
                __BUILD_TYPE__: 'readonly',
                __PACKAGE_VERSION__: 'readonly',
                define: 'readonly',
            },
        },
        rules: {
            // Code quality
            'no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            'no-console': 'off',
            'no-plusplus': 'off',
            'no-bitwise': 'off',
            'no-shadow': 'off',
            'no-use-before-define': 'off',
            'consistent-return': 'off',
            'no-promise-executor-return': 'off',
            'no-empty': 'off',
            'no-alert': 'off',
            'no-nested-ternary': 'off',
            'prefer-destructuring': 'off',
            'no-inner-declarations': 'off',
            'no-param-reassign': 'off',

            // JSDoc — strict enforcement (matches Butler SOS)
            'jsdoc/tag-lines': ['error', 'any', { startLines: 1 }],
            'jsdoc/require-jsdoc': [
                'error',
                {
                    require: {
                        FunctionDeclaration: true,
                        MethodDefinition: true,
                        ClassDeclaration: true,
                        ArrowFunctionExpression: true,
                        FunctionExpression: true,
                    },
                },
            ],
            'jsdoc/require-description': 'error',
            'jsdoc/require-param': 'error',
            'jsdoc/require-param-description': 'error',
            'jsdoc/require-param-name': 'error',
            'jsdoc/require-param-type': 'error',
            'jsdoc/require-returns': 'error',
            'jsdoc/require-returns-description': 'error',
            'jsdoc/require-returns-type': 'error',
        },
    },

    // Prettier must be last — disables formatting rules that conflict with Prettier
    prettierConfig,
];
