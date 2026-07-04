// API 에러의 단일 소스. 하나의 코드 = 하나의 problem type.
//
// - `slug`  : 응답 `type` URL(`https://<origin>/problems/<slug>`)의 식별자이자 웹이 로케일 카피로 변환하는 키.
// - `status`: 이 코드의 표준 HTTP status. 발생 지점에서 override 할 수 있다(드묾).
// - `title` : 코드(type)당 1개의 dev-facing 한국어 요약. 발생 건마다 바뀌지 않는다(RFC 9457).
//             사용자에게 표시하지 않는다 — 사용자 카피는 웹이 slug로 변환한다.
//
// 발생 건별 진단(동적 값·generic 분기 설명)은 응답 `detail`에 싣는다. title 은 여기서만 정의한다.
export type ProblemSpec = {
  slug: string
  status: number
  title: string
}

export const PROBLEM = {
  // --- generic HTTP status (코드 없이 status만 던지는 응답의 canonical type) ---
  BAD_REQUEST: {
    slug: 'bad-request',
    status: 400,
    title: '잘못된 요청이에요',
  },
  UNAUTHORIZED: {
    slug: 'unauthorized',
    status: 401,
    title: '로그인이 필요해요',
  },
  FORBIDDEN: {
    slug: 'forbidden',
    status: 403,
    title: '권한이 없어요',
  },
  NOT_FOUND: {
    slug: 'not-found',
    status: 404,
    title: '찾을 수 없어요',
  },
  REQUEST_TIMEOUT: {
    slug: 'request-timeout',
    status: 408,
    title: '요청 시간이 초과됐어요',
  },
  CONFLICT: {
    slug: 'conflict',
    status: 409,
    title: '요청이 충돌했어요',
  },
  TOO_MANY_REQUESTS: {
    slug: 'too-many-requests',
    status: 429,
    title: '요청이 너무 많아요',
  },
  CLIENT_ABORTED: {
    slug: 'client-aborted',
    status: 499,
    title: '요청이 취소됐어요',
  },
  SERVER_ERROR: {
    slug: 'internal-server-error',
    status: 500,
    title: '서버 오류가 발생했어요',
  },
  BAD_GATEWAY: {
    slug: 'bad-gateway',
    status: 502,
    title: '외부 서비스 오류예요',
  },
  SERVICE_UNAVAILABLE: {
    slug: 'service-unavailable',
    status: 503,
    title: '서비스를 사용할 수 없어요',
  },
  GATEWAY_TIMEOUT: {
    slug: 'gateway-timeout',
    status: 504,
    title: '게이트웨이 시간이 초과됐어요',
  },

  // --- 공통 게이트/검증 ---
  ADULT_VERIFICATION_REQUIRED: {
    slug: 'adult-verification-required',
    status: 403,
    title: '성인인증이 필요해요',
  },
  AUTHENTICATION_REQUIRED: {
    slug: 'authentication-required',
    status: 401,
    title: '로그인 정보가 없거나 만료됐어요',
  },
  INVALID_INPUT: {
    slug: 'invalid-input',
    status: 400,
    title: '입력을 확인해 주세요',
  },
  LIBO_EXPANSION_REQUIRED: {
    slug: 'libo-expansion-required',
    status: 403,
    title: '저장 한도에 도달했어요',
  },
  TURNSTILE_REQUIRED: {
    slug: 'turnstile-required',
    status: 400,
    title: '보안 검증을 완료해 주세요',
  },

  // --- auth / account ---
  BBATON_ALREADY_LINKED: {
    slug: 'bbaton-already-linked',
    status: 409,
    title: '이미 다른 계정에 연결된 비바톤 계정이에요',
  },
  CREDENTIAL_VERIFICATION_FAILED: {
    slug: 'credential-verification-failed',
    status: 400,
    title: '인증 정보가 일치하지 않아요',
  },
  CURRENT_SESSION_NOT_REMOVABLE: {
    slug: 'current-session-not-removable',
    status: 400,
    title: '지금 사용 중인 기기는 여기서 로그아웃할 수 없어요',
  },
  HUMAN_VERIFICATION_FAILED: {
    slug: 'human-verification-failed',
    status: 400,
    title: '보안 확인에 실패했어요',
  },
  INVALID_CREDENTIALS: {
    slug: 'invalid-credentials',
    status: 401,
    title: '아이디 또는 비밀번호가 일치하지 않아요',
  },
  LOGIN_CHALLENGE_EXPIRED: {
    slug: 'login-challenge-expired',
    status: 401,
    title: '인증이 만료됐어요. 새로고침 후 다시 시도해 주세요',
  },
  LOGIN_ID_CONFLICT: {
    slug: 'login-id-conflict',
    status: 409,
    title: '이미 사용 중인 아이디예요',
  },
  NAME_CONFLICT: {
    slug: 'name-conflict',
    status: 409,
    title: '이미 사용 중인 이름이에요',
  },
  PASSKEY_LIMIT_REACHED: {
    slug: 'passkey-limit-reached',
    status: 400,
    title: '패스키를 더 등록할 수 없어요',
  },
  PASSKEY_VERIFICATION_FAILED: {
    slug: 'passkey-verification-failed',
    status: 400,
    title: '패스키를 검증할 수 없어요',
  },
  PASSWORD_SAME_AS_CURRENT: {
    slug: 'password-same-as-current',
    status: 400,
    title: '현재 비밀번호와 새 비밀번호가 같아요',
  },
  TWO_FACTOR_ALREADY_ENABLED: {
    slug: 'two-factor-already-enabled',
    status: 409,
    title: '이미 2단계 인증이 활성화되어 있어요',
  },
  TWO_FACTOR_NOT_ENABLED: {
    slug: 'two-factor-not-enabled',
    status: 404,
    title: '활성화된 2단계 인증이 없어요',
  },
  TWO_FACTOR_SETUP_EXPIRED: {
    slug: 'two-factor-setup-expired',
    status: 403,
    title: '2단계 인증 설정이 만료됐어요',
  },
  TWO_FACTOR_TOKEN_INVALID: {
    slug: 'two-factor-token-invalid',
    status: 400,
    title: '인증 코드를 확인해 주세요',
  },
  VERIFICATION_ATTEMPT_EXPIRED: {
    slug: 'verification-attempt-expired',
    status: 400,
    title: '인증 시도가 만료됐어요. 다시 시도해 주세요',
  },

  // --- library ---
  CENSORSHIP_LIMIT_REACHED: {
    slug: 'censorship-limit-reached',
    status: 400,
    title: '검열 규칙 한도에 도달했어요',
  },
  LIBRARY_FULL: {
    slug: 'library-full',
    status: 403,
    title: '서재가 가득 찼어요',
  },
  LIBRARY_ITEM_CONFLICT: {
    slug: 'library-item-conflict',
    status: 403,
    title: '이미 서재에 있는 작품이에요',
  },
  LIBRARY_ITEMS_MISSING: {
    slug: 'library-items-missing',
    status: 403,
    title: '작품을 찾을 수 없어요',
  },
  OWN_LIBRARY_PIN: {
    slug: 'own-library-pin',
    status: 400,
    title: '본인의 서재는 고정할 수 없어요',
  },
  PRIVATE_LIBRARY_PIN: {
    slug: 'private-library-pin',
    status: 403,
    title: '비공개 서재는 고정할 수 없어요',
  },

  // --- notification ---
  NOTIFICATION_CRITERIA_CONFLICT: {
    slug: 'notification-criteria-conflict',
    status: 409,
    title: '이미 같은 키워드 알림이 있어요',
  },
  NOTIFICATION_CRITERIA_LIMIT_REACHED: {
    slug: 'notification-criteria-limit-reached',
    status: 403,
    title: '키워드 알림 한도에 도달했어요',
  },

  // --- points (libo) ---
  AD_COOLDOWN: {
    slug: 'ad-cooldown',
    status: 429,
    title: '같은 광고는 잠시 후 다시 적립할 수 있어요',
  },
  DAILY_EARN_LIMIT_REACHED: {
    slug: 'daily-earn-limit-reached',
    status: 429,
    title: '오늘의 적립 한도에 도달했어요',
  },
  DONATION_AMOUNT_TOO_SMALL: {
    slug: 'donation-amount-too-small',
    status: 400,
    title: '후원 금액이 너무 적어요',
  },
  DONATION_DUPLICATE_TARGET: {
    slug: 'donation-duplicate-target',
    status: 400,
    title: '후원 대상이 중복돼요',
  },
  EXPANSION_MAXED: {
    slug: 'expansion-maxed',
    status: 400,
    title: '최대 확장에 도달했어요',
  },
  INSUFFICIENT_POINTS: {
    slug: 'insufficient-points',
    status: 400,
    title: '리보가 부족해요',
  },
  ITEM_ALREADY_OWNED: {
    slug: 'item-already-owned',
    status: 400,
    title: '이미 보유한 아이템이에요',
  },

  // --- chat (sobok) ---
  ARTIST_PROFILE_EXISTS: {
    slug: 'artist-profile-exists',
    status: 409,
    title: '이미 아티스트 프로필이 있어요',
  },
  HANDLE_CONFLICT: {
    slug: 'handle-conflict',
    status: 409,
    title: '이미 사용 중인 핸들이에요',
  },
  MESSAGE_SEND_FAILED: {
    slug: 'message-send-failed',
    status: 503,
    title: '메시지를 보내지 못했어요. 잠시 후 다시 시도해 주세요',
  },
  REFUND_FORFEITED_BY_REPLY: {
    slug: 'refund-forfeited-by-reply',
    status: 403,
    title: '이번 결제 기간에 답장을 보내서 환불할 수 없어요',
  },
  REFUND_INCOMPLETE: {
    slug: 'refund-incomplete',
    status: 402,
    title: '환불이 완료되지 않았어요. 잠시 후 다시 시도해 주세요',
  },
  REFUND_NO_PAYMENT: {
    slug: 'refund-no-payment',
    status: 400,
    title: '환불할 결제가 없어요',
  },
  REFUND_WINDOW_EXPIRED: {
    slug: 'refund-window-expired',
    status: 403,
    title: '결제 후 7일이 지나 환불할 수 없어요',
  },
  REPLY_LIMIT_REACHED: {
    slug: 'reply-limit-reached',
    status: 403,
    title: '이 메시지에 보낼 수 있는 답장 횟수를 모두 사용했어요',
  },
  REPLY_TOO_LONG: {
    slug: 'reply-too-long',
    status: 403,
    title: '답장 글자 수 한도를 넘었어요',
  },

  // --- billing ---
  PAYMENT_FAILED: {
    slug: 'payment-failed',
    status: 402,
    title: '결제에 실패했어요. 카드 상태를 확인한 뒤 다시 시도해 주세요',
  },
  PAYMENT_METHOD_CONFLICT: {
    slug: 'payment-method-conflict',
    status: 409,
    title: '이미 다른 계정에 등록된 결제수단이에요',
  },
  PAYMENT_METHOD_NOT_FOUND: {
    slug: 'payment-method-not-found',
    status: 400,
    title: '결제수단을 찾을 수 없어요',
  },
  RECEIPT_NOT_READY: {
    slug: 'receipt-not-ready',
    status: 404,
    title: '영수증이 아직 준비되지 않았어요',
  },
} as const satisfies Record<string, ProblemSpec>

