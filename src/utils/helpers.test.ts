import {
  debounce,
  formatDate,
  generateId,
  // PREDEFINED_CATEGORIES is a const, not a function to test here
} from './helpers';

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
