const path = require('path');
const { existsSync } = require('fs');
const { WatchedDir } = require('broccoli-source');
const { MergeTrees } = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');
const flattenAddons = require('./flatten-addons');

const DEFAULT_PROCESS_TESTS = (_path) => _path;

const generateTreeFromPath = (path, processTests) =>
  existsSync(path) ? processTests(new WatchedDir(path)) : null;

const getInRepoAddonTestTrees = (inRepoAddons, processTests) => {
  if (inRepoAddons.length === 0) {
    return [null];
  }

  return inRepoAddons.map((inRepoAddon) => {
    const inRepoAddonTestPath = `${inRepoAddon.root}/tests`;

    return existsSync(inRepoAddonTestPath)
      ? new Funnel(processTests(inRepoAddonTestPath), {
          destDir: path.join('ember-add-in-repo-tests', inRepoAddon.name),
        })
      : null;
  });
};

module.exports = (options) => {
  const { project, shouldIncludeTestsInHost } = options;
  let processTests = options.processTests || DEFAULT_PROCESS_TESTS;

  if (!project || !project.root) {
    return null;
  }

  const flattenedAddons = flattenAddons(project.addons);
  // we need flattenedAddons to be a unique set, otherwise tests get overriden
  // if two addons have a common dependency
  const uniqueFlattenedAddons = flattenedAddons.filter(
    (flattenedAddon, index, allAddons) =>
      allAddons.findIndex((addon) => addon.name === flattenedAddon.name) ===
      index
  );

  const projectTestsPath = path.join(project.root, 'tests');
  const inRepoAddons = uniqueFlattenedAddons.filter(shouldIncludeTestsInHost);
  const inRepoAddonsTestTrees = getInRepoAddonTestTrees(
    inRepoAddons,
    processTests
  );

  return new MergeTrees(
    [
      ...inRepoAddonsTestTrees,
      generateTreeFromPath(projectTestsPath, processTests),
    ].filter(Boolean)
  );
};
