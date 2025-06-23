import {
  debounce,
  throttle,
  formatCurrency,
  formatDate,
  validateEmail,
  validatePhone,
  deepClone,
  mergeObjects,
  arrayToObject,
  objectToArray,
  capitalizeFirstLetter,
  truncateString,
  generateRandomId,
  isEmptyObject,
  removeObjectProperty,
  getNestedProperty,
  setNestedProperty,
  flattenArray,
  uniqueArray,
  groupByProperty,
  sortObjectsByProperty,
  parseQueryString,
  buildQueryString,
  sanitizeString,
  escapeHtml,
  unescapeHtml,
  calculateAge,
  isValidDate,
  addDays,
  subtractDays,
  formatFileSize,
  downloadFile,
  uploadFile,
  copyToClipboard,
  getUrlParameter,
  setUrlParameter,
  removeUrlParameter,
  isMobile,
  isTablet,
  isDesktop,
  getBrowserInfo,
  getOSInfo,
  localStorage,
  sessionStorage,
  cookie,
  retry,
  timeout,
  promiseAllSettled,
  waitForElement,
  observeElement,
  calculateDistance,
  generateHash,
  compareVersions,
  normalizeText,
  highlightText,
  extractTextFromHtml,
  convertToSlug,
  generatePassword,
  validatePassword,
  encryptData,
  decryptData,
  compressData,
  decompressData,
  formatPhoneNumber,
  formatSSN,
  formatCreditCard,
  validateCreditCard,
  calculateTax,
  calculateDiscount,
  calculateTip,
  convertCurrency,
  formatNumber,
  parseNumber,
  roundToDecimal,
  clamp,
  randomBetween,
  shuffle,
  sample,
  chunk,
  partition,
  intersection,
  union,
  difference,
  symmetricDifference,
  zip,
  unzip,
  transpose,
  memoize,
  once,
  curry,
  compose,
  pipe,
  partial,
  bind,
  noop,
  identity,
  constant,
  times,
  range,
  fill,
  pad,
  repeat,
  reverse,
  sort,
  binarySearch,
  linearSearch,
  insertionSort,
  bubbleSort,
  quickSort,
  mergeSort,
  heapSort,
  radixSort,
  countingSort,
  bucketSort,
  shellSort,
  selectionSort
} from './helpers';

// Mock external dependencies
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => Buffer.from('mockrandomdata')),
  createHash: jest.fn(() => ({
    update: jest.fn(() => ({
      digest: jest.fn(() => 'mockhash')
    }))
  }))
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn()
}));

// Mock window and document for browser-specific functions
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://example.com?param=value',
    search: '?param=value'
  },
  writable: true
});

Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    clipboard: {
      writeText: jest.fn()
    }
  },
  writable: true
});

Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => ({
    click: jest.fn(),
    href: '',
    download: ''
  })),
  writable: true
});

