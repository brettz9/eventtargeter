import babel from 'rollup-plugin-babel';

export default {
    input: 'EventTarget-es6.js',
    output: {
        file: 'EventTarget.js',
        format: 'umd',
        name: 'EventTargeter'
    },
    plugins: [
        babel()
    ]
};
