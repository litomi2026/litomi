export enum MangaInfoType {
  ARTISTS = 0,
  CHARACTERS = 1,
  TAGS = 2,
  SERIES = 3,
  GROUP = 4,
}

export function encodeMangaType(key: string) {
  switch (key) {
    case 'doujinshi':
      return 1
    case 'manga':
      return 2
    case 'artist CG':
      return 3
    case 'game CG':
      return 4
    case 'image set':
      return 5
    case 'anime':
      return 6
    default:
      return 0
  }
}

export function decodeMangaType(key: number) {
  switch (key) {
    case 1:
      return 'doujinshi'
    case 2:
      return 'manga'
    case 3:
      return 'artist CG'
    case 4:
      return 'game CG'
    case 5:
      return 'image set'
    case 6:
      return 'anime'
    default:
      return ''
  }
}
