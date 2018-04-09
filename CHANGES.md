# 0.4.0

- Breaking change (minor): Avoid `setPrototypeOf` calls unless new export
    function explicitly called
- Linting: Add `.eslintignore` (helpful to IDEs as well as simplifying script)
- npm: Avoid extra build during install

# 0.3.1

- Fix `.npmignore`

# 0.3.0

- npm: Use `babel-preset-env` instead of `babel-env` (problems on Travis
    due to rebuilding babelrc file?)
- npm: Update dev deps
- Build: Add yarn.lock
- Docs: Correct and elaborate on browser setup

# 0.2.2

- Build: Properly apply Babel

# 0.2.1

- npm: Add omitted `module` property

# 0.2.0

- Linting: `.remarkrc`
- Linting: Tighten ESLint checks and apply
- Enhancement: ES6 Module export option
- Refactoring: Utilize ES6 `const`, arrow functions, etc. in source with Babel Rollup
- Testing: Use better static server, refactor tests as ES6 Modules and rollup tests
- Docs: Demo ES6 import usage

# 0.1.0

- First separately released version
