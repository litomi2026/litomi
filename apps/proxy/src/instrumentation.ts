import { initBackendOtel } from './otel'

/*
  NOTE: OpenTelemetry는 반드시 다른 모든 모듈보다 먼저 시작해야 한다.
  `@hono/otel`의 httpInstrumentationMiddleware()는 미들웨어 생성(= app.ts의 app.use) 시점에 트레이서를 즉시 resolve하는데,
  그때 SDK가 아직 시작되지 않았으면 no-op 트레이서로 고정되어 이후 등록되는 provider로 복구되지 않아 모든 스팬이 export되지 않는다.
  따라서 이 모듈을 server.ts의 최상단 import로 두어 `./app`보다 먼저 실행시킨다.
*/
initBackendOtel()
