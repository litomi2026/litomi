const config = {
  '*.{js,mjs,cjs,jsx,ts,tsx,json,jsonc}': ['biome check --write --no-errors-on-unmatched'],
  '*.{css,md,yml,yaml,html}': ['prettier --write'],
}

export default config
