# Vault seed templates

This directory stores example files used by `./k8s/platform-ops.sh --mode init`.

- Copy each `*.env.example` to `*.env`.
- Fill every value with real secrets before running the script.
- Keep `*.env` and referenced files private (they are ignored by git).
- For multiline values, wrap in double quotes and use `\n` escapes.

Quick start:

```zsh
find k8s/vault-secrets -type f -name '*.env.example' | while read -r f; do
  cp -n "$f" "${f%.example}"
done
```

Then edit the generated `*.env` files.
