module.exports = {
  root: true,
  env: {
    browser: false,
    node: true,
    es6: true,
  },
  plugins: ['node', 'jest', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:jest/recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['test/**/*.js'],
      env: {
        jest: true,
      },
    },
  ],
};
