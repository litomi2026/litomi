import { describe, expect, test } from 'bun:test'

import { translateSeriesList } from '../series'

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

  test('should translate known series to Korean', () => {
    const series = ['touhou_project', 'fate_grand_order', 'pokemon']
    const translated = translateSeriesList(series, 'ko')
    expect(translated).toEqual([
      { label: '동방 프로젝트', value: 'touhou_project' },
      { label: '페이트/그랜드 오더', value: 'fate_grand_order' },
      { label: '포켓몬스터', value: 'pokemon' },
    ])
  })

  test('should translate known series to Japanese', () => {
    const series = ['touhou_project', 'kantai_collection']
    const translated = translateSeriesList(series, 'ja')
    expect(translated).toEqual([
      { label: '東方Project', value: 'touhou_project' },
      { label: '艦隊これくしょん', value: 'kantai_collection' },
    ])
  })

  test('should return English translation when locale not available', () => {
    const series = ['touhou_project']
    const translated = translateSeriesList(series, 'zh-CN')
    expect(translated).toEqual([{ label: 'Touhou Project', value: 'touhou_project' }])
  })

  test('should return original name when no translation found', () => {
    const series = ['unknown_series', 'Some Random Series']
    const translated = translateSeriesList(series, 'ko')
    expect(translated).toEqual([
      { label: 'unknown series', value: 'unknown_series' },
      { label: 'Some Random Series', value: 'Some Random Series' },
    ])
  })
})
