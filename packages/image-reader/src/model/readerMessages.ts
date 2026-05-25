import type {
  ImageFit,
  LowDataMode,
  Orientation,
  PageView,
  ReadingDirection,
  ScrollAxis,
  ViewerMode,
} from '#reader/state/readerStore'

export type ReaderLocale = 'en' | 'ja' | 'ko' | 'zh-CN' | 'zh-TW'

export type ReaderMessageOverrides = Partial<Omit<ReaderMessages, ReaderMessageMapKey>> & {
  lowDataLabels?: Partial<Record<LowDataMode, string>>
  imageFitButtons?: Partial<Record<ImageFit, string>>
  pageViewButtons?: Partial<Record<PageView, string>>
  readingDirectionButtons?: Partial<Record<ReadingDirection, string>>
  scrollAxisButtons?: Partial<Record<ScrollAxis, string>>
  viewerModeButtons?: Partial<Record<ViewerMode, string>>
  viewerOrientationButtons?: Partial<Record<Orientation, string>>
}

export type ReaderMessages = {
  brightPreset: string
  brightnessLabel: string
  cancelAction: string
  closeDialog: string
  controlsToolbarLabel: string
  darkPreset: string
  firstPageNotice: string
  imageWidthLabel: string
  intervalLabel: string
  lastPageNotice: string
  loadingImages: string
  lowDataAutoSaveDataNotice: string
  lowDataAutoSlowNetworkNotice: string
  pageSliderLabel: string
  previewButton: string
  readingDirectionLeftShort: string
  readingDirectionRightShort: string
  repeatLabel: string
  resetViewControls: string
  resumeReadingAction: string
  secondsUnit: string
  slideshowRepeatLabel: string
  slideshowStartAction: string
  slideshowStartButton: string
  slideshowStopButton: string
  slideshowTitle: string
  thumbnailNext: string
  thumbnailPrevious: string
  touchNext: string
  touchPrevious: string
  viewControlsButton: string
  viewControlsTitle: string
  goToPage: (pageNumber: number) => string
  imageFitButtons: Record<ImageFit, string>
  lowDataLabels: Record<LowDataMode, string>
  pageSliderValue: (currentPageText: number | string, maxPage: number) => string
  pageViewButtons: Record<PageView, string>
  readingDirectionButtons: Record<ReadingDirection, string>
  resumeReadingNotice: (pageNumber: number) => string
  scrollAxisButtons: Record<ScrollAxis, string>
  viewerModeButtons: Record<ViewerMode, string>
  viewerOrientationButtons: Record<Orientation, string>
}

type ReaderMessageMapKey =
  | 'imageFitButtons'
  | 'lowDataLabels'
  | 'pageViewButtons'
  | 'readingDirectionButtons'
  | 'scrollAxisButtons'
  | 'viewerModeButtons'
  | 'viewerOrientationButtons'

