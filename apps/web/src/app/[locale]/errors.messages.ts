import type { InvalidParamCode, ProblemSlug } from '@litomi/contracts'

import { Locale } from '@litomi/domain/locale'

import type { LocalizedMessages } from '@/i18n/messages'

// 에러 카탈로그 — 서버가 보내는 machine code(problem type slug / invalidParams[].code)를 사용자 로케일 카피로 변환한다.
// - problem: 응답 레벨(type). Record<ProblemSlug> 이라 @litomi/contracts PROBLEM 에 코드를 추가하면 누락이 컴파일 에러로 잡힌다.
// - field  : 필드 레벨(invalidParams[].code). 수량 코드(too_small/too_big)만 ICU 인터폴레이션({min}/{max})을 쓴다.
// - status : ProblemDetails 가 아닌 에러(네트워크/알 수 없음)용 fallback. 나머지 status 카피는 problem 의 generic slug 가 담당.
type ErrorCatalog = {
  status: { offline: string; serverError: string }
  toast: { adultRecommended: string; liboExpansionRequired: string; liboExpansionAction: string }
  problem: Record<ProblemSlug, string>
  field: Record<InvalidParamCode, string>
}

const ko: ErrorCatalog = {
  status: {
    offline: '네트워크 연결을 확인해 주세요',
    serverError: '요청 처리 중 오류가 발생했어요',
  },
  toast: {
    adultRecommended: '성인인증 시 광고가 제거돼요',
    liboExpansionRequired: '저장 한도에 도달했어요',
    liboExpansionAction: '확장',
  },
  problem: {
    'bad-request': '잘못된 요청이에요',
    unauthorized: '로그인이 필요해요',
    forbidden: '권한이 없어요',
    'not-found': '대상을 찾을 수 없어요',
    'request-timeout': '요청 시간이 초과됐어요',
    conflict: '요청이 처리 중 충돌했어요',
    'too-many-requests': '요청이 너무 많아요. 잠시 후 다시 시도해 주세요',
    'client-aborted': '요청이 취소됐어요',
    'internal-server-error': '요청 처리 중 오류가 발생했어요',
    'bad-gateway': '외부 서비스에 문제가 있어요',
    'service-unavailable': '서비스를 잠시 사용할 수 없어요',
    'gateway-timeout': '응답 시간이 초과됐어요',
    'adult-verification-required': '성인인증이 필요해요',
    'authentication-required': '로그인이 필요해요',
    'invalid-input': '입력을 확인해 주세요',
    'libo-expansion-required': '저장 한도에 도달했어요',
    'turnstile-required': '보안 검증을 완료해 주세요',
    'ad-cooldown': '같은 광고는 잠시 후 다시 적립할 수 있어요',
    'artist-profile-exists': '이미 아티스트 프로필이 있어요',
    'bbaton-already-linked': '이미 다른 계정에 연결된 비바톤 계정이에요',
    'censorship-limit-reached': '검열 규칙 한도에 도달했어요',
    'credential-verification-failed': '인증 정보가 일치하지 않아요',
    'current-session-not-removable': '지금 사용 중인 기기는 여기서 로그아웃할 수 없어요',
    'daily-earn-limit-reached': '오늘의 적립 한도에 도달했어요',
    'donation-amount-too-small': '후원 금액이 너무 적어요',
    'donation-duplicate-target': '후원 대상이 중복돼요',
    'expansion-maxed': '최대 확장에 도달했어요',
    'handle-conflict': '이미 사용 중인 핸들이에요',
    'human-verification-failed': '보안 확인에 실패했어요',
    'insufficient-points': '리보가 부족해요',
    'invalid-credentials': '아이디 또는 비밀번호가 일치하지 않아요',
    'item-already-owned': '이미 보유한 아이템이에요',
    'library-full': '서재가 가득 찼어요',
    'library-item-conflict': '이미 서재에 있는 작품이에요',
    'library-items-missing': '작품을 찾을 수 없어요',
    'login-challenge-expired': '인증이 만료됐어요. 새로고침 후 다시 시도해 주세요',
    'login-id-conflict': '이미 사용 중인 아이디예요',
    'message-send-failed': '메시지를 보내지 못했어요. 잠시 후 다시 시도해 주세요',
    'name-conflict': '이미 사용 중인 이름이에요',
    'notification-criteria-conflict': '이미 같은 키워드 알림이 있어요',
    'notification-criteria-limit-reached': '키워드 알림 한도에 도달했어요',
    'own-library-pin': '본인의 서재는 고정할 수 없어요',
    'passkey-limit-reached': '패스키를 더 등록할 수 없어요',
    'passkey-verification-failed': '패스키를 검증할 수 없어요',
    'password-same-as-current': '현재 비밀번호와 새 비밀번호가 같아요',
    'payment-failed': '결제에 실패했어요. 카드 상태를 확인한 뒤 다시 시도해 주세요',
    'payment-method-conflict': '이미 다른 계정에 등록된 결제수단이에요',
    'payment-method-not-found': '결제수단을 찾을 수 없어요',
    'private-library-pin': '비공개 서재는 고정할 수 없어요',
    'receipt-not-ready': '영수증이 아직 준비되지 않았어요',
    'refund-forfeited-by-reply': '이번 결제 기간에 답장을 보내서 환불할 수 없어요',
    'refund-incomplete': '환불이 완료되지 않았어요. 잠시 후 다시 시도해 주세요',
    'refund-no-payment': '환불할 결제가 없어요',
    'refund-window-expired': '결제 후 7일이 지나 환불할 수 없어요',
    'reply-limit-reached': '이 메시지에 보낼 수 있는 답장 횟수를 모두 사용했어요',
    'reply-too-long': '답장 글자 수 한도를 넘었어요',
    'payment-method-conflict ': '', // placeholder-removed below
    'two-factor-already-enabled': '이미 2단계 인증이 활성화되어 있어요',
    'two-factor-not-enabled': '활성화된 2단계 인증이 없어요',
    'two-factor-setup-expired': '2단계 인증 설정이 만료됐어요',
    'two-factor-token-invalid': '인증 코드를 확인해 주세요',
    'verification-attempt-expired': '인증 시도가 만료됐어요. 다시 시도해 주세요',
  },
  field: {
    too_small: '{min}자 이상 입력해 주세요',
    too_big: '{max}자 이하로 입력해 주세요',
    invalid_type: '입력 형식을 확인해 주세요',
    invalid_format: '형식이 올바르지 않아요',
    'date-range-inverted': '시작 날짜는 종료 날짜보다 늦을 수 없어요',
    'date-range-too-long': '조회 기간이 너무 길어요',
    'duplicate-condition': '같은 조건은 한 번만 추가할 수 있어요',
    'handle-reserved': '사용할 수 없는 핸들이에요',
    'invalid-date': '날짜 형식을 확인해 주세요',
    'invalid-protocol': '프로필 이미지 주소를 확인해 주세요',
    'invalid-search-language': '지원하지 않는 언어예요',
    'password-confirm-mismatch': '비밀번호와 비밀번호 확인 값이 일치하지 않아요',
    'password-equals-login-id': '아이디와 비밀번호는 같을 수 없어요',
    'price-below-minimum': '최소 금액 이상 입력해 주세요',
  },
}

export const messages = {
  [Locale.KO]: { Errors: ko },
} satisfies LocalizedMessages
