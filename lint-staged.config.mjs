const config = {
  '*.{js,mjs,cjs,jsx,ts,tsx,json,jsonc,css}': ['biome check --write --no-errors-on-unmatched'],
  '*.{md,yml,yaml,html}': ['prettier --write'],
}

export default config
