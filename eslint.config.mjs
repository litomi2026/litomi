// @ts-check

import { FlatCompat } from '@eslint/eslintrc';
import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import perfectionist from 'eslint-plugin-perfectionist';
import { dirname } from 'path';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  perfectionist.configs['recommended-natural'],
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  { ignores: ['.next'] },
  {
    rules: {
      'perfectionist/sort-enums': 'off',
      'perfectionist/sort-object-types': 'off',
      'perfectionist/sort-objects': 'off',
    },
  },
  eslintConfigPrettier,
);
