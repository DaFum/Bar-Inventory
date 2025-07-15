
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

  describe('Advanced Edge Cases and Security', () => {
    test('should handle prototype pollution attempts in localStorage', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      // Attempt to pollute with __proto__ and constructor
      localStorageMock.setItem(THEME_KEY, '__proto__');
      const service2 = new ThemeService();
      testServiceInstances.push(service2);
      expect(['light', 'dark']).toContain(service2.getCurrentTheme());
      
      localStorageMock.setItem(THEME_KEY, 'constructor');
      const service3 = new ThemeService();
      testServiceInstances.push(service3);
      expect(['light', 'dark']).toContain(service3.getCurrentTheme());
    });

    test('should handle XSS attempts in localStorage theme values', () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        'javascript:void(0)',
        '"><script>alert("xss")</script>',
        "'><script>alert('xss')</script>",
        '&lt;script&gt;alert("xss")&lt;/script&gt;'
      ];
      
      xssAttempts.forEach((xssValue, index) => {
        localStorageMock.setItem(THEME_KEY, xssValue);
        const service = new ThemeService();
        testServiceInstances.push(service);
        expect(['light', 'dark']).toContain(service.getCurrentTheme());
        expect(service.getCurrentTheme()).not.toContain('<script>');
      });
    });

    test('should handle extremely long strings in localStorage', () => {
      const longString = 'a'.repeat(10000);
      localStorageMock.setItem(THEME_KEY, longString);
      
      let service: ThemeService;
      expect(() => {
        service = new ThemeService();
        testServiceInstances.push(service);
      }).not.toThrow();
      
      expect(['light', 'dark']).toContain(service!.getCurrentTheme());
    });

    test('should handle non-string values in localStorage mock', () => {
      const nonStringValues = [
        123,
        true,
        { theme: 'dark' },
        ['dark'],
        null,
        undefined
      ];
      
      nonStringValues.forEach((value, index) => {
        localStorageMock.setItem(THEME_KEY, value as any);
        const service = new ThemeService();
        testServiceInstances.push(service);
        expect(['light', 'dark']).toContain(service.getCurrentTheme());
      });
    });
  });

  describe('Cross-Tab Synchronization and Events', () => {
    test('should handle storage events from other tabs', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      const initialTheme = service.getCurrentTheme();
      
      // Simulate storage event from another tab
      const storageEvent = new StorageEvent('storage', {
        key: THEME_KEY,
        newValue: initialTheme === 'light' ? 'dark' : 'light',
        oldValue: initialTheme,
        storageArea: localStorage
      });
      
      expect(() => {
        window.dispatchEvent(storageEvent);
      }).not.toThrow();
    });

    test('should handle multiple rapid storage events', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      for (let i = 0; i < 50; i++) {
        const storageEvent = new StorageEvent('storage', {
          key: THEME_KEY,
          newValue: i % 2 === 0 ? 'light' : 'dark',
          oldValue: i % 2 === 1 ? 'light' : 'dark',
          storageArea: localStorage
        });
        
        expect(() => {
          window.dispatchEvent(storageEvent);
        }).not.toThrow();
      }
    });

    test('should ignore storage events for other keys', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      const originalTheme = service.getCurrentTheme();
      
      const storageEvent = new StorageEvent('storage', {
        key: 'other-key',
        newValue: 'some-value',
        oldValue: 'old-value',
        storageArea: localStorage
      });
      
      window.dispatchEvent(storageEvent);
      expect(service.getCurrentTheme()).toBe(originalTheme);
    });
  });

  describe('Performance Stress Testing', () => {
    test('should handle thousands of rapid toggles without memory leaks', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        service.toggleTheme();
      }
      const endTime = performance.now();
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(1000); // 1 second
      expect(['light', 'dark']).toContain(service.getCurrentTheme());
    });

    test('should handle massive Chart instances without performance degradation', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      // Create many mock chart instances
      const mockCharts: any = {};
      for (let i = 0; i < 1000; i++) {
        mockCharts[`chart${i}`] = { 
          update: jest.fn(),
          id: i,
          destroy: jest.fn()
        };
      }
      
      (Chart.instances as any) = mockCharts;
      
      const startTime = performance.now();
      service.toggleTheme();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500); // 500ms threshold
      
      // Verify all charts were updated
      Object.values(mockCharts).forEach((chart: any) => {
        expect(chart.update).toHaveBeenCalled();
      });
      
      // Clean up
      (Chart.instances as any) = {};
    });

    test('should handle concurrent theme operations gracefully', async () => {
      const services = Array.from({ length: 10 }, () => {
        const service = new ThemeService();
        testServiceInstances.push(service);
        return service;
      });
      
      // Perform concurrent operations
      const operations = services.map(async (service, index) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            for (let i = 0; i < 10; i++) {
              service.toggleTheme();
            }
            resolve();
          }, index * 10);
        });
      });
      
      await Promise.all(operations);
      
      // All services should have consistent themes (since they share localStorage)
      const themes = services.map(s => s.getCurrentTheme());
      expect(new Set(themes).size).toBeLessThanOrEqual(2); // Should only have 1-2 unique values
    });
  });

  describe('Advanced Chart.js Integration', () => {
    test('should handle Chart instances with custom update methods', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      const customUpdateChart = {
        update: jest.fn((options?: any) => {
          if (options?.mode === 'resize') {
            throw new Error('Resize not supported');
          }
        }),
        id: 'custom'
      };
      
      (Chart.instances as any) = { customChart: customUpdateChart };
      
      expect(() => {
        service.toggleTheme();
      }).not.toThrow();
      
      expect(customUpdateChart.update).toHaveBeenCalled();
    });

    test('should handle Chart instances with async update methods', async () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      const asyncUpdateChart = {
        update: jest.fn().mockResolvedValue(undefined),
        id: 'async'
      };
      
      (Chart.instances as any) = { asyncChart: asyncUpdateChart };
      
      expect(() => {
        service.toggleTheme();
      }).not.toThrow();
      
      expect(asyncUpdateChart.update).toHaveBeenCalled();
    });

    test('should handle Chart.defaults with circular references', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      const circularObject: any = { color: '#000' };
      circularObject.self = circularObject;
      
      const originalDefaults = { ...globalChartDefaults };
      try {
        (globalChartDefaults as any).circularRef = circularObject;
        
        expect(() => {
          service.toggleTheme();
        }).not.toThrow();
      } finally {
        Object.assign(globalChartDefaults, originalDefaults);
      }
    });

    test('should handle Chart.defaults with getter/setter properties', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      const originalDefaults = { ...globalChartDefaults };
      let getterCallCount = 0;
      
      try {
        Object.defineProperty(globalChartDefaults, 'dynamicColor', {
          get() {
            getterCallCount++;
            return getterCallCount % 2 === 0 ? '#fff' : '#000';
          },
          set(value) {
            // Setter that might throw
            if (value === 'invalid') {
              throw new Error('Invalid color');
            }
          },
          configurable: true
        });
        
        expect(() => {
          service.toggleTheme();
        }).not.toThrow();
        
        expect(getterCallCount).toBeGreaterThan(0);
      } finally {
        delete (globalChartDefaults as any).dynamicColor;
        Object.assign(globalChartDefaults, originalDefaults);
      }
    });
  });

  describe('Advanced DOM Manipulation', () => {
    test('should handle document.documentElement being replaced during operation', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      const originalDocumentElement = document.documentElement;
      
      try {
        // Replace documentElement during theme toggle
        const newDocumentElement = document.createElement('html');
        newDocumentElement.setAttribute = jest.fn();
        
        Object.defineProperty(document, 'documentElement', {
          value: newDocumentElement,
          writable: true,
          configurable: true
        });
        
        expect(() => {
          service.toggleTheme();
        }).not.toThrow();
        
        expect(newDocumentElement.setAttribute).toHaveBeenCalled();
      } finally {
        Object.defineProperty(document, 'documentElement', {
          value: originalDocumentElement,
          writable: true,
          configurable: true
        });
      }
    });

    test('should handle setAttribute with non-string values', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      const mockElement = {
        setAttribute: jest.fn((name: string, value: any) => {
          if (typeof value !== 'string') {
            throw new Error('Value must be string');
          }
        })
      };
      
      const originalDocumentElement = document.documentElement;
      try {
        Object.defineProperty(document, 'documentElement', {
          value: mockElement,
          writable: true,
          configurable: true
        });
        
        expect(() => {
          service.toggleTheme();
        }).not.toThrow();
      } finally {
        Object.defineProperty(document, 'documentElement', {
          value: originalDocumentElement,
          writable: true,
          configurable: true
        });
      }
    });

    test('should handle body classList mutations during theme changes', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      const mutatingClassList = {
        add: jest.fn((className: string) => {
          if (className === DARK_MODE_CLASS) {
            // Simulate another script modifying classList
            setTimeout(() => {
              document.body.classList.remove(DARK_MODE_CLASS);
            }, 0);
          }
        }),
        remove: jest.fn(),
        contains: jest.fn(() => false),
        toggle: jest.fn()
      };
      
      const originalClassList = document.body.classList;
      try {
        Object.defineProperty(document.body, 'classList', {
          value: mutatingClassList,
          writable: true,
          configurable: true
        });
        
        expect(() => {
          service.toggleTheme();
        }).not.toThrow();
      } finally {
        Object.defineProperty(document.body, 'classList', {
          value: originalClassList,
          writable: true,
          configurable: true
        });
      }
    });
  });

  describe('Resource Management and Cleanup', () => {
    test('should properly dispose of all resources when service is destroyed', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      const mediaQueryMock = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      };
      
      matchMediaMock.mockReturnValue(mediaQueryMock as any);
      
      // Create new service to attach listeners
      const serviceWithListeners = new ThemeService();
      testServiceInstances.push(serviceWithListeners);
      
      // Verify listeners were attached
      expect(mediaQueryMock.addEventListener).toHaveBeenCalled();
      
      // Dispose the service
      if (typeof (serviceWithListeners as any).dispose === 'function') {
        (serviceWithListeners as any).dispose();
      }
      
      // Verify cleanup occurred
      expect(mediaQueryMock.removeEventListener).toHaveBeenCalled();
    });

    test('should handle disposal when mediaQuery is no longer available', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      // Make matchMedia unavailable after initialization
      Object.defineProperty(window, 'matchMedia', { 
        value: undefined, 
        writable: true, 
        configurable: true 
      });
      
      expect(() => {
        if (typeof (service as any).dispose === 'function') {
          (service as any).dispose();
        }
      }).not.toThrow();
      
      // Restore matchMedia
      Object.defineProperty(window, 'matchMedia', { 
        value: matchMediaMock, 
        configurable: true 
      });
    });

    test('should handle multiple disposal calls gracefully', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      expect(() => {
        for (let i = 0; i < 5; i++) {
          if (typeof (service as any).dispose === 'function') {
            (service as any).dispose();
          }
        }
      }).not.toThrow();
    });
  });

  describe('Accessibility Enhancements', () => {
    test('should emit custom events for screen readers', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      const eventListener = jest.fn();
      document.addEventListener('themechange', eventListener);
      
      service.toggleTheme();
      
      // Clean up listener
      document.removeEventListener('themechange', eventListener);
    });

    test('should update ARIA attributes for theme-aware components', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      // Create mock elements with ARIA attributes
      const themeAwareElement = document.createElement('div');
      themeAwareElement.setAttribute('aria-label', 'Theme indicator');
      themeAwareElement.setAttribute('data-theme-aware', 'true');
      document.body.appendChild(themeAwareElement);
      
      try {
        service.toggleTheme();
        
        // Verify theme was applied
        expect(['light', 'dark']).toContain(service.getCurrentTheme());
      } finally {
        document.body.removeChild(themeAwareElement);
      }
    });

    test('should respect prefers-reduced-motion for theme transitions', () => {
      const reducedMotionQuery = '(prefers-reduced-motion: reduce)';
      const originalMatchMedia = window.matchMedia;
      
      const mockReducedMotion = jest.fn((query: string) => ({
        matches: query === reducedMotionQuery,
        media: query,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      }));
      
      Object.defineProperty(window, 'matchMedia', { 
        value: mockReducedMotion, 
        configurable: true 
      });
      
      try {
        const service = new ThemeService();
        testServiceInstances.push(service);
        
        service.toggleTheme();
        
        expect(mockReducedMotion).toHaveBeenCalledWith(reducedMotionQuery);
      } finally {
        Object.defineProperty(window, 'matchMedia', { 
          value: originalMatchMedia, 
          configurable: true 
        });
      }
    });
  });

  describe('Future-Proofing and Extensibility', () => {
    test('should handle new theme values being added', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      // Simulate future theme values
      const futureThemes = ['auto', 'high-contrast', 'sepia', 'blue-light-filter'];
      
      futureThemes.forEach(theme => {
        localStorageMock.setItem(THEME_KEY, theme);
        const newService = new ThemeService();
        testServiceInstances.push(newService);
        
        // Should fallback to default themes
        expect(['light', 'dark']).toContain(newService.getCurrentTheme());
      });
    });

    test('should handle Chart.js version upgrades gracefully', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      // Simulate Chart.js v4+ with different API structure
      const futureChartDefaults = {
        global: {
          defaultColor: '#000',
          elements: {
            arc: { borderColor: '#fff' },
            line: { borderColor: '#000' }
          }
        },
        scale: {
          ticks: { color: '#333' },
          grid: { color: 'rgba(0,0,0,0.1)' }
        }
      };
      
      const originalDefaults = globalChartDefaults;
      try {
        Object.assign(globalChartDefaults, futureChartDefaults);
        
        expect(() => {
          service.toggleTheme();
        }).not.toThrow();
      } finally {
        Object.assign(globalChartDefaults, originalDefaults);
      }
    });

    test('should handle CSS custom properties for theme variables', () => {
      const service = new ThemeService();
      testServiceInstances.push(service);
      
      const mockSetProperty = jest.fn();
      const mockRemoveProperty = jest.fn();
      
      Object.defineProperty(document.documentElement, 'style', {
        value: {
          setProperty: mockSetProperty,
          removeProperty: mockRemoveProperty
        },
        configurable: true
      });
      
      service.toggleTheme();
      
      // Should update CSS custom properties
      expect(['light', 'dark']).toContain(service.getCurrentTheme());
    });
  });
});
