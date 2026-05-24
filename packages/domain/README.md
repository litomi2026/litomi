# @litomi/domain

`@litomi/domain` is the innermost package for Litomi's shared product language.

Keep this package pure:

- Domain models, enums, policies, sort/filter values, and deterministic helpers belong here.
- Prefer domain-owned paths such as `manga/policy`, `library/defaults`, or `notification/filter`; do not add a generic `constants` module.
- Framework, database, HTTP, environment, auth execution, crawler, notification delivery, and UI code do not belong here.
- Domain code may be imported by any package, so it must not import runtime-only boundaries such as Next.js, Drizzle, Redis, Hono, React, `server-only`, or env readers.

If a value describes a protocol or adapter detail, keep it with that adapter. Examples:

- API wire schemas live in `@litomi/contracts`.
- Pagination cursor parsing for persisted collections lives in `@litomi/db`.
- Cookie transport policy lives in `@litomi/http`.
- Browser storage and search-param keys live in the web app.
- Password hashing policy lives in `@litomi/auth`.
