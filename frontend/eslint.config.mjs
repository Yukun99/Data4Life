import nx from '@nx/eslint-plugin';

const layer = (group, message) => ({ group, message });

const NO_PAGES = layer(['@/pages/**'], 'Only app/ and pages/ may import from pages/.');
const NO_FEATURES = layer(['@/features/**'], 'Only app/ and pages/ may import from features/.');
const NO_APP = layer(['@/app/**'], 'Only the app shell may import from app/.');
const NO_STORE = layer(['@/store/**'], 'common/ must not import from store/.');

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  ...nx.configs['flat/react'],
  {
    ignores: [
      '**/dist',
      '**/out-tsc',
      '**/test-output',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    settings: {
      'import/resolver': { typescript: { project: import.meta.dirname + '/tsconfig.app.json' } },
      'import/extensions': ['.ts', '.tsx'],
      'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
    },
    rules: { 'import/no-cycle': 'error' },
  },
  {
    files: ['src/common/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [NO_APP, NO_FEATURES, NO_PAGES, NO_STORE] }],
    },
  },
  {
    files: ['src/store/**'],
    rules: { 'no-restricted-imports': ['error', { patterns: [NO_APP, NO_FEATURES, NO_PAGES] }] },
  },
  {
    files: ['src/features/**'],
    rules: { 'no-restricted-imports': ['error', { patterns: [NO_APP, NO_PAGES] }] },
  },
  {
    files: ['src/pages/**'],
    rules: { 'no-restricted-imports': ['error', { patterns: [NO_APP] }] },
  },
];
