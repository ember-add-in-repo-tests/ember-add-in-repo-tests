/**
 * the given data structure is similar to
 *
 * {
 *   name: '...',
 *   addons: [{
 *     name: '...',
 *     addons: [{
 *
 *     }]
 *   }]
 * }
 *
 * We need to recursively fetch the `addons` and return a single array of addons
 */

const flattenAddonModel = (addon) => {
  if (!addon || Object.keys(addon).length === 0) {
    return [];
  } else if (!addon.addons || addon.addons.length === 0) {
    return [addon];
  }

  const childAddons = addon.addons.map(flattenAddonModel);
  return [].concat(addon, ...childAddons);
};

const flattenAddons = (addons) => {
  if (!addons || addons.length === 0) {
    return [];
  }

  return [].concat(...addons.map(flattenAddonModel));
};

module.exports = flattenAddons;
