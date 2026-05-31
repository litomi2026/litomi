import { APP_METADATA } from '@litomi/domain/app/metadata'
import { Locale } from '@litomi/domain/locale'

import type { LocalizedMessages } from '@/i18n/messages'

export const messages = {
  [Locale.KO]: {
    Metadata: {
      app: {
        description: APP_METADATA[Locale.KO].description,
      },
      newYear: {
        title: '새해 카운트다운',
        description: '카운트다운과 불꽃놀이로 새해를 축하하세요.',
      },
    },
    Common: {
      guard: {
        loginRequired: '로그인이 필요해요',
        loginAction: '로그인',
        adultVerificationRequired: '성인인증이 필요해요',
        anonymousAdultVerificationAction: '익명 성인인증',
      },
      manga: {
        loadError: '작품을 불러올 수 없어요',
      },
      bookmark: {
        label: '북마크',
        added: '북마크에 추가했어요',
        addToLibrary: '서재에도 추가',
        error: '오류',
      },
      libraryModal: {
        title: '서재에 추가',
        duplicated: '해당 서재에 이미 추가되어 있어요',
        added: '{count}개 서재에 추가했어요',
        addedWithDuplicates: '{count}개 서재에 추가했어요 (중복 {duplicateCount}개)',
        loading: '불러오는 중이에요',
        loadError: '서재 목록을 불러오지 못했어요',
        retry: '다시 시도',
        empty: '아직 서재가 없어요',
        create: '서재 만들기',
        itemCount: '{count}개 작품',
        addSelected: '{count}개 서재에 추가',
        selectLibrary: '서재를 선택해 주세요',
        cancel: '취소',
      },
      report: {
        action: '신고하기',
        shortAction: '신고',
        title: '작품 신고',
        duplicated: '이미 신고했어요',
        submitted: '신고가 접수됐어요',
        reasons: {
          deepfake: '실존 인물 딥페이크 같아요',
          realPersonMinor: '미성년자로 보이는 실존 인물이 나와요',
        },
        adultVerificationPrefix: '',
        adultVerificationAction: '비바톤 익명 인증',
        adultVerificationSuffix: '을 완료한 사용자만 신고할 수 있어요',
        dmcaPrefix: '저작권/DMCA 신고는',
        dmcaAction: '여기에서',
        dmcaSuffix: '할 수 있어요',
        cancel: '취소',
      },
      pagination: {
        firstPage: '첫 페이지',
        previousPages: '이전 {count} 페이지',
        previousPage: '이전 페이지',
        nextPage: '다음 페이지',
        nextPages: '다음 {count} 페이지',
        lastPage: '마지막 페이지',
        jumpInputLabel: '이동할 페이지 번호',
        jumpAction: '특정 페이지로 이동',
      },
    },
    Home: {
      ageGate: {
        warning:
          '이 정보 내용은 청소년유해매체물로서 "정보통신망 이용촉진 및 정보보호 등에 관한 법률" 및 "청소년 보호법"에 따라 19세 미만의 청소년이 이용할 수 없습니다.',
        description:
          '본 웹사이트에는 19세 이상 전용의 성인 콘텐츠(성인 만화 등)가 포함되어 있습니다. 이용자는 "19세 이상 성인입니다" 버튼을 클릭함으로써, 본인이 19세 이상이거나 현지법상 성인임을 확인하고 해당 콘텐츠 이용에 동의하는 것으로 간주됩니다.',
        enterAction: '19세 이상 성인입니다',
        leaveAction: '19세 미만 나가기',
      },
      cta: {
        christmas: '메리 크리스마스',
        newYear: '새해 카운트다운',
      },
    },
    NotFound: {
      titleLine1: '찾던 페이지가',
      titleLine2: '서가에서 사라졌어요',
      description:
        '주소가 바뀌었거나 더 이상 제공하지 않는 페이지일 수 있어요. 홈에서 다시 둘러보거나 검색으로 원하는 작품을 찾아보세요.',
      homeAction: '홈으로 가기',
      searchAction: '검색하러 가기',
      emptyDescription: 'NO MATCH IN CATALOG',
      emptyTitle: '비어 있는 결과예요',
    },
  },
  [Locale.EN]: {
    Metadata: {
      app: {
        description: APP_METADATA[Locale.EN].description,
      },
      newYear: {
        title: 'New Year Countdown',
        description: 'Celebrate the new year with a countdown and fireworks.',
      },
    },
    Common: {
      guard: {
        loginRequired: 'Log in to continue',
        loginAction: 'Log in',
        adultVerificationRequired: 'Adult verification is required',
        anonymousAdultVerificationAction: 'Anonymous verification',
      },
      manga: {
        loadError: 'Could not load works',
      },
      bookmark: {
        label: 'Bookmark',
        added: 'Added to bookmarks',
        addToLibrary: 'Also add to library',
        error: 'Error',
      },
      libraryModal: {
        title: 'Add to library',
        duplicated: 'This work is already in the selected library',
        added: 'Added to {count, plural, one {# library} other {# libraries}}',
        addedWithDuplicates:
          'Added to {count, plural, one {# library} other {# libraries}} ({duplicateCount, plural, one {# duplicate} other {# duplicates}})',
        loading: 'Loading',
        loadError: 'Could not load libraries',
        retry: 'Try again',
        empty: 'No libraries yet',
        create: 'Create library',
        itemCount: '{count, plural, one {# work} other {# works}}',
        addSelected: 'Add to {count, plural, one {# library} other {# libraries}}',
        selectLibrary: 'Select a library',
        cancel: 'Cancel',
      },
      report: {
        action: 'Report',
        shortAction: 'Report',
        title: 'Report work',
        duplicated: 'You already reported this work',
        submitted: 'Report submitted',
        reasons: {
          deepfake: 'It appears to be a deepfake of a real person',
          realPersonMinor: 'It appears to show a real person who is a minor',
        },
        adultVerificationPrefix: 'Only users who complete ',
        adultVerificationAction: 'Vivaton anonymous verification',
        adultVerificationSuffix: ' can report works',
        dmcaPrefix: 'Copyright/DMCA reports are available',
        dmcaAction: 'here',
        dmcaSuffix: '',
        cancel: 'Cancel',
      },
      pagination: {
        firstPage: 'First page',
        previousPages: 'Previous {count} pages',
        previousPage: 'Previous page',
        nextPage: 'Next page',
        nextPages: 'Next {count} pages',
        lastPage: 'Last page',
        jumpInputLabel: 'Page number to jump to',
        jumpAction: 'Go to page',
      },
    },
    Home: {
      ageGate: {
        warning:
          'This content is restricted to adults and may not be used by anyone under 19 or under the age of majority in their jurisdiction.',
        description:
          'This website contains adult-only content, including adult comics. By selecting "I am an adult", you confirm that you are at least 19 years old or legally an adult where you live, and that you agree to access this content.',
        enterAction: 'I am an adult',
        leaveAction: 'Leave',
      },
      cta: {
        christmas: 'Merry Christmas',
        newYear: 'New Year Countdown',
      },
    },
    NotFound: {
      titleLine1: 'This page slipped',
      titleLine2: 'off the shelf',
      description:
        'The address may have changed, or the page may no longer be available. Head home or search for the work you wanted.',
      homeAction: 'Go home',
      searchAction: 'Search',
      emptyDescription: 'NO MATCH IN CATALOG',
      emptyTitle: 'Nothing here',
    },
  },
} satisfies LocalizedMessages
