import js from '@eslint/js'
import importPlugin from 'eslint-plugin-import'
import n from 'eslint-plugin-n'
import promisePlugin from 'eslint-plugin-promise'
import prettier from 'eslint-config-prettier/flat'
import globals from 'globals'

export default [
    js.configs.recommended,
    importPlugin.flatConfigs.recommended,
    n.configs['flat/recommended-module'],
    promisePlugin.configs['flat/recommended'],
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.node,
                ...globals.es2022,
            },
        },
        rules: {
            indent: ['error', 4, { SwitchCase: 1 }],
            semi: 'off',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'max-len': ['error', { code: 150, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true }],
            'no-console': 'off',
            'import/extensions': 'off',
            'no-var': 'error',
            'prefer-const': 'error',
            'prefer-template': 'error',
            'object-shorthand': 'error',
            eqeqeq: ['error', 'always', { null: 'ignore' }],
            'no-underscore-dangle': 'off',
            'import/prefer-default-export': 'off',
            'no-param-reassign': ['error', { props: false }],
            'no-use-before-define': ['error', { functions: false, classes: false }],
            'prefer-arrow-callback': 'error',
            'no-await-in-loop': 'off',
            'class-methods-use-this': 'off',
            'no-bitwise': 'off',
            'func-names': 'off',
            'no-cond-assign': 'error',
            'no-constant-condition': ['error', { checkLoops: false }],
            'no-restricted-syntax': [
                'warn',
                { selector: 'ForInStatement', message: 'Use Object.keys/values/entries instead of for-in loops.' },
                { selector: 'LabeledStatement', message: 'Labels are not allowed.' },
                { selector: 'WithStatement', message: 'with is not allowed.' },
            ],
            'arrow-body-style': 'off',
            'no-return-await': 'off',

            // Lib-specific plugin overrides
            'import/no-unresolved': 'off',
            'promise/always-return': 'off',
            'n/no-missing-import': 'off',
            'n/no-process-exit': 'off',
            'n/no-unpublished-import': 'off',
        },
    },
    // prettier MUST be last — disables conflicting formatting rules
    prettier,
    {
        ignores: ['node_modules/**'],
    },
]
