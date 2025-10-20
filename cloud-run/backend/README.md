To install dependencies:

```sh
bun install
```

To run:

```sh
bun run dev
```

open http://localhost:3000

```sh
cd litomi
docker build . -t litomi-backend -f cloud-run/backend/Dockerfile
docker run -e PORT=4000 -p 4000:4000 --rm litomi-backend:latest
```
