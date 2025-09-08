#### dump

```bash
ppg_dump "postgresql://...?sslmode=require" \
  --data-only -Fc \
  -n public \
  -f data.dump
```

#### restore

```bash
ppg_restore "postgres://...?sslmode=require" \
  --data-only --disable-triggers \
  -j 4 data.dump
```
