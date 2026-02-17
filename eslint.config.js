import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
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
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': 'off',
      'max-len': ['error', { code: 165 }],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
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
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '*.zip'],
  },
];
