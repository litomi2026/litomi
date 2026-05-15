/**
 * 웹툰 크롤러 인터페이스
 *
 * 모든 웹툰 provider는 이 인터페이스를 구현해야 해요.
 */
export interface WebtoonCrawler<TParams = unknown> {
  /**
   * 에피소드 이미지 및 메타데이터를 가져와요.
   */
  fetchEpisode(params: TParams): Promise<WebtoonEpisode>

  /**
   * 웹툰 목록을 가져와요.
   */
  fetchList(params: TParams): Promise<WebtoonList>

  /**
   * 시리즈 정보와 에피소드 목록을 가져와요.
   */
  fetchSeries(params: TParams): Promise<WebtoonSeries>
}

/**
 * 웹툰 에피소드 데이터 (모든 provider 공통)
 */
export type WebtoonEpisode = {
  /** 이미지 URL 목록 */
  images: string[]
  /** 에피소드 제목 */
  title?: string
  /** 이전 에피소드 */
  prevEpisode?: WebtoonEpisodeLink
  /** 다음 에피소드 */
  nextEpisode?: WebtoonEpisodeLink
  /** 시리즈 정보 */
  series?: WebtoonSeriesLink
}

export type WebtoonEpisodeLink = {
  path: string
  title?: string
}

/**
 * 웹툰 목록 데이터
 */
export type WebtoonList = {
  /** 웹툰 목록 */
  items: WebtoonListItem[]
  /** 다음 페이지 커서 (없으면 마지막 페이지) */
  nextCursor?: string
}

/**
 * 웹툰 목록 항목
 */
export type WebtoonListItem = {
  /** 시리즈 경로 (e.g., '/노예일지') */
  path: string
  /** 제목 */
  title: string
  /** 썸네일 URL */
  thumbnail?: string
  /** 장르 */
  genre?: string
  /** 성인 여부 */
  isAdult?: boolean
  /** 좋아요 수 */
  likes?: number
  /** 업데이트 날짜 (MM.DD) */
  updatedAt?: string
}

/**
 * 웹툰 시리즈 데이터
 */
export type WebtoonSeries = {
  /** 시리즈 제목 */
  title: string
  /** 작가 */
  author?: string
  /** 설명 */
  description?: string
  /** 썸네일 URL */
  thumbnail?: string
  /** 총 에피소드 수 */
  totalEpisodes?: number
  /** 장르 */
  genre?: string
  /** 성인 여부 */
  isAdult?: boolean
  /** 에피소드 목록 */
  episodes: WebtoonSeriesEpisode[]
}

/**
 * 시리즈 내 에피소드 항목
 */
export type WebtoonSeriesEpisode = {
  /** 에피소드 경로 */
  path: string
  /** 에피소드 제목 */
  title: string
  /** 게시 날짜 (YYYY-MM-DD) */
  publishedAt?: string
}

export type WebtoonSeriesLink = {
  path: string
  title: string
}
