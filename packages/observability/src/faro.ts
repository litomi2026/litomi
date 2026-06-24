/**
 * URLs the Faro browser tracing instrumentation (OTel `fetch` + `XHR`) must not
 * create spans for. Passed as `ignoreUrls` to `getDefaultOTELInstrumentations`.
 *
 * Why: the instrumentation opens a CLIENT span for every request and, per the
 * HTTP semantic conventions, marks any response >= 400 (or a failed/blocked
 * request) as span status `ERROR`. For third-party requests that is pure noise —
 * they cannot continue our distributed trace, and ad-blockers, CORS and flaky
 * mobile networks make analytics, ad, fingerprint and telemetry-collector
 * beacons fail constantly. In production these third-party CLIENT spans were the
 * overwhelming majority of errored traces (and a large share of trace ingest).
 *
 * Strategy: trace first-party origins only (`*.litomi.cc`); ignore everything
 * else. The Faro collector itself lives on `grafana.net`, so this also breaks the
 * self-instrumentation feedback loop. (Dev origins like localhost are ignored too;
 * `NEXT_PUBLIC_FARO_URL` is unset locally, so nothing is exported in dev anyway.)
 *
 * Note: a 4xx on a first-party CLIENT span is intentionally left as `ERROR` — that
 * is correct OTel semantics (a 4xx is a failure from the caller's perspective; the
 * server-side `@hono/otel` SERVER span keeps it `UNSET`). Reduce those by not
 * issuing the request (e.g. don't prefetch auth-gated routes), not by relabeling.
 */

/** Any absolute http(s) URL whose host is NOT a first-party origin. */
const NON_FIRST_PARTY_URL = /^https?:\/\/(?!([^/?#]*\.)?litomi\.cc([:/?#]|$))/i

/**
 * First-party image-proxy reads (`img.litomi.cc/i/...`): high volume, low value
 * for tracing — resource timing is already captured by the Performance
 * instrumentation. Preserves the original `/\/i\//` ignore rule.
 */
const IMAGE_PROXY_URL = /\/i\//

export const FARO_IGNORED_URLS: (RegExp | string)[] = [NON_FIRST_PARTY_URL, IMAGE_PROXY_URL]
