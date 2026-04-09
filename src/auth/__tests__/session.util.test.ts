import { describe, expect, test } from 'bun:test'

import { buildSessionDeviceLabel } from '../session.util'

describe('buildSessionDeviceLabel', () => {
  test('raw user-agent 대신 축약된 기기 라벨만 만든다', () => {
    const label = buildSessionDeviceLabel(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
    )

    expect(label).toBe('Chrome macOS 데스크톱')
    expect(label).not.toContain('Mozilla/5.0')
    expect(label).not.toContain('146.0.0.0')
  })

  test('모바일 브라우저는 모바일 기기로 축약한다', () => {
    const label = buildSessionDeviceLabel(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
    )

    expect(label).toBe('Mobile Safari iOS 모바일')
  })

  test('user-agent가 없으면 null을 반환한다', () => {
    expect(buildSessionDeviceLabel(null)).toBeNull()
    expect(buildSessionDeviceLabel(undefined)).toBeNull()
    expect(buildSessionDeviceLabel('unknown')).toBeNull()
  })
})
