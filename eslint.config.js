import ashNazg from 'eslint-config-ash-nazg';

export default [
    {
        ignores: [
            'dist',
            'coverage'
        ]
    },
    {
        settings: {
            polyfills: [
                'Object.assign',
                'Symbol.toStringTag'
            ]
        }
    },
    ...ashNazg(['sauron', 'browser']),
    {
        files: ['**/*.html'],
        rules: {
            'jsdoc/require-jsdoc': 'off',
            'no-alert': 'off',
            'import/unambiguous': 'off'
        }
    },
    // Our Markdown rules (and used for JSDoc examples as well, by way of
    //   our use of `matchingFileName` in conjunction with
    //   `jsdoc/check-examples` within `ash-nazg`)
    {
        files: ['*.md/*.js'],
        rules: {
            'no-shadow': 'off',
            'sonarjs/no-internal-api-use': 'off',

            'eol-last': ['off'],
            'no-console': ['off'],
            'no-undef': ['off'],
            'no-unused-vars': ['warn', {
                caughtErrors: 'none',
                varsIgnorePattern: 'EventTargetFactory|ShimEvent|ShimCustomEvent|ShimDOMException|setPrototypeOfCustomEvent|EventTarget'
            }],
            'padded-blocks': 'off',
            'import/unambiguous': 'off',
            'import/no-unresolved': 'off',
            'import/no-commonjs': 'off',
            'n/no-missing-import': 'off',
            'n/no-unsupported-features/es-syntax': 'off',
            'no-multi-spaces': 'off',
            'no-alert': 'off'
        }
    },
    {
        rules: {
            '@stylistic/indent': ['error', 4, {outerIIFEBody: 0}],
            // Disable for now
            '@stylistic/max-len': 0,
            'unicorn/prefer-global-this': 0
        }
    }
];
