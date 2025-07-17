import { describe, expect, test } from 'bun:test'

import { translateSeries, translateSeriesList } from '../series'

describe('series-translations', () => {
  describe('translateSeries', () => {
    test('should translate known series to Korean', () => {
      expect(translateSeries('touhou_project', 'ko')).toBe('동방 프로젝트')
      expect(translateSeries('fate_grand_order', 'ko')).toBe('페이트/그랜드 오더')
      expect(translateSeries('pokemon', 'ko')).toBe('포켓몬스터')
    })

    test('should translate known series to Japanese', () => {
      expect(translateSeries('touhou_project', 'ja')).toBe('東方Project')
      expect(translateSeries('kantai_collection', 'ja')).toBe('艦隊これくしょん')
    })

    test('should return English translation when locale not available', () => {
      expect(translateSeries('touhou_project', 'zh-CN')).toBe('Touhou Project')
    })

    test('should return original name when no translation found', () => {
      expect(translateSeries('unknown_series', 'ko')).toBe('unknown series')
      expect(translateSeries('Some Random Series', 'ko')).toBe('Some Random Series')
    })
  })

  describe('translateSeriesList', () => {
    test('should translate multiple series', () => {
      const series = ['touhou_project', 'pokemon', 'unknown_series']
      const translated = translateSeriesList(series, 'ko')
      expect(translated).toEqual([
        { label: '동방 프로젝트', value: 'touhou_project' },
        { label: '포켓몬스터', value: 'pokemon' },
        { label: 'unknown series', value: 'unknown_series' },
      ])
    })

    test('should handle empty list', () => {
      expect(translateSeriesList([], 'ko')).toEqual([])
    })
  })

  describe('translateSeriesListAsLabeledValues', () => {
    test('should translate multiple series and return as labeled values', () => {
      const series = ['one_piece', 'dragon_ball']
      const translated = translateSeriesList(series, 'ko')
      expect(translated).toEqual([
        { value: 'one_piece', label: '원피스' },
        { value: 'dragon_ball', label: '드래곤볼' },
      ])
    })

    test('should handle series without translation', () => {
      const series = ['unknown_series', 'one_piece']
      const translated = translateSeriesList(series, 'ko')
      expect(translated).toEqual([
        { value: 'unknown_series', label: 'unknown series' },
        { value: 'one_piece', label: '원피스' },
      ])
    })

    test('should handle empty list', () => {
      expect(translateSeriesList([], 'ko')).toEqual([])
    })

    test('should use English fallback when locale not available', () => {
      const series = ['one_piece']
      const translated = translateSeriesList(series, 'zh-TW')
      expect(translated).toEqual([{ value: 'one_piece', label: 'One Piece' }])
    })
  })
})
