module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  env: {
    browser: true,
    node: true,
    es6: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    // Ajuste as regras conforme necessidade, por exemplo:
    'no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'off'
  },
  ignorePatterns: ['dist/', 'wwwroot/js/']
};
