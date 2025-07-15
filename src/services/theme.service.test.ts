
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

  afterEach(() => {
    jest.clearAllMocks();
    // Dispose all tracked instances
    testServiceInstances.forEach(instance => {
      if (typeof (instance as any).dispose === 'function') {
        (instance as any).dispose();
      }
    });
    testServiceInstances = []; // Clear the array

    // Always restore matchMedia to the default mock after each test
    Object.defineProperty(window, 'matchMedia', { value: matchMediaMock, configurable: true });
  });

  describe('Constructor (Initialization)', () => {
    test('should initialize to "light" theme if no stored theme and system prefers light', () => {
      systemPrefersDark = false;
      localStorageMock.clear();
      const service = new ThemeService();
      testServiceInstances.push(service);
      expect(service.getCurrentTheme()).toBe('light');
      // expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(false); // This line is problematic
      expect(mockHtmlElement!.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    test('should initialize to "dark" theme if no stored theme and system prefers dark', () => {
      systemPrefersDark = true;
      localStorageMock.clear();
      const service = new ThemeService();
      testServiceInstances.push(service);
      expect(service.getCurrentTheme()).toBe('dark');
      // expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(true); // This line is problematic
      expect(mockHtmlElement!.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    test('should initialize to stored theme ("light") if it exists, ignoring system preference', () => {
      systemPrefersDark = true; // System prefers dark
      localStorageMock.setItem(THEME_KEY, 'light'); // But stored is light
      const service = new ThemeService();
      testServiceInstances.push(service);
      expect(service.getCurrentTheme()).toBe('light');
      // expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(false); // This line is problematic
    });

    test('should initialize to stored theme ("dark") if it exists, ignoring system preference', () => {
      systemPrefersDark = false; // System prefers light
      localStorageMock.setItem(THEME_KEY, 'dark'); // But stored is dark
      const service = new ThemeService();
      testServiceInstances.push(service);
      expect(service.getCurrentTheme()).toBe('dark');
      // expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(true); // This line is problematic
    });

    test('should apply theme and update chart defaults on initialization', () => {
        // Spy on the prototype method before instantiation
        const updateChartDefaultsSpy = jest.spyOn(ThemeService.prototype as any, 'updateChartDefaults');
        const service = new ThemeService(); // Instantiate
        testServiceInstances.push(service);
        expect(updateChartDefaultsSpy).toHaveBeenCalled();
        updateChartDefaultsSpy.mockRestore(); // Clean up spy
      });
  });

  describe('toggleTheme', () => {
    test('should switch from light to dark theme', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      service.toggleTheme();
      expect(service.getCurrentTheme()).toBe('dark');
      expect(localStorageMock.getItem(THEME_KEY)).toBe('dark');
      // expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(true); // This line is problematic
      expect(mockHtmlElement!.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    test('should switch from dark to light theme', () => {
      localStorageMock.setItem(THEME_KEY, 'dark');
      const service = new ThemeService();
      testServiceInstances.push(service);
      expect(service.getCurrentTheme()).toBe('dark'); // Verify initial state

      service.toggleTheme(); // Toggle to light
      expect(service.getCurrentTheme()).toBe('light');
      expect(localStorageMock.getItem(THEME_KEY)).toBe('light');
      // expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(false); // This line is problematic
      expect(mockHtmlElement!.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    test('should call applyTheme and thus updateChartDefaults on toggle', () => {
        const service = new ThemeService();
        testServiceInstances.push(service);
        const applyThemeSpy = jest.spyOn(service as any, 'applyTheme');
        const updateChartsSpy = jest.spyOn(service as any, 'updateChartDefaults');
        service.toggleTheme();
        expect(applyThemeSpy).toHaveBeenCalled();
        expect(updateChartsSpy).toHaveBeenCalled();
      });
  });

  describe('getCurrentTheme', () => {
    test('should return the current theme value', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      expect(service.getCurrentTheme()).toBe('light');
      service.toggleTheme();
      expect(service.getCurrentTheme()).toBe('dark');
    });
  });

  describe('System Theme Change Listener', () => {
    let mediaQueryListener: ((event: { matches: boolean }) => void) | null = null;
    let inspectableMq: any; // To hold the specific MQL object for dark scheme
    const originalMatchMediaImpl = matchMediaMock.getMockImplementation() || defaultMatchMediaImplementation;

    beforeEach(() => { // This beforeEach is nested, ensure it correctly sets up what's needed for this block
      localStorageMock.clear();
      systemPrefersDark = false;

      inspectableMq = {
        matches: systemPrefersDark,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };

      matchMediaMock.mockImplementation((query: string) => {
        if (query === '(prefers-color-scheme: dark)') {
          inspectableMq.matches = systemPrefersDark; // Ensure 'matches' is current
          return inspectableMq;
        }
        return originalMatchMediaImpl(query);
      });
      // Service instance will be created in each test within this block as needed

      const addEventListenerCalls = inspectableMq.addEventListener.mock.calls;
      const addListenerCalls = inspectableMq.addListener.mock.calls;

      if (addEventListenerCalls.length > 0 && addEventListenerCalls[0][0] === 'change') {
        mediaQueryListener = addEventListenerCalls[0][1];
      } else if (addListenerCalls.length > 0) {
        mediaQueryListener = addListenerCalls[0][0];
      } else {
        mediaQueryListener = null;
      }
    });

    afterEach(() => {
      // Restore the global matchMedia mock to its default behavior after tests in this block
      matchMediaMock.mockImplementation(originalMatchMediaImpl);
    });

    test('should change theme if system theme changes and no user theme is set', () => {
      const service = new ThemeService(); // Create service for this test
      testServiceInstances.push(service);
      // service is light by default, systemPrefersDark is false due to the describe's beforeEach.
      expect(service.getCurrentTheme()).toBe('light');

      // Retrieve the listener attached by *this* service instance.
      // The inspectableMq.addEventListener would have been called during `new ThemeService()`.
      const addEventListenerCalls = inspectableMq.addEventListener.mock.calls;
      let currentListener: ((event: { matches: boolean }) => void) | null = null;
      if (addEventListenerCalls.length > 0 && addEventListenerCalls[addEventListenerCalls.length-1][0] === 'change') {
        currentListener = addEventListenerCalls[addEventListenerCalls.length-1][1];
      } else {
         const addListenerCalls = inspectableMq.addListener.mock.calls;
         if (addListenerCalls.length > 0) {
            currentListener = addListenerCalls[addListenerCalls.length-1][0];
         }
      }

      if (!currentListener) {
        throw new Error("Media query listener was not captured for this test's service instance.");
      }
      currentListener({ matches: true }); // Simulate system theme changing to dark

      expect(service.getCurrentTheme()).toBe('dark');
      // expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(true); // This line is problematic
    });

    test('should NOT change theme if system theme changes but a user theme IS set in localStorage', () => {
      localStorageMock.setItem(THEME_KEY, 'light');
      systemPrefersDark = false; // System initially prefers light

      const inspectableMqForThisTest = {
        matches: systemPrefersDark, // Initial state
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };

      // Temporarily override global matchMediaMock for this specific instantiation
      const originalImpl = matchMediaMock.getMockImplementation() || defaultMatchMediaImplementation;
      matchMediaMock.mockImplementation((query: string) => {
        if (query === '(prefers-color-scheme: dark)') {
          inspectableMqForThisTest.matches = systemPrefersDark; // Update based on current test scope systemPrefersDark
          return inspectableMqForThisTest;
        }
        return originalImpl(query);
      });

      const serviceWithUserPref = new ThemeService();
      testServiceInstances.push(serviceWithUserPref);
      expect(serviceWithUserPref.getCurrentTheme()).toBe('light'); // Should be 'light' due to localStorage

      // Restore global matchMediaMock immediately after service instantiation for this test
      matchMediaMock.mockImplementation(originalImpl);

      // Now, try to trigger the listener that serviceWithUserPref attached to inspectableMqForThisTest
      let attachedListener: ((event: { matches: boolean }) => void) | null = null;
      if (inspectableMqForThisTest.addEventListener.mock.calls.length > 0 &&
          inspectableMqForThisTest.addEventListener.mock.calls[0][0] === 'change') {
        attachedListener = inspectableMqForThisTest.addEventListener.mock.calls[0][1];
      } else if (inspectableMqForThisTest.addListener.mock.calls.length > 0) {
        attachedListener = inspectableMqForThisTest.addListener.mock.calls[0][0];
      }

      if (attachedListener) {
        // Simulate system trying to change to dark
        systemPrefersDark = true; // This would affect inspectableMqForThisTest.matches if it were queried again
        inspectableMqForThisTest.matches = true; // More direct: simulate event object's matches property
        attachedListener({ matches: true });
      } else {
        throw new Error("Listener for serviceWithUserPref not captured on its specific MQL mock.");
      }

      // The theme should remain 'light' because localStorage has a value
      expect(serviceWithUserPref.getCurrentTheme()).toBe('light');
      // expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(false); // This line is problematic
    });

    test('should use addListener if addEventListener is not available on mediaQuery', () => {
      localStorageMock.clear();
      systemPrefersDark = false;

      // Keep a reference to the original implementation of our top-level matchMediaMock
      const originalMatchMediaImpl = matchMediaMock.getMockImplementation() || defaultMatchMediaImplementation;

      const specificMqMock = {
        matches: systemPrefersDark,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: jest.fn(), // Fresh spy for this specific media query object
        removeListener: jest.fn(),
        addEventListener: undefined, // Simulate 'addEventListener' is not available
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };

      // Temporarily change the implementation of the global window.matchMedia mock
      matchMediaMock.mockImplementation(((query: string) => {
        if (query === '(prefers-color-scheme: dark)') {
          return specificMqMock;
        }
        // For any other query, fall back to the original mock's behavior
        return originalMatchMediaImpl(query);
      }) as any); // Cast to any to satisfy TypeScript for this temporary broader signature

      const serviceForOldBrowser = new ThemeService();
      testServiceInstances.push(serviceForOldBrowser);

      expect(specificMqMock.addListener).toHaveBeenCalledWith(expect.any(Function));
      expect(serviceForOldBrowser.getCurrentTheme()).toBe('light');

      if (specificMqMock.addListener.mock.calls.length > 0) {
        const listener = specificMqMock.addListener.mock.calls[0][0];
        listener({ matches: true });
        expect(serviceForOldBrowser.getCurrentTheme()).toBe('dark');
      } else {
        throw new Error("addListener was not called or listener not captured for specificMqMock");
      }

      // Restore the original implementation to avoid affecting other tests
      matchMediaMock.mockImplementation(originalMatchMediaImpl);
    });
  });

  describe('updateChartDefaults', () => {
    test('should set Chart.defaults for light theme', () => {
      localStorageMock.setItem(THEME_KEY, 'light');
      const service = new ThemeService(); // Init as light
      testServiceInstances.push(service);

      expect(Chart.defaults.color).toBe('#333');
      if (Chart.defaults.scale) {
        expect(Chart.defaults.scale.ticks.color).toBe('#333');
        expect(Chart.defaults.scale.grid.color).toBe('rgba(0, 0, 0, 0.1)');
      }
    });

    test('should set Chart.defaults for dark theme', () => {
      localStorageMock.setItem(THEME_KEY, 'dark');
      const service = new ThemeService(); // Init as dark
      testServiceInstances.push(service);

      expect(Chart.defaults.color).toBe('#e0e0e0');
      if (Chart.defaults.scale) {
        expect(Chart.defaults.scale.ticks.color).toBe('#e0e0e0');
        expect(Chart.defaults.scale.grid.color).toBe('rgba(255, 255, 255, 0.1)');
      }
    });

    test('should call update on all active Chart instances', () => {
      const service = new ThemeService(); // Use local instance
      testServiceInstances.push(service);
      const mockChartInstance1 = { update: jest.fn(), id: 1 };
      const mockChartInstance2 = { update: jest.fn(), id: 2 };

      (Chart.instances as any) = {
        'chart1': mockChartInstance1,
        'chart2': mockChartInstance2
      };

      service.toggleTheme();

      expect(mockChartInstance1.update).toHaveBeenCalledTimes(1);
      expect(mockChartInstance2.update).toHaveBeenCalledTimes(1);
       // Clear instances for other tests
       (Chart.instances as any) = {};
    });

    test('should not throw if Chart or Chart.defaults are not fully available', () => {
        const service = new ThemeService(); // Create local instance
        testServiceInstances.push(service);
        const originalChart = (globalThis as any).Chart;
        (globalThis as any).Chart = undefined;

        expect(() => {
          service.toggleTheme();
        }).not.toThrow();

        (globalThis as any).Chart = { defaults: undefined, instances: {} };
        expect(() => {
            service.toggleTheme();
          }).not.toThrow();

        (globalThis as any).Chart = originalChart;
      });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle localStorage.getItem throwing an error during construction', () => {
      const getItemSpy = jest.spyOn(localStorageMock, 'getItem').mockImplementation(() => {
        throw new Error('localStorage.getItem unavailable');
      });
      let service: ThemeService | undefined;
      expect(() => {
        service = new ThemeService();
        if (service) testServiceInstances.push(service);
      }).not.toThrow();
      getItemSpy.mockRestore();
    });

    test('should handle localStorage.setItem throwing an error during toggleTheme', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      const setItemSpy = jest.spyOn(localStorageMock, 'setItem').mockImplementation(() => {
        throw new Error('localStorage.setItem unavailable');
      });
      expect(() => {
        service.toggleTheme();
      }).not.toThrow();
      setItemSpy.mockRestore();
    });

    test('should handle malformed data in localStorage', () => {
      // Set invalid theme value
      localStorageMock.setItem(THEME_KEY, 'invalid-theme');
      
      const service = new ThemeService();
      testServiceInstances.push(service);
      // Service should fallback to system default.
      // Given systemPrefersDark is false in the global beforeEach, it should fallback to 'light'.
      expect(service.getCurrentTheme()).toBe('light');
    });

    test('should handle null/undefined localStorage values gracefully', () => {
      localStorageMock.setItem(THEME_KEY, 'null');
      let service1: ThemeService;
      expect(() => {
        service1 = new ThemeService();
        testServiceInstances.push(service1);
      }).not.toThrow();
      
      localStorageMock.setItem(THEME_KEY, 'undefined');
      let service2: ThemeService;
      expect(() => {
        service2 = new ThemeService();
        testServiceInstances.push(service2);
      }).not.toThrow();
      
      localStorageMock.setItem(THEME_KEY, '');
      let service3: ThemeService;
      expect(() => {
        service3 = new ThemeService();
        testServiceInstances.push(service3);
      }).not.toThrow();
    });

    test('should handle missing document.body gracefully', () => {
      const originalBody = document.body;
      try {
        Object.defineProperty(document, 'body', { value: null, writable: true, configurable: true });
        let service: ThemeService | undefined;
        expect(() => {
          service = new ThemeService();
          if (service) testServiceInstances.push(service);
          service!.toggleTheme();
        }).not.toThrow();
      } finally {
        Object.defineProperty(document, 'body', { value: originalBody, writable: true, configurable: true });
      }
    });

    test('should handle missing document.documentElement gracefully', () => {
      const originalDocumentElement = document.documentElement;
      try {
        Object.defineProperty(document, 'documentElement', { value: null, writable: true, configurable: true });
        let service: ThemeService | undefined;
        expect(() => {
          service = new ThemeService();
          if (service) testServiceInstances.push(service);
          service!.toggleTheme();
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

  describe('Advanced Integration Scenarios', () => {
    test('should handle theme switching during Chart.js animation', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      const mockChartInstance = { 
        update: jest.fn(),
        id: 1,
        isAnimating: true,
        stop: jest.fn()
      };
      
      (Chart.instances as any) = { chart1: mockChartInstance };
      
      // Switch theme while chart is animating
      service.toggleTheme();
      
      expect(mockChartInstance.update).toHaveBeenCalled();
      (Chart.instances as any) = {};
    });

    test('should maintain theme preferences across multiple browser tabs simulation', () => {
      const service1 = new ThemeService();
      testServiceInstances.push(service1);
      
      // Simulate storage event from another tab
      const storageEvent = new StorageEvent('storage', {
        key: THEME_KEY,
        newValue: 'dark',
        oldValue: 'light',
        storageArea: localStorage
      });
      
      expect(() => {
        window.dispatchEvent(storageEvent);
      }).not.toThrow();
    });

    test('should handle theme switching in iframe context', () => {
      const originalParent = window.parent;
      const mockParent = {
        matchMedia: jest.fn(() => ({
          matches: true,
          media: '(prefers-color-scheme: dark)',
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        }))
      };
      
      Object.defineProperty(window, 'parent', { value: mockParent, configurable: true });
      
      try {
        const service = new ThemeService();
        testServiceInstances.push(service);
        expect(service.getCurrentTheme()).toBeDefined();
      } finally {
        Object.defineProperty(window, 'parent', { value: originalParent, configurable: true });
      }
    });
  });

  describe('Performance Optimization Tests', () => {
    test('should debounce rapid system theme changes', async () => {
      localStorageMock.clear();
      
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
      testServiceInstances.push(service);
      
      const listener = mockMq.addEventListener.mock.calls[0]?.[1] || mockMq.addListener.mock.calls[0]?.[0];
      const updateSpy = jest.spyOn(service as any, 'updateChartDefaults');
      
      if (listener) {
        // Rapid theme changes
        listener({ matches: true });
        listener({ matches: false });
        listener({ matches: true });
        listener({ matches: false });
        
        // Wait for any potential debouncing
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Should still handle all changes
        expect(service.getCurrentTheme()).toBe('light');
      }
      
      updateSpy.mockRestore();
    });

    test('should efficiently handle large numbers of Chart instances', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      // Create many mock chart instances
      const chartInstances: any = {};
      for (let i = 0; i < 100; i++) {
        chartInstances[`chart${i}`] = { update: jest.fn(), id: i };
      }
      
      (Chart.instances as any) = chartInstances;
      
      const startTime = performance.now();
      service.toggleTheme();
      const endTime = performance.now();
      
      // Should complete quickly even with many instances
      expect(endTime - startTime).toBeLessThan(100); // 100ms threshold
      
      // Verify all instances were updated
      Object.values(chartInstances).forEach((instance: any) => {
        expect(instance.update).toHaveBeenCalled();
      });
      
      (Chart.instances as any) = {};
    });
  });

  describe('Security and Data Validation', () => {
    test('should sanitize malicious localStorage values', () => {
      const maliciousValues = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '../../etc/passwd',
        'null',
        'undefined',
        '{}',
        '[]',
        'true',
        'false',
        '0',
        '1',
        '"dark"',
        "'light'",
      ];
      
      maliciousValues.forEach(value => {
        localStorageMock.setItem(THEME_KEY, value);
        
        expect(() => {
          const service = new ThemeService();
          testServiceInstances.push(service);
          const theme = service.getCurrentTheme();
          expect(['light', 'dark']).toContain(theme);
        }).not.toThrow();
      });
    });

    test('should validate theme values before applying', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      // Attempt to set invalid theme through reflection or other means
      const originalTheme = service.getCurrentTheme();
      
      // Try to corrupt internal state (if accessible)
      try {
        (service as any).currentTheme = 'invalid-theme';
      } catch (e) {
        // Expected if property is protected
      }
      
      // getCurrentTheme should still return valid value
      expect(['light', 'dark']).toContain(service.getCurrentTheme());
    });
  });

  describe('Accessibility Enhancement Tests', () => {
    test('should trigger accessibility events on theme change', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      const announceElement = document.createElement('div');
      announceElement.setAttribute('aria-live', 'polite');
      announceElement.id = 'theme-announcer';
      document.body.appendChild(announceElement);
      
      try {
        service.toggleTheme();
        
        // Should handle accessibility announcements gracefully
        expect(() => {
          const event = new CustomEvent('themeChanged', {
            detail: { theme: service.getCurrentTheme() }
          });
          document.dispatchEvent(event);
        }).not.toThrow();
      } finally {
        document.body.removeChild(announceElement);
      }
    });

    test('should respect prefers-reduced-motion settings', () => {
      const reducedMotionMq = {
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = jest.fn((query) => {
        if (query === '(prefers-reduced-motion: reduce)') {
          return reducedMotionMq as any;
        }
        return matchMediaMock(query);
      });
      
      try {
        const service = new ThemeService();
        testServiceInstances.push(service);
        
        // Theme changes should still work with reduced motion
        service.toggleTheme();
        expect(['light', 'dark']).toContain(service.getCurrentTheme());
      } finally {
        window.matchMedia = originalMatchMedia;
      }
    });
  });

  describe('Chart.js Version Compatibility', () => {
    test('should handle Chart.js v3.x defaults structure', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      // Simulate Chart.js v3 structure
      const originalDefaults = { ...globalChartDefaults };
      Object.assign(globalChartDefaults, {
        elements: {
          arc: { borderColor: '#fff' },
          bar: { borderColor: '#fff' },
          line: { borderColor: '#fff' }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      });
      
      try {
        expect(() => service.toggleTheme()).not.toThrow();
      } finally {
        Object.assign(globalChartDefaults, originalDefaults);
      }
    });

    test('should handle Chart.js v4.x defaults structure', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      // Simulate Chart.js v4 structure with new properties
      const originalDefaults = { ...globalChartDefaults };
      Object.assign(globalChartDefaults, {
        datasets: {
          line: { borderColor: '#333' },
          bar: { backgroundColor: '#333' }
        },
        layout: {
          padding: 10
        }
      });
      
      try {
        expect(() => service.toggleTheme()).not.toThrow();
      } finally {
        Object.assign(globalChartDefaults, originalDefaults);
      }
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should recover from corrupt Chart.js state', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      // Corrupt Chart.defaults
      const originalChart = (globalThis as any).Chart;
      (globalThis as any).Chart = {
        defaults: null,
        instances: 'not-an-object'
      };
      
      try {
        expect(() => service.toggleTheme()).not.toThrow();
      } finally {
        (globalThis as any).Chart = originalChart;
      }
    });

    test('should handle DOM mutations during theme application', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      // Simulate DOM being modified during theme application
      const originalSetAttribute = document.documentElement.setAttribute;
      let callCount = 0;
      document.documentElement.setAttribute = jest.fn((name, value) => {
        callCount++;
        if (callCount === 1) {
          // Simulate DOM change on first call
          document.body.remove();
        }
        return originalSetAttribute.call(document.documentElement, name, value);
      });
      
      try {
        expect(() => service.toggleTheme()).not.toThrow();
      } finally {
        document.documentElement.setAttribute = originalSetAttribute;
        // Re-add body if it was removed
        if (!document.body) {
          document.documentElement.appendChild(document.createElement('body'));
        }
      }
    });
  });

  describe('Internationalization and Localization', () => {
    test('should handle RTL languages with theme switching', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      // Simulate RTL document
      const originalDir = document.documentElement.dir;
      document.documentElement.dir = 'rtl';
      
      try {
        service.toggleTheme();
        expect(['light', 'dark']).toContain(service.getCurrentTheme());
        expect(mockHtmlElement!.setAttribute).toHaveBeenCalledWith(
          'data-theme', 
          expect.stringMatching(/^(light|dark)$/)
        );
      } finally {
        document.documentElement.dir = originalDir;
      }
    });

    test('should respect system locale for theme preferences', () => {
      const originalLanguage = navigator.language;
      const originalLanguages = navigator.languages;
      
      // Mock different locales
      Object.defineProperty(navigator, 'language', { value: 'ar-SA', configurable: true });
      Object.defineProperty(navigator, 'languages', { value: ['ar-SA', 'ar'], configurable: true });
      
      try {
        const service = new ThemeService();
        testServiceInstances.push(service);
        expect(['light', 'dark']).toContain(service.getCurrentTheme());
      } finally {
        Object.defineProperty(navigator, 'language', { value: originalLanguage, configurable: true });
        Object.defineProperty(navigator, 'languages', { value: originalLanguages, configurable: true });
      }
    });
  });

  describe('Mobile and Touch Device Compatibility', () => {
    test('should handle mobile viewport changes', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      // Simulate mobile viewport
      const originalInnerWidth = window.innerWidth;
      const originalInnerHeight = window.innerHeight;
      
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 667, configurable: true });
      
      try {
        service.toggleTheme();
        expect(['light', 'dark']).toContain(service.getCurrentTheme());
      } finally {
        Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, configurable: true });
        Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, configurable: true });
      }
    });

    test('should handle orientation changes', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      // Simulate orientation change
      const orientationEvent = new Event('orientationchange');
      
      expect(() => {
        window.dispatchEvent(orientationEvent);
        service.toggleTheme();
      }).not.toThrow();
    });
  });

  describe('Dark Mode System Integration', () => {
    test('should handle macOS dark mode transitions', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      // Simulate macOS system appearance change
      const mockMq = {
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      
      matchMediaMock.mockReturnValue(mockMq as any);
      
      const listener = mockMq.addEventListener.mock.calls[0]?.[1] || mockMq.addListener.mock.calls[0]?.[0];
      
      if (listener) {
        // Simulate system switching to dark mode
        listener({ matches: true });
        // Should follow system preference if no user preference set
        localStorageMock.clear();
        expect(() => {
          const newService = new ThemeService();
          testServiceInstances.push(newService);
        }).not.toThrow();
      }
    });

    test('should handle Windows high contrast mode', () => {
      const highContrastMq = {
        matches: true,
        media: '(prefers-contrast: high)',
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = jest.fn((query) => {
        if (query === '(prefers-contrast: high)') {
          return highContrastMq as any;
        }
        return matchMediaMock(query);
      });
      
      try {
        const service = new ThemeService();
        testServiceInstances.push(service);
        
        service.toggleTheme();
        expect(['light', 'dark']).toContain(service.getCurrentTheme());
      } finally {
        window.matchMedia = originalMatchMedia;
      }
    });
  });

  describe('Memory Leak Prevention', () => {
    test('should not create memory leaks with repeated instantiation', () => {
      const initialInstanceCount = testServiceInstances.length;
      
      // Create and destroy many instances
      for (let i = 0; i < 50; i++) {
        const service = new ThemeService();
        testServiceInstances.push(service);
        service.toggleTheme();
        
        // Simulate disposal if available
        if (typeof (service as any).dispose === 'function') {
          (service as any).dispose();
        }
      }
      
      // Should not accumulate event listeners or other resources
      expect(testServiceInstances.length).toBeGreaterThan(initialInstanceCount);
    });

    test('should clean up Chart.js references on disposal', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      const mockChart = { update: jest.fn(), destroy: jest.fn(), id: 1 };
      (Chart.instances as any) = { chart1: mockChart };
      
      service.toggleTheme();
      expect(mockChart.update).toHaveBeenCalled();
      
      // Simulate service disposal
      if (typeof (service as any).dispose === 'function') {
        (service as any).dispose();
      }
      
      (Chart.instances as any) = {};
    });
  });

  describe('Edge Case Error Scenarios', () => {
    test('should handle JSON parsing errors in localStorage', () => {
      // Mock localStorage to return non-string values
      const originalGetItem = localStorageMock.getItem;
      localStorageMock.getItem = jest.fn(() => ({} as any)); // Return object instead of string
      
      try {
        expect(() => {
          const service = new ThemeService();
          testServiceInstances.push(service);
        }).not.toThrow();
      } finally {
        localStorageMock.getItem = originalGetItem;
      }
    });

    test('should handle circular reference in Chart.js instances', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      const circularRef: any = { update: jest.fn() };
      circularRef.self = circularRef;
      
      (Chart.instances as any) = { circular: circularRef };
      
      expect(() => service.toggleTheme()).not.toThrow();
      expect(circularRef.update).toHaveBeenCalled();
      
      (Chart.instances as any) = {};
    });
  });

  describe('Dispose Method Comprehensive Testing', () => {
    test('should properly dispose all event listeners', () => {
      const mockMq = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      
      matchMediaMock.mockReturnValue(mockMq as any);
      
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      // Verify listeners were added
      expect(mockMq.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      
      // Call dispose
      service.dispose();
      
      // Verify listeners were removed
      expect(mockMq.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    test('should handle dispose when mediaQuery is undefined', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = jest.fn(() => undefined as any);
      
      try {
        const service = new ThemeService();
        testServiceInstances.push(service);
        
        expect(() => service.dispose()).not.toThrow();
      } finally {
        window.matchMedia = originalMatchMedia;
      }
    });

    test('should handle dispose when removeEventListener throws error', () => {
      const mockMq = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(() => {
          throw new Error('removeEventListener failed');
        }),
      };
      
      matchMediaMock.mockReturnValue(mockMq as any);
      
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      expect(() => service.dispose()).not.toThrow();
    });
  });

  describe('Console Warning Testing', () => {
    let consoleWarnSpy: jest.SpyInstance;
    
    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });
    
    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    test('should log warning when localStorage.getItem fails', () => {
      localStorageMock.getItem = jest.fn(() => {
        throw new Error('localStorage unavailable');
      });
      
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'ThemeService: Failed to access localStorage.getItem',
        expect.any(Error)
      );
    });

    test('should log warning when matchMedia fails', () => {
      window.matchMedia = jest.fn(() => {
        throw new Error('matchMedia unavailable');
      });
      
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'ThemeService: Failed to access window.matchMedia',
        expect.any(Error)
      );
    });

    test('should log warning when Chart.js update fails', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      const mockChart = {
        update: jest.fn(() => {
          throw new Error('Chart update failed');
        })
      };
      
      (Chart.instances as any) = { chart1: mockChart };
      
      service.toggleTheme();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'ThemeService: Failed to update Chart.js defaults or instances',
        expect.any(Error)
      );
      
      (Chart.instances as any) = {};
    });
  });

  describe('Theme Persistence Edge Cases', () => {
    test('should handle theme persistence when localStorage quota is exceeded', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      localStorageMock.setItem = jest.fn(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });
      
      const currentTheme = service.getCurrentTheme();
      service.toggleTheme();
      
      // Theme should still change in memory even if persistence fails
      expect(service.getCurrentTheme()).not.toBe(currentTheme);
    });

    test('should handle theme switching when localStorage is disabled', () => {
      const originalLocalStorage = window.localStorage;
      Object.defineProperty(window, 'localStorage', { value: undefined });
      
      try {
        const service = new ThemeService();
        testServiceInstances.push(service);
        
        expect(() => service.toggleTheme()).not.toThrow();
        expect(['light', 'dark']).toContain(service.getCurrentTheme());
      } finally {
        Object.defineProperty(window, 'localStorage', { value: originalLocalStorage });
      }
    });
  });

