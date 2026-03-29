import { describe, expect, it } from 'bun:test'

import { formatNumber } from '../format/number'

describe('formatNumber', () => {
  describe('English formatting (en)', () => {
    describe('numbers less than 1,000', () => {
      it('should return the number as is', () => {
        expect(formatNumber(0, 'en')).toBe('0')
        expect(formatNumber(1, 'en')).toBe('1')
        expect(formatNumber(99, 'en')).toBe('99')
        expect(formatNumber(999, 'en')).toBe('999')
      })
    })

    describe('thousands (1k - 999k)', () => {
      it('should format whole thousands without decimal', () => {
        expect(formatNumber(1000, 'en')).toBe('1k')
        expect(formatNumber(2000, 'en')).toBe('2k')
        expect(formatNumber(10000, 'en')).toBe('10k')
        expect(formatNumber(100000, 'en')).toBe('100k')
      })

      it('should format with appropriate decimal places for non-whole thousands', () => {
        // Values < 10K show 2 decimals
        expect(formatNumber(1100, 'en')).toBe('1.1k')
        expect(formatNumber(1500, 'en')).toBe('1.5k')
        expect(formatNumber(2700, 'en')).toBe('2.7k')
        expect(formatNumber(9900, 'en')).toBe('9.9k')
        expect(formatNumber(1234, 'en')).toBe('1.23k')
        expect(formatNumber(5678, 'en')).toBe('5.67k')
      })

      it('should floor to appropriate decimal places', () => {
        // Values < 10K floor to 2 decimals
        expect(formatNumber(1144, 'en')).toBe('1.14k')
        expect(formatNumber(1145, 'en')).toBe('1.14k')
        expect(formatNumber(1149, 'en')).toBe('1.14k')
        expect(formatNumber(1150, 'en')).toBe('1.15k')
        expect(formatNumber(1944, 'en')).toBe('1.94k')
        expect(formatNumber(1949, 'en')).toBe('1.94k')
        expect(formatNumber(1950, 'en')).toBe('1.95k')
        expect(formatNumber(1994, 'en')).toBe('1.99k')
        expect(formatNumber(1999, 'en')).toBe('1.99k')
        expect(formatNumber(2000, 'en')).toBe('2k')
      })

      it('should handle values with maximum 3 significant figures', () => {
        // Under 100K can have decimal (up to 3 significant figures)
        expect(formatNumber(12300, 'en')).toBe('12.3k')
        expect(formatNumber(12340, 'en')).toBe('12.3k')
        expect(formatNumber(12350, 'en')).toBe('12.3k')
        expect(formatNumber(12400, 'en')).toBe('12.4k')
        expect(formatNumber(99900, 'en')).toBe('99.9k')
        expect(formatNumber(99950, 'en')).toBe('99.9k')
        expect(formatNumber(100000, 'en')).toBe('100k')

        // 100K and above should not have decimal (to keep max 3 significant figures)
        expect(formatNumber(123000, 'en')).toBe('123k')
        expect(formatNumber(123400, 'en')).toBe('123k')
        expect(formatNumber(123900, 'en')).toBe('123k')
        expect(formatNumber(124000, 'en')).toBe('124k')
        expect(formatNumber(999000, 'en')).toBe('999k')
        expect(formatNumber(999900, 'en')).toBe('999k')
      })
    })

    describe('millions (1M+)', () => {
      it('should format whole millions without decimal', () => {
        expect(formatNumber(1000000, 'en')).toBe('1M')
        expect(formatNumber(2000000, 'en')).toBe('2M')
        expect(formatNumber(10000000, 'en')).toBe('10M')
        expect(formatNumber(100000000, 'en')).toBe('100M')
      })

      it('should format with appropriate decimal places for non-whole millions', () => {
        // Values < 10M show 2 decimals
        expect(formatNumber(1100000, 'en')).toBe('1.1M')
        expect(formatNumber(1500000, 'en')).toBe('1.5M')
        expect(formatNumber(2700000, 'en')).toBe('2.7M')
        expect(formatNumber(9900000, 'en')).toBe('9.9M')
        expect(formatNumber(1234000, 'en')).toBe('1.23M')
        expect(formatNumber(5678000, 'en')).toBe('5.67M')
      })

      it('should floor to appropriate decimal places', () => {
        // Values < 10M floor to 2 decimals
        expect(formatNumber(1144000, 'en')).toBe('1.14M')
        expect(formatNumber(1145000, 'en')).toBe('1.14M')
        expect(formatNumber(1149000, 'en')).toBe('1.14M')
        expect(formatNumber(1150000, 'en')).toBe('1.15M')
        expect(formatNumber(1944000, 'en')).toBe('1.94M')
        expect(formatNumber(1949000, 'en')).toBe('1.94M')
        expect(formatNumber(1950000, 'en')).toBe('1.95M')
        expect(formatNumber(1994000, 'en')).toBe('1.99M')
        expect(formatNumber(1999000, 'en')).toBe('1.99M')
        expect(formatNumber(2000000, 'en')).toBe('2M')
      })

      it('should handle values with maximum 3 significant figures', () => {
        // Under 100M can have decimal (up to 3 significant figures)
        expect(formatNumber(12300000, 'en')).toBe('12.3M')
        expect(formatNumber(12340000, 'en')).toBe('12.3M')
        expect(formatNumber(12350000, 'en')).toBe('12.3M')
        expect(formatNumber(12400000, 'en')).toBe('12.4M')
        expect(formatNumber(99900000, 'en')).toBe('99.9M')
        expect(formatNumber(99950000, 'en')).toBe('99.9M')
        expect(formatNumber(100000000, 'en')).toBe('100M')

        // 100M and above should not have decimal (to keep max 3 significant figures)
        expect(formatNumber(123000000, 'en')).toBe('123M')
        expect(formatNumber(123400000, 'en')).toBe('123M')
        expect(formatNumber(123900000, 'en')).toBe('123M')
        expect(formatNumber(124000000, 'en')).toBe('124M')
        expect(formatNumber(999000000, 'en')).toBe('999M')
        expect(formatNumber(999900000, 'en')).toBe('999M')
      })

      it('should handle very large numbers', () => {
        // These should now format as billions
        expect(formatNumber(1234000000, 'en')).toBe('1.23B')
        expect(formatNumber(12345000000, 'en')).toBe('12.3B')
      })
    })

    describe('billions (1B+)', () => {
      it('should format whole billions without decimal', () => {
        expect(formatNumber(1000000000, 'en')).toBe('1B')
        expect(formatNumber(2000000000, 'en')).toBe('2B')
        expect(formatNumber(10000000000, 'en')).toBe('10B')
        expect(formatNumber(100000000000, 'en')).toBe('100B')
      })

      it('should format with appropriate decimal places for non-whole billions', () => {
        // Values < 10B show 2 decimals
        expect(formatNumber(1100000000, 'en')).toBe('1.1B')
        expect(formatNumber(1500000000, 'en')).toBe('1.5B')
        expect(formatNumber(2700000000, 'en')).toBe('2.7B')
        expect(formatNumber(9900000000, 'en')).toBe('9.9B')
        expect(formatNumber(1234000000, 'en')).toBe('1.23B')
        expect(formatNumber(5678000000, 'en')).toBe('5.67B')
      })

      it('should floor to appropriate decimal places', () => {
        // Values < 10B floor to 2 decimals
        expect(formatNumber(1144000000, 'en')).toBe('1.14B')
        expect(formatNumber(1145000000, 'en')).toBe('1.14B')
        expect(formatNumber(1149000000, 'en')).toBe('1.14B')
        expect(formatNumber(1150000000, 'en')).toBe('1.15B')
        expect(formatNumber(1944000000, 'en')).toBe('1.94B')
        expect(formatNumber(1949000000, 'en')).toBe('1.94B')
        expect(formatNumber(1950000000, 'en')).toBe('1.95B')
        expect(formatNumber(1994000000, 'en')).toBe('1.99B')
        expect(formatNumber(1999000000, 'en')).toBe('1.99B')
        expect(formatNumber(2000000000, 'en')).toBe('2B')
      })

      it('should handle values with maximum 3 significant figures', () => {
        // Under 100B can have decimal (up to 3 significant figures)
        expect(formatNumber(12300000000, 'en')).toBe('12.3B')
        expect(formatNumber(12340000000, 'en')).toBe('12.3B')
        expect(formatNumber(12350000000, 'en')).toBe('12.3B')
        expect(formatNumber(12400000000, 'en')).toBe('12.4B')
        expect(formatNumber(99900000000, 'en')).toBe('99.9B')
        expect(formatNumber(99950000000, 'en')).toBe('99.9B')
        expect(formatNumber(100000000000, 'en')).toBe('100B')

        // 100B and above should not have decimal (to keep max 3 significant figures)
        expect(formatNumber(123000000000, 'en')).toBe('123B')
        expect(formatNumber(123400000000, 'en')).toBe('123B')
        expect(formatNumber(123900000000, 'en')).toBe('123B')
        expect(formatNumber(124000000000, 'en')).toBe('124B')
        expect(formatNumber(999000000000, 'en')).toBe('999B')
        expect(formatNumber(999900000000, 'en')).toBe('999B')
      })

      it('should handle extremely large numbers', () => {
        expect(formatNumber(1234000000000, 'en')).toBe('1,234B')
        expect(formatNumber(12345000000000, 'en')).toBe('12,345B')
      })
    })
  })

  describe('Korean formatting (ko)', () => {
    describe('numbers less than 10,000', () => {
      it('should format with thousands separator', () => {
        expect(formatNumber(0, 'ko')).toBe('0')
        expect(formatNumber(999, 'ko')).toBe('999')
        expect(formatNumber(1000, 'ko')).toBe('1,000')
        expect(formatNumber(9999, 'ko')).toBe('9,999')
      })
    })

    describe('ten thousands (만)', () => {
      it('should format whole ten thousands without decimal', () => {
        expect(formatNumber(10000, 'ko')).toBe('1만')
        expect(formatNumber(20000, 'ko')).toBe('2만')
        expect(formatNumber(100000, 'ko')).toBe('10만')
        expect(formatNumber(1000000, 'ko')).toBe('100만')
      })

      it('should format with one decimal place for non-whole ten thousands', () => {
        expect(formatNumber(11000, 'ko')).toBe('1.1만')
        expect(formatNumber(15000, 'ko')).toBe('1.5만')
        expect(formatNumber(27000, 'ko')).toBe('2.7만')
        expect(formatNumber(27500, 'ko')).toBe('2.7만')
        expect(formatNumber(99000, 'ko')).toBe('9.9만')
        expect(formatNumber(99500, 'ko')).toBe('9.9만')
      })
    })

    describe('hundred millions (억)', () => {
      it('should format whole hundred millions without decimal', () => {
        expect(formatNumber(100000000, 'ko')).toBe('1억')
        expect(formatNumber(200000000, 'ko')).toBe('2억')
        expect(formatNumber(1000000000, 'ko')).toBe('10억')
      })

      it('should format with one decimal place for non-whole hundred millions', () => {
        expect(formatNumber(110000000, 'ko')).toBe('1.1억')
        expect(formatNumber(150000000, 'ko')).toBe('1.5억')
        expect(formatNumber(270000000, 'ko')).toBe('2.7억')
        expect(formatNumber(275000000, 'ko')).toBe('2.7억')
        expect(formatNumber(990000000, 'ko')).toBe('9.9억')
        expect(formatNumber(995000000, 'ko')).toBe('9.9억')
      })
    })
  })

  describe('default locale', () => {
    it('should default to Korean formatting when locale is not specified', () => {
      expect(formatNumber(10000)).toBe('1만')
      expect(formatNumber(100000000)).toBe('1억')
    })
  })

  describe('other locales', () => {
    it('should use English formatting for non-Korean locales', () => {
      expect(formatNumber(1000, 'ja')).toBe('1k')
      expect(formatNumber(1000, 'zh-CN')).toBe('1k')
      expect(formatNumber(1000, 'zh-TW')).toBe('1k')
      expect(formatNumber(1000000, 'ja')).toBe('1M')
      expect(formatNumber(1000000, 'zh-CN')).toBe('1M')
      expect(formatNumber(1000000, 'zh-TW')).toBe('1M')
    })
  })
})
