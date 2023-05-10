import {babel} from '@rollup/plugin-babel';

export default [{
    input: 'src/EventTarget.js',
    output: {
        file: 'dist/index.js',
        format: 'umd',
        name: 'EventTargeter'
    },
    plugins: [
        babel({
            babelHelpers: 'bundled'
        })
    ]
}, {
    input: 'src/EventTarget.js',
    output: {
        file: 'dist/index-es.js',
        format: 'es',
        name: 'EventTargeter'
    },
    plugins: [
        babel({
            babelHelpers: 'bundled'
        })
    ]
}];
