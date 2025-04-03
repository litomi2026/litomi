import { hashaMangaIds, hashaMangas } from '@/database/hasha'
import { getImageSrc } from '@/utils/manga'
import { getElementBySecureFisherYates } from '@/utils/random'

export type TAuthor = (typeof mockedPosts)[number]['author']
export type TPost = TPost2 & { parentPosts?: TPost2[] }
export type TPost2 = (typeof mockedPosts)[number]
export type TReferedPost = NonNullable<TPost['referredPost']>

export const mockedPosts = [
  {
    id: '15',
    createdAt: '2024-10-10T12:20:08.751Z',
    publishAt: '2024-10-10T12:20:08.751Z',
    status: 0,
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    author: {
      id: '35',
      name: '22895fe0-011e-4517-a5fa-c10c0fde4162',
      nickname: '열정적인 유혹자의 질서',
      profileImageURLs: ['https://pbs.twimg.com/media/GPI3mRXa8AAHuYs?format=jpg'],
    },
  },
  {
    id: '14',
    createdAt: '2024-07-31T15:35:35.465Z',
    updatedAt: '2024-08-17T15:53:37.803Z',
    publishAt: '2024-07-31T15:35:35.465Z',
    status: 0,
    content:
      'asdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdf',
    imageURLs: (() => {
      const randomMangaId = getElementBySecureFisherYates(hashaMangaIds)
      return hashaMangas[randomMangaId].images
        .slice(0, 4)
        .map((path) => getImageSrc({ cdn: 'HASHA', id: randomMangaId, path }))
    })(),
    referredPostId: '13',
    author: {
      id: '35',
      name: '22895fe0-011e-4517-a5fa-c10c0fde4162',
      nickname: '열정적인 유혹자의 질서',
      profileImageURLs: ['https://pbs.twimg.com/media/GPI3mRXa8AAHuYs?format=jpg'],
    },
    referredPost: {
      id: '13',
      createdAt: '2024-07-29T16:10:14.754Z',
      updatedAt: '2024-07-25T15:53:37.803Z',
      publishAt: '2024-07-28T16:10:14.754Z',
      category: 0,
      status: 0,
      content: 'asds',
      imageURLs: (() => {
        const randomMangaId = getElementBySecureFisherYates(hashaMangaIds)
        return hashaMangas[randomMangaId].images
          .slice(0, 4)
          .map((path) => getImageSrc({ cdn: 'HASHA', id: randomMangaId, path }))
      })(),
      author: {
        id: '42',
        name: '94895fe0-011e-4517-a5fa-c10c0fde4161',
        nickname: 'asd',
      },
    },
    viewCount: 1012,
    commentCount: '1',
  },
  {
    id: '13',
    createdAt: '2024-07-29T16:10:14.754Z',
    updatedAt: '2024-07-25T15:53:37.803Z',
    publishAt: '2024-07-28T16:10:14.754Z',
    status: 0,
    content: 'asds',
    imageURLs: (() => {
      const randomMangaId = getElementBySecureFisherYates(hashaMangaIds)
      return hashaMangas[randomMangaId].images
        .slice(0, 3)
        .map((path) => getImageSrc({ cdn: 'HASHA', id: randomMangaId, path }))
    })(),
    author: {
      id: '42',
      name: '94895fe0-011e-4517-a5fa-c10c0fde4161',
      nickname: 'asd',
    },
    referredPost: {
      id: '13',
      createdAt: '2024-07-29T16:10:14.754Z',
      updatedAt: '2024-07-25T15:53:37.803Z',
      publishAt: '2024-07-28T16:10:14.754Z',
      category: 0,
      status: 0,
      content: 'asds',
      imageURLs: (() => {
        const randomMangaId = getElementBySecureFisherYates(hashaMangaIds)
        return hashaMangas[randomMangaId].images
          .slice(0, 3)
          .map((path) => getImageSrc({ cdn: 'HASHA', id: randomMangaId, path }))
      })(),
      author: {
        id: '42',
        name: '94895fe0-011e-4517-a5fa-c10c0fde4161',
        nickname: 'asd',
      },
    },
    repostCount: '2',
  },
  {
    id: '9',
    createdAt: '2024-07-29T10:54:13.199Z',
    publishAt: '2024-07-29T10:54:13.199Z',
    status: 0,
    content: 'sdfasdf',
    imageURLs: (() => {
      const randomMangaId = getElementBySecureFisherYates(hashaMangaIds)
      return hashaMangas[randomMangaId].images
        .slice(0, 2)
        .map((path) => getImageSrc({ cdn: 'HASHA', id: randomMangaId, path }))
    })(),
    author: {
      id: '35',
      name: '22895fe0-011e-4517-a5fa-c10c0fde4162',
      nickname: '열정적인 유혹자의 질서',
      profileImageURLs: ['https://pbs.twimg.com/media/GPI3mRXa8AAHuYs?format=jpg'],
    },
    referredPost: {
      id: '13',
      createdAt: '2024-07-29T16:10:14.754Z',
      updatedAt: '2024-07-25T15:53:37.803Z',
      publishAt: '2024-07-28T16:10:14.754Z',
      category: 0,
      status: 0,
      content: 'asds',
      imageURLs: (() => {
        const randomMangaId = getElementBySecureFisherYates(hashaMangaIds)
        return hashaMangas[randomMangaId].images
          .slice(0, 2)
          .map((path) => getImageSrc({ cdn: 'HASHA', id: randomMangaId, path }))
      })(),
      author: {
        id: '42',
        name: '94895fe0-011e-4517-a5fa-c10c0fde4161',
        nickname: 'asd',
      },
    },
  },
  {
    id: '8',
    createdAt: '2024-07-27T16:52:36.186Z',
    publishAt: '2024-07-27T16:52:36.186Z',
    status: 0,
    content: 'asfasdf',
    imageURLs: (() => {
      const randomMangaId = getElementBySecureFisherYates(hashaMangaIds)
      return hashaMangas[randomMangaId].images
        .slice(0, 1)
        .map((path) => getImageSrc({ cdn: 'HASHA', id: randomMangaId, path }))
    })(),
    author: {
      id: '35',
      name: '22895fe0-011e-4517-a5fa-c10c0fde4162',
      nickname: '열정적인 유혹자의 질서',
      profileImageURLs: ['https://pbs.twimg.com/media/GPI3mRXa8AAHuYs?format=jpg'],
    },
    referredPost: {
      id: '13',
      createdAt: '2024-07-29T16:10:14.754Z',
      updatedAt: '2024-07-25T15:53:37.803Z',
      publishAt: '2024-07-28T16:10:14.754Z',
      category: 0,
      status: 0,
      content: 'asds',
      imageURLs: (() => {
        const randomMangaId = getElementBySecureFisherYates(hashaMangaIds)
        return hashaMangas[randomMangaId].images
          .slice(0, 1)
          .map((path) => getImageSrc({ cdn: 'HASHA', id: randomMangaId, path }))
      })(),
      author: {
        id: '42',
        name: '94895fe0-011e-4517-a5fa-c10c0fde4161',
        nickname: 'asd',
      },
    },
  },
  {
    id: '7',
    createdAt: '2024-07-27T06:30:56.578Z',
    publishAt: '2024-07-27T06:30:56.578Z',
    status: 0,
    content: 'sadf',
    imageURLs: (() => {
      const randomMangaId = getElementBySecureFisherYates(hashaMangaIds)
      return hashaMangas[randomMangaId].images
        .slice(0, 4)
        .map((path) => getImageSrc({ cdn: 'HASHA', id: randomMangaId, path }))
    })(),
    referredPostId: '13',
    author: {
      id: '35',
      name: '22895fe0-011e-4517-a5fa-c10c0fde4162',
      nickname: '열정적인 유혹자의 질서',
      profileImageURLs: ['https://pbs.twimg.com/media/GPI3mRXa8AAHuYs?format=jpg'],
    },
    referredPost: {
      id: '13',
      createdAt: '2024-07-29T16:10:14.754Z',
      updatedAt: '2024-07-25T15:53:37.803Z',
      publishAt: '2024-07-28T16:10:14.754Z',
      category: 0,
      status: 0,
      content: 'asds',
    },
    commentCount: '3',
  },
  {
    id: '6',
    createdAt: '2024-07-27T06:30:45.203Z',
    publishAt: '2024-07-27T06:30:45.203Z',
    status: 0,
    content: 'asdf',
    referredPostId: '3',
    author: {
      id: '35',
      name: '22895fe0-011e-4517-a5fa-c10c0fde4162',
      nickname: '열정적인 유혹자의 질서',
      profileImageURLs: ['https://pbs.twimg.com/media/GPI3mRXa8AAHuYs?format=jpg'],
    },
    referredPost: {
      id: '3',
      createdAt: '2024-07-26T11:37:23.225Z',
      publishAt: '2024-07-26T11:37:23.225Z',
      status: 0,
      content: 'asdf12',
      author: {
        id: '35',
        name: '22895fe0-011e-4517-a5fa-c10c0fde4162',
        nickname: '열정적인 유혹자의 질서',
        profileImageURLs: ['https://pbs.twimg.com/media/GPI3mRXa8AAHuYs?format=jpg'],
      },
    },
  },
  {
    id: '5',
    createdAt: '2024-07-26T16:28:01.650Z',
    publishAt: '2024-07-26T16:28:01.650Z',
    status: 0,
    content:
      'ㄴㅇㄹㅁㄴㄹㅁㄴㄹㅁㄴㄹㄴㅇㄹㅁㄴㄹㅁㄴㄹㅁㄴㄹㄴㅇㄹㅁㄴㄹㅁㄴㄹㅁㄴㄹㄴㅇㄹㅁㄴㄹㅁㄴㄹㅁㄴㄹㄴㅇㄹㅁㄴㄹㅁㄴㄹㅁㄴㄹㄴㅇㄹㅁㄴㄹㅁㄴㄹㅁㄴㄹㄴㅇㄹㅁㄴㄹㅁㄴㄹㅁㄴㄹㄴㅇㄹㅁㄴㄹㅁㄴㄹㅁㄴㄹㄴㅇㄹㅁㄴㄹㅁㄴㄹㅁㄴㄹㄴㅇㄹㅁㄴㄹㅁㄴㄹㅁㄴㄹㄴㅇㄹㅁㄴㄹㅁㄴㄹㅁㄴㄹㄴㅇㄹㅁㄴㄹㅁㄴㄹㅁㄴㄹㄴㅇㄹㅁㄴㄹㅁㄴㄹㅁㄴㄹㄴㅇㄹㅁㄴㄹㅁㄴㄹㅁㄴㄹㄴㅇㄹㅁㄴㄹㅁㄴㄹㅁㄴㄹ',
    author: {
      id: '35',
      name: '22895fe0-011e-4517-a5fa-c10c0fde4162',
      nickname: '열정적인 유혹자의 질서',
      profileImageURLs: ['https://pbs.twimg.com/media/GPI3mRXa8AAHuYs?format=jpg'],
    },
  },
  {
    id: '4',
    createdAt: '2024-07-26T16:27:43.480Z',
    publishAt: '2024-07-26T16:27:43.480Z',
    status: 0,
    content:
      '학교교육 및 평생교육을 포함한 교육제도와 그 운영, 교육재정 및 교원의 지위에 관한 기본적인 사항은 법률로 정한다. 이 헌법시행 당시의 대법원장과 대법원판사가 아닌 법관은 제1항 단서의 규정에 불구하고 이 헌법에 의하여 임명된 것으로 본다. 대통령이 임시회의 집회를 요구할 때에는 기간과 집회요구의 이유를 명시하여야 한다. 대한민국의 영토는 한반도와 그 부속도서로 한다. 국방상 또는 국민경제상 긴절한 필요로 인하여 법률이 정하는 경우를 제외하고는, 사영기업을 국유 또는 공유로 이전하거나 그 경영을 통제 또는 관리할 수 없다.',
    author: {
      id: '35',
      name: '22895fe0-011e-4517-a5fa-c10c0fde4162',
      nickname: '열정적인 유혹자의 질서',
      profileImageURLs: ['https://pbs.twimg.com/media/GPI3mRXa8AAHuYs?format=jpg'],
    },
  },
  {
    id: '3',
    createdAt: '2024-07-26T11:37:23.225Z',
    publishAt: '2024-07-26T11:37:23.225Z',
    status: 0,
    content: 'asdf12',
    author: {
      id: '35',
      name: '22895fe0-011e-4517-a5fa-c10c0fde4162',
      nickname: '열정적인 유혹자의 질서',
      profileImageURLs: ['https://pbs.twimg.com/media/GPI3mRXa8AAHuYs?format=jpg'],
    },
    likeCount: '2',
    commentCount: '2',
    repostCount: '2',
  },
  {
    id: '1',
    createdAt: '2024-07-07T12:46:59.455Z',
    publishAt: '2024-07-07T12:46:59.455Z',
    status: 0,
    content: 'asdfasdf',
  },
]
