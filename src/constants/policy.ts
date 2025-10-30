export const MAX_BOOKMARK_FILE_SIZE = 1024 * 1024 // 1 MiB
export const MAX_BOOKMARKS_PER_USER = 500
export const MAX_CENSORSHIPS_PER_USER = 20
export const MAX_CREDENTIALS_PER_USER = 10
export const MAX_CRITERIA_NAME_LENGTH = 32
export const MAX_CRITERIA_PER_USER = 10
export const MAX_HARPI_MANGA_BATCH_SIZE = 10
export const MAX_KHENTAI_SEARCH_QUERY_LENGTH = 255
export const MAX_LIBRARY_ITEMS_PER_LIBRARY = 100 // TODO
export const MAX_LIBRARIES_PER_USER = 10
export const MAX_LIBRARY_NAME_LENGTH = 50
export const MAX_LIBRARY_DESCRIPTION_LENGTH = 100
export const MAX_MANGA_DESCRIPTION_LENGTH = 150
export const MAX_MANGA_TITLE_LENGTH = 50
export const MAX_NOTIFICATION_COUNT = 500
export const MAX_POST_CONTENT_LENGTH = 160
export const MAX_READING_HISTORY_PER_USER = 1000
export const MAX_RECENT_SEARCHES = 5
export const MAX_SEARCH_QUERY_LENGTH = 500
export const MAX_SEARCH_SUGGESTIONS = 10
export const MAX_THUMBNAIL_IMAGES = 4
export const MAX_TRUSTED_DEVICES_PER_USER = 5
export const MANGA_INITIAL_LINES = 1
export const TOUCH_VIEWER_IMAGE_PREFETCH_AMOUNT = 6
export const MIN_SUGGESTION_QUERY_LENGTH = 2
export const SUGGESTION_DEBOUNCE_MS = 500
export const BOOKMARKS_PER_PAGE = 20
export const CENSORSHIPS_PER_PAGE = 10
export const LIBRARIES_PER_PAGE = 20
export const TOP_MANGA_PER_PAGE = 20
export const READING_HISTORY_PER_PAGE = 20
export const RATING_PER_PAGE = 20
export const LIBRARY_ITEMS_PER_PAGE = 20
export const LINK_PENDING_DELAY = 500
export const SCROLL_THROTTLE_MS = 200
export const SCROLL_THRESHOLD_PX = 10
export const REALTIME_PAGE_VIEW_MIN_THRESHOLD = 10

// NOTE: 꾸준히 올려줘야 함
export const MAX_MANGA_ID = 10_000_000
export const TOTAL_HIYOBI_PAGES = 7736

export const LOGIN_ID_PATTERN = '^[a-zA-Z][a-zA-Z0-9_]*$'
export const PASSWORD_PATTERN = '^(?=.*[A-Za-z])(?=.*[0-9]).+$'
export const BACKUP_CODE_PATTERN = '^[A-Z0-9\\-]*$'

export const BLACKLISTED_MANGA_IDS = [
  2905292, // 张元英之财阀的快乐裸着表演 [AI Generated]
  2910760, // 张元英之财阀的快乐裸着表演 [AI Generated]
  3210070, // 美女迪丽热巴和网红们的私密照[AI Generated]
  3309543, // won
  3316020, // won 2
  3343193, // 美女网红明星原图去衣合集[AI Generated]
  3358108, // Various Celebrità Fake [AI Generated]
  3581879, // AI Jennifer Love Hewett
]
