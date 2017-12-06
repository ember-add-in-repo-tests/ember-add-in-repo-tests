const path = require('path');
const { existsSync } = require('fs');
const { WatchedDir } = require('broccoli-source');
const mergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');

const generateTreeFromPath = path =>
  existsSync(path) ? new WatchedDir(path) : null;

const getInRepoAddonTestTrees = (inRepoAddons, predicate) => {
  if (inRepoAddons.length === 0) {
    return [null];
  }

  return inRepoAddons.map(inRepoAddon => {
    const inRepoAddonTestPath = `${inRepoAddon.root}/tests`;
    const nestedAddons = inRepoAddon.addons || [];
    const nestedAddonsTestTrees = getInRepoAddonTestTrees(
      nestedAddons.filter(predicate),
      predicate
    );

    const inRepoAddonTestTree = existsSync(inRepoAddonTestPath)
      ? new Funnel(inRepoAddonTestPath, { destDir: inRepoAddon.name })
      : null;

    return mergeTrees(
      [inRepoAddonTestTree, ...nestedAddonsTestTrees].filter(Boolean)
    );
  });
};

module.exports = (emberProject, predicate) => {
  if (!emberProject || !emberProject.root) {
    return null;
  }

  const projectTestsPath = path.join(emberProject.root, 'tests');
  const inRepoAddons = emberProject.addons.filter(predicate);
  const inRepoAddonsTestTrees = getInRepoAddonTestTrees(
    inRepoAddons,
    predicate
  );

  return mergeTrees(
    [...inRepoAddonsTestTrees, generateTreeFromPath(projectTestsPath)].filter(
      Boolean
    )
  );
};
