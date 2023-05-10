# CHANGES for eventtargeter

## 0.9.0

BREAKING CHANGES:
Update to Node 16; add `exports`; adds types

- refactor: adds types
- refactor: switch to native ESM
- Linting: Check RC file
- Linting: As per latest ash-nazg
- Build: Use "json" extension for RC
- Testing: Move files to `test` (default for Mocha)
- Testing: Use `chai/register-expect`
- Testing: Add `nyc` (and separate `mocha` and `coverage` scripts)
- npm: Change from deprecated `rollup-plugin-babel` to `rollup/plugin-babel`
    and make explicit `babelHelpers` value of `bundled`
- npm: Update devDeps

## 0.8.0

- Build: Update
- Linting (ESLint): As per latest ash-nazg (jsdoc)
- npm: Update devDeps

## 0.7.0

- Breaking change: Switch `core-js-bundle` from dep. to devDep (and use
    in example file)
- Linting (ESLint): Change to add recommended extension (".js"); lint HTML, MD
- Linting (lgtm): Add `lgtm.yml`
- Catch `handleEvent` and `handleEvent.bind` errors within listener
- npm: Update devDeps and `core-js-bundle`

## 0.6.0

- Breaking change: Remove `yarn.lock`
- Change from now deprecated `@babel/polyfill` to `core-js-bundle`
- Testing: Use `esm` to avoid need for test build; use CLI server over
    programmatic
- npm: Update devDeps

## 0.5.0

- Breaking change: Add separate ES build to `dist` along with UMD build
    (and move source file to `src`) and point to them in `module` and
    `main` of `package.json`, respectively
- Enhancement: Add `@babel/polyfill` as dependency
- Linting (ESLint): Avoid pseudo-deprecated Node `url.parse`
- npm: Update to Babel7; update other devDeps

## 0.4.0

- Breaking change (minor): Avoid `setPrototypeOf` calls unless new export
    function explicitly called
- Linting: Add `.eslintignore` (helpful to IDEs as well as simplifying script)
- npm: Avoid extra build during install

## 0.3.1

- Fix `.npmignore`

## 0.3.0

- npm: Use `babel-preset-env` instead of `babel-env` (problems on Travis
    due to rebuilding babelrc file?)
- npm: Update dev deps
- Build: Add yarn.lock
- Docs: Correct and elaborate on browser setup

## 0.2.2

- Build: Properly apply Babel

## 0.2.1

- npm: Add omitted `module` property

## 0.2.0

- Linting: `.remarkrc`
- Linting: Tighten ESLint checks and apply
- Enhancement: ES6 Module export option
- Refactoring: Utilize ES6 `const`, arrow functions, etc. in source with Babel Rollup
- Testing: Use better static server, refactor tests as ES6 Modules and rollup tests
- Docs: Demo ES6 import usage

## 0.1.0

- First separately released version
