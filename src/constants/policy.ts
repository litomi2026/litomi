export const MAX_BOOKMARK_FILE_SIZE = 1024 * 1024 // 1 MiB
export const MAX_BOOKMARKS_PER_USER = 500
export const MAX_CENSORSHIPS_PER_USER = 20
export const MAX_CREDENTIALS_PER_USER = 10
export const MAX_CRITERIA_NAME_LENGTH = 32
export const MAX_CRITERIA_PER_USER = 10
export const MAX_HARPI_MANGA_BATCH_SIZE = 10
export const MAX_KHENTAI_SEARCH_QUERY_LENGTH = 255
export const MAX_ITEMS_PER_LIBRARY = 200
export const MAX_LIBRARIES_PER_USER = 5
export const MAX_LIBRARY_NAME_LENGTH = 50
export const MAX_LIBRARY_DESCRIPTION_LENGTH = 100
export const MAX_MANGA_DESCRIPTION_LENGTH = 150
export const MAX_MANGA_TITLE_LENGTH = 50
export const MAX_NOTIFICATION_COUNT = 100
export const MAX_POST_CONTENT_LENGTH = 160
export const MAX_READING_HISTORY_PER_USER = 200
export const MAX_RATINGS_PER_USER = 200
export const MAX_RECENT_SEARCHES = 5
export const MAX_SEARCH_QUERY_LENGTH = 500
export const MAX_SEARCH_SUGGESTIONS = 10
export const MAX_THUMBNAIL_IMAGES = 4
export const MAX_TRUSTED_DEVICES_PER_USER = 5
export const MANGA_INITIAL_LINES = 1
export const TOUCH_VIEWER_IMAGE_PREFETCH_AMOUNT = 6
export const DONATION_CARD_INTERVAL = 20
export const MIN_SUGGESTION_QUERY_LENGTH = 2
export const SUGGESTION_DEBOUNCE_MS = 500
export const BOOKMARKS_PER_PAGE = 30
export const CENSORSHIPS_PER_PAGE = 10
export const LIBRARIES_PER_PAGE = 50
export const TOP_MANGA_PER_PAGE = 20
export const NOTIFICATION_PER_PAGE = 20
export const READING_HISTORY_PER_PAGE = 30
export const RATING_PER_PAGE = 30
export const POST_PER_PAGE = 20
export const LIBRARY_ITEMS_PER_PAGE = 30
export const LINK_PENDING_DELAY = 500
export const SCROLL_THROTTLE_MS = 200
export const SCROLL_THRESHOLD_PX = 10
export const REALTIME_PAGE_VIEW_MIN_THRESHOLD = 10

// NOTE: 꾸준히 올려줘야 함
export const LAST_VERIFIED_MANGA_ID = 3_700_000
export const MAX_MANGA_ID = LAST_VERIFIED_MANGA_ID * 2
export const TOTAL_HIYOBI_PAGES = 7800

export const LOGIN_ID_PATTERN = '^[a-zA-Z][a-zA-Z0-9_]*$'
export const PASSWORD_PATTERN = '^(?=.*[A-Za-z])(?=.*[0-9]).+$'
export const BACKUP_CODE_PATTERN = '^[A-Z0-9\\-]*$'

export const BLACKLISTED_MANGA_IDS = [
  2533746, // eun
  2643174, // Various Celebrità Fake [AI Generated]
  2648793, // Various Celebrità Fake [AI Generated]
  2653601, // Various Celebrità Fake [AI Generated]
  2697490, // EMMA WATSON [AI Generated]
  2701687, // Various Celebrità Fake [AI Generated]
  2704313, // Various Celebrità Fake [AI Generated]
  2706268, // Various Celebrità Fake [AI Generated]
  2726866, // Various Celebrità Fake [AI Generated]
  2730390, // Various Celebrità Fake [AI Generated]
  2806315, // Various Celebrità Fake [AI Generated]
  2806316, // Various Celebrità Fake [AI Generated]
  2808132, // ffxiv slut fakes
  2840933, // Various Celebrità Fake [AI Generated]
  2905292, // 张元英之财阀的快乐裸着表演 [AI Generated]
  2910760, // 张元英之财阀的快乐裸着表演 [AI Generated]
  2961989, // 韩书静[AI Generated]
  2972503, // Ai generated deepfakes
  3046732, // Various Celebrità Fake [AI Generated]
  3049568, // Various Celebrità Fake [AI Generated]
  3085567, // Various Celebrità Fake [AI Generated]
  3126327, // [AI Generated]
  3210070, // 美女迪丽热巴和网红们的私密照[AI Generated]
  3238607, // Various Celebrità Fake [AI Generated]
  3244525, // Various Celebrità Fake [AI Generated]
  3285228, // Various Celebrità Fake [AI Generated]
  3309543, // won
  3316020, // won 2
  3321467, // Various Celebrità Fake [AI Generated]
  3336264, // Various Celebrità Fake [AI Generated]
  3343193, // 美女网红明星原图去衣合集[AI Generated]
  3358108, // Various Celebrità Fake [AI Generated]
  3443970, // Flexible Summer Glau [Faceswap Fake] [AI Generated]
  3461364, // 澄澄汁
  3461373, // 澄澄汁
  3465500, // 澄澄汁
  3465503, // 澄澄汁
  3470143, // 自用
  3470147, // 秀儿
  3470294, // 秀儿
  3550045, // AI retouching laboratory 6 -remove clothing [AI Generated]
  3581879, // AI Jennifer Love Hewett
  3608418, // 自用
  3608422, // 自用
  3614486, // 自用
  3614490, // 自用
  3622379, // 全网露出收集大全
  3638123, // 李情深
  3638124, // 悍妇
  3638128, // 李情深
  3638133, // 悍妇
  3640303, // 凡青一 [AI Generated]
  3640308, // 凡青一 [AI Generated]

  /* uploader:david80740 */
  3678046,
  3678072,
  3678085,
  3678089,
  3679464,
  3679604,
  3679686,
  3679856,
  3680088,
  3680895,
  3681088,
  3681242,
  3682455,
  3683593,
  3684286,
  3684788,
  3685441,
  3686014,
  3686387,
  3686960,
  3687895,
  3688424,
  3689279,
  3689716,
  3690040,
  3691037,
  3691316,
  3692623,
  3692908,
  3693354,
  3694168,
  3694774,
  3695827,
  3696328,
  3696744,
  3697623,
  3697992,
  3698376,
  3699250,
  3699588,
  3699912,
  3700905,
  3701298,
  3701701,
  3702504,
  3703009,
  3703120,
  3703482,
  3704490,
  3704917,
  3705399,
  3706228,
  3706883,
  3707297,
  3708215,
  3708803,
  3710198,
  3710508,
]
