import { getRequestIP, getRequestUserAgent } from '@litomi/http/request'
import { describe, expect, test } from 'bun:test'

describe('request helpers', () => {
  test('CF-Connecting-IP를 가장 우선해서 사용한다', () => {
    const headers = new Headers({
      'CF-Connecting-IP': '198.51.100.10',
      'x-forwarded-for': '203.0.113.1, 203.0.113.2',
      'x-real-ip': '192.0.2.1',
    })

    expect(getRequestIP(headers)).toBe('198.51.100.10')
  })

  test('x-forwarded-for에서는 첫 번째 IP만 사용한다', () => {
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.1, 203.0.113.2, 203.0.113.3',
    })

    expect(getRequestIP(headers)).toBe('203.0.113.1')
  })

  test('IP 헤더가 없으면 unknown을 반환한다', () => {
    expect(getRequestIP(new Headers())).toBe('unknown')
  })

  test('user-agent가 없으면 sec-ch-ua로 대체한다', () => {
    const headers = new Headers({
      'sec-ch-ua': '"Chromium";v="135"',
    })

    expect(getRequestUserAgent(headers)).toBe('"Chromium";v="135"')
  })

  test('User-Agent 헤더가 모두 없으면 unknown을 반환한다', () => {
    expect(getRequestUserAgent(new Headers())).toBe('unknown')
  })
})
