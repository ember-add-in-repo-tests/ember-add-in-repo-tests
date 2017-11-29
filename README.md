# ember-add-in-repo-tests

Provides ability to collocate in-repo addons app code and test code.

Ideally we can have a structure like this:

```
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

```
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

  includeTestsInHosts: true,
};
```

We can definte the predicate as

```javascript
const inRepoAddonPredicate = addon => addon.includeTestsInHosts;
```

We can now override the test tree in `ember-cli-build`. Full code below

```javascript
const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const inRepoAddonPredicate = (addon) => addon.includeTestsInHosts;

module.exports = function(defaults) {
  let app = new EmberApp(defaults, {
    trees: {
      tests: addInRepoTestsToHost(defaults.project, inRepoAddonPredicate),
    },
    hinting: false,
  });

  return app.toTree();
};
```
