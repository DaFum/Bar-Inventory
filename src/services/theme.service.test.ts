// Mocks must be defined BEFORE the service is imported.
// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.matchMedia
let systemPrefersDark = false; // Controllable for tests
const defaultMatchMediaImplementation = (query: string) => ({
  matches: query === '(prefers-color-scheme: dark)' ? systemPrefersDark : false,
  media: query,
  onchange: null,
  addListener: jest.fn(), // Deprecated
  removeListener: jest.fn(), // Deprecated
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

const matchMediaMock = jest.fn(defaultMatchMediaImplementation);
Object.defineProperty(window, 'matchMedia', { value: matchMediaMock, writable: true, configurable: true });

// Mock Chart.js global and instances
// IMPORTANT: This mock must be defined before ThemeService is imported.
const globalChartDefaults = { // Deep clone and make modifiable if necessary
    color: '',
    scale: {
        ticks: { color: '' },
        grid: { color: '' },
        title: { color: '' }, // Service expects this path
    },
    plugins: {
        legend: { labels: { color: '' } },
        title: { color: '' },
    },
};
const globalChartInstances = {};

jest.mock('chart.js', () => {
    const actualChartJs = jest.requireActual('chart.js');
    const mockChartInstance = {
        update: jest.fn(),
        destroy: jest.fn(),
    };

    const ChartConstructorMock = jest.fn().mockImplementation(() => mockChartInstance);

    // Attach static properties directly to the mock constructor
    (ChartConstructorMock as any).instances = globalChartInstances; // Use the global var
    (ChartConstructorMock as any).defaults = globalChartDefaults; // Use the global var
    // The direct assignment of properties here was incorrect after assigning globalChartDefaults.
    // globalChartDefaults already contains these properties.
    // Remove the redundant block:
    //     color: '',
    //     scale: {
    //         ticks: { color: '' },
    //         grid: { color: '' },
    //         title: { color: '' }, // Service expects this path
    //     },
    //     plugins: {
    //         legend: { labels: { color: '' } },
    //         title: { color: '' },
    //     },
    // };
    (ChartConstructorMock as any).register = (...args: any[]) => actualChartJs.Chart.register(...args);

    return {
      ...actualChartJs, // To bring in registerables, etc.
      Chart: ChartConstructorMock,
    };
  });

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
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(false);
      expect(mockHtmlElement!.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    test('should initialize to "dark" theme if no stored theme and system prefers dark', () => {
      systemPrefersDark = true;
      localStorageMock.clear();
      const service = new ThemeService();
      testServiceInstances.push(service);
      expect(service.getCurrentTheme()).toBe('dark');
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(true);
      expect(mockHtmlElement!.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    test('should initialize to stored theme ("light") if it exists, ignoring system preference', () => {
      systemPrefersDark = true; // System prefers dark
      localStorageMock.setItem(THEME_KEY, 'light'); // But stored is light
      const service = new ThemeService();
      testServiceInstances.push(service);
      expect(service.getCurrentTheme()).toBe('light');
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(false);
    });

    test('should initialize to stored theme ("dark") if it exists, ignoring system preference', () => {
      systemPrefersDark = false; // System prefers light
      localStorageMock.setItem(THEME_KEY, 'dark'); // But stored is dark
      const service = new ThemeService();
      testServiceInstances.push(service);
      expect(service.getCurrentTheme()).toBe('dark');
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(true);
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
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(true);
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
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(false);
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
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(true);
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
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(false);
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
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(true);
      if (!mockHtmlElement) throw new Error("mockHtmlElement is null in test");
      expect(mockHtmlElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
      
      service.toggleTheme(); // Switch back to light
      
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(false);
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
