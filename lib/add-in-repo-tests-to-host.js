const path = require('path');
const { existsSync } = require('fs');
const { WatchedDir } = require('broccoli-source');
const { MergeTrees } = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');
const flattenAddons = require('./flatten-addons');

const DEFAULT_PROCESS_TESTS = (_path) => _path;

const generateTreeFromPath = (path, processTests) =>
  existsSync(path) ? processTests(new WatchedDir(path)) : null;

const getInRepoAddonTestTrees = ({
  inRepoAddons,
  projectRoot,
  processTests,
}) => {
  if (inRepoAddons.length === 0) {
    return [null];
  }

  return inRepoAddons.map((inRepoAddon) => {
    const absoluteInRepoAddonTestsPath = `${inRepoAddon.root}/tests`;
    const relativeInRepoAddonTestsPath = path.relative(
      projectRoot,
      absoluteInRepoAddonTestsPath
    );

    return existsSync(absoluteInRepoAddonTestsPath)
      ? new Funnel(processTests(absoluteInRepoAddonTestsPath), {
          destDir: path.join(
            'ember-add-in-repo-tests',
            relativeInRepoAddonTestsPath
          ),
        })
      : null;
  });
};

module.exports = (options) => {
  let { project, projectRoot, shouldIncludeTestsInHost } = options;
  let processTests = options.processTests || DEFAULT_PROCESS_TESTS;

  if (!project || !project.root) {
    return null;
  }

  projectRoot = projectRoot || project.root;

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
  const inRepoAddonsTestTrees = getInRepoAddonTestTrees({
    inRepoAddons,
    projectRoot,
    processTests,
  });

  return new MergeTrees(
    [
      ...inRepoAddonsTestTrees,
      generateTreeFromPath(projectTestsPath, processTests),
    ].filter(Boolean)
  );
};