export const readerMessageCatalog = {
  ko: {
    brightPreset: '밝게',
    brightnessLabel: '밝기',
    cancelAction: '취소',
    closeDialog: '닫기',
    controlsToolbarLabel: '뷰어 보기 설정',
    darkPreset: '어둡게',
    firstPageNotice: '첫번째 페이지예요',
    imageWidthLabel: '이미지 너비',
    intervalLabel: '주기',
    lastPageNotice: '마지막 페이지예요',
    loadingImages: '이미지 불러오는 중',
    lowDataAutoSaveDataNotice: '데이터 절약 모드가 켜졌어요',
    lowDataAutoSlowNetworkNotice: '느린 네트워크가 감지됐어요',
    pageSliderLabel: '페이지 이동',
    previewButton: '미리보기',
    readingDirectionLeftShort: '좌',
    readingDirectionRightShort: '우',
    repeatLabel: '반복',
    resetViewControls: '초기화',
    resumeReadingAction: '이동',
    secondsUnit: '초',
    slideshowRepeatLabel: '자동 넘기기 반복',
    slideshowStartAction: '시작',
    slideshowStartButton: '자동 넘기기',
    slideshowStopButton: '중지',
    slideshowTitle: '자동 넘기기',
    thumbnailNext: '다음 미리보기',
    thumbnailPrevious: '이전 미리보기',
    touchNext: '다음',
    touchPrevious: '이전',
    viewControlsButton: '보기 조절',
    viewControlsTitle: '보기 조절',
    goToPage: (pageNumber) => `${pageNumber}페이지로 이동`,
    lowDataLabels: {
      auto: '저데이터 자동',
      off: '저데이터 꺼짐',
      on: '저데이터 켜짐',
    },
    pageSliderValue: (currentPageText, maxPage) => `${currentPageText} / ${maxPage}`,
    pageViewButtons: {
      double: '두 쪽 보기',
      single: '한 쪽 보기',
    },
    readingDirectionButtons: {
      ltr: '읽기 방향: 좌에서 우로',
      rtl: '읽기 방향: 우에서 좌로',
    },
    resumeReadingNotice: (pageNumber) => `마지막으로 읽던 페이지 ${pageNumber}`,
    scrollAxisButtons: {
      horizontal: '가로 스크롤',
      vertical: '세로 스크롤',
    },
    imageFitButtons: {
      contain: '화면 맞춤',
      'fit-height': '세로 맞춤',
      'fit-width': '가로 맞춤',
    },
    viewerModeButtons: {
      page: '페이지보기',
      scroll: '스크롤보기',
    },
    viewerOrientationButtons: {
      horizontal: '좌우 넘기기',
      'horizontal-reverse': '우좌 넘기기',
      vertical: '상하 넘기기',
      'vertical-reverse': '하상 넘기기',
    },
  },
  en: {
    brightPreset: 'Bright',
    brightnessLabel: 'Brightness',
    cancelAction: 'Cancel',
    closeDialog: 'Close',
    controlsToolbarLabel: 'Reader view settings',
    darkPreset: 'Dark',
    firstPageNotice: 'This is the first page',
    imageWidthLabel: 'Image width',
    intervalLabel: 'Interval',
    lastPageNotice: 'This is the last page',
    loadingImages: 'Loading images',
    lowDataAutoSaveDataNotice: 'Data saver mode is on',
    lowDataAutoSlowNetworkNotice: 'A slow network was detected',
    pageSliderLabel: 'Go to page',
    previewButton: 'Preview',
    readingDirectionLeftShort: 'L',
    readingDirectionRightShort: 'R',
    repeatLabel: 'Repeat',
    resetViewControls: 'Reset',
    resumeReadingAction: 'Go',
    secondsUnit: 'sec',
    slideshowRepeatLabel: 'Repeat slideshow',
    slideshowStartAction: 'Start',
    slideshowStartButton: 'Slideshow',
    slideshowStopButton: 'Stop',
    slideshowTitle: 'Slideshow',
    thumbnailNext: 'Next preview',
    thumbnailPrevious: 'Previous preview',
    touchNext: 'Next',
    touchPrevious: 'Previous',
    viewControlsButton: 'View controls',
    viewControlsTitle: 'View controls',
    goToPage: (pageNumber) => `Go to page ${pageNumber}`,
    lowDataLabels: {
      auto: 'Low data auto',
      off: 'Low data off',
      on: 'Low data on',
    },
    pageSliderValue: (currentPageText, maxPage) => `${currentPageText} / ${maxPage}`,
    pageViewButtons: {
      double: 'Two-page view',
      single: 'One-page view',
    },
    readingDirectionButtons: {
      ltr: 'Reading direction: left to right',
      rtl: 'Reading direction: right to left',
    },
    resumeReadingNotice: (pageNumber) => `Last read page ${pageNumber}`,
    scrollAxisButtons: {
      horizontal: 'Horizontal scroll',
      vertical: 'Vertical scroll',
    },
    imageFitButtons: {
      contain: 'Fit screen',
      'fit-height': 'Fit height',
      'fit-width': 'Fit width',
    },
    viewerModeButtons: {
      page: 'Page view',
      scroll: 'Scroll view',
    },
    viewerOrientationButtons: {
      horizontal: 'Left-to-right turn',
      'horizontal-reverse': 'Right-to-left turn',
      vertical: 'Top-to-bottom turn',
      'vertical-reverse': 'Bottom-to-top turn',
    },
  },
  ja: {
    brightPreset: '明るく',
    brightnessLabel: '明るさ',
    cancelAction: 'キャンセル',
    closeDialog: '閉じる',
    controlsToolbarLabel: 'ビューア表示設定',
    darkPreset: '暗く',
    firstPageNotice: '最初のページです',
    imageWidthLabel: '画像の幅',
    intervalLabel: '間隔',
    lastPageNotice: '最後のページです',
    loadingImages: '画像を読み込み中',
    lowDataAutoSaveDataNotice: 'データ節約モードがオンです',
    lowDataAutoSlowNetworkNotice: '低速ネットワークを検出しました',
    pageSliderLabel: 'ページへ移動',
    previewButton: 'プレビュー',
    readingDirectionLeftShort: '左',
    readingDirectionRightShort: '右',
    repeatLabel: '繰り返し',
    resetViewControls: 'リセット',
    resumeReadingAction: '移動',
    secondsUnit: '秒',
    slideshowRepeatLabel: '自動送りを繰り返す',
    slideshowStartAction: '開始',
    slideshowStartButton: '自動送り',
    slideshowStopButton: '停止',
    slideshowTitle: '自動送り',
    thumbnailNext: '次のプレビュー',
    thumbnailPrevious: '前のプレビュー',
    touchNext: '次',
    touchPrevious: '前',
    viewControlsButton: '表示調整',
    viewControlsTitle: '表示調整',
    goToPage: (pageNumber) => `${pageNumber}ページへ移動`,
    lowDataLabels: {
      auto: '低データ 自動',
      off: '低データ オフ',
      on: '低データ オン',
    },
    pageSliderValue: (currentPageText, maxPage) => `${currentPageText} / ${maxPage}`,
    pageViewButtons: {
      double: '見開き表示',
      single: '単ページ表示',
    },
    readingDirectionButtons: {
      ltr: '読み方向: 左から右',
      rtl: '読み方向: 右から左',
    },
    resumeReadingNotice: (pageNumber) => `最後に読んだページ ${pageNumber}`,
    scrollAxisButtons: {
      horizontal: '横スクロール',
      vertical: '縦スクロール',
    },
    imageFitButtons: {
      contain: '画面に合わせる',
      'fit-height': '高さに合わせる',
      'fit-width': '幅に合わせる',
    },
    viewerModeButtons: {
      page: 'ページ表示',
      scroll: 'スクロール表示',
    },
    viewerOrientationButtons: {
      horizontal: '左右送り',
      'horizontal-reverse': '右左送り',
      vertical: '上下送り',
      'vertical-reverse': '下上送り',
    },
  },
  'zh-CN': {
    brightPreset: '调亮',
    brightnessLabel: '亮度',
    cancelAction: '取消',
    closeDialog: '关闭',
    controlsToolbarLabel: '阅读器显示设置',
    darkPreset: '调暗',
    firstPageNotice: '已经是第一页',
    imageWidthLabel: '图片宽度',
    intervalLabel: '间隔',
    lastPageNotice: '已经是最后一页',
    loadingImages: '正在加载图片',
    lowDataAutoSaveDataNotice: '已开启省流量模式',
    lowDataAutoSlowNetworkNotice: '检测到网络较慢',
    pageSliderLabel: '跳转页面',
    previewButton: '预览',
    readingDirectionLeftShort: '左',
    readingDirectionRightShort: '右',
    repeatLabel: '重复',
    resetViewControls: '重置',
    resumeReadingAction: '跳转',
    secondsUnit: '秒',
    slideshowRepeatLabel: '重复自动翻页',
    slideshowStartAction: '开始',
    slideshowStartButton: '自动翻页',
    slideshowStopButton: '停止',
    slideshowTitle: '自动翻页',
    thumbnailNext: '下一个预览',
    thumbnailPrevious: '上一个预览',
    touchNext: '下一页',
    touchPrevious: '上一页',
    viewControlsButton: '视图调整',
    viewControlsTitle: '视图调整',
    goToPage: (pageNumber) => `跳转到第 ${pageNumber} 页`,
    lowDataLabels: {
      auto: '省流量自动',
      off: '省流量关闭',
      on: '省流量开启',
    },
    pageSliderValue: (currentPageText, maxPage) => `${currentPageText} / ${maxPage}`,
    pageViewButtons: {
      double: '双页视图',
      single: '单页视图',
    },
    readingDirectionButtons: {
      ltr: '阅读方向：从左到右',
      rtl: '阅读方向：从右到左',
    },
    resumeReadingNotice: (pageNumber) => `上次读到第 ${pageNumber} 页`,
    scrollAxisButtons: {
      horizontal: '横向滚动',
      vertical: '纵向滚动',
    },
    imageFitButtons: {
      contain: '适应屏幕',
      'fit-height': '适应高度',
      'fit-width': '适应宽度',
    },
    viewerModeButtons: {
      page: '分页视图',
      scroll: '滚动视图',
    },
    viewerOrientationButtons: {
      horizontal: '左右翻页',
      'horizontal-reverse': '右左翻页',
      vertical: '上下翻页',
      'vertical-reverse': '下上翻页',
    },
  },
  'zh-TW': {
    brightPreset: '調亮',
    brightnessLabel: '亮度',
    cancelAction: '取消',
    closeDialog: '關閉',
    controlsToolbarLabel: '閱讀器顯示設定',
    darkPreset: '調暗',
    firstPageNotice: '已經是第一頁',
    imageWidthLabel: '圖片寬度',
    intervalLabel: '間隔',
    lastPageNotice: '已經是最後一頁',
    loadingImages: '正在載入圖片',
    lowDataAutoSaveDataNotice: '已開啟省流量模式',
    lowDataAutoSlowNetworkNotice: '偵測到網路較慢',
    pageSliderLabel: '跳到頁面',
    previewButton: '預覽',
    readingDirectionLeftShort: '左',
    readingDirectionRightShort: '右',
    repeatLabel: '重複',
    resetViewControls: '重設',
    resumeReadingAction: '前往',
    secondsUnit: '秒',
    slideshowRepeatLabel: '重複自動翻頁',
    slideshowStartAction: '開始',
    slideshowStartButton: '自動翻頁',
    slideshowStopButton: '停止',
    slideshowTitle: '自動翻頁',
    thumbnailNext: '下一個預覽',
    thumbnailPrevious: '上一個預覽',
    touchNext: '下一頁',
    touchPrevious: '上一頁',
    viewControlsButton: '檢視調整',
    viewControlsTitle: '檢視調整',
    goToPage: (pageNumber) => `跳到第 ${pageNumber} 頁`,
    lowDataLabels: {
      auto: '省流量自動',
      off: '省流量關閉',
      on: '省流量開啟',
    },
    pageSliderValue: (currentPageText, maxPage) => `${currentPageText} / ${maxPage}`,
    pageViewButtons: {
      double: '雙頁檢視',
      single: '單頁檢視',
    },
    readingDirectionButtons: {
      ltr: '閱讀方向：從左到右',
      rtl: '閱讀方向：從右到左',
    },
    resumeReadingNotice: (pageNumber) => `上次讀到第 ${pageNumber} 頁`,
    scrollAxisButtons: {
      horizontal: '水平捲動',
      vertical: '垂直捲動',
    },
    imageFitButtons: {
      contain: '符合螢幕',
      'fit-height': '符合高度',
      'fit-width': '符合寬度',
    },
    viewerModeButtons: {
      page: '分頁檢視',
      scroll: '捲動檢視',
    },
    viewerOrientationButtons: {
      horizontal: '左右翻頁',
      'horizontal-reverse': '右左翻頁',
      vertical: '上下翻頁',
      'vertical-reverse': '下上翻頁',
    },
  },
} satisfies Record<ReaderLocale, ReaderMessages>

export function getReaderMessages(locale: ReaderLocale, overrides: ReaderMessageOverrides = {}): ReaderMessages {
  const messages = readerMessageCatalog[locale]

  return {
    ...messages,
    ...overrides,
    lowDataLabels: {
      ...messages.lowDataLabels,
      ...overrides.lowDataLabels,
    },
    pageViewButtons: {
      ...messages.pageViewButtons,
      ...overrides.pageViewButtons,
    },
    readingDirectionButtons: {
      ...messages.readingDirectionButtons,
      ...overrides.readingDirectionButtons,
    },
    scrollAxisButtons: {
      ...messages.scrollAxisButtons,
      ...overrides.scrollAxisButtons,
    },
    imageFitButtons: {
      ...messages.imageFitButtons,
      ...overrides.imageFitButtons,
    },
    viewerModeButtons: {
      ...messages.viewerModeButtons,
      ...overrides.viewerModeButtons,
    },
    viewerOrientationButtons: {
      ...messages.viewerOrientationButtons,
      ...overrides.viewerOrientationButtons,
    },
  }
}
