# ember-add-in-repo-tests

> Allows Ember applications to co-locate their tests inside in-repo addons.

![CI Build](https://github.com/ember-add-in-repo-tests/ember-add-in-repo-tests/workflows/CI%20Build/badge.svg)
[![License](https://img.shields.io/github/license/ember-add-in-repo-tests/ember-add-in-repo-tests.svg)](https://github.com/ember-add-in-repo-tests/ember-add-in-repo-tests/blob/master/package.json)
[![Package Version](https://img.shields.io/npm/v/ember-add-in-repo-tests.svg?style=flat-square)](https://www.npmjs.com/package/ember-add-in-repo-tests)
[![Code Style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](#badge)

Adding this broccoli plugin to your `ember-cli-build.js` means you can have a structure like this in your Ember application:

```sh-session
.
├── lib
│   ├── foo
│   │   ├── index.js
│   │   ├── package.json
│   │   └── tests
│   │       └── unit
│   │           └── multiply-test.js
├── tests
│   ├── helpers
│   │   ├── destroy-app.js
│   │   ├── module-for-acceptance.js
│   │   ├── resolver.js
│   │   └── start-app.js
│   ├── index.html
│   ├── integration
│   ├── test-helper.js
│   └── unit
│       └── add-test.js
```

And when we execute `ember test`, both `unit/multiply-test` + `unit/add-test` should run.

## Usage

```sh-session
npm install ember-add-in-repo-tests
```

Import the function

```javascript
const { addInRepoTestsToHost } = require('ember-add-in-repo-tests');
```

Define a predicate on which addons should be included. If `lib/foo/index.js` has
this type of definition:

```javascript
/* eslint-env node */
'use strict';

module.exports = {
  name: 'foo',

  isDevelopingAddon() {
    return true;
  },

  includeTestsInHost: true,
};
```

We can define the predicate as

```javascript
const shouldIncludeTestsInHost = (addon) => addon.includeTestsInHost;
```

We can now override the test tree in `ember-cli-build`. Full code below

```javascript
const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const shouldIncludeTestsInHost = (addon) => addon.includeTestsInHost;

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    trees: {
      tests: addInRepoTestsToHost({
        project: defaults.project,
        shouldIncludeTestsInHost,
      }),
    },
  });

  return app.toTree();
};
```

You can additionally pass in a `projectRoot` to the options to override the root of the project. By default, `projectRoot` is `defaults.project.root`.

```javascript
const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const shouldIncludeTestsInHost = (addon) => addon.includeTestsInHost;

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    trees: {
      tests: addInRepoTestsToHost({
        project: defaults.project,
        projectRoot: customProjectRoot,
        shouldIncludeTestsInHost,
      }),
    },
  });

  return app.toTree();
};
```
