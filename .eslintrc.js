module.exports = {
  extends: ['@nutol/eslint-config/eslintrc.js', 'plugin:prettier/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['import', 'simple-import-sort', 'react', '@typescript-eslint', 'prettier'],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',
        'import/first': 'error',
        'import/newline-after-import': 'error',
        'import/no-duplicates': 'error',
        'prettier/prettier': 'off',
        '@typescript-eslint/naming-convention': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-misused-promises': [
          'error',
          {
            checksVoidReturn: false,
          },
        ],
      },
    },
    {
      files: ['**/__tests__/**/*.ts'],
      rules: {
        '@typescript-eslint/no-shadow': 'off',
      },
    },
  ],
};