describe('Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('debounce', () => {
    it('should debounce function calls', (done) => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      expect(mockFn).not.toHaveBeenCalled();
      
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
        done();
      }, 150);
    });

    it('should handle immediate execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100, true);
      
      debouncedFn();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle null/undefined function', () => {
      expect(() => debounce(null as any, 100)).toThrow();
      expect(() => debounce(undefined as any, 100)).toThrow();
    });

    it('should handle negative delay', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, -100);
      debouncedFn();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous debounced calls', (done) => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn();
      setTimeout(() => debouncedFn(), 50);
      
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
        done();
      }, 200);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', (done) => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);
      
      throttledFn();
      throttledFn();
      throttledFn();
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      setTimeout(() => {
        throttledFn();
        expect(mockFn).toHaveBeenCalledTimes(2);
        done();
      }, 150);
    });

    it('should handle trailing calls', (done) => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100, { trailing: true });
      
      throttledFn();
      throttledFn();
      
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(2);
        done();
      }, 150);
    });

    it('should handle null/undefined function', () => {
      expect(() => throttle(null as any, 100)).toThrow();
      expect(() => throttle(undefined as any, 100)).toThrow();
    });

    it('should handle leading option', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100, { leading: false });
      
      throttledFn();
      expect(mockFn).not.toHaveBeenCalled();
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
      expect(formatCurrency(1234.56, 'USD', 'en-US')).toBe('$1,234.56');
    });

    it('should handle zero values', () => {
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(0.00)).toBe('$0.00');
    });

    it('should handle negative values', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });

    it('should handle invalid inputs', () => {
      expect(() => formatCurrency('invalid' as any)).toThrow();
      expect(() => formatCurrency(null as any)).toThrow();
      expect(() => formatCurrency(undefined as any)).toThrow();
    });

    it('should handle different locales', () => {
      expect(formatCurrency(1234.56, 'EUR', 'de-DE')).toBe('1.234,56 €');
      expect(formatCurrency(1234.56, 'JPY', 'ja-JP')).toBe('¥1,235');
    });

    it('should handle large numbers', () => {
      expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
    });

    it('should handle small decimal values', () => {
      expect(formatCurrency(0.01)).toBe('$0.01');
      expect(formatCurrency(0.001)).toBe('$0.00');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2023-12-25T10:30:00Z');

    it('should format date with default format', () => {
      expect(formatDate(testDate)).toBe('12/25/2023');
    });

    it('should format date with custom format', () => {
      expect(formatDate(testDate, 'YYYY-MM-DD')).toBe('2023-12-25');
      expect(formatDate(testDate, 'DD/MM/YYYY')).toBe('25/12/2023');
      expect(formatDate(testDate, 'MMM DD, YYYY')).toBe('Dec 25, 2023');
    });

    it('should handle string input', () => {
      expect(formatDate('2023-12-25')).toBe('12/25/2023');
    });

    it('should handle invalid dates', () => {
      expect(() => formatDate('invalid')).toThrow();
      expect(() => formatDate(null as any)).toThrow();
      expect(() => formatDate(undefined as any)).toThrow();
    });

    it('should handle different locales', () => {
      expect(formatDate(testDate, 'DD/MM/YYYY', 'en-GB')).toBe('25/12/2023');
    });

    it('should handle time formatting', () => {
      expect(formatDate(testDate, 'HH:mm:ss')).toBe('10:30:00');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
      expect(validateEmail('test_email@domain-name.com')).toBe(true);
      expect(validateEmail('123@domain.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@invalid.com')).toBe(false);
      expect(validateEmail('invalid@.com')).toBe(false);
      expect(validateEmail('invalid@domain')).toBe(false);
      expect(validateEmail('invalid..email@domain.com')).toBe(false);
      expect(validateEmail('invalid@domain..com')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(undefined as any)).toBe(false);
      expect(validateEmail('  ')).toBe(false);
      expect(validateEmail('   test@example.com   ')).toBe(true); // Should trim
    });

    it('should handle special characters', () => {
      expect(validateEmail('test+label@example.com')).toBe(true);
      expect(validateEmail('test.email.with+symbol@example.com')).toBe(true);
      expect(validateEmail('user%department@company.com')).toBe(true);
    });
  });

  describe('validatePhone', () => {
    it('should validate US phone numbers', () => {
      expect(validatePhone('(555) 123-4567')).toBe(true);
      expect(validatePhone('555-123-4567')).toBe(true);
      expect(validatePhone('5551234567')).toBe(true);
      expect(validatePhone('+1 555 123 4567')).toBe(true);
      expect(validatePhone('1-555-123-4567')).toBe(true);
    });

    it('should validate international phone numbers', () => {
      expect(validatePhone('+44 20 7946 0958')).toBe(true);
      expect(validatePhone('+33 1 42 86 83 26')).toBe(true);
      expect(validatePhone('+49 30 12345678')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('invalid')).toBe(false);
      expect(validatePhone('')).toBe(false);
      expect(validatePhone(null as any)).toBe(false);
      expect(validatePhone('123-45-67')).toBe(false);
      expect(validatePhone('(555) 123-456')).toBe(false);
    });

    it('should handle different formats', () => {
      expect(validatePhone('555.123.4567')).toBe(true);
      expect(validatePhone('555 123 4567')).toBe(true);
      expect(validatePhone('(555)123-4567')).toBe(true);
    });
  });

  describe('deepClone', () => {
    it('should deep clone objects', () => {
      const obj = { a: 1, b: { c: 2, d: [3, 4] } };
      const cloned = deepClone(obj);
      
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
      expect(cloned.b.d).not.toBe(obj.b.d);
    });

    it('should handle primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('string')).toBe('string');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
      expect(deepClone(undefined)).toBe(undefined);
    });

    it('should handle arrays', () => {
      const arr = [1, 2, { a: 3 }, [4, 5]];
      const cloned = deepClone(arr);
      
      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[2]).not.toBe(arr[2]);
      expect(cloned[3]).not.toBe(arr[3]);
    });

    it('should handle circular references', () => {
      const obj: any = { a: 1 };
      obj.self = obj;
      
      const cloned = deepClone(obj);
      expect(cloned.a).toBe(1);
      expect(cloned.self).toBe(cloned);
    });

    it('should handle Date objects', () => {
      const date = new Date('2023-12-25');
      const cloned = deepClone(date);
      
      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
      expect(cloned instanceof Date).toBe(true);
    });

    it('should handle RegExp objects', () => {
      const regex = /test/gi;
      const cloned = deepClone(regex);
      
      expect(cloned.source).toBe(regex.source);
      expect(cloned.flags).toBe(regex.flags);
      expect(cloned).not.toBe(regex);
      expect(cloned instanceof RegExp).toBe(true);
    });

    it('should handle nested structures', () => {
      const complex = {
        arr: [1, { nested: true }],
        obj: { deep: { very: { deep: 'value' } } },
        date: new Date(),
        regex: /test/
      };
      
      const cloned = deepClone(complex);
      expect(cloned).toEqual(complex);
      expect(cloned.arr[1]).not.toBe(complex.arr[1]);
      expect(cloned.obj.deep.very).not.toBe(complex.obj.deep.very);
    });
  });

  describe('mergeObjects', () => {
    it('should merge objects shallowly', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3, c: 4 };
      const merged = mergeObjects(obj1, obj2);
      
      expect(merged).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should merge objects deeply', () => {
      const obj1 = { a: 1, b: { x: 1, y: 2 } };
      const obj2 = { b: { y: 3, z: 4 }, c: 5 };
      const merged = mergeObjects(obj1, obj2, { deep: true });
      
      expect(merged).toEqual({ a: 1, b: { x: 1, y: 3, z: 4 }, c: 5 });
    });

    it('should handle multiple objects', () => {
      const obj1 = { a: 1 };
      const obj2 = { b: 2 };
      const obj3 = { c: 3 };
      const merged = mergeObjects(obj1, obj2, obj3);
      
      expect(merged).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should handle null/undefined objects', () => {
      expect(mergeObjects(null, { a: 1 })).toEqual({ a: 1 });
      expect(mergeObjects({ a: 1 }, undefined)).toEqual({ a: 1 });
      expect(mergeObjects(null, undefined)).toEqual({});
    });

    it('should handle arrays in deep merge', () => {
      const obj1 = { arr: [1, 2] };
      const obj2 = { arr: [3, 4] };
      const merged = mergeObjects(obj1, obj2, { deep: true });
      
      expect(merged.arr).toEqual([3, 4]); // Arrays should be replaced, not merged
    });

    it('should not mutate original objects', () => {
      const obj1 = { a: 1, b: { x: 1 } };
      const obj2 = { b: { y: 2 }, c: 3 };
      const original1 = JSON.parse(JSON.stringify(obj1));
      const original2 = JSON.parse(JSON.stringify(obj2));
      
      mergeObjects(obj1, obj2, { deep: true });
      
      expect(obj1).toEqual(original1);
      expect(obj2).toEqual(original2);
    });
  });

  describe('arrayToObject', () => {
    it('should convert array to object using key property', () => {
      const arr = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ];
      const obj = arrayToObject(arr, 'id');
      
      expect(obj).toEqual({
        1: { id: 1, name: 'John' },
        2: { id: 2, name: 'Jane' }
      });
    });

    it('should handle duplicate keys', () => {
      const arr = [
        { id: 1, name: 'John' },
        { id: 1, name: 'Jane' }
      ];
      const obj = arrayToObject(arr, 'id');
      
      expect(obj[1].name).toBe('Jane'); // Last one wins
    });

    it('should handle empty array', () => {
      expect(arrayToObject([], 'id')).toEqual({});
    });

    it('should handle missing key property', () => {
      const arr = [
        { id: 1, name: 'John' },
        { name: 'Jane' }
      ];
      const obj = arrayToObject(arr, 'id');
      
      expect(obj[1]).toBeDefined();
      expect(obj.undefined).toBeDefined();
    });

    it('should handle nested key properties', () => {
      const arr = [
        { user: { id: 1 }, name: 'John' },
        { user: { id: 2 }, name: 'Jane' }
      ];
      const obj = arrayToObject(arr, 'user.id');
      
      expect(obj[1].name).toBe('John');
      expect(obj[2].name).toBe('Jane');
    });
  });

  describe('capitalizeFirstLetter', () => {
    it('should capitalize first letter', () => {
      expect(capitalizeFirstLetter('hello')).toBe('Hello');
      expect(capitalizeFirstLetter('HELLO')).toBe('HELLO');
      expect(capitalizeFirstLetter('hELLO')).toBe('HELLO');
    });

    it('should handle empty string', () => {
      expect(capitalizeFirstLetter('')).toBe('');
    });

    it('should handle single character', () => {
      expect(capitalizeFirstLetter('h')).toBe('H');
      expect(capitalizeFirstLetter('H')).toBe('H');
    });

    it('should handle non-string input', () => {
      expect(() => capitalizeFirstLetter(null as any)).toThrow();
      expect(() => capitalizeFirstLetter(undefined as any)).toThrow();
      expect(() => capitalizeFirstLetter(123 as any)).toThrow();
    });

    it('should handle whitespace', () => {
      expect(capitalizeFirstLetter(' hello')).toBe(' hello'); // Should not trim
      expect(capitalizeFirstLetter('\thello')).toBe('\thello');
    });

    it('should handle numbers at start', () => {
      expect(capitalizeFirstLetter('123abc')).toBe('123abc');
    });
  });

  describe('truncateString', () => {
    it('should truncate string to specified length', () => {
      expect(truncateString('Hello World', 5)).toBe('Hello...');
      expect(truncateString('Hello World', 11)).toBe('Hello World');
      expect(truncateString('Hello World', 20)).toBe('Hello World');
    });

    it('should use custom ellipsis', () => {
      expect(truncateString('Hello World', 5, '---')).toBe('Hello---');
      expect(truncateString('Hello World', 5, '')).toBe('Hello');
    });

    it('should handle edge cases', () => {
      expect(truncateString('', 5)).toBe('');
      expect(truncateString('Hello', 0)).toBe('...');
      expect(truncateString('Hello', -1)).toBe('...');
    });

    it('should handle non-string input', () => {
      expect(() => truncateString(null as any, 5)).toThrow();
      expect(() => truncateString(undefined as any, 5)).toThrow();
    });

    it('should handle exact length match', () => {
      expect(truncateString('Hello', 5)).toBe('Hello');
    });

    it('should handle single character strings', () => {
      expect(truncateString('H', 1)).toBe('H');
      expect(truncateString('H', 0)).toBe('...');
    });
  });

  describe('generateRandomId', () => {
    it('should generate random id with default length', () => {
      const id = generateRandomId();
      expect(typeof id).toBe('string');
      expect(id.length).toBe(8);
    });

    it('should generate random id with custom length', () => {
      const id = generateRandomId(16);
      expect(id.length).toBe(16);
    });

    it('should generate unique ids', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateRandomId());
      }
      expect(ids.size).toBe(100);
    });

    it('should handle zero length', () => {
      expect(generateRandomId(0)).toBe('');
    });

    it('should handle negative length', () => {
      expect(generateRandomId(-5)).toBe('');
    });

    it('should only contain valid characters', () => {
      const id = generateRandomId(100);
      expect(id).toMatch(/^[a-zA-Z0-9]+$/);
    });

    it('should handle large lengths', () => {
      const id = generateRandomId(1000);
      expect(id.length).toBe(1000);
    });
  });

  describe('isEmptyObject', () => {
    it('should detect empty objects', () => {
      expect(isEmptyObject({})).toBe(true);
      expect(isEmptyObject(Object.create(null))).toBe(true);
    });

    it('should detect non-empty objects', () => {
      expect(isEmptyObject({ a: 1 })).toBe(false);
      expect(isEmptyObject({ a: undefined })).toBe(false);
      expect(isEmptyObject({ a: null })).toBe(false);
    });

    it('should handle null/undefined', () => {
      expect(isEmptyObject(null)).toBe(true);
      expect(isEmptyObject(undefined)).toBe(true);
    });

    it('should handle non-objects', () => {
      expect(isEmptyObject('string')).toBe(false);
      expect(isEmptyObject(123)).toBe(false);
      expect(isEmptyObject([])).toBe(true);
      expect(isEmptyObject([1, 2, 3])).toBe(false);
    });

    it('should handle objects with inherited properties', () => {
      const parent = { inherited: true };
      const child = Object.create(parent);
      expect(isEmptyObject(child)).toBe(true); // Should only check own properties
      
      child.own = true;
      expect(isEmptyObject(child)).toBe(false);
    });
  });

  describe('getNestedProperty', () => {
    const obj = {
      a: {
        b: {
          c: 'value'
        },
        d: [1, 2, { e: 'array value' }]
      },
      nullValue: null,
      undefinedValue: undefined,
      falseValue: false,
      zeroValue: 0,
      emptyString: ''
    };

    it('should get nested property', () => {
      expect(getNestedProperty(obj, 'a.b.c')).toBe('value');
      expect(getNestedProperty(obj, 'a.d.0')).toBe(1);
      expect(getNestedProperty(obj, 'a.d.2.e')).toBe('array value');
    });

    it('should handle falsy values correctly', () => {
      expect(getNestedProperty(obj, 'nullValue')).toBe(null);
      expect(getNestedProperty(obj, 'undefinedValue')).toBe(undefined);
      expect(getNestedProperty(obj, 'falseValue')).toBe(false);
      expect(getNestedProperty(obj, 'zeroValue')).toBe(0);
      expect(getNestedProperty(obj, 'emptyString')).toBe('');
    });

    it('should return undefined for non-existent path', () => {
      expect(getNestedProperty(obj, 'a.b.x')).toBeUndefined();
      expect(getNestedProperty(obj, 'x.y.z')).toBeUndefined();
    });

    it('should use default value', () => {
      expect(getNestedProperty(obj, 'a.b.x', 'default')).toBe('default');
      expect(getNestedProperty(obj, 'nullValue', 'default')).toBe(null); // Should not use default for null
      expect(getNestedProperty(obj, 'undefinedValue', 'default')).toBe('default');
    });

    it('should handle invalid input', () => {
      expect(getNestedProperty(null, 'a.b.c')).toBeUndefined();
      expect(getNestedProperty(undefined, 'a.b.c')).toBeUndefined();
      expect(getNestedProperty(obj, null as any)).toBeUndefined();
      expect(getNestedProperty(obj, undefined as any)).toBeUndefined();
      expect(getNestedProperty(obj, '')).toBe(obj);
    });

    it('should handle array notation', () => {
      expect(getNestedProperty(obj, 'a.d[0]')).toBe(1);
      expect(getNestedProperty(obj, 'a.d[2].e')).toBe('array value');
    });
  });

  describe('setNestedProperty', () => {
    it('should set nested property', () => {
      const obj = {};
      setNestedProperty(obj, 'a.b.c', 'value');
      expect(obj).toEqual({ a: { b: { c: 'value' } } });
    });

    it('should overwrite existing property', () => {
      const obj = { a: { b: { c: 'old' } } };
      setNestedProperty(obj, 'a.b.c', 'new');
      expect((obj as any).a.b.c).toBe('new');
    });

    it('should handle array indices', () => {
      const obj = { a: [] };
      setNestedProperty(obj, 'a.0.b', 'value');
      expect((obj as any).a[0].b).toBe('value');
    });

    it('should handle invalid input', () => {
      expect(() => setNestedProperty(null as any, 'a.b.c', 'value')).toThrow();
      expect(() => setNestedProperty({}, null as any, 'value')).toThrow();
      expect(() => setNestedProperty({}, undefined as any, 'value')).toThrow();
    });

    it('should handle empty path', () => {
      const obj = {};
      setNestedProperty(obj, '', 'value');
      expect(obj).toEqual('value');
    });

    it('should handle single level property', () => {
      const obj = {};
      setNestedProperty(obj, 'a', 'value');
      expect(obj).toEqual({ a: 'value' });
    });

    it('should preserve existing sibling properties', () => {
      const obj = { a: { b: 1, c: 2 } };
      setNestedProperty(obj, 'a.d', 3);
      expect(obj).toEqual({ a: { b: 1, c: 2, d: 3 } });
    });
  });

  describe('flattenArray', () => {
    it('should flatten nested arrays', () => {
      expect(flattenArray([1, [2, 3], [4, [5, 6]]])).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should handle empty arrays', () => {
      expect(flattenArray([])).toEqual([]);
      expect(flattenArray([[], []])).toEqual([]);
    });

    it('should handle single level arrays', () => {
      expect(flattenArray([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('should handle deeply nested arrays', () => {
      expect(flattenArray([1, [2, [3, [4, [5]]]]])).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle mixed types', () => {
      expect(flattenArray([1, ['a', [true, [null]]]])).toEqual([1, 'a', true, null]);
    });

    it('should handle sparse arrays', () => {
      const sparse = [1, , 3, [4, , 6]];
      const flattened = flattenArray(sparse);
      expect(flattened).toEqual([1, undefined, 3, 4, undefined, 6]);
    });

    it('should specify depth level', () => {
      expect(flattenArray([1, [2, [3, [4]]]], 1)).toEqual([1, 2, [3, [4]]]);
      expect(flattenArray([1, [2, [3, [4]]]], 2)).toEqual([1, 2, 3, [4]]);
    });
  });

  describe('uniqueArray', () => {
    it('should remove duplicates from array', () => {
      expect(uniqueArray([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(uniqueArray(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('should handle empty array', () => {
      expect(uniqueArray([])).toEqual([]);
    });

    it('should handle array with no duplicates', () => {
      expect(uniqueArray([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('should handle mixed types', () => {
      expect(uniqueArray([1, '1', true, 1, '1', false, true]))
        .toEqual([1, '1', true, false]);
    });

    it('should handle objects by reference', () => {
      const obj1 = { a: 1 };
      const obj2 = { a: 1 };
      expect(uniqueArray([obj1, obj2, obj1])).toEqual([obj1, obj2]);
    });

    it('should handle NaN values', () => {
      expect(uniqueArray([NaN, NaN, 1, NaN])).toEqual([NaN, 1]);
    });

    it('should maintain order', () => {
      expect(uniqueArray([3, 1, 2, 1, 3])).toEqual([3, 1, 2]);
    });
  });

  // Additional comprehensive tests for remaining functions...
  // Due to length constraints, continuing with key functions

  describe('clamp', () => {
    it('should clamp values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle equal min and max', () => {
      expect(clamp(5, 7, 7)).toBe(7);
      expect(clamp(10, 7, 7)).toBe(7);
    });

    it('should handle invalid range', () => {
      expect(() => clamp(5, 10, 0)).toThrow();
    });

    it('should handle non-numeric input', () => {
      expect(() => clamp('invalid' as any, 0, 10)).toThrow();
      expect(() => clamp(5, 'invalid' as any, 10)).toThrow();
      expect(() => clamp(5, 0, 'invalid' as any)).toThrow();
    });

    it('should handle decimal values', () => {
      expect(clamp(5.5, 0.1, 10.9)).toBe(5.5);
      expect(clamp(0.05, 0.1, 10.9)).toBe(0.1);
    });
  });

  describe('memoize', () => {
    it('should memoize function results', () => {
      const fn = jest.fn((x: number) => x * 2);
      const memoized = memoize(fn);
      
      expect(memoized(5)).toBe(10);
      expect(memoized(5)).toBe(10);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple arguments', () => {
      const fn = jest.fn((x: number, y: number) => x + y);
      const memoized = memoize(fn);
      
      expect(memoized(1, 2)).toBe(3);
      expect(memoized(1, 2)).toBe(3);
      expect(memoized(2, 1)).toBe(3);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should handle object arguments', () => {
      const fn = jest.fn((obj: any) => obj.value);
      const memoized = memoize(fn);
      const obj = { value: 42 };
      
      expect(memoized(obj)).toBe(42);
      expect(memoized(obj)).toBe(42);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle custom key resolver', () => {
      const fn = jest.fn((obj: any) => obj.value);
      const keyResolver = (obj: any) => obj.id;
      const memoized = memoize(fn, keyResolver);
      
      expect(memoized({ id: 1, value: 42 })).toBe(42);
      expect(memoized({ id: 1, value: 100 })).toBe(42); // Uses cached result
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle cache size limit', () => {
      const fn = jest.fn((x: number) => x * 2);
      const memoized = memoize(fn, undefined, 2);
      
      memoized(1); // Cache: {1: 2}
      memoized(2); // Cache: {1: 2, 2: 4}
      memoized(3); // Cache: {2: 4, 3: 6} (1 evicted)
      memoized(1); // Should call fn again
      
      expect(fn).toHaveBeenCalledTimes(4);
    });
  });

  describe('retry', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const fn = jest.fn(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Failed');
        }
        return 'success';
      });

      const result = await retry(fn, 3, 10);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const fn = jest.fn(() => {
        throw new Error('Always fails');
      });

      await expect(retry(fn, 2, 10)).rejects.toThrow('Always fails');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should succeed on first try', async () => {
      const fn = jest.fn(() => 'success');

      const result = await retry(fn, 3, 10);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle async functions', async () => {
      let attempts = 0;
      const fn = jest.fn(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Async failed');
        }
        return 'async success';
      });

      const result = await retry(fn, 3, 10);
      expect(result).toBe('async success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should handle exponential backoff', async () => {
      const fn = jest.fn(() => {
        throw new Error('Failed');
      });

      const start = Date.now();
      await expect(retry(fn, 3, 100, { exponential: true })).rejects.toThrow();
      const elapsed = Date.now() - start;
      
      // Should take approximately 100 + 200 + 400 = 700ms with exponential backoff
      expect(elapsed).toBeGreaterThan(600);
    });
  });

  describe('timeout', () => {
    it('should resolve within timeout', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('success'), 50));
      const result = await timeout(promise, 100);
      expect(result).toBe('success');
    });

    it('should reject after timeout', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('success'), 200));
      await expect(timeout(promise, 100)).rejects.toThrow('Timeout');
    });

    it('should handle immediate resolution', async () => {
      const promise = Promise.resolve('immediate');
      const result = await timeout(promise, 100);
      expect(result).toBe('immediate');
    });

    it('should handle immediate rejection', async () => {
      const promise = Promise.reject(new Error('immediate error'));
      await expect(timeout(promise, 100)).rejects.toThrow('immediate error');
    });

    it('should handle custom timeout message', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('success'), 200));
      await expect(timeout(promise, 100, 'Custom timeout message'))
        .rejects.toThrow('Custom timeout message');
    });
  });

  // Browser/Device Detection Tests
  describe('Device Detection', () => {
    beforeEach(() => {
      // Reset navigator mock
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        writable: true
      });
    });

    it('should detect mobile devices', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        },
        writable: true
      });

      expect(isMobile()).toBe(true);
      expect(isDesktop()).toBe(false);
    });

    it('should detect tablet devices', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        },
        writable: true
      });

      expect(isTablet()).toBe(true);
      expect(isMobile()).toBe(false);
      expect(isDesktop()).toBe(false);
    });

    it('should detect desktop devices', () => {
      expect(isDesktop()).toBe(true);
      expect(isMobile()).toBe(false);
      expect(isTablet()).toBe(false);
    });

    it('should get browser info', () => {
      const info = getBrowserInfo();
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('version');
      expect(typeof info.name).toBe('string');
      expect(typeof info.version).toBe('string');
    });

    it('should get OS info', () => {
      const info = getOSInfo();
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('version');
      expect(typeof info.name).toBe('string');
    });
  });

  // Storage Tests
  describe('Storage Utilities', () => {
    let mockLocalStorage: any;
    let mockSessionStorage: any;

    beforeEach(() => {
      mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      };
      
      mockSessionStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      };
      
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });

      Object.defineProperty(window, 'sessionStorage', {
        value: mockSessionStorage,
        writable: true
      });
    });

    describe('localStorage utility', () => {
      it('should get from localStorage', () => {
        mockLocalStorage.getItem.mockReturnValue('{"key":"value"}');
        
        const result = localStorage.get('test');
        expect(result).toEqual({ key: 'value' });
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test');
      });

      it('should set to localStorage', () => {
        localStorage.set('test', { key: 'value' });
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test', '{"key":"value"}');
      });

      it('should remove from localStorage', () => {
        localStorage.remove('test');
        
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test');
      });

      it('should handle localStorage errors gracefully', () => {
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error('Storage error');
        });

        expect(() => localStorage.get('test')).not.toThrow();
        expect(localStorage.get('test')).toBeNull();
      });

      it('should handle invalid JSON', () => {
        mockLocalStorage.getItem.mockReturnValue('invalid-json');
        
        expect(() => localStorage.get('test')).not.toThrow();
        expect(localStorage.get('test')).toBe('invalid-json');
      });
    });

    describe('sessionStorage utility', () => {
      it('should get from sessionStorage', () => {
        mockSessionStorage.getItem.mockReturnValue('{"key":"value"}');
        
        const result = sessionStorage.get('test');
        expect(result).toEqual({ key: 'value' });
        expect(mockSessionStorage.getItem).toHaveBeenCalledWith('test');
      });

      it('should set to sessionStorage', () => {
        sessionStorage.set('test', { key: 'value' });
        
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith('test', '{"key":"value"}');
      });
    });
  });

  // URL Utilities Tests
  describe('URL Utilities', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://example.com?param1=value1&param2=value2&encoded=%20space',
          search: '?param1=value1&param2=value2&encoded=%20space',
          origin: 'https://example.com',
          pathname: '/',
          hash: ''
        },
        writable: true
      });
    });

    describe('getUrlParameter', () => {
      it('should get URL parameter', () => {
        expect(getUrlParameter('param1')).toBe('value1');
        expect(getUrlParameter('param2')).toBe('value2');
        expect(getUrlParameter('param3')).toBeNull();
      });

      it('should handle encoded parameters', () => {
        expect(getUrlParameter('encoded')).toBe(' space');
      });

      it('should handle empty parameters', () => {
        Object.defineProperty(window, 'location', {
          value: { search: '?empty=&param=value' },
          writable: true
        });

        expect(getUrlParameter('empty')).toBe('');
        expect(getUrlParameter('param')).toBe('value');
      });
    });

    describe('parseQueryString', () => {
      it('should parse query string', () => {
        const params = parseQueryString('?param1=value1&param2=value2');
        expect(params).toEqual({
          param1: 'value1',
          param2: 'value2'
        });
      });

      it('should handle query string without question mark', () => {
        const params = parseQueryString('param1=value1&param2=value2');
        expect(params).toEqual({
          param1: 'value1',
          param2: 'value2'
        });
      });

      it('should handle empty query string', () => {
        expect(parseQueryString('')).toEqual({});
        expect(parseQueryString('?')).toEqual({});
      });

      it('should handle malformed query string', () => {
        const params = parseQueryString('param1=value1&param2&param3=');
        expect(params).toEqual({
          param1: 'value1',
          param2: '',
          param3: ''
        });
      });

      it('should handle encoded values', () => {
        const params = parseQueryString('name=John%20Doe&email=test%40example.com');
        expect(params).toEqual({
          name: 'John Doe',
          email: 'test@example.com'
        });
      });
    });

    describe('buildQueryString', () => {
      it('should build query string', () => {
        const params = { param1: 'value1', param2: 'value2' };
        const queryString = buildQueryString(params);
        expect(queryString).toBe('param1=value1&param2=value2');
      });

      it('should handle empty params object', () => {
        expect(buildQueryString({})).toBe('');
      });

      it('should encode special characters', () => {
        const params = { name: 'John Doe', email: 'test@example.com' };
        const queryString = buildQueryString(params);
        expect(queryString).toBe('name=John%20Doe&email=test%40example.com');
      });

      it('should handle null and undefined values', () => {
        const params = { param1: 'value1', param2: null, param3: undefined };
        const queryString = buildQueryString(params);
        expect(queryString).toBe('param1=value1&param2=null&param3=undefined');
      });

      it('should handle boolean and number values', () => {
        const params = { bool: true, num: 42, zero: 0 };
        const queryString = buildQueryString(params);
        expect(queryString).toBe('bool=true&num=42&zero=0');
      });
    });
  });

  // Mathematical Function Tests
  describe('Mathematical Functions', () => {
    describe('randomBetween', () => {
      it('should generate random number between range', () => {
        for (let i = 0; i < 100; i++) {
          const random = randomBetween(1, 10);
          expect(random).toBeGreaterThanOrEqual(1);
          expect(random).toBeLessThanOrEqual(10);
        }
      });

      it('should handle equal min and max', () => {
        expect(randomBetween(5, 5)).toBe(5);
      });

      it('should handle integer flag', () => {
        for (let i = 0; i < 100; i++) {
          const random = randomBetween(1, 10, true);
          expect(Number.isInteger(random)).toBe(true);
        }
      });

      it('should handle invalid range', () => {
        expect(() => randomBetween(10, 1)).toThrow();
      });

      it('should handle decimal ranges', () => {
        for (let i = 0; i < 50; i++) {
          const random = randomBetween(1.5, 2.5);
          expect(random).toBeGreaterThanOrEqual(1.5);
          expect(random).toBeLessThanOrEqual(2.5);
        }
      });
    });

    describe('roundToDecimal', () => {
      it('should round to specified decimal places', () => {
        expect(roundToDecimal(3.14159, 2)).toBe(3.14);
        expect(roundToDecimal(3.14159, 4)).toBe(3.1416);
        expect(roundToDecimal(3.14159, 0)).toBe(3);
      });

      it('should handle negative numbers', () => {
        expect(roundToDecimal(-3.14159, 2)).toBe(-3.14);
      });

      it('should handle zero', () => {
        expect(roundToDecimal(0, 2)).toBe(0);
      });

      it('should handle large decimal places', () => {
        expect(roundToDecimal(1.123456789, 8)).toBe(1.12345679);
      });

      it('should handle numbers that don't need rounding', () => {
        expect(roundToDecimal(3.1, 2)).toBe(3.1);
        expect(roundToDecimal(3, 2)).toBe(3);
      });
    });

    describe('calculateDiscount', () => {
      it('should calculate discount correctly', () => {
        expect(calculateDiscount(100, 0.2)).toBe(80);
        expect(calculateDiscount(250, 0.15)).toBe(212.5);
      });

      it('should handle percentage format', () => {
        expect(calculateDiscount(100, 20, true)).toBe(80);
      });

      it('should handle zero discount', () => {
        expect(calculateDiscount(100, 0)).toBe(100);
      });

      it('should handle 100% discount', () => {
        expect(calculateDiscount(100, 1)).toBe(0);
        expect(calculateDiscount(100, 100, true)).toBe(0);
      });

      it('should handle invalid discount rates', () => {
        expect(() => calculateDiscount(100, -0.1)).toThrow();
        expect(() => calculateDiscount(100, 1.1)).toThrow();
        expect(() => calculateDiscount(100, 110, true)).toThrow();
      });
    });
  });

  // Array Utility Tests
  describe('Array Utilities', () => {
    describe('shuffle', () => {
      it('should shuffle array', () => {
        const arr = [1, 2, 3, 4, 5];
        const shuffled = shuffle([...arr]);
        
        expect(shuffled).toHaveLength(arr.length);
        expect(shuffled.sort()).toEqual(arr.sort());
      });

      it('should handle empty array', () => {
        expect(shuffle([])).toEqual([]);
      });

      it('should handle single element array', () => {
        expect(shuffle([1])).toEqual([1]);
      });

      it('should not mutate original array', () => {
        const arr = [1, 2, 3];
        const shuffled = shuffle(arr);
        expect(arr).toEqual([1, 2, 3]);
        expect(shuffled).not.toBe(arr);
      });

      it('should produce different results', () => {
        const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const shuffled1 = shuffle([...arr]);
        const shuffled2 = shuffle([...arr]);
        
        // It's extremely unlikely that two shuffles of a 10-element array are identical
        expect(shuffled1).not.toEqual(shuffled2);
      });
    });

    describe('chunk', () => {
      it('should chunk array into specified size', () => {
        expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
        expect(chunk([1, 2, 3, 4, 5, 6], 3)).toEqual([[1, 2, 3], [4, 5, 6]]);
      });

      it('should handle empty array', () => {
        expect(chunk([], 2)).toEqual([]);
      });

      it('should handle chunk size larger than array', () => {
        expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
      });

      it('should handle chunk size of 1', () => {
        expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
      });

      it('should handle invalid chunk size', () => {
        expect(() => chunk([1, 2, 3], 0)).toThrow();
        expect(() => chunk([1, 2, 3], -1)).toThrow();
        expect(() => chunk([1, 2, 3], 1.5)).toThrow();
      });

      it('should handle array with different types', () => {
        expect(chunk([1, 'a', true, null], 2)).toEqual([[1, 'a'], [true, null]]);
      });
    });

    describe('intersection', () => {
      it('should find intersection of arrays', () => {
        expect(intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
        expect(intersection(['a', 'b', 'c'], ['b', 'c', 'd'])).toEqual(['b', 'c']);
      });

      it('should handle empty arrays', () => {
        expect(intersection([], [1, 2, 3])).toEqual([]);
        expect(intersection([1, 2, 3], [])).toEqual([]);
      });

      it('should handle no intersection', () => {
        expect(intersection([1, 2, 3], [4, 5, 6])).toEqual([]);
      });

      it('should handle multiple arrays', () => {
        expect(intersection([1, 2, 3], [2, 3, 4], [3, 4, 5])).toEqual([3]);
      });

      it('should handle duplicates', () => {
        expect(intersection([1, 1, 2, 3], [1, 2, 2, 4])).toEqual([1, 2]);
      });
    });

    describe('union', () => {
      it('should find union of arrays', () => {
        expect(union([1, 2, 3], [3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
        expect(union(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c']);
      });

      it('should handle empty arrays', () => {
        expect(union([], [1, 2, 3])).toEqual([1, 2, 3]);
        expect(union([1, 2, 3], [])).toEqual([1, 2, 3]);
      });

      it('should handle duplicate values', () => {
        expect(union([1, 1, 2], [2, 3, 3])).toEqual([1, 2, 3]);
      });

      it('should handle multiple arrays', () => {
        expect(union([1, 2], [2, 3], [3, 4])).toEqual([1, 2, 3, 4]);
      });
    });

    describe('difference', () => {
      it('should find difference of arrays', () => {
        expect(difference([1, 2, 3, 4], [2, 4])).toEqual([1, 3]);
        expect(difference(['a', 'b', 'c'], ['b'])).toEqual(['a', 'c']);
      });

      it('should handle empty arrays', () => {
        expect(difference([], [1, 2, 3])).toEqual([]);
        expect(difference([1, 2, 3], [])).toEqual([1, 2, 3]);
      });

      it('should handle no difference', () => {
        expect(difference([1, 2, 3], [1, 2, 3])).toEqual([]);
      });

      it('should handle duplicates in first array', () => {
        expect(difference([1, 1, 2, 3], [1])).toEqual([2, 3]);
      });
    });
  });

  // Date Utility Tests
  describe('Date Utilities', () => {
    describe('calculateAge', () => {
      it('should calculate age correctly', () => {
        const birthDate = new Date('1990-01-01');
        const referenceDate = new Date('2023-01-01');
        expect(calculateAge(birthDate, referenceDate)).toBe(33);
      });

      it('should handle birthday not yet occurred this year', () => {
        const birthDate = new Date('1990-06-15');
        const referenceDate = new Date('2023-01-01');
        expect(calculateAge(birthDate, referenceDate)).toBe(32);
      });

      it('should use current date as default reference', () => {
        const birthDate = new Date('1990-01-01');
        const age = calculateAge(birthDate);
        expect(typeof age).toBe('number');
        expect(age).toBeGreaterThan(0);
      });

      it('should handle leap years', () => {
        const birthDate = new Date('2000-02-29'); // Leap year
        const referenceDate = new Date('2023-02-28');
        expect(calculateAge(birthDate, referenceDate)).toBe(22);
      });

      it('should handle same date', () => {
        const date = new Date('2000-01-01');
        expect(calculateAge(date, date)).toBe(0);
      });
    });

    describe('addDays', () => {
      it('should add days to date', () => {
        const date = new Date('2023-01-01');
        const newDate = addDays(date, 5);
        expect(newDate.getDate()).toBe(6);
        expect(newDate.getMonth()).toBe(0);
        expect(newDate.getFullYear()).toBe(2023);
      });

      it('should handle negative days', () => {
        const date = new Date('2023-01-15');
        const newDate = addDays(date, -10);
        expect(newDate.getDate()).toBe(5);
      });

      it('should handle month/year transitions', () => {
        const date = new Date('2023-01-30');
        const newDate = addDays(date, 5);
        expect(newDate.getMonth()).toBe(1); // February
        expect(newDate.getDate()).toBe(4);
      });

      it('should not mutate original date', () => {
        const date = new Date('2023-01-01');
        const originalTime = date.getTime();
        addDays(date, 5);
        expect(date.getTime()).toBe(originalTime);
      });

      it('should handle leap years', () => {
        const date = new Date('2020-02-28'); // 2020 is a leap year
        const newDate = addDays(date, 1);
        expect(newDate.getDate()).toBe(29);
        expect(newDate.getMonth()).toBe(1); // February
      });
    });

    describe('isValidDate', () => {
      it('should validate valid dates', () => {
        expect(isValidDate(new Date())).toBe(true);
        expect(isValidDate(new Date('2023-01-01'))).toBe(true);
        expect(isValidDate('2023-01-01')).toBe(true);
        expect(isValidDate('01/01/2023')).toBe(true);
      });

      it('should reject invalid dates', () => {
        expect(isValidDate(new Date('invalid'))).toBe(false);
        expect(isValidDate('invalid')).toBe(false);
        expect(isValidDate(null)).toBe(false);
        expect(isValidDate(undefined)).toBe(false);
        expect(isValidDate('')).toBe(false);
      });

      it('should handle edge cases', () => {
        expect(isValidDate('2023-02-29')).toBe(false); // Not a leap year
        expect(isValidDate('2020-02-29')).toBe(true); // Leap year
        expect(isValidDate('2023-13-01')).toBe(false); // Invalid month
        expect(isValidDate('2023-01-32')).toBe(false); // Invalid day
      });

      it('should handle different date formats', () => {
        expect(isValidDate('Dec 25, 2023')).toBe(true);
        expect(isValidDate('25 Dec 2023')).toBe(true);
        expect(isValidDate('2023/12/25')).toBe(true);
      });
    });
  });
});