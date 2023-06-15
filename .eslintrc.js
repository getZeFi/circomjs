module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
  },
  rules: { '@typescript-eslint/no-explicit-any': 'off' },
  ignorePatterns: ['node_modules', 'dist', 'data', 'build', 'src/vendors'],
};
