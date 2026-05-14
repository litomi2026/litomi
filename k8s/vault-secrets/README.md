# Vault seed templates

This directory stores example files used by `./k8s/platform-ops.sh`.

- Copy each `*.env.example` to `*.env`.
- Fill every value with real secrets before running the script.
- Keep `*.env` and referenced files private (they are ignored by git).
- For multiline values, wrap in double quotes and use `\n` escapes.
