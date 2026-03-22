import js from '@eslint/js'
import globals from 'globals'
import importPlugin from 'eslint-plugin-import'
import n from 'eslint-plugin-n'
import prettierPlugin from 'eslint-plugin-prettier'
import promisePlugin from 'eslint-plugin-promise'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
    {
        ignores: ['node_modules/**'],
    },
    js.configs.recommended,
    importPlugin.flatConfigs.recommended,
    n.configs['flat/recommended-module'],
    promisePlugin.configs['flat/recommended'],
    eslintConfigPrettier,
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
        plugins: {
            prettier: prettierPlugin,
        },
        rules: {
            indent: ['error', 4, { SwitchCase: 1 }],
            semi: 'off',
            'prettier/prettier': ['error', { endOfLine: 'auto' }],
            'no-unused-vars': 'warn',
            'max-len': ['error', { code: 150 }],
            'no-console': 'off',
            'import/extensions': 'off',
            'import/no-unresolved': 'off',
            'promise/always-return': 'off',
            'n/no-missing-import': 'off',
            'n/no-process-exit': 'off',
            'n/no-unpublished-import': 'off',
        },
    },
]
