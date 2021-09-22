'use strict';

const { expect } = require('chai');
const { createTempDir, buildOutput } = require('broccoli-test-helper');
const { glob } = require('glob');

const fs = require('fs');
const Funnel = require('broccoli-funnel');

const addInRepoTestsToHost = require('../lib/add-in-repo-tests-to-host');

describe('add-in-repo-tests-to-host', () => {
  it('Should always return app unit test trees', async () => {
    const input = await createTempDir();

    input.write({
      'package.json': `foo`,
      'README.md': 'lol',
      'ember-cli-build.js': 'bar',
      tests: {
        unit: {
          'foo-test.js': `console.log('hello world')`,
        },
      },
    });

    const project = {
      name: 'foo-app',
      addons: [],
      root: input.path(),
    };

    const node = addInRepoTestsToHost(project, () => false);
    const output = await buildOutput(node);
    expect(output.read()).to.deep.equal({
      unit: { 'foo-test.js': `console.log('hello world')` },
    });

    input.dispose();
  });

  it('Should merge unit tests of in repo addon', async () => {
    const input = await createTempDir();

    input.write({
      'package.json': `foo`,
      'README.md': 'lol',
      'ember-cli-build.js': 'bar',
      lib: {
        foo: {
          'index.js': `module.exports = { name: 'foo', includeTestsInHost: true }`,
          'package.json': `in-repo package.json`,
          tests: {
            unit: {
              'bar-test.js': `console.log('bar-test')`,
            },
          },
        },
      },
      tests: {
        unit: {
          'foo-test.js': `console.log('hello world')`,
        },
      },
    });

    const project = {
      root: input.path(),
      addons: [
        {
          name: 'foo',
          root: `${input.path()}/lib/foo`,
          includeTestsInHost: true,
        },
      ],
      name: 'foo-app',
    };

    const node = addInRepoTestsToHost(
      project,
      (addon) => addon.includeTestsInHost
    );
    const output = await buildOutput(node);
    expect(output.read()).to.deep.equal({
      foo: {
        unit: {
          'bar-test.js': `console.log('bar-test')`,
        },
      },
      unit: {
        'foo-test.js': `console.log('hello world')`,
      },
    });

    input.dispose();
  });

  it('handles addons without test directories', async () => {
    const input = await createTempDir();

    input.write({
      'package.json': `foo`,
      'README.md': 'lol',
      'ember-cli-build.js': 'bar',
      lib: {
        foo: {
          'index.js': `module.exports = { name: 'foo', includeTestsInHost: true }`,
          'package.json': `in-repo package.json`,
        },
      },
      tests: {
        unit: {
          'foo-test.js': `console.log('hello world')`,
        },
      },
    });

    const project = {
      root: input.path(),
      addons: [
        {
          name: 'foo',
          root: input.path('lib/foo'),
          includeTestsInHost: true,
        },
      ],
      name: 'foo-app',
    };

    const node = addInRepoTestsToHost(
      project,
      (addon) => addon.includeTestsInHost
    );
    const output = await buildOutput(node);

    expect(output.read()).to.deep.equal({
      unit: { 'foo-test.js': `console.log('hello world')` },
    });

    input.dispose();
  });

  it('filters addons by processing test contents', async () => {
    const input = await createTempDir();

    input.write({
      'package.json': `foo`,
      'README.md': 'lol',
      'ember-cli-build.js': 'bar',
      tests: {
        unit: {
          'foo-test.js': `console.log('hello world')`,
        },
      },
    });

    const project = {
      root: input.path(),
      addons: [],
      name: 'foo-app',
    };
    debugger;
    const filterRepoAddon = (dir) => {
      glob.sync(`${dir._directoryPath}/*/**-test.js`).forEach((file) => {
        const content = fs
          .readFileSync(file)
          .toString()
          .replace('console.log', 'console.error');

        fs.writeFileSync(file, content, 'utf8');
      });
      return new Funnel(dir);
    };

    const node = await addInRepoTestsToHost(
      project,
      (addon) => addon.includeTestsInHost,
      filterRepoAddon
    );
    const output = await buildOutput(node);
    expect(output.read()).to.deep.equal({
      unit: { 'foo-test.js': `console.error('hello world')` },
    });

    input.dispose();
  });

  it('addon recursively computes test trees based on initial predicate', async () => {
    const input = await createTempDir();

    input.write({
      'package.json': `foo`,
      'README.md': 'lol',
      'ember-cli-build.js': 'bar',
      lib: {
        foo: {
          'index.js': `module.exports = { name: 'foo', includeTestsInHost: true }`,
          'package.json': `in-repo package.json`,
          tests: {
            unit: {
              'foo-test.js': `console.log('foo-test')`,
            },
          },
        },
        'bar-foo': {
          'index.js': `module.exports = { name: 'bar-foo', includeTestsInHost: true }`,
          'package.json': `in-repo package.json`,
          tests: {
            unit: {
              'bar-foo-test.js': `console.log('bar-foo-test')`,
            },
          },
        },
      },
      tests: {
        unit: {
          'foo-test.js': `console.log('hello world')`,
        },
      },
    });

    const project = {
      root: input.path(),
      addons: [
        {
          name: 'foo',
          root: input.path('lib/foo'),
          includeTestsInHost: true,
          addons: [
            {
              name: 'bar-foo',
              root: input.path('lib/bar-foo'),
              includeTestsInHost: true,
            },
          ],
        },
      ],
      name: 'foo-app',
    };

    const node = addInRepoTestsToHost(
      project,
      (addon) => addon.includeTestsInHost
    );
    const output = await buildOutput(node);
    expect(output.read()).to.deep.equal({
      foo: {
        unit: {
          'foo-test.js': `console.log('foo-test')`,
        },
      },
      'bar-foo': {
        unit: {
          'bar-foo-test.js': `console.log('bar-foo-test')`,
        },
      },
      unit: {
        'foo-test.js': `console.log('hello world')`,
      },
    });

    input.dispose();
  });

  it('detects nested addon even if parent addon does not match predicate', async () => {
    const input = await createTempDir();

    input.write({
      'package.json': `foo`,
      'README.md': 'lol',
      'ember-cli-build.js': 'bar',
      lib: {
        foo: {
          'index.js': `module.exports = { name: 'foo' }`,
          'package.json': `in-repo package.json`,
        },
        'bar-foo': {
          'index.js': `module.exports = { name: 'bar-foo', includeTestsInHost: true }`,
          'package.json': `in-repo package.json`,
          tests: {
            unit: {
              'bar-foo-test.js': `console.log('bar-foo-test')`,
            },
          },
        },
      },
      tests: {
        unit: {
          'foo-test.js': `console.log('hello world')`,
        },
      },
    });

    const project = {
      root: input.path(),
      addons: [
        {
          name: 'foo',
          root: input.path('lib/foo'),
          addons: [
            {
              name: 'bar-foo',
              root: input.path('lib/bar-foo'),
              includeTestsInHost: true,
            },
          ],
        },
      ],
      name: 'foo-app',
    };

    const node = addInRepoTestsToHost(
      project,
      (addon) => addon.includeTestsInHost
    );
    const output = await buildOutput(node);

    expect(output.read()).to.deep.equal({
      'bar-foo': {
        unit: {
          'bar-foo-test.js': `console.log('bar-foo-test')`,
        },
      },
      unit: {
        'foo-test.js': `console.log('hello world')`,
      },
    });

    input.dispose();
  });

  it('does not duplicate test files even if addons share a common dependency', async () => {
    const input = await createTempDir();

    input.write({
      'package.json': `foo-app`,
      lib: {
        foo: {
          'index.js': `module.exports = { name: 'foo' }`,
          'package.json': `in-repo package.json`,
          tests: {
            unit: {
              'foo-test.js': `console.log('foo-test')`,
            },
          },
        },
        bar: {
          'index.js': `module.exports = { name: 'bar'}`,
          'package.json': `in-repo package.json`,
          tests: {
            unit: {
              'bar-test.js': `console.log('bar-test')`,
            },
          },
        },
        'common-addon': {
          'index.js': `module.exports = { name: 'common-addon'}`,
          'package.json': 'in-repo package.json',
          tests: {
            integration: {
              'common-addon-test.js': `console.log('common-addon-test')`,
            },
          },
        },
      },
    });

    const project = {
      root: input.path(),
      addons: [
        {
          name: 'foo',
          root: input.path('lib/foo'),
          includeTestsInHost: true,
          addons: [
            {
              name: 'common-addon',
              root: input.path('lib/common-addon'),
              includeTestsInHost: true,
            },
          ],
        },
        {
          name: 'bar',
          root: input.path('lib/bar'),
          includeTestsInHost: true,
          addons: [
            {
              name: 'common-addon',
              root: input.path('lib/common-addon'),
              includeTestsInHost: true,
            },
          ],
        },
      ],
      name: 'foo-app',
    };

    const node = addInRepoTestsToHost(
      project,
      (addon) => addon.includeTestsInHost
    );
    const output = await buildOutput(node);

    expect(output.read()).to.deep.equal({
      foo: {
        unit: {
          'foo-test.js': `console.log('foo-test')`,
        },
      },
      bar: {
        unit: {
          'bar-test.js': `console.log('bar-test')`,
        },
      },
      'common-addon': {
        integration: {
          'common-addon-test.js': `console.log('common-addon-test')`,
        },
      },
    });

    input.dispose();
  });
});
