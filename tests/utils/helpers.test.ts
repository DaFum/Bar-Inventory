import {
  debounce,
  formatDate,
  generateId,
  // PREDEFINED_CATEGORIES is a const, not a function to test here
} from '../../src/utils/helpers';

// No external mocks needed for these functions unless they had complex internal dependencies

describe('Utility Functions from helpers.ts', () => {
  beforeEach(() => {
    jest.useRealTimers(); // Ensure real timers for debounce tests by default
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clears spy calls, etc.
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers(); // Restore real timers after debounce tests
    });

    it('should execute the function after the delay', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled(); // Not called immediately

      jest.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled(); // Still not called

      jest.advanceTimersByTime(50); // Total 100ms
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should only execute the last call if called multiple times within delay', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn(1);
      debouncedFn(2);
      jest.advanceTimersByTime(50);
      debouncedFn(3); // This call should reset the timer

      jest.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled(); // Not yet (50ms after last call)

      jest.advanceTimersByTime(50); // Total 100ms after last call
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith(3); // Only the last call's args
    });

    it('should correctly apply `this` context and arguments', () => {
        const mockFn = jest.fn();
        const context = { value: 42 };
        const debouncedFn = debounce(mockFn, 100);

        debouncedFn.call(context, 'arg1', 'arg2');

        jest.advanceTimersByTime(100);
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
        expect(mockFn.mock.instances[0]).toBe(context); // Check 'this' context
      });
  });

  describe('formatDate', () => {
    it('should format a date object to "DD.MM.YYYY, HH:MM:SS" with de-DE locale by default', () => {
      const date = new Date(2023, 0, 25, 14, 30, 15); // Month is 0-indexed (0 for January)
      // Expected format: 25.01.2023, 14:30:15 (or similar based on exact toLocaleString output)
      // toLocaleString can be slightly variable, so we check for components
      const formatted = formatDate(date);
      expect(formatted).toContain('25.01.2023');
      expect(formatted).toContain('14:30:15');
    });

    it('should use provided locale for formatting', () => {
      const date = new Date(2023, 0, 25, 14, 30, 15);
      // US format: 1/25/2023, 2:30:15 PM (or similar)
      const formatted = formatDate(date, 'en-US');
      expect(formatted).toContain('1/25/2023');
      // Time part can vary (AM/PM), so check for hour component
      expect(formatted).toMatch(/2:30:15\s*(?:AM|PM)?/i);
    });

    it('should handle different date components correctly', () => {
        const date = new Date(2021, 8, 5, 8, 5, 5); // September 5, 2021, 08:05:05
        const formatted = formatDate(date);
        expect(formatted).toContain('05.09.2021');
        expect(formatted).toContain('08:05:05');
    });
  });

  describe('generateId', () => {
    it('should generate an ID with the default prefix "id" if none is provided', () => {
      const id = generateId();
      expect(id.startsWith('id_')).toBe(true);
    });

    it('should generate an ID with a custom prefix', () => {
      const prefix = 'customPrefix';
      const id = generateId(prefix);
      expect(id.startsWith(prefix + '_')).toBe(true);
    });

    it('should generate IDs of a certain pattern (prefix + random part)', () => {
      const id = generateId('test');
      // Example: test_a1b2c3d4e (prefix_ + 9 random chars from Math.random)
      expect(id).toMatch(/^test_[a-z0-9]{9}$/);
    });

    it('should generate different IDs on subsequent calls (due to Math.random)', () => {
      const id1 = generateId('rand');
      const id2 = generateId('rand');
      expect(id1).not.toBe(id2);
    });
  });
});

  // Additional comprehensive tests for edge cases and error conditions

  describe('debounce - Additional Edge Cases', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should handle zero delay', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 0);

      debouncedFn();
      
      jest.runAllTimers();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle negative delay (should treat as 0)', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, -100);

      debouncedFn();
      
      jest.runAllTimers();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle very large delay values', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, Number.MAX_SAFE_INTEGER);

      debouncedFn();
      jest.advanceTimersByTime(1000);
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should handle multiple arguments correctly', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2', 'arg3', { key: 'value' }, [1, 2, 3]);

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3', { key: 'value' }, [1, 2, 3]);
    });

    it('should handle undefined and null arguments', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn(undefined, null);

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledWith(undefined, null);
    });

    it('should not interfere with separate debounced instances', () => {
      const mockFn1 = jest.fn();
      const mockFn2 = jest.fn();
      const debouncedFn1 = debounce(mockFn1, 100);
      const debouncedFn2 = debounce(mockFn2, 200);

      debouncedFn1('call1');
      debouncedFn2('call2');

      jest.advanceTimersByTime(100);
      expect(mockFn1).toHaveBeenCalledWith('call1');
      expect(mockFn2).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100); // Total 200ms
      expect(mockFn2).toHaveBeenCalledWith('call2');
    });

    it('should handle function that throws an error', () => {
      const errorFn = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      const debouncedFn = debounce(errorFn, 100);

      debouncedFn();

      expect(() => {
        jest.advanceTimersByTime(100);
      }).toThrow('Test error');
    });

    it('should preserve function return value context', () => {
      const mockFn = jest.fn().mockReturnValue('test result');
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalled();
      expect(mockFn).toReturnWith('test result');
    });

    it('should handle rapid successive calls correctly', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      // Call 5 times rapidly
      debouncedFn('call1');
      debouncedFn('call2');
      debouncedFn('call3');
      debouncedFn('call4');
      debouncedFn('call5');

      // Should not be called yet
      expect(mockFn).not.toHaveBeenCalled();

      // Fast forward time
      jest.advanceTimersByTime(100);

      // Should only be called once with the last arguments
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call5');
    });

    it('should handle clearTimeout edge cases', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      // Call once
      debouncedFn('first');
      
      // Advance part way
      jest.advanceTimersByTime(50);
      
      // Call again (should reset timer)
      debouncedFn('second');
      
      // Advance another 50ms (total 100ms from start, but only 50ms from second call)
      jest.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled();
      
      // Advance another 50ms (100ms from second call)
      jest.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledWith('second');
    });
  });

  describe('formatDate - Additional Edge Cases', () => {
    it('should handle invalid date objects', () => {
      const invalidDate = new Date('invalid');
      const formatted = formatDate(invalidDate);
      expect(formatted).toBe('Invalid Date');
    });

    it('should handle edge case dates', () => {
      // Test leap year
      const leapYear = new Date(2020, 1, 29, 12, 0, 0); // Feb 29, 2020
      const formatted = formatDate(leapYear);
      expect(formatted).toContain('29.02.2020');

      // Test year 2000 (century leap year)
      const y2k = new Date(2000, 0, 1, 0, 0, 0);
      const formattedY2k = formatDate(y2k);
      expect(formattedY2k).toContain('01.01.2000');
    });

    it('should handle very old dates', () => {
      const oldDate = new Date(1901, 0, 1, 0, 0, 0);
      const formatted = formatDate(oldDate);
      expect(formatted).toContain('01.01.1901');
    });

    it('should handle very future dates', () => {
      const futureDate = new Date(2099, 11, 31, 23, 59, 59);
      const formatted = formatDate(futureDate);
      expect(formatted).toContain('31.12.2099');
      expect(formatted).toContain('23:59:59');
    });

    it('should handle midnight and noon edge cases', () => {
      const midnight = new Date(2023, 5, 15, 0, 0, 0);
      const noon = new Date(2023, 5, 15, 12, 0, 0);
      
      const midnightFormatted = formatDate(midnight);
      const noonFormatted = formatDate(noon);
      
      expect(midnightFormatted).toContain('00:00:00');
      expect(noonFormatted).toContain('12:00:00');
    });

    it('should handle different timezone scenarios consistently', () => {
      // Test with various locales that handle timezones differently
      const date = new Date(2023, 5, 15, 12, 30, 45);
      
      const deFormat = formatDate(date, 'de-DE');
      const usFormat = formatDate(date, 'en-US');
      const jpFormat = formatDate(date, 'ja-JP');
      
      expect(deFormat).toBeTruthy();
      expect(usFormat).toBeTruthy();
      expect(jpFormat).toBeTruthy();
      
      // Each should have a date and time component
      expect(deFormat).toMatch(/\d{2}\.\d{2}\.\d{4}.*\d{2}:\d{2}:\d{2}/);
    });

    it('should handle edge case locale strings', () => {
      const date = new Date(2023, 5, 15, 12, 30, 45);
      
      // Test with locale that might not be supported - should fallback gracefully
      const formatted = formatDate(date, 'xx-XX');
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('should handle single digit date components with proper padding', () => {
      const date = new Date(2023, 0, 5, 8, 5, 5); // Jan 5, 2023, 08:05:05
      const formatted = formatDate(date);
      
      // Check that single digits are properly padded in German locale
      expect(formatted).toContain('05.01.2023');
      expect(formatted).toContain('08:05:05');
    });

    it('should handle December 31st and January 1st correctly', () => {
      const newYearsEve = new Date(2023, 11, 31, 23, 59, 59);
      const newYearsDay = new Date(2024, 0, 1, 0, 0, 1);
      
      const eveFormatted = formatDate(newYearsEve);
      const dayFormatted = formatDate(newYearsDay);
      
      expect(eveFormatted).toContain('31.12.2023');
      expect(eveFormatted).toContain('23:59:59');
      expect(dayFormatted).toContain('01.01.2024');
      expect(dayFormatted).toContain('00:00:01');
    });

    it('should consistently format the same date object', () => {
      const date = new Date(2023, 5, 15, 12, 30, 45);
      
      const formatted1 = formatDate(date);
      const formatted2 = formatDate(date);
      const formatted3 = formatDate(date);
      
      expect(formatted1).toBe(formatted2);
      expect(formatted2).toBe(formatted3);
    });
  });

  describe('generateId - Additional Edge Cases', () => {
    it('should handle empty string prefix', () => {
      const id = generateId('');
      expect(id.startsWith('_')).toBe(true);
      expect(id.length).toBe(10); // '_' + 9 random chars
    });

    it('should handle whitespace in prefix', () => {
      const id = generateId('test prefix');
      expect(id.startsWith('test prefix_')).toBe(true);
    });

    it('should handle special characters in prefix', () => {
      const specialPrefix = 'test-prefix_123!@#';
      const id = generateId(specialPrefix);
      expect(id.startsWith(specialPrefix + '_')).toBe(true);
    });

    it('should handle very long prefix', () => {
      const longPrefix = 'a'.repeat(1000);
      const id = generateId(longPrefix);
      expect(id.startsWith(longPrefix + '_')).toBe(true);
      expect(id.length).toBe(1000 + 1 + 9); // prefix + '_' + 9 random chars
    });

    it('should handle unicode characters in prefix', () => {
      const unicodePrefix = 'test_🚀_ñ_中文';
      const id = generateId(unicodePrefix);
      expect(id.startsWith(unicodePrefix + '_')).toBe(true);
    });

    it('should generate consistent pattern across multiple calls', () => {
      const ids = [];
      for (let i = 0; i < 100; i++) {
        ids.push(generateId('test'));
      }
      
      // All should follow the same pattern
      ids.forEach(id => {
        expect(id).toMatch(/^test_[a-z0-9]{9}$/);
      });
      
      // All should be unique
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(100);
    });

    it('should generate IDs with proper entropy (collision resistance)', () => {
      const idsSet = new Set();
      const iterations = 10000;
      
      for (let i = 0; i < iterations; i++) {
        idsSet.add(generateId('collision'));
      }
      
      // Should have no collisions (or very few due to Math.random)
      expect(idsSet.size).toBeGreaterThan(iterations * 0.99); // Allow for tiny collision chance
    });

    it('should handle numeric-looking prefixes', () => {
      const numericPrefix = '12345';
      const id = generateId(numericPrefix);
      expect(id.startsWith('12345_')).toBe(true);
      expect(id).toMatch(/^12345_[a-z0-9]{9}$/);
    });

    it('should generate random part with correct character set', () => {
      const id = generateId('test');
      const randomPart = id.substring(5); // Remove 'test_'
      
      // Should only contain lowercase letters and numbers
      expect(randomPart).toMatch(/^[a-z0-9]{9}$/);
      expect(randomPart).not.toMatch(/[A-Z]/);
      expect(randomPart).not.toMatch(/[^a-z0-9]/);
    });

    it('should generate exactly 9 character random part', () => {
      const ids = [
        generateId('a'),
        generateId(''),
        generateId('very_long_prefix_here'),
      ];
      
      ids.forEach(id => {
        const parts = id.split('_');
        const randomPart = parts[parts.length - 1];
        expect(randomPart.length).toBe(9);
      });
    });

    it('should handle prefix with underscores', () => {
      const prefixWithUnderscore = 'test_prefix_with_underscores';
      const id = generateId(prefixWithUnderscore);
      expect(id.startsWith(prefixWithUnderscore + '_')).toBe(true);
      
      // Should end with exactly 9 random characters
      const parts = id.split('_');
      const lastPart = parts[parts.length - 1];
      expect(lastPart.length).toBe(9);
    });
  });

  describe('PREDEFINED_CATEGORIES constant', () => {
    it('should export PREDEFINED_CATEGORIES constant', () => {
      const { PREDEFINED_CATEGORIES } = require('../../src/utils/helpers');
      expect(PREDEFINED_CATEGORIES).toBeDefined();
      expect(Array.isArray(PREDEFINED_CATEGORIES)).toBe(true);
    });

    it('should contain expected category values', () => {
      const { PREDEFINED_CATEGORIES } = require('../../src/utils/helpers');
      const expectedCategories = [
        'Spirituose',
        'Bier', 
        'Wein',
        'Softdrink',
        'Sirup',
        'Sonstiges',
      ];
      
      expect(PREDEFINED_CATEGORIES).toEqual(expectedCategories);
    });

    it('should not be modifiable (if frozen)', () => {
      const { PREDEFINED_CATEGORIES } = require('../../src/utils/helpers');
      
      // Test if array is frozen
      expect(() => {
        PREDEFINED_CATEGORIES.push('NewCategory');
      }).toThrow();
    });
  });

  describe('Integration Tests - Function Interactions', () => {
    it('should work correctly when functions are composed together', () => {
      jest.useFakeTimers();
      
      const mockFn = jest.fn((prefix: string) => {
        const id = generateId(prefix);
        const date = new Date(2023, 5, 15, 12, 30, 45);
        return `${id}: ${formatDate(date)}`;
      });
      
      const debouncedComposedFn = debounce(mockFn, 100);
      
      debouncedComposedFn('test');
      jest.advanceTimersByTime(100);
      
      expect(mockFn).toHaveBeenCalledWith('test');
      const result = mockFn.mock.results[0].value;
      expect(result).toMatch(/^test_[a-z0-9]{9}: 15\.06\.2023, 12:30:45$/);
      
      jest.useRealTimers();
    });

    it('should maintain performance characteristics under load', () => {
      jest.useFakeTimers();
      
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 50);
      
      // Simulate rapid calls
      for (let i = 0; i < 1000; i++) {
        debouncedFn(i);
      }
      
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith(999); // Last call wins
      
      jest.useRealTimers();
    });

    it('should handle concurrent usage of all utilities', () => {
      jest.useFakeTimers();
      
      const results: string[] = [];
      const mockLogger = jest.fn((message: string) => {
        results.push(message);
      });
      
      const debouncedLogger = debounce(mockLogger, 100);
      
      // Generate multiple IDs and format dates
      for (let i = 0; i < 5; i++) {
        const id = generateId(`item${i}`);
        const date = new Date(2023, i, i + 1, i, i, i);
        const formattedDate = formatDate(date);
        debouncedLogger(`${id}: ${formattedDate}`);
      }
      
      jest.advanceTimersByTime(100);
      
      expect(mockLogger).toHaveBeenCalledTimes(1);
      expect(results).toHaveLength(1);
      expect(results[0]).toMatch(/^item4_[a-z0-9]{9}: \d{2}\.\d{2}\.2023, \d{2}:\d{2}:\d{2}$/);
      
      jest.useRealTimers();
    });
  });

  describe('Type Safety and Error Handling', () => {
    it('should handle debounce with different function signatures', () => {
      jest.useFakeTimers();
      
      const voidFn = jest.fn();
      const returnFn = jest.fn().mockReturnValue('result');
      const asyncFn = jest.fn().mockResolvedValue('async result');
      
      const debouncedVoid = debounce(voidFn, 100);
      const debouncedReturn = debounce(returnFn, 100);
      const debouncedAsync = debounce(asyncFn, 100);
      
      debouncedVoid();
      debouncedReturn();
      debouncedAsync();
      
      jest.advanceTimersByTime(100);
      
      expect(voidFn).toHaveBeenCalled();
      expect(returnFn).toHaveBeenCalled();
      expect(asyncFn).toHaveBeenCalled();
      
      jest.useRealTimers();
    });

    it('should maintain function identity and properties', () => {
      const namedFunction = function testFunction() { return 'test'; };
      const debouncedNamed = debounce(namedFunction, 100);
      
      expect(typeof debouncedNamed).toBe('function');
    });

    it('should handle edge cases in Math.random behavior', () => {
      // Mock Math.random to return specific values
      const originalRandom = Math.random;
      
      // Test with minimum possible value
      Math.random = jest.fn().mockReturnValue(0);
      let id = generateId('min');
      expect(id).toMatch(/^min_[a-z0-9]{9}$/);
      
      // Test with maximum possible value (just under 1)
      Math.random = jest.fn().mockReturnValue(0.9999999999);
      id = generateId('max');
      expect(id).toMatch(/^max_[a-z0-9]{9}$/);
      
      // Restore original Math.random
      Math.random = originalRandom;
    });
  });
