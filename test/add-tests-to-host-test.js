'use strict';

const { assert, expect } = require('chai');
const { createTempDir, buildOutput } = require('broccoli-test-helper');

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
      addon => addon.includeTestsInHost
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
      addon => addon.includeTestsInHost
    );
    const output = await buildOutput(node);

    expect(output.read()).to.deep.equal({
      unit: { 'foo-test.js': `console.log('hello world')` },
    });

    input.dispose();
  });
});
