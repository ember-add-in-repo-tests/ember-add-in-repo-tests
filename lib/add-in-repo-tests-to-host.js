const path = require('path');
const { existsSync } = require('fs');
const { WatchedDir } = require('broccoli-source');
const mergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');
const flattenAddons = require('./flatten-addons');

const generateTreeFromPath = path =>
  existsSync(path) ? new WatchedDir(path) : null;

const getInRepoAddonTestTrees = inRepoAddons => {
  if (inRepoAddons.length === 0) {
    return [null];
  }

  return inRepoAddons.map(inRepoAddon => {
    const inRepoAddonTestPath = `${inRepoAddon.root}/tests`;

    return existsSync(inRepoAddonTestPath)
      ? new Funnel(inRepoAddonTestPath, { destDir: inRepoAddon.name })
      : null;
  });
};

module.exports = (emberProject, predicate) => {
  if (!emberProject || !emberProject.root) {
    return null;
  }

  const flattenedAddons = flattenAddons(emberProject.addons);
  // we need flattenedAddons to be a unique set, otherwise tests get overriden
  // if two addons have a common dependency
  const uniqueFlattenedAddons = flattenedAddons.filter(
    (flattenedAddon, index, allAddons) =>
      allAddons.findIndex(addon => addon.name === flattenedAddon.name) === index
  );

  const projectTestsPath = path.join(emberProject.root, 'tests');
  const inRepoAddons = uniqueFlattenedAddons.filter(predicate);
  const inRepoAddonsTestTrees = getInRepoAddonTestTrees(inRepoAddons);

  return mergeTrees(
    [...inRepoAddonsTestTrees, generateTreeFromPath(projectTestsPath)].filter(
      Boolean
    )
  );
};
