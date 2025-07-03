import { escapeHtml } from './security';

describe('Security Utilities', () => {
  describe('escapeHtml', () => {
    test('should return an empty string for null input', () => {
      expect(escapeHtml(null)).toBe('');
    });

    test('should return an empty string for undefined input', () => {
      expect(escapeHtml(undefined)).toBe('');
    });

    test('should return an empty string for an empty string input', () => {
      expect(escapeHtml('')).toBe('');
    });

    test('should not change a string with no special characters', () => {
      const input = 'Hello world123';
      expect(escapeHtml(input)).toBe(input);
    });

    test('should escape "&" to "&amp;"', () => {
      expect(escapeHtml('a & b')).toBe('a &amp; b');
      expect(escapeHtml('&')).toBe('&amp;');
    });

    test('should escape "<" to "&lt;"', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
      expect(escapeHtml('<')).toBe('&lt;');
    });

    test('should escape ">" to "&gt;"', () => {
      expect(escapeHtml('a > b')).toBe('a &gt; b');
      expect(escapeHtml('>')).toBe('&gt;');
    });

    test('should escape \'"\' to "&quot;"', () => {
      expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
      expect(escapeHtml('"')).toBe('&quot;');
    });

    test('should escape "\'" to "&#39;"', () => {
      expect(escapeHtml("it's a test")).toBe('it&#39;s a test');
      expect(escapeHtml("'")).toBe('&#39;');
    });

    test('should escape multiple special characters in a string', () => {
      const input = '<div id="test" class=\'main\'>Content & more</div>';
      const expected = '&lt;div id=&quot;test&quot; class=&#39;main&#39;&gt;Content &amp; more&lt;/div&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });

    test('should handle strings with already escaped entities correctly (double escaping if not careful)', () => {
      // The current implementation will double-escape if presented with already escaped characters.
      // This test documents that behavior. If it's undesired, the function would need to be more complex.
      expect(escapeHtml('a &amp; b')).toBe('a &amp;amp; b');
    });

    test('should handle mixed case characters and numbers', () => {
        const input = 'Test1 <Test2> "Test3" \'Test4\' &Test5';
        const expected = 'Test1 &lt;Test2&gt; &quot;Test3&quot; &#39;Test4&#39; &amp;Test5';
        expect(escapeHtml(input)).toBe(expected);
    });
  });

  // Add tests for other security functions if they are added to security.ts
});
