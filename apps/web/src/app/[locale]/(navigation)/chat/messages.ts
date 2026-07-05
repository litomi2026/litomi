import { Locale } from '@litomi/domain/locale'

import type { LocalizedMessages } from '@/i18n/messages'

export const messages = {
  [Locale.KO]: {
    AIChat: {
      sessionExpired: '로그인 정보가 만료됐어요',
      modelRemoved: '모델을 삭제했어요',
      gpuDisconnected: 'GPU 연결이 끊겼어요. 다시 시도해 주세요',
      generateFailed: '응답을 생성하지 못했어요',
    },
  },
  [Locale.EN]: {
    AIChat: {
      sessionExpired: 'Your login has expired.',
      modelRemoved: 'Model removed.',
      gpuDisconnected: 'GPU connection lost. Please try again.',
      generateFailed: 'Could not generate a response.',
    },
  },
  [Locale.JA]: {
    AIChat: {
      sessionExpired: 'ログイン情報の有効期限が切れました',
      modelRemoved: 'モデルを削除しました',
      gpuDisconnected: 'GPU接続が切断されました。もう一度お試しください',
      generateFailed: '応答を生成できませんでした',
    },
  },
  [Locale.ZH_CN]: {
    AIChat: {
      sessionExpired: '登录信息已过期',
      modelRemoved: '已删除模型',
      gpuDisconnected: 'GPU 连接已断开，请重试',
      generateFailed: '无法生成回复',
    },
  },
} satisfies LocalizedMessages
