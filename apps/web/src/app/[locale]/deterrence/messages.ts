import { Locale } from '@litomi/domain/locale'

import type { LocalizedMessages } from '@/i18n/messages'

export const messages = {
  [Locale.KO]: {
    Metadata: {
      deterrence: {
        title: '19세 미만 이용 제한 안내',
        description: '청소년 및 보호자를 위한 이용 제한 안내와 보호 기능 설정 방법을 안내합니다.',
      },
    },
    Deterrence: {
      actions: {
        backHome: '입구로 돌아가기',
        guardianGuide: '보호자 안내 보기',
      },
      hero: {
        badge: '19+ 성인 전용',
        titleLine1: '19세 미만은',
        titleLine2: '여기서 멈춰주세요.',
        description:
          '리토미는 성인 대상 콘텐츠를 포함하고 있어 19세 미만 청소년의 이용을 제한합니다. 청소년은 본 사이트와 관련 성인 콘텐츠를 이용할 수 없으며, 일부 기능에는 추가적인 성인인증 또는 접근 제한이 적용될 수 있습니다.',
      },
      summary: {
        audience: {
          label: '대상',
          value: '19세 이상 성인',
        },
        support: {
          label: '보호 설정',
          description: '보호자는 기기와 계정 설정을 함께 관리해 주세요.',
        },
        contact: {
          label: '문의',
        },
      },
      quickFacts: {
        ageRestricted: {
          title: '19세 미만 이용 불가',
          description: '청소년은 리토미 및 관련 성인 콘텐츠를 이용할 수 없습니다.',
        },
        additionalCheck: {
          title: '추가 확인이 필요할 수 있어요',
          description: '일부 기능과 흐름에는 성인인증 또는 추가 접근 제한이 적용될 수 있습니다.',
        },
        guardianSettings: {
          title: '보호자 설정이 중요해요',
          description: '보호자는 사이트 안내문과 별개로 기기 수준의 차단 기능을 함께 설정해 주세요.',
        },
      },
      guardian: {
        eyebrow: '보호자 안내',
        title: '보호자라면 이렇게 관리해 주세요.',
        description:
          '사이트의 안내문만으로는 모든 접근을 막기 어렵습니다. 공용 기기, 자녀 계정, 검색 서비스, 보호자 비밀번호를 함께 관리하는 방식이 가장 현실적이고 효과적입니다.',
        steps: {
          separateProfiles: {
            title: '1. 자녀 전용 계정이나 프로필을 분리해 사용하세요.',
            description: '공용 브라우저나 공용 계정은 우회 가능성을 높일 수 있어요.',
          },
          deviceLock: {
            title: '2. 보호자 비밀번호와 기기 잠금을 함께 설정하세요.',
            description: '방문 기록 삭제만 막는 것으로는 충분하지 않을 수 있어요.',
          },
          combinedFilters: {
            title: '3. 검색 필터와 기기 제한을 동시에 사용하세요.',
            description: '검색 필터는 도움을 주지만, 모든 웹사이트를 완전히 차단하지는 않을 수 있습니다.',
          },
        },
        guides: {
          appleScreenTime: {
            title: 'Apple Screen Time',
            description: 'iPhone과 iPad에서 웹 콘텐츠 제한, 앱 제한, 자녀 기기 보호 설정을 관리할 수 있어요.',
          },
          googleSafeSearch: {
            title: 'Google SafeSearch',
            description:
              'Google 검색의 SafeSearch와 Family Link를 통해 자녀 계정의 검색 결과와 일부 웹 접근을 관리할 수 있어요.',
          },
        },
      },
      docs: {
        heading: '문서 및 문의',
        inquiry: '청소년 보호, 접근 제한, 정책 관련 문의',
      },
      policyLinks: {
        youthProtection: '청소년보호정책',
        privacy: '개인정보처리방침',
        terms: '이용약관',
      },
      notice: {
        eyebrow: '유의사항',
        title: '면책 및 유의사항',
        disclaimers: {
          legalAdvice: {
            title: '법률 자문 대체 아님',
            body: '이 페이지는 일반적인 청소년 보호 및 보호자 안내를 위한 정보 제공용 문서입니다. 개별 상황에 대한 법률 자문을 대신하지 않습니다.',
          },
          thirdPartyTools: {
            title: '제3자 도구의 한계',
            body: '운영체제, 브라우저, 검색 서비스의 보호 기능은 각 제공자의 정책과 기기 환경에 따라 작동 방식이 달라질 수 있습니다.',
          },
          finalResponsibility: {
            title: '최종 관리 책임',
            body: '실제 기기 관리, 계정 통제, 보호자 비밀번호 설정과 사용 환경 관리는 이용자와 보호자의 책임 영역입니다.',
          },
        },
      },
    },
  },
  [Locale.EN]: {
    Metadata: {
      deterrence: {
        title: 'Under-19 Access Restriction Notice',
        description: 'Guidance for minors and guardians about access restrictions and protection settings.',
      },
    },
    Deterrence: {
      actions: {
        backHome: 'Back to entrance',
        guardianGuide: 'View guardian guide',
      },
      hero: {
        badge: '19+ Adults only',
        titleLine1: 'If you are under 19,',
        titleLine2: 'please stop here.',
        description:
          'Litomi includes adult-oriented content and restricts use by minors under 19. Minors may not use this site or related adult content, and some features may require additional adult verification or access restrictions.',
      },
      summary: {
        audience: {
          label: 'Audience',
          value: 'Adults 19 and older',
        },
        support: {
          label: 'Support',
          description: 'Guardians should manage device and account settings together.',
        },
        contact: {
          label: 'Contact',
        },
      },
      quickFacts: {
        ageRestricted: {
          title: 'Under 19 not allowed',
          description: 'Minors may not use Litomi or related adult content.',
        },
        additionalCheck: {
          title: 'Additional checks may apply',
          description: 'Some features and flows may require adult verification or extra access restrictions.',
        },
        guardianSettings: {
          title: 'Guardian settings matter',
          description: 'Guardians should use device-level blocking controls alongside this site notice.',
        },
      },
      guardian: {
        eyebrow: 'Parents & Guardians',
        title: 'How guardians can manage access.',
        description:
          'A site notice alone cannot block every access path. Managing shared devices, child accounts, search services, and guardian passwords together is the most realistic and effective approach.',
        steps: {
          separateProfiles: {
            title: '1. Use a separate child account or profile.',
            description: 'Shared browsers or shared accounts can make bypassing restrictions easier.',
          },
          deviceLock: {
            title: '2. Set guardian passwords and device locks together.',
            description: 'Blocking history deletion alone may not be enough.',
          },
          combinedFilters: {
            title: '3. Use search filters and device restrictions together.',
            description: 'Search filters help, but they may not completely block every website.',
          },
        },
        guides: {
          appleScreenTime: {
            title: 'Apple Screen Time',
            description: 'Manage web content restrictions, app limits, and child device protection on iPhone and iPad.',
          },
          googleSafeSearch: {
            title: 'Google SafeSearch',
            description:
              'Use Google SafeSearch and Family Link to manage search results and some web access for child accounts.',
          },
        },
      },
      docs: {
        heading: 'Docs & Contact',
        inquiry: 'Questions about youth protection, access restrictions, or policies',
      },
      policyLinks: {
        youthProtection: 'Youth Protection Policy',
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
      },
      notice: {
        eyebrow: 'Notice',
        title: 'Disclaimers and Notes',
        disclaimers: {
          legalAdvice: {
            title: 'Not legal advice',
            body: 'This page provides general information about youth protection and guardian guidance. It does not replace legal advice for individual situations.',
          },
          thirdPartyTools: {
            title: 'Limits of third-party tools',
            body: 'Protection features from operating systems, browsers, and search services may work differently depending on each provider policy and device environment.',
          },
          finalResponsibility: {
            title: 'Final management responsibility',
            body: 'Actual device management, account controls, guardian passwords, and usage environment settings remain the responsibility of users and guardians.',
          },
        },
      },
    },
  },
  [Locale.JA]: {
    Metadata: {
      deterrence: {
        title: '19歳未満の利用制限に関するお知らせ',
        description: '未成年者と保護者向けに、利用制限と保護機能の設定方法を案内します。',
      },
    },
    Deterrence: {
      actions: {
        backHome: '入口に戻る',
        guardianGuide: '保護者向け案内を見る',
      },
      hero: {
        badge: '19+ 成人向け',
        titleLine1: '19歳未満の方は',
        titleLine2: 'ここでお戻りください。',
        description:
          'リトミには成人向けコンテンツが含まれるため、19歳未満の未成年者による利用を制限しています。未成年者は本サイトおよび関連する成人向けコンテンツを利用できず、一部の機能では追加の成人確認またはアクセス制限が適用される場合があります。',
      },
      summary: {
        audience: {
          label: '対象',
          value: '19歳以上の成人',
        },
        support: {
          label: 'サポート',
          description: '保護者はデバイスとアカウント設定をあわせて管理してください。',
        },
        contact: {
          label: '連絡先',
        },
      },
      quickFacts: {
        ageRestricted: {
          title: '19歳未満は利用できません',
          description: '未成年者はリトミおよび関連する成人向けコンテンツを利用できません。',
        },
        additionalCheck: {
          title: '追加確認が必要な場合があります',
          description: '一部の機能や導線では、成人確認または追加のアクセス制限が適用される場合があります。',
        },
        guardianSettings: {
          title: '保護者設定が重要です',
          description: '保護者はサイト上の案内に加えて、デバイス側のブロック機能も設定してください。',
        },
      },
      guardian: {
        eyebrow: '保護者の方へ',
        title: '保護者はこのように管理してください。',
        description:
          'サイトの案内だけですべてのアクセスを防ぐことは困難です。共有デバイス、子ども用アカウント、検索サービス、保護者パスワードをあわせて管理する方法が、現実的で効果的です。',
        steps: {
          separateProfiles: {
            title: '1. 子ども専用のアカウントまたはプロフィールを分けて使用してください。',
            description: '共有ブラウザや共有アカウントは、制限を回避しやすくする可能性があります。',
          },
          deviceLock: {
            title: '2. 保護者パスワードとデバイスロックをあわせて設定してください。',
            description: '閲覧履歴の削除だけを防いでも、十分でない場合があります。',
          },
          combinedFilters: {
            title: '3. 検索フィルターとデバイス制限を同時に使用してください。',
            description: '検索フィルターは役立ちますが、すべてのウェブサイトを完全に遮断できるとは限りません。',
          },
        },
        guides: {
          appleScreenTime: {
            title: 'Apple Screen Time',
            description: 'iPhoneとiPadで、Webコンテンツ制限、アプリ制限、子どものデバイス保護設定を管理できます。',
          },
          googleSafeSearch: {
            title: 'Google SafeSearch',
            description:
              'Google検索のSafeSearchとFamily Linkを使って、子ども用アカウントの検索結果や一部のWebアクセスを管理できます。',
          },
        },
      },
      docs: {
        heading: '文書・連絡先',
        inquiry: '青少年保護、アクセス制限、ポリシーに関するお問い合わせ',
      },
      policyLinks: {
        youthProtection: '青少年保護ポリシー',
        privacy: 'プライバシーポリシー',
        terms: '利用規約',
      },
      notice: {
        eyebrow: '注意',
        title: '免責事項および注意点',
        disclaimers: {
          legalAdvice: {
            title: '法律相談ではありません',
            body: 'このページは、一般的な青少年保護および保護者向け案内のための情報提供文書です。個別の状況に関する法律相談に代わるものではありません。',
          },
          thirdPartyTools: {
            title: '第三者ツールの限界',
            body: 'OS、ブラウザ、検索サービスの保護機能は、各提供者のポリシーやデバイス環境によって動作が異なる場合があります。',
          },
          finalResponsibility: {
            title: '最終的な管理責任',
            body: '実際のデバイス管理、アカウント制御、保護者パスワード設定、利用環境の管理は、利用者および保護者の責任範囲です。',
          },
        },
      },
    },
  },
  [Locale.ZH_CN]: {
    Metadata: {
      deterrence: {
        title: '未满 19 岁访问限制说明',
        description: '面向未成年人和监护人，说明访问限制与保护功能设置。',
      },
    },
    Deterrence: {
      actions: {
        backHome: '返回入口',
        guardianGuide: '查看监护人指南',
      },
      hero: {
        badge: '19+ 成人专用',
        titleLine1: '未满 19 岁，',
        titleLine2: '请在此停止。',
        description:
          '莉托米包含面向成人的内容，因此限制未满 19 岁的未成年人使用。未成年人不得使用本网站及相关成人内容，部分功能可能会适用额外的成人认证或访问限制。',
      },
      summary: {
        audience: {
          label: '受众',
          value: '19 岁及以上成年人',
        },
        support: {
          label: '支持',
          description: '监护人应同时管理设备和账号设置。',
        },
        contact: {
          label: '联系',
        },
      },
      quickFacts: {
        ageRestricted: {
          title: '未满 19 岁不可使用',
          description: '未成年人不得使用莉托米及相关成人内容。',
        },
        additionalCheck: {
          title: '可能需要额外确认',
          description: '部分功能和流程可能适用成人认证或额外访问限制。',
        },
        guardianSettings: {
          title: '监护人设置很重要',
          description: '除网站提示外，监护人也应设置设备级别的拦截功能。',
        },
      },
      guardian: {
        eyebrow: '父母与监护人',
        title: '监护人可以这样管理访问。',
        description:
          '仅靠网站提示很难阻止所有访问路径。同时管理共用设备、儿童账号、搜索服务和监护人密码，是更现实且有效的方式。',
        steps: {
          separateProfiles: {
            title: '1. 使用单独的儿童账号或个人资料。',
            description: '共用浏览器或共用账号可能会提高绕过限制的可能性。',
          },
          deviceLock: {
            title: '2. 同时设置监护人密码和设备锁。',
            description: '仅阻止删除浏览记录可能并不充分。',
          },
          combinedFilters: {
            title: '3. 同时使用搜索过滤和设备限制。',
            description: '搜索过滤有帮助，但不一定能完全屏蔽所有网站。',
          },
        },
        guides: {
          appleScreenTime: {
            title: 'Apple Screen Time',
            description: '可在 iPhone 和 iPad 上管理网页内容限制、App 限制以及儿童设备保护设置。',
          },
          googleSafeSearch: {
            title: 'Google SafeSearch',
            description: '可通过 Google 搜索的 SafeSearch 和 Family Link 管理儿童账号的搜索结果及部分网页访问。',
          },
        },
      },
      docs: {
        heading: '文档与联系',
        inquiry: '关于青少年保护、访问限制和政策的咨询',
      },
      policyLinks: {
        youthProtection: '青少年保护政策',
        privacy: '隐私政策',
        terms: '服务条款',
      },
      notice: {
        eyebrow: '注意',
        title: '免责声明与注意事项',
        disclaimers: {
          legalAdvice: {
            title: '不替代法律意见',
            body: '本页面仅提供一般性的青少年保护和监护人指南信息，不替代针对个别情况的法律意见。',
          },
          thirdPartyTools: {
            title: '第三方工具的限制',
            body: '操作系统、浏览器和搜索服务的保护功能，可能会因各提供方政策及设备环境而有不同的工作方式。',
          },
          finalResponsibility: {
            title: '最终管理责任',
            body: '实际的设备管理、账号控制、监护人密码设置和使用环境管理，属于用户和监护人的责任范围。',
          },
        },
      },
    },
  },
} satisfies LocalizedMessages
