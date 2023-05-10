'use strict';

module.exports = {
    extends: 'ash-nazg/sauron-node-overrides',
    env: {
        browser: true
    },
    settings: {
        polyfills: [
            'Object.assign',
            'Symbol.toStringTag'
        ]
    },
    overrides: [
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

                'eol-last': ['off'],
                'no-console': ['off'],
                'no-undef': ['off'],
                'no-unused-vars': ['warn', {
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
        }
    ],
    rules: {
        indent: ['error', 4, {outerIIFEBody: 0}],
        // Disable for now
        'max-len': 0
    }
};
