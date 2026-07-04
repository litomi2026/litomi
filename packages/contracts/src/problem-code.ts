// API 전체 problem code 카탈로그 — 응답 `type` URL의 slug이자 웹이 로케일 카피로 변환하는 키.
// 명시적으로 부여하는 코드만 등재한다. status에서 자동 파생되는 generic slug(bad-request 등)는
// @litomi/http/problem-details 내부 테이블 소관이라 두 집합은 겹치지 않는다.
export const problemCode = {
  // --- 공통 게이트/검증 ---
  ADULT_VERIFICATION_REQUIRED: 'adult-verification-required',
  AUTHENTICATION_REQUIRED: 'authentication-required',
  INVALID_INPUT: 'invalid-input',
  LIBO_EXPANSION_REQUIRED: 'libo-expansion-required',
  TURNSTILE_REQUIRED: 'turnstile-required',

  // --- auth / account ---
  BBATON_ALREADY_LINKED: 'bbaton-already-linked',
  CREDENTIAL_VERIFICATION_FAILED: 'credential-verification-failed',
  CURRENT_SESSION_NOT_REMOVABLE: 'current-session-not-removable',
  HUMAN_VERIFICATION_FAILED: 'human-verification-failed',
  INVALID_CREDENTIALS: 'invalid-credentials',
  LOGIN_CHALLENGE_EXPIRED: 'login-challenge-expired',
  LOGIN_ID_CONFLICT: 'login-id-conflict',
  NAME_CONFLICT: 'name-conflict',
  PASSKEY_LIMIT_REACHED: 'passkey-limit-reached',
  PASSKEY_VERIFICATION_FAILED: 'passkey-verification-failed',
  PASSWORD_SAME_AS_CURRENT: 'password-same-as-current',
  TWO_FACTOR_ALREADY_ENABLED: 'two-factor-already-enabled',
  TWO_FACTOR_NOT_ENABLED: 'two-factor-not-enabled',
  TWO_FACTOR_SETUP_EXPIRED: 'two-factor-setup-expired',
  TWO_FACTOR_TOKEN_INVALID: 'two-factor-token-invalid',
  VERIFICATION_ATTEMPT_EXPIRED: 'verification-attempt-expired',

  // --- library ---
  CENSORSHIP_LIMIT_REACHED: 'censorship-limit-reached',
  LIBRARY_FULL: 'library-full',
  LIBRARY_ITEM_CONFLICT: 'library-item-conflict',
  LIBRARY_ITEMS_MISSING: 'library-items-missing',
  OWN_LIBRARY_PIN: 'own-library-pin',
  PRIVATE_LIBRARY_PIN: 'private-library-pin',

  // --- notification ---
  NOTIFICATION_CRITERIA_CONFLICT: 'notification-criteria-conflict',
  NOTIFICATION_CRITERIA_LIMIT_REACHED: 'notification-criteria-limit-reached',

  // --- points (libo) ---
  AD_COOLDOWN: 'ad-cooldown',
  DAILY_EARN_LIMIT_REACHED: 'daily-earn-limit-reached',
  DONATION_AMOUNT_TOO_SMALL: 'donation-amount-too-small',
  DONATION_DUPLICATE_TARGET: 'donation-duplicate-target',
  EXPANSION_MAXED: 'expansion-maxed',
  INSUFFICIENT_POINTS: 'insufficient-points',
  ITEM_ALREADY_OWNED: 'item-already-owned',

  // --- chat (sobok) ---
  ARTIST_PROFILE_EXISTS: 'artist-profile-exists',
  HANDLE_CONFLICT: 'handle-conflict',
  MESSAGE_SEND_FAILED: 'message-send-failed',
  REFUND_FORFEITED_BY_REPLY: 'refund-forfeited-by-reply',
  REFUND_INCOMPLETE: 'refund-incomplete',
  REFUND_NO_PAYMENT: 'refund-no-payment',
  REFUND_WINDOW_EXPIRED: 'refund-window-expired',
  REPLY_LIMIT_REACHED: 'reply-limit-reached',
  REPLY_TOO_LONG: 'reply-too-long',

  // --- billing ---
  PAYMENT_FAILED: 'payment-failed',
  PAYMENT_METHOD_CONFLICT: 'payment-method-conflict',
  PAYMENT_METHOD_NOT_FOUND: 'payment-method-not-found',
  RECEIPT_NOT_READY: 'receipt-not-ready',
} as const
