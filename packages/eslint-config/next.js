/** @type {import('eslint').Linter.Config} */
const base = require('./index.js');
module.exports = [...base, { rules: { 'no-console': 'off' } }];
