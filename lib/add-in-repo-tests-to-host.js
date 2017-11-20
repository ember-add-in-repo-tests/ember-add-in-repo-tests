const path = require('path');
const { existsSync } = require('fs');
const { WatchedDir } = require('broccoli-source');
const mergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');

const generateTreeFromPath = path =>
  existsSync(path) ? new WatchedDir(path) : null;

const getInRepoAddonTestTrees = inRepoAddons =>
  inRepoAddons.map(inRepoAddon => {
    const inRepoAddonTestPath = `${inRepoAddon.root}/tests`;
    return existsSync(inRepoAddonTestPath)
      ? new Funnel(inRepoAddonTestPath, { destDir: inRepoAddon.name })
      : null;
  });

module.exports = (emberProject, predicate) => {
  if (!emberProject || !emberProject.root) {
    return null;
  }

  const projectTestsPath = path.join(emberProject.root, 'tests');
  const inRepoAddons = emberProject.addons.filter(predicate);
  const inRepoAddonsTestTrees = getInRepoAddonTestTrees(inRepoAddons);

  return mergeTrees(
    [...inRepoAddonsTestTrees, generateTreeFromPath(projectTestsPath)].filter(
      Boolean
    )
  );
};
