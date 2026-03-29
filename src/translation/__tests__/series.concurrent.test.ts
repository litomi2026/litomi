import { describe, expect, test } from 'bun:test'

import { translateSeriesList } from '../series'

describe('translateSeriesList', () => {
  test('여러 시리즈를 번역한다', () => {
    const series = ['touhou_project', 'pokemon', 'unknown_series']
    const translated = translateSeriesList(series, 'ko')
    expect(translated).toEqual([
      { label: '동방 프로젝트', value: 'touhou_project' },
      { label: '포켓몬스터', value: 'pokemon' },
      { label: 'unknown series', value: 'unknown_series' },
    ])
  })

  test('빈 목록을 처리한다', () => {
    expect(translateSeriesList([], 'ko')).toEqual([])
  })
})

describe('translateSeriesListAsLabeledValues', () => {
  test('여러 시리즈를 번역해 label/value 형태로 반환한다', () => {
    const series = ['one_piece', 'dragon_ball']
    const translated = translateSeriesList(series, 'ko')
    expect(translated).toEqual([
      { value: 'one_piece', label: '원피스' },
      { value: 'dragon_ball', label: '드래곤볼' },
    ])
  })

  test('번역이 없는 시리즈도 처리한다', () => {
    const series = ['unknown_series', 'one_piece']
    const translated = translateSeriesList(series, 'ko')
    expect(translated).toEqual([
      { value: 'unknown_series', label: 'unknown series' },
      { value: 'one_piece', label: '원피스' },
    ])
  })

  test('빈 목록을 처리한다', () => {
    expect(translateSeriesList([], 'ko')).toEqual([])
  })

  test('지원하지 않는 로케일이면 영어로 대체한다', () => {
    const series = ['one_piece']
    const translated = translateSeriesList(series, 'zh-TW')
    expect(translated).toEqual([{ value: 'one_piece', label: 'One Piece' }])
  })

  test('알려진 시리즈를 한국어로 번역한다', () => {
    const series = ['touhou_project', 'fate_grand_order', 'pokemon']
    const translated = translateSeriesList(series, 'ko')
    expect(translated).toEqual([
      { label: '동방 프로젝트', value: 'touhou_project' },
      { label: '페이트/그랜드 오더', value: 'fate_grand_order' },
      { label: '포켓몬스터', value: 'pokemon' },
    ])
  })

  test('알려진 시리즈를 일본어로 번역한다', () => {
    const series = ['touhou_project', 'kantai_collection']
    const translated = translateSeriesList(series, 'ja')
    expect(translated).toEqual([
      { label: '東方Project', value: 'touhou_project' },
      { label: '艦隊これくしょん', value: 'kantai_collection' },
    ])
  })

  test('지원하지 않는 로케일이면 영어 번역을 반환한다', () => {
    const series = ['touhou_project']
    const translated = translateSeriesList(series, 'zh-CN')
    expect(translated).toEqual([{ label: 'Touhou Project', value: 'touhou_project' }])
  })

  test('번역이 없으면 원래 이름을 정규화해 반환한다', () => {
    const series = ['unknown_series', 'Some Random Series']
    const translated = translateSeriesList(series, 'ko')
    expect(translated).toEqual([
      { label: 'unknown series', value: 'unknown_series' },
      { label: 'some random series', value: 'some_random_series' },
    ])
  })
})
