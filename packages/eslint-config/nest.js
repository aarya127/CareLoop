/** @type {import('eslint').Linter.Config} */
const base = require('./index.js');
module.exports = [
  ...base,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // decorators often need any
    },
  },
];