export type ProblemCode = keyof typeof PROBLEM
export type ProblemSlug = (typeof PROBLEM)[ProblemCode]['slug']

const SPEC_BY_STATUS: Partial<Record<number, ProblemSpec>> = {
  400: PROBLEM.BAD_REQUEST,
  401: PROBLEM.UNAUTHORIZED,
  403: PROBLEM.FORBIDDEN,
  404: PROBLEM.NOT_FOUND,
  408: PROBLEM.REQUEST_TIMEOUT,
  409: PROBLEM.CONFLICT,
  429: PROBLEM.TOO_MANY_REQUESTS,
  499: PROBLEM.CLIENT_ABORTED,
  500: PROBLEM.SERVER_ERROR,
  502: PROBLEM.BAD_GATEWAY,
  503: PROBLEM.SERVICE_UNAVAILABLE,
  504: PROBLEM.GATEWAY_TIMEOUT,
}

/** 코드 없이 status만 던질 때의 canonical spec. 알 수 없는 status는 4xx→BAD_REQUEST, 그 외→SERVER_ERROR. */
export function genericProblemByStatus(status: number): ProblemSpec {
  const spec = SPEC_BY_STATUS[status]

  if (spec) {
    return spec
  }

  return status >= 400 && status < 500 ? PROBLEM.BAD_REQUEST : PROBLEM.SERVER_ERROR
}

