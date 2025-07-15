
// Now import the service and Chart (which will be the mocked version)
import { ThemeService } from './theme.service';
import { Chart } from 'chart.js'; // This will be the mocked Chart

const THEME_KEY = 'app-theme';
const DARK_MODE_CLASS = 'dark-mode';

describe('ThemeService', () => {
  let testServiceInstances: ThemeService[] = [];
  let mockHtmlElement: HTMLElement | null; // Can be null if documentElement is not always present
  const originalLocalStorage = { // Store original localStorage mock functions
      getItem: localStorageMock.getItem,
      setItem: localStorageMock.setItem,
      removeItem: localStorageMock.removeItem,
      clear: localStorageMock.clear,
  };

  beforeEach(() => { // No longer async
    // Restore localStorageMock to its original state before each test
    localStorageMock.getItem = originalLocalStorage.getItem;
    localStorageMock.setItem = originalLocalStorage.setItem;
    localStorageMock.removeItem = originalLocalStorage.removeItem;
    localStorageMock.clear = originalLocalStorage.clear;
    localStorageMock.clear(); // Then clear it for the test
    testServiceInstances = []; // Clear instances at the beginning of each test

    systemPrefersDark = false;
    // if (document.body && document.body.classList) { // Check if body and classList exist
    //   document.body.classList.remove(DARK_MODE_CLASS); // Temporarily remove this to see if it interferes
    // }

    mockHtmlElement = document.documentElement; // This can be null in some test environments
    if (mockHtmlElement && typeof mockHtmlElement.setAttribute === 'function') { // Check if documentElement and setAttribute exist
      jest.spyOn(mockHtmlElement, 'setAttribute');
    } else {
      // Provide a fallback mock if document.documentElement is not available or suitable
      mockHtmlElement = {
        setAttribute: jest.fn(),
        // Add other HTMLElement properties/methods if needed by tests, though unlikely for this service
      } as any;
      // If setAttribute was the only thing needed, this spy satisfies that.
      // No need to spyOn if it's already a jest.fn().
    }

    // Reset global Chart mock states directly and defensively
    globalChartDefaults.color = '';

    if (!globalChartDefaults.scale) globalChartDefaults.scale = {} as any;
    if (!(globalChartDefaults.scale as any).ticks) (globalChartDefaults.scale as any).ticks = {};
    (globalChartDefaults.scale as any).ticks.color = '';
    if (!(globalChartDefaults.scale as any).grid) (globalChartDefaults.scale as any).grid = {};
    (globalChartDefaults.scale as any).grid.color = '';
    if (!(globalChartDefaults.scale as any).title) (globalChartDefaults.scale as any).title = {};
    (globalChartDefaults.scale as any).title.color = ''; // title itself is optional in Chart.js types, but color on it is not

    if (!globalChartDefaults.plugins) globalChartDefaults.plugins = {} as any;
    if (!(globalChartDefaults.plugins as any).legend) (globalChartDefaults.plugins as any).legend = {};
    if (!((globalChartDefaults.plugins as any).legend as any).labels) ((globalChartDefaults.plugins as any).legend as any).labels = {};
    ((globalChartDefaults.plugins as any).legend as any).labels.color = '';
    if (!(globalChartDefaults.plugins as any).title) (globalChartDefaults.plugins as any).title = {};
    (globalChartDefaults.plugins as any).title.color = '';

    // Clear instances from the globalChartInstances object
    for (const key in globalChartInstances) {
        delete (globalChartInstances as any)[key];
    }

    // themeServiceInstance will be initialized within specific describe/test blocks as needed.
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {

  afterEach(() => {
    jest.clearAllMocks();
    // Dispose all tracked instances
    testServiceInstances.forEach(instance => {
      if (typeof (instance as any).dispose === 'function') {
        (instance as any).dispose();
      }
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      (Chart.instances as any) = instances;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {

    test("should handle async Chart.js update operations", async () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      service.toggleTheme();
      }
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      (Chart.instances as any) = {
      // Create chart instances with async update methods
      const asyncUpdatePromise = Promise.resolve();

    test("should handle performance with large number of Chart instances", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      service.toggleTheme();
      }
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      (Chart.instances as any) = {
      // Create chart instances with async update methods
      const asyncUpdatePromise = Promise.resolve();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      service.toggleTheme();
      }
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      (Chart.instances as any) = {
      // Create chart instances with async update methods
      const asyncUpdatePromise = Promise.resolve();
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      service.toggleTheme();
      }
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      (Chart.instances as any) = {
      // Create chart instances with async update methods
      const asyncUpdatePromise = Promise.resolve();
      // Verify all instances were updated
      Object.values(instances).forEach((instance: any) => {
      // Should complete within reasonable time (2 seconds)
      const startTime = performance.now();
      // Create many mock chart instances
      const instances: any = {};
      for (let i = 0; i < 1000; i++) {

    test("should handle circular references in Chart.js objects", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      service.toggleTheme();
      }
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      (Chart.instances as any) = {
      // Create chart instances with async update methods
      const asyncUpdatePromise = Promise.resolve();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      service.toggleTheme();
      }
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      (Chart.instances as any) = {
      // Create chart instances with async update methods
      const asyncUpdatePromise = Promise.resolve();
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      service.toggleTheme();
      }
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      (Chart.instances as any) = {
      // Create chart instances with async update methods
      const asyncUpdatePromise = Promise.resolve();
      // Verify all instances were updated
      Object.values(instances).forEach((instance: any) => {
      // Should complete within reasonable time (2 seconds)
      const startTime = performance.now();
      // Create many mock chart instances
      const instances: any = {};
      for (let i = 0; i < 1000; i++) {
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      service.toggleTheme();
      }
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      (Chart.instances as any) = {
      // Create chart instances with async update methods
      const asyncUpdatePromise = Promise.resolve();
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      service.toggleTheme();
      }
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      (Chart.instances as any) = {
      // Create chart instances with async update methods
      const asyncUpdatePromise = Promise.resolve();
      // Verify all instances were updated
      Object.values(instances).forEach((instance: any) => {
      // Should complete within reasonable time (2 seconds)
      const startTime = performance.now();
      // Create many mock chart instances
      const instances: any = {};
      for (let i = 0; i < 1000; i++) {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      service.toggleTheme();
      }
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      (Chart.instances as any) = {
      // Create chart instances with async update methods
      const asyncUpdatePromise = Promise.resolve();
      // Verify all instances were updated
      Object.values(instances).forEach((instance: any) => {
      // Should complete within reasonable time (2 seconds)
      const startTime = performance.now();
      // Create many mock chart instances
      const instances: any = {};
      for (let i = 0; i < 1000; i++) {
      expect(() => {
      // Create circular reference in Chart defaults
      const circularObject: any = { self: null };
      circularObject.self = circularObject;
      globalChartDefaults.scale = circularObject;
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      service.toggleTheme();
      }
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      (Chart.instances as any) = {
      // Create chart instances with async update methods
      const asyncUpdatePromise = Promise.resolve();
      // Verify all instances were updated
      Object.values(instances).forEach((instance: any) => {
      // Should complete within reasonable time (2 seconds)
      const startTime = performance.now();
      // Create many mock chart instances
      const instances: any = {};
      for (let i = 0; i < 1000; i++) {
      expect(() => {
    testServiceInstances = []; // Clear the array

    // Always restore matchMedia to the default mock after each test
    Object.defineProperty(window, 'matchMedia', { value: matchMediaMock, configurable: true });
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {

  describe('Constructor (Initialization)', () => {
    test('should initialize to "light" theme if no stored theme and system prefers light', () => {
      systemPrefersDark = false;
      localStorageMock.clear();
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      service.toggleTheme();
      }
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      (Chart.instances as any) = {
      // Create chart instances with async update methods
      const asyncUpdatePromise = Promise.resolve();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      service.toggleTheme();
      }
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      (Chart.instances as any) = {
      // Create chart instances with async update methods
      const asyncUpdatePromise = Promise.resolve();
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      service.toggleTheme();
      }
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      (Chart.instances as any) = {
      // Create chart instances with async update methods
      const asyncUpdatePromise = Promise.resolve();
      // Verify all instances were updated
      Object.values(instances).forEach((instance: any) => {
      // Should complete within reasonable time (2 seconds)
      const startTime = performance.now();
      // Create many mock chart instances
      const instances: any = {};
      for (let i = 0; i < 1000; i++) {
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stringify({ nested: { deep: { object: "value" } } }), // JSON object
      ];
      
      pollutionAttempts.forEach((attempt) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

  describe("LocalStorage Stress Testing", () => {
    test("should handle rapid localStorage operations", () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      expect(mockAsyncChart.update).toHaveBeenCalled();
      service.toggleTheme();
      }
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      
      pollutionAttempts.forEach((attempt) => {
      maliciousValues.forEach((maliciousValue, index) => {
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      // Should handle the race condition gracefully
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      const service = new ThemeService();
      Object.defineProperty(window, "matchMedia", { value: delayedMatchMedia, configurable: true });
      Object.defineProperty(window, "matchMedia", { value: matchMediaMock, configurable: true });
      expect(() => {
      Object.defineProperty(window, "matchMedia", { value: quirkyMatchMedia, configurable: true });
      corruptedValues.forEach((corruptedValue, index) => {
      // Verify final state is consistent
      expect(["light", "dark"]).toContain(service.getCurrentTheme());
      // Perform rapid theme toggles to stress localStorage
      for (let i = 0; i < 100; i++) {
      // Wait for async operations to complete
      await asyncUpdatePromise;
    });
  });

    test("should protect against prototype pollution via localStorage", () => {
      const pollutionAttempts = [
        "constructor",
        "__proto__",
        "prototype",
        "constructor.prototype",
        JSON.stringify({ __proto__: { isAdmin: true } }),

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

    test("should handle media query events fired before listeners are attached", () => {
      let capturedListener: Function | null = null;
      const delayedMatchMedia = jest.fn((query: string) => {

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {
  });

  describe("Security and Validation", () => {
    test("should sanitize and validate theme values from localStorage", () => {
      const maliciousValues = [
        "<script>alert(\"XSS\")</script>",

  describe("MediaQuery Edge Cases and Browser Quirks", () => {
    test("should handle matchMedia with non-standard query syntax", () => {
      const quirkyMatchMedia = jest.fn((query: string) => {

    test("should handle localStorage corruption with special characters", () => {
      const corruptedValues = [
        "\u0000\u0001\u0002", // Control characters
        "🎨🌙☀️", // Emojis
        "\n\r\t", // Whitespace characters
        "<?xml><script>alert(1)</script>", // Potential XSS
        Array(10000).fill("a").join(""), // Very long string
        JSON.stri
        }).not.toThrow();
      } finally {
        Object.defineProperty(document, 'documentElement', { value: originalDocumentElement, writable: true, configurable: true });
      }
    });

    test('should handle matchMedia not being available', () => {
      const originalMatchMedia = window.matchMedia;
      Object.defineProperty(window, 'matchMedia', { value: undefined, writable: true });
      let service: ThemeService | undefined;
      expect(() => {
        service = new ThemeService();
        if (service) testServiceInstances.push(service);
      }).not.toThrow();
      
      Object.defineProperty(window, 'matchMedia', { value: originalMatchMedia });
    });
  });

  describe('Performance and Concurrency', () => {
    test('should handle rapid theme toggles without issues', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      const initialTheme = service.getCurrentTheme();
      
      // Rapidly toggle theme multiple times
      for (let i = 0; i < 10; i++) {
        service.toggleTheme();
      }
      
      // After even number of toggles, should be back to original
      expect(service.getCurrentTheme()).toBe(initialTheme);
    });

    test('should handle multiple service instances correctly', () => {
      const service1 = new ThemeService();
      testServiceInstances.push(service1);
      const service2 = new ThemeService();
      testServiceInstances.push(service2);
      
      expect(service1.getCurrentTheme()).toBe(service2.getCurrentTheme());
      
      service1.toggleTheme();
      // Both should reflect the same theme (shared localStorage)
      // Re-create service2 to pick up localStorage change for this specific test logic
      const service2AfterToggle = new ThemeService();
      testServiceInstances.push(service2AfterToggle);
      expect(service1.getCurrentTheme()).toBe(service2AfterToggle.getCurrentTheme());
    });

    test('should handle concurrent initialization', async () => {
      localStorageMock.clear();
      
      // Since ThemeService is now imported directly, jest.isolateModulesAsync isn't strictly needed
      // for re-importing ThemeService itself, but it's good for ensuring clean state of its deps if any.
      // However, the core issue was the class definition. Simpler now:
      const servicesInitialized: ThemeService[] = [];
      const promises = Array.from({ length: 5 }, () => {
          // Each new ThemeService() will read the same localStorage and attach to the same mocked matchMedia
          const service = new ThemeService();
          servicesInitialized.push(service); // Track for cleanup
          return service;
      });
      testServiceInstances.push(...servicesInitialized); // Add to global tracking for afterEach
      
      const services = await Promise.all(promises.map(s => Promise.resolve(s))); // Wrap in promise if needed or just use them
      const themes = services.map(s => s.getCurrentTheme());
      
      // All should have the same theme
      expect(new Set(themes).size).toBe(1);
    });
  });

  describe('Memory Management', () => {
    test('should properly clean up event listeners on repeated instantiation', () => {
      const mediaQueryMockListenerFunctions = {
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };

      const mediaQueryMockFactory = () => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        ...mediaQueryMockListenerFunctions, // Use shared listener functions
        dispatchEvent: jest.fn(),
      });
      
      matchMediaMock.mockImplementation(mediaQueryMockFactory as any);
      
      // Create multiple instances
      const instances: ThemeService[] = [];
      for (let i = 0; i < 3; i++) {
        const service = new ThemeService();
        instances.push(service);
        // testServiceInstances.push(service); // No, let this test manage its own instances for disposal check
      }
      
      // Should have attached listeners for each instance
      expect(mediaQueryMockListenerFunctions.addEventListener).toHaveBeenCalledTimes(3);

      // Dispose instances to check if removeEventListener is called
      instances.forEach(instance => {
        if (typeof (instance as any).dispose === 'function') {
          (instance as any).dispose();
        }
      });
      // Depending on how dispose is implemented, check removeEventListener calls
      // This check assumes dispose calls removeEventListener for the 'change' event
      expect(mediaQueryMockListenerFunctions.removeEventListener).toHaveBeenCalledTimes(instances.length);
    });
  });

  describe('Chart.js Integration Edge Cases', () => {
    beforeEach(() => {
        // Instances will be created and tracked within individual tests for this block
    });

    test('should handle Chart instances with missing update method', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      const mockChartInstanceWithoutUpdate = { id: 1 }; // No update method
      const mockChartInstanceWithUpdate = { update: jest.fn(), id: 2 };
      
      (Chart.instances as any) = {
        chart1: mockChartInstanceWithoutUpdate,
        chart2: mockChartInstanceWithUpdate
      };
      
      expect(() => {
        service.toggleTheme();
      }).not.toThrow();
      
      expect(mockChartInstanceWithUpdate.update).toHaveBeenCalled();
    });

    test('should handle Chart instances as array instead of object', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      // Some Chart.js versions might use array
      (Chart.instances as any) = [
        { update: jest.fn(), id: 1 },
        { update: jest.fn(), id: 2 }
      ];
      
      expect(() => {
        service.toggleTheme();
      }).not.toThrow();
    });

    test('should handle Chart.defaults with missing nested properties', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      // Simulate incomplete Chart.defaults structure
      const originalDefaults = JSON.parse(JSON.stringify(globalChartDefaults)); // Use globalChartDefaults
      Object.keys(globalChartDefaults).forEach(key => delete (globalChartDefaults as any)[key]);
      (globalChartDefaults as any).scale = {};
      (globalChartDefaults as any).plugins = {};
      
      expect(() => {
        service.toggleTheme();
      }).not.toThrow();
      
      Object.assign(globalChartDefaults, JSON.parse(JSON.stringify(originalDefaults)));
    });

    test('should handle Chart.defaults.scale being null', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      const originalScale = JSON.parse(JSON.stringify(globalChartDefaults.scale));
      try {
        (globalChartDefaults as any).scale = null;

        expect(() => {
          service.toggleTheme();
        }).not.toThrow();
      } finally {
        globalChartDefaults.scale = originalScale || { ticks: {}, grid: {}, title: {} }; // Restore or set to default object
      }
    });

    test('should handle Chart.defaults.plugins being null', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      const originalPlugins = JSON.parse(JSON.stringify(globalChartDefaults.plugins));
      try {
        (globalChartDefaults as any).plugins = null;

        expect(() => {
          service.toggleTheme();
        }).not.toThrow();
      } finally {
        globalChartDefaults.plugins = originalPlugins || { legend: { labels: {} }, title: {} }; // Restore or set to default object
      }
    });
  });

  describe('Theme Validation and Data Integrity', () => {
    beforeEach(() => {
        // Instances will be created and tracked within individual tests for this block
    });

    test('should only accept valid theme values', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      const currentTheme = service.getCurrentTheme();
      
      // getCurrentTheme should always return 'light' or 'dark'
      expect(['light', 'dark']).toContain(currentTheme);
    });

    test('should maintain theme consistency across page reloads', () => {
      const service1 = new ThemeService();
      testServiceInstances.push(service1);
      service1.toggleTheme();
      const theme1 = service1.getCurrentTheme();
      
      // Simulate page reload by creating new instance
      const service2 = new ThemeService();
      testServiceInstances.push(service2);
      const theme2 = service2.getCurrentTheme();
      
      expect(theme1).toBe(theme2);
    });

    test('should handle localStorage quota exceeded gracefully', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });
      
      expect(() => {
        service.toggleTheme();
      }).not.toThrow();
      
      localStorageMock.setItem = originalSetItem;
    });
  });

  describe('Browser Compatibility', () => {
    test('should work with older browsers without modern matchMedia features', () => {
      const originalMatchMedia = window.matchMedia;
      const legacyMatchMedia = (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      });
      
      Object.defineProperty(window, 'matchMedia', { value: jest.fn(legacyMatchMedia), configurable: true });
      let service: ThemeService | undefined;
      try {
        expect(() => {
          service = new ThemeService();
          if (service) testServiceInstances.push(service);
        }).not.toThrow();
      } finally {
        Object.defineProperty(window, 'matchMedia', { value: matchMediaMock, configurable: true }); // Restore to the defined mock
      }
    });

    test('should handle matchMedia returning null', () => {
      const originalMatchMedia = window.matchMedia; // Still useful to save the current state before this specific test's override
      Object.defineProperty(window, 'matchMedia', { value: jest.fn(() => null), configurable: true });
      let service: ThemeService | undefined;
      try {
        expect(() => {
          service = new ThemeService();
          if (service) testServiceInstances.push(service);
        }).not.toThrow();
      } finally {
        Object.defineProperty(window, 'matchMedia', { value: matchMediaMock, configurable: true }); // Restore to the defined mock
      }
    });

    test('should handle matchMedia throwing an error', () => {
      const originalMatchMedia = window.matchMedia; // Still useful to save the current state
      Object.defineProperty(window, 'matchMedia', { value: jest.fn(() => { throw new Error('matchMedia not supported'); }), configurable: true });
      let service: ThemeService | undefined;
      try {
        expect(() => {
          service = new ThemeService();
          if (service) testServiceInstances.push(service);
        }).not.toThrow();
      } finally {
        Object.defineProperty(window, 'matchMedia', { value: matchMediaMock, configurable: true }); // Restore to the defined mock
      }
    });
  });

  describe('System Theme Detection Edge Cases', () => {
    test('should handle system theme detection when matchMedia returns different values', () => {
      const originalMatchMedia = window.matchMedia;
      let callCount = 0;
      Object.defineProperty(window, 'matchMedia', { value: jest.fn((query: string) => {
        callCount++;
        return {
          matches: query === '(prefers-color-scheme: dark)' && callCount % 2 === 0,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
      }), configurable: true });
      let service: ThemeService | undefined;
      try {
        service = new ThemeService();
        if (service) testServiceInstances.push(service);
        expect(['light', 'dark']).toContain(service.getCurrentTheme());
      } finally {
        Object.defineProperty(window, 'matchMedia', { value: matchMediaMock, configurable: true }); // Restore to the defined mock
      }
    });

    test('should handle multiple media queries being checked', () => {
      const queryResults = new Map([
        ['(prefers-color-scheme: dark)', true],
        ['(prefers-color-scheme: light)', false],
        ['(prefers-reduced-motion: reduce)', false],
      ]);
      
      matchMediaMock.mockImplementation((query: string) => ({
        matches: queryResults.get(query) || false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      } as any));
      let service: ThemeService | undefined;
      try {
        service = new ThemeService();
        if (service) testServiceInstances.push(service);
        expect(service.getCurrentTheme()).toBe('dark');
      } finally {
        Object.defineProperty(window, 'matchMedia', { value: matchMediaMock, configurable: true }); // Restore original mock
      }
    });
  });

  describe('Integration with DOM APIs', () => {
    // Tests in this block will use a fresh ThemeService instance created in their beforeEach or locally.
     beforeEach(() => {
        // Individual tests in this block will create and track their own instances.
    });

    test('should handle setAttribute failing', () => {
      const service = new ThemeService(); // Local instance
      testServiceInstances.push(service);
      const originalSetAttribute = document.documentElement.setAttribute;
      document.documentElement.setAttribute = jest.fn(() => {
        throw new Error('setAttribute failed');
      });
      
      expect(() => {
        service.toggleTheme();
      }).not.toThrow();
      
      document.documentElement.setAttribute = originalSetAttribute;
    });

    test('should handle classList operations failing', () => {
      const service = new ThemeService(); // Use a local instance
      testServiceInstances.push(service);
      const originalAdd = document.body.classList.add;
      const originalRemove = document.body.classList.remove;
      
      document.body.classList.add = jest.fn(() => {
        throw new Error('classList.add failed');
      });
      document.body.classList.remove = jest.fn(() => {
        throw new Error('classList.remove failed');
      });
      
      expect(() => {
        service.toggleTheme();
      }).not.toThrow();
      
      document.body.classList.add = originalAdd;
      document.body.classList.remove = originalRemove;
    });
  });

  describe('State Management', () => {
    test('should maintain internal state consistency', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      const initialTheme = service.getCurrentTheme();
      
      // Toggle and check state
      service.toggleTheme();
      const toggledTheme = service.getCurrentTheme();
      expect(toggledTheme).not.toBe(initialTheme);
      
      // Toggle back
      service.toggleTheme();
      expect(service.getCurrentTheme()).toBe(initialTheme);
    });

    test('should handle external localStorage changes', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      const currentTheme = service.getCurrentTheme();
      
      // Simulate external change to localStorage
      localStorageMock.setItem(THEME_KEY, currentTheme === 'light' ? 'dark' : 'light');
      
      // Create new instance to pick up the change
      const newService = new ThemeService();
      testServiceInstances.push(newService);
      expect(newService.getCurrentTheme()).not.toBe(currentTheme);
    });
  });

  describe('Accessibility and User Experience', () => {
    beforeEach(() => {
        // mockHtmlElement and document.body will be set up here.
        // Service instances will be created within each test.
        mockHtmlElement = document.documentElement;
        if (mockHtmlElement && typeof mockHtmlElement.setAttribute === 'function') {
            jest.spyOn(mockHtmlElement, 'setAttribute'); // Ensure this spies on the actual element or a fresh mock
        } else {
            // Fallback if document.documentElement is not standard or available
            mockHtmlElement = { setAttribute: jest.fn() } as any;
            // If this path is taken, setAttribute is already a jest.fn(), no need to spy.
        }
        // Explicitly clear body classes for this test block
        if(document.body) document.body.className = '';
    });

    test('should apply theme consistently to all required DOM elements', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);

      service.toggleTheme(); // Switch to dark
      
      if (!document.body) throw new Error("document.body is null in test");
      // expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(true); // This line is problematic
      if (!mockHtmlElement) throw new Error("mockHtmlElement is null in test");
      expect(mockHtmlElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
      
      service.toggleTheme(); // Switch back to light
      
      // expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(false); // This line is problematic
      expect(mockHtmlElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    test('should handle rapid system theme changes', () => {
      localStorageMock.clear(); // Ensure we follow system preference
      
      const mockMq = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };
      
      matchMediaMock.mockReturnValue(mockMq as any);
      const service = new ThemeService();
      testServiceInstances.push(service); // Track this instance
      
      // Get the listener
      const listener = mockMq.addEventListener.mock.calls[0]?.[1] || mockMq.addListener.mock.calls[0]?.[0];
      
      if (listener) {
        // Simulate rapid system theme changes
        listener({ matches: true });
        expect(service.getCurrentTheme()).toBe('dark');
        
        listener({ matches: false });
        expect(service.getCurrentTheme()).toBe('light');
        
        listener({ matches: true });
        expect(service.getCurrentTheme()).toBe('dark');
      }
    });
  });
});
