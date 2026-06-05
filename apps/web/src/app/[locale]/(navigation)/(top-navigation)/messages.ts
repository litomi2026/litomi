import { Locale } from '@litomi/domain/locale'

import type { LocalizedMessages } from '@/i18n/messages'

export const messages = {
  [Locale.KO]: {
    Metadata: {
      explore: {
        fortune: {
          title: '오늘의 운세',
          description: '오늘의 분위기와 흐름을 가볍게 확인해 봐요.',
        },
        new: {
          title: '신작',
          pagedTitle: '신작 {page}페이지',
          description: '새로 추가된 작품을 최신순으로 확인하세요.',
        },
        random: {
          title: '랜덤',
          description: '무작위로 추천되는 작품을 둘러보세요.',
        },
        recommendManga: {
          title: '추천 작품',
          description: '리토미가 추천하는 작품을 확인하세요.',
        },
        tag: {
          title: '태그',
          description: '태그별로 작품을 탐색하세요.',
        },
      },
    },
    TopNavigation: {
      actions: {
        label: '빠른 이동',
        menu: '메뉴 열기',
        recommend: '추천',
        new: '신작',
        random: '랜덤',
        liveCam: '라이브 섹스 캠',
        randomRefresh: {
          loadingTitle: '로딩 중...',
          cooldownTitle: '잠시 후에 시도해 주세요',
          refreshTitle: '새로고침',
          loading: '로딩',
          seconds: '{seconds}초',
          refresh: '갱신',
        },
      },
      footer: {
        installApp: '앱 설치/다운로드',
        terms: '이용약관',
        privacy: '개인정보처리방침',
        ageRestriction: '사용자 연령 제한 규정',
        notice2257: '2257 고지',
        dmca: '저작권/DMCA',
        youthProtection: '청소년보호정책',
      },
    },
    Tag: {
      categories: {
        label: '태그 카테고리',
        female: '여',
        male: '남',
        mixed: '혼합',
        other: '기타',
      },
      pagination: {
        range: '{total}개 중 {start}-{end}',
      },
      loading: '태그 불러오는 중',
      error: '태그를 불러오는 데 실패했어요',
    },
    RecommendManga: {
      adultGateDescription: '추천 작품을 보려면 익명 성인인증이 필요해요',
    },
  },
  [Locale.EN]: {
    Metadata: {
      explore: {
        fortune: {
          title: "Today's Fortune",
          description: "Take a light look at today's mood and flow.",
        },
        new: {
          title: 'New',
          pagedTitle: 'New Manga Page {page}',
          description: 'Browse newly added manga in latest order.',
        },
        random: {
          title: 'Random',
          description: 'Browse randomly recommended manga.',
        },
        recommendManga: {
          title: 'Recommended Manga',
          description: 'Discover manga recommended by Litomi.',
        },
        tag: {
          title: 'Tags',
          description: 'Explore manga by tag.',
        },
      },
    },
    TopNavigation: {
      actions: {
        label: 'Quick navigation',
        menu: 'Open menu',
        recommend: 'Recommended',
        new: 'New',
        random: 'Random',
        liveCam: 'Live sex cam',
        randomRefresh: {
          loadingTitle: 'Loading...',
          cooldownTitle: 'Please try again shortly',
          refreshTitle: 'Refresh',
          loading: 'Loading',
          seconds: '{seconds}s',
          refresh: 'Refresh',
        },
      },
      footer: {
        installApp: 'Install app',
        terms: 'Terms',
        privacy: 'Privacy Policy',
        ageRestriction: 'Age Restriction Rules',
        notice2257: '2257 Notice',
        dmca: 'Copyright/DMCA',
        youthProtection: 'Youth Protection Policy',
      },
    },
    Tag: {
      categories: {
        label: 'Tag categories',
        female: 'Female',
        male: 'Male',
        mixed: 'Mixed',
        other: 'Other',
      },
      pagination: {
        range: 'Showing {start}-{end} of {total} tags',
      },
      loading: 'Loading tags',
      error: 'Failed to load tags',
    },
    RecommendManga: {
      adultGateDescription: 'Anonymous adult verification is required to view recommended works.',
    },
  },
  [Locale.JA]: {
    Metadata: {
      explore: {
        fortune: {
          title: '今日の運勢',
          description: '今日の雰囲気と流れを気軽に確認してみましょう。',
        },
        new: {
          title: '新着',
          pagedTitle: '新着作品 {page}ページ',
          description: '新しく追加された作品を新着順で確認しましょう。',
        },
        random: {
          title: 'おまかせ',
          description: 'おまかせで選ばれた作品を見てみましょう。',
        },
        recommendManga: {
          title: 'おすすめ作品',
          description: 'リトミがおすすめする作品を確認しましょう。',
        },
        tag: {
          title: 'タグ',
          description: 'タグ別に作品を探しましょう。',
        },
      },
    },
    TopNavigation: {
      actions: {
        label: '主な移動先',
        menu: 'メニューを開く',
        recommend: 'おすすめ',
        new: '新着',
        random: 'おまかせ',
        liveCam: '成人向け生配信',
        randomRefresh: {
          loadingTitle: '読み込み中...',
          cooldownTitle: '少し待ってからお試しください',
          refreshTitle: '更新',
          loading: '読み込み中',
          seconds: '{seconds}秒',
          refresh: '更新',
        },
      },
      footer: {
        installApp: 'アプリで使う',
        terms: '利用規約',
        privacy: '個人情報保護方針',
        ageRestriction: '年齢制限規定',
        notice2257: '2257 告知',
        dmca: '著作権/DMCA',
        youthProtection: '青少年保護方針',
      },
    },
    Tag: {
      categories: {
        label: 'タグ分類',
        female: '女性',
        male: '男性',
        mixed: '混合',
        other: 'その他',
      },
      pagination: {
        range: '{total}件中 {start}-{end}',
      },
      loading: 'タグを読み込み中',
      error: 'タグの読み込みに失敗しました',
    },
    RecommendManga: {
      adultGateDescription: 'おすすめ作品を見るには匿名成人認証が必要です',
    },
  },
  [Locale.ZH_CN]: {
    Metadata: {
      explore: {
        fortune: {
          title: '今日运势',
          description: '轻松看看今天的氛围和走势。',
        },
        new: {
          title: '新作',
          pagedTitle: '新作第 {page} 页',
          description: '按最新顺序查看新添加的作品。',
        },
        random: {
          title: '随机',
          description: '浏览随机推荐的作品。',
        },
        recommendManga: {
          title: '推荐作品',
          description: '查看莉托米推荐的作品。',
        },
        tag: {
          title: '标签',
          description: '按标签探索作品。',
        },
      },
    },
    TopNavigation: {
      actions: {
        label: '快速导航',
        menu: '打开菜单',
        recommend: '推荐',
        new: '新作',
        random: '随机',
        liveCam: '性爱视频直播',
        randomRefresh: {
          loadingTitle: '加载中...',
          cooldownTitle: '请稍后再试',
          refreshTitle: '刷新',
          loading: '加载中',
          seconds: '{seconds}秒',
          refresh: '刷新',
        },
      },
      footer: {
        installApp: '安装应用',
        terms: '使用条款',
        privacy: '隐私政策',
        ageRestriction: '年龄限制规则',
        notice2257: '2257 声明',
        dmca: '版权/DMCA',
        youthProtection: '青少年保护政策',
      },
    },
    Tag: {
      categories: {
        label: '标签分类',
        female: '女性',
        male: '男性',
        mixed: '混合',
        other: '其他',
      },
      pagination: {
        range: '共 {total} 个标签，显示 {start}-{end}',
      },
      loading: '正在加载标签',
      error: '标签加载失败',
    },
    RecommendManga: {
      adultGateDescription: '查看推荐作品需要匿名成人认证。',
    },
  },
} satisfies LocalizedMessages