// 필드 레벨 검증 코드 — 응답 `invalidParams[].code`이자 웹이 필드 카피로 변환하는 키.
// 표준 Zod 이슈 코드와 스키마 refine 의 `params.code`를 한곳에 열거한다(응답 레벨 PROBLEM 과 다른 축).
export const INVALID_PARAM = {
  // 표준 Zod (수량 → ICU 인터폴레이션 대상)
  TOO_SMALL: 'too_small',
  TOO_BIG: 'too_big',
  INVALID_TYPE: 'invalid_type',
  INVALID_FORMAT: 'invalid_format',
  // 스키마 refine (params.code)
  DATE_RANGE_INVERTED: 'date-range-inverted',
  DATE_RANGE_TOO_LONG: 'date-range-too-long',
  DUPLICATE_CONDITION: 'duplicate-condition',
  HANDLE_RESERVED: 'handle-reserved',
  INVALID_DATE: 'invalid-date',
  INVALID_PROTOCOL: 'invalid-protocol',
  INVALID_SEARCH_LANGUAGE: 'invalid-search-language',
  PASSWORD_CONFIRM_MISMATCH: 'password-confirm-mismatch',
  PASSWORD_EQUALS_LOGIN_ID: 'password-equals-login-id',
  PRICE_BELOW_MINIMUM: 'price-below-minimum',
} as const

export type InvalidParamCode = (typeof INVALID_PARAM)[keyof typeof INVALID_PARAM]
