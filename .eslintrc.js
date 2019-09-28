module.exports = {
    "extends": "eslint-config-ash-nazg/sauron",
    "env": {
        "browser": true
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
            files: ['**/*.md'],
            rules: {
                'no-shadow': 'off',

                'eol-last': ['off'],
                'no-console': ['off'],
                'no-undef': ['off'],
                'no-unused-vars': ['warn', {varsIgnorePattern: 'EventTargetFactory|ShimEvent|ShimCustomEvent|ShimDOMException|setPrototypeOfCustomEvent|EventTarget'}],
                "padded-blocks": "off",
                "import/unambiguous": "off",
                "import/no-unresolved": "off",
                "import/no-commonjs": "off",
                "node/no-missing-import": "off",
                "no-multi-spaces": "off",
                "no-alert": "off",
                // Disable until may fix https://github.com/gajus/eslint-plugin-jsdoc/issues/211
                "indent": "off"
            }
        }
    ],
    "rules": {
        "indent": ["error", 4, {"outerIIFEBody": 0}],
        // Disable for now
        "max-len": 0
    }
};
