import babel from 'rollup-plugin-babel';

// eslint-disable-next-line import/no-anonymous-default-export
export default [{
    input: 'src/EventTarget.js',
    output: {
        file: 'dist/index.js',
        format: 'umd',
        name: 'EventTargeter'
    },
    plugins: [
        babel()
    ]
}, {
    input: 'src/EventTarget.js',
    output: {
        file: 'dist/index-es.js',
        format: 'es',
        name: 'EventTargeter'
    },
    plugins: [
        babel()
    ]
}];
