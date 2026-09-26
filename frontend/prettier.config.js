/** @type {import("prettier").Config} */

module.exports = {
  printWidth: 100,
  singleQuote: true,
  jsxSingleQuote: true,
  trailingComma: 'all',
  semi: true,
  tabWidth: 2,
  arrowParens: 'always',
  bracketSpacing: true,
  bracketSameLine: false,
  endOfLine: 'lf',

  plugins: [require.resolve('prettier-plugin-organize-imports')],
};
