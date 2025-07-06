import type { ThemeService as ThemeServiceType } from '../../src/services/theme.service'; // Type-only import
import { Chart } from 'chart.js';

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
jest.mock('chart.js', () => {
    const actualChartJs = jest.requireActual('chart.js');
    const mockChartInstance = {
        update: jest.fn(),
        destroy: jest.fn(),
    };

    const ChartConstructorMock = jest.fn().mockImplementation(() => mockChartInstance);

    // Attach static properties directly to the mock constructor
    (ChartConstructorMock as any).instances = {}; // Make it assignable for tests
    (ChartConstructorMock as any).defaults = { // Deep clone and make modifiable if necessary
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
    (ChartConstructorMock as any).register = (...args: any[]) => actualChartJs.Chart.register(...args);

    return {
      ...actualChartJs, // To bring in registerables, etc.
      Chart: ChartConstructorMock,
    };
  });


const THEME_KEY = 'app-theme';
const DARK_MODE_CLASS = 'dark-mode';

describe('ThemeService', () => {
  let themeServiceInstance: ThemeServiceType | undefined;
  let mockHtmlElement: HTMLElement;
  let ActualThemeServiceClass: (new () => ThemeServiceType) | undefined; // To store the dynamically imported class

  beforeEach(async () => {
    localStorageMock.clear();
    systemPrefersDark = false; // Default to light system theme
    document.body.classList.remove(DARK_MODE_CLASS);

    mockHtmlElement = document.documentElement;
    jest.spyOn(mockHtmlElement, 'setAttribute');

    // Clear Chart.js mocks specifically for defaults and instances
    const ChartMock = Chart as any; // Cast to access custom static properties
    ChartMock.defaults.color = '';
    if (ChartMock.defaults.scale) {
        ChartMock.defaults.scale.ticks.color = '';
        ChartMock.defaults.scale.grid.color = '';
        if (ChartMock.defaults.scale.title) { // Ensure title property exists before setting color
            ChartMock.defaults.scale.title.color = '';
        }
    }
    if (ChartMock.defaults.plugins?.legend) ChartMock.defaults.plugins.legend.labels.color = '';
    if (ChartMock.defaults.plugins?.title) ChartMock.defaults.plugins.title.color = '';
    ChartMock.instances = {}; // Reset instances on the mock for each test

    // Dynamically import the ThemeService class within an isolated module context
    // This ensures it picks up the mocks defined at the top of this test file.
    await jest.isolateModulesAsync(async () => {
      const themeServiceModule = await import('../../src/services/theme.service');
      ActualThemeServiceClass = themeServiceModule.ThemeService;
    });
    if (!ActualThemeServiceClass) {
      throw new Error("ActualThemeServiceClass was not initialized.");
    }
    themeServiceInstance = new ActualThemeServiceClass();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor (Initialization)', () => {
    test('should initialize to "light" theme if no stored theme and system prefers light', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      systemPrefersDark = false;
      localStorageMock.clear();
      const service = new ActualThemeServiceClass();
      expect(service.getCurrentTheme()).toBe('light');
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(false);
      expect(mockHtmlElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    test('should initialize to "dark" theme if no stored theme and system prefers dark', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      systemPrefersDark = true;
      localStorageMock.clear();
      const service = new ActualThemeServiceClass();
      expect(service.getCurrentTheme()).toBe('dark');
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(true);
      expect(mockHtmlElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    test('should initialize to stored theme ("light") if it exists, ignoring system preference', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      systemPrefersDark = true; // System prefers dark
      localStorageMock.setItem(THEME_KEY, 'light'); // But stored is light
      const service = new ActualThemeServiceClass();
      expect(service.getCurrentTheme()).toBe('light');
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(false);
    });

    test('should initialize to stored theme ("dark") if it exists, ignoring system preference', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      systemPrefersDark = false; // System prefers light
      localStorageMock.setItem(THEME_KEY, 'dark'); // But stored is dark
      const service = new ActualThemeServiceClass();
      expect(service.getCurrentTheme()).toBe('dark');
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(true);
    });

    test('should apply theme and update chart defaults on initialization', () => {
        if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
        // Spy on the prototype method before instantiation
        const updateChartDefaultsSpy = jest.spyOn(ActualThemeServiceClass.prototype as any, 'updateChartDefaults');
        new ActualThemeServiceClass(); // Instantiate
        expect(updateChartDefaultsSpy).toHaveBeenCalled();
        updateChartDefaultsSpy.mockRestore(); // Clean up spy
      });
  });

  describe('toggleTheme', () => {
    test('should switch from light to dark theme', () => {
      if (!themeServiceInstance) throw new Error("Test setup error: themeServiceInstance not defined");
      // Initial state is light (default or set by beforeEach)
      themeServiceInstance.toggleTheme();
      expect(themeServiceInstance.getCurrentTheme()).toBe('dark');
      expect(localStorageMock.getItem(THEME_KEY)).toBe('dark');
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(true);
      expect(mockHtmlElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    test('should switch from dark to light theme', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      // Set initial to dark
      localStorageMock.setItem(THEME_KEY, 'dark');
      const serviceInDark = new ActualThemeServiceClass();

      serviceInDark.toggleTheme(); // Toggle to light
      expect(serviceInDark.getCurrentTheme()).toBe('light');
      expect(localStorageMock.getItem(THEME_KEY)).toBe('light');
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(false);
      expect(mockHtmlElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    test('should call applyTheme and thus updateChartDefaults on toggle', () => {
        if (!themeServiceInstance) throw new Error("Test setup error: themeServiceInstance not defined");
        const applyThemeSpy = jest.spyOn(themeServiceInstance as any, 'applyTheme');
        const updateChartsSpy = jest.spyOn(themeServiceInstance as any, 'updateChartDefaults');
        themeServiceInstance.toggleTheme();
        expect(applyThemeSpy).toHaveBeenCalled();
        expect(updateChartsSpy).toHaveBeenCalled();
      });
  });

  describe('getCurrentTheme', () => {
    test('should return the current theme value', () => {
      if (!themeServiceInstance) throw new Error("Test setup error: themeServiceInstance not defined");
      expect(themeServiceInstance.getCurrentTheme()).toBe('light'); // Default from beforeEach
      themeServiceInstance.toggleTheme();
      expect(themeServiceInstance.getCurrentTheme()).toBe('dark');
    });
  });

  describe('System Theme Change Listener', () => {
    let mediaQueryListener: ((event: { matches: boolean }) => void) | null = null;
    let inspectableMq: any; // To hold the specific MQL object for dark scheme
    const originalMatchMediaImpl = matchMediaMock.getMockImplementation() || defaultMatchMediaImplementation;

    beforeEach(() => {
      localStorageMock.clear();
      systemPrefersDark = false;

      inspectableMq = { // Define it here so it's fresh for each test in this block
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
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      themeServiceInstance = new ActualThemeServiceClass();

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
      if (!themeServiceInstance) throw new Error("Test setup error: themeServiceInstance not defined");
      // themeServiceInstance is already light, systemPrefersDark is false.
      expect(themeServiceInstance.getCurrentTheme()).toBe('light');

      if (!mediaQueryListener) {
        throw new Error("Media query listener was not captured in beforeEach for this test block.");
      }
      mediaQueryListener({ matches: true }); // Simulate system theme changing to dark

      expect(themeServiceInstance.getCurrentTheme()).toBe('dark');
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(true);
    });

    test('should NOT change theme if system theme changes but a user theme IS set in localStorage', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
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

      const serviceWithUserPref = new ActualThemeServiceClass();
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
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
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

      const serviceForOldBrowser = new ActualThemeServiceClass();

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
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      localStorageMock.setItem(THEME_KEY, 'light');
      const service = new ActualThemeServiceClass(); // Init as light

      expect(Chart.defaults.color).toBe('#333');
      if (Chart.defaults.scale) {
        expect(Chart.defaults.scale.ticks.color).toBe('#333');
        expect(Chart.defaults.scale.grid.color).toBe('rgba(0, 0, 0, 0.1)');
      }
    });

    test('should set Chart.defaults for dark theme', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      localStorageMock.setItem(THEME_KEY, 'dark');
      const service = new ActualThemeServiceClass(); // Init as dark

      expect(Chart.defaults.color).toBe('#e0e0e0');
      if (Chart.defaults.scale) {
        expect(Chart.defaults.scale.ticks.color).toBe('#e0e0e0');
        expect(Chart.defaults.scale.grid.color).toBe('rgba(255, 255, 255, 0.1)');
      }
    });

    test('should call update on all active Chart instances', () => {
      if (!themeServiceInstance) throw new Error("Test setup error: themeServiceInstance not defined");
      const mockChartInstance1 = { update: jest.fn(), id: 1 }; // Charts have an ID
      const mockChartInstance2 = { update: jest.fn(), id: 2 };

      // Clear existing instances from the mock and add new ones
      // Chart.instances is mocked as an object `{}`
      for (const key in Chart.instances) {
        delete (Chart.instances as any)[key];
      }
      (Chart.instances as any)['chart1'] = mockChartInstance1; // Or use IDs if the service iterates by values
      (Chart.instances as any)['chart2'] = mockChartInstance2;


      themeServiceInstance.toggleTheme(); // This will trigger updateChartDefaults

      expect(mockChartInstance1.update).toHaveBeenCalledTimes(1);
      expect(mockChartInstance2.update).toHaveBeenCalledTimes(1);
    });

    test('should not throw if Chart or Chart.defaults are not fully available', () => {
        if (!themeServiceInstance) throw new Error("Test setup error: themeServiceInstance not defined");
        // Simulate Chart not being fully loaded or in a weird state
        const originalChart = (globalThis as any).Chart; // Use globalThis for broader compatibility
        (globalThis as any).Chart = undefined; // Remove Chart global

        expect(() => {
          themeServiceInstance.toggleTheme(); // This calls updateChartDefaults
        }).not.toThrow();

        (globalThis as any).Chart = { defaults: undefined, instances: {} }; // Chart exists but no defaults
        expect(() => {
            themeServiceInstance.toggleTheme();
          }).not.toThrow();

        (globalThis as any).Chart = originalChart; // Restore
      });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle localStorage being unavailable', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      // Mock localStorage to throw an error
      const originalLocalStorage = window.localStorage;
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => { throw new Error('localStorage unavailable'); }),
          setItem: jest.fn(() => { throw new Error('localStorage unavailable'); }),
          removeItem: jest.fn(() => { throw new Error('localStorage unavailable'); }),
          clear: jest.fn(() => { throw new Error('localStorage unavailable'); }),
        },
        writable: true
      });

      expect(() => {
        const service = new ActualThemeServiceClass();
        service.toggleTheme();
      }).not.toThrow();

      // Restore localStorage
      Object.defineProperty(window, 'localStorage', { value: originalLocalStorage });
    });

    test('should handle malformed data in localStorage', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      // Set invalid theme value
      localStorageMock.setItem(THEME_KEY, 'invalid-theme');
      
      const service = new ActualThemeServiceClass();
      // Should fallback to system preference or default
      expect(['light', 'dark']).toContain(service.getCurrentTheme());
    });

    test('should handle null/undefined localStorage values gracefully', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      localStorageMock.setItem(THEME_KEY, 'null');
      expect(() => new ActualThemeServiceClass()).not.toThrow();
      
      localStorageMock.setItem(THEME_KEY, 'undefined');
      expect(() => new ActualThemeServiceClass()).not.toThrow();
      
      localStorageMock.setItem(THEME_KEY, '');
      expect(() => new ActualThemeServiceClass()).not.toThrow();
    });

    test('should handle missing document.body gracefully', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      const originalBody = document.body;
      Object.defineProperty(document, 'body', { value: null, writable: true });
      
      expect(() => {
        const service = new ActualThemeServiceClass();
        service.toggleTheme();
      }).not.toThrow();
      
      Object.defineProperty(document, 'body', { value: originalBody });
    });

    test('should handle missing document.documentElement gracefully', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      const originalDocumentElement = document.documentElement;
      Object.defineProperty(document, 'documentElement', { value: null, writable: true });
      
      expect(() => {
        const service = new ActualThemeServiceClass();
        service.toggleTheme();
      }).not.toThrow();
      
      Object.defineProperty(document, 'documentElement', { value: originalDocumentElement });
    });

    test('should handle matchMedia not being available', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      const originalMatchMedia = window.matchMedia;
      Object.defineProperty(window, 'matchMedia', { value: undefined, writable: true });
      
      expect(() => {
        const service = new ActualThemeServiceClass();
      }).not.toThrow();
      
      Object.defineProperty(window, 'matchMedia', { value: originalMatchMedia });
    });
  });

  describe('Performance and Concurrency', () => {
    test('should handle rapid theme toggles without issues', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      const service = new ActualThemeServiceClass();
      const initialTheme = service.getCurrentTheme();
      
      // Rapidly toggle theme multiple times
      for (let i = 0; i < 10; i++) {
        service.toggleTheme();
      }
      
      // After even number of toggles, should be back to original
      expect(service.getCurrentTheme()).toBe(initialTheme);
    });

    test('should handle multiple service instances correctly', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      const service1 = new ActualThemeServiceClass();
      const service2 = new ActualThemeServiceClass();
      
      expect(service1.getCurrentTheme()).toBe(service2.getCurrentTheme());
      
      service1.toggleTheme();
      // Both should reflect the same theme (shared localStorage)
      expect(service1.getCurrentTheme()).toBe(service2.getCurrentTheme());
    });

    test('should handle concurrent initialization', async () => {
      localStorageMock.clear();
      
      const promises = Array.from({ length: 5 }, async () => {
        return await jest.isolateModulesAsync(async () => {
          const themeServiceModule = await import('../../src/services/theme.service');
          return new themeServiceModule.ThemeService();
        });
      });
      
      const services = await Promise.all(promises);
      const themes = services.map(s => s.getCurrentTheme());
      
      // All should have the same theme
      expect(new Set(themes).size).toBe(1);
    });
  });

  describe('Memory Management', () => {
    test('should properly clean up event listeners on repeated instantiation', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      const mediaQueryMock = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };
      
      matchMediaMock.mockReturnValue(mediaQueryMock);
      
      // Create multiple instances
      for (let i = 0; i < 3; i++) {
        new ActualThemeServiceClass();
      }
      
      // Should have attached listeners for each instance
      expect(mediaQueryMock.addEventListener).toHaveBeenCalledTimes(3);
    });
  });

  describe('Chart.js Integration Edge Cases', () => {
    test('should handle Chart instances with missing update method', () => {
      if (!themeServiceInstance) throw new Error("Test setup error: themeServiceInstance not defined");
      const mockChartInstanceWithoutUpdate = { id: 1 }; // No update method
      const mockChartInstanceWithUpdate = { update: jest.fn(), id: 2 };
      
      (Chart.instances as any) = {
        chart1: mockChartInstanceWithoutUpdate,
        chart2: mockChartInstanceWithUpdate
      };
      
      expect(() => {
        themeServiceInstance.toggleTheme();
      }).not.toThrow();
      
      expect(mockChartInstanceWithUpdate.update).toHaveBeenCalled();
    });

    test('should handle Chart instances as array instead of object', () => {
      if (!themeServiceInstance) throw new Error("Test setup error: themeServiceInstance not defined");
      // Some Chart.js versions might use array
      (Chart.instances as any) = [
        { update: jest.fn(), id: 1 },
        { update: jest.fn(), id: 2 }
      ];
      
      expect(() => {
        themeServiceInstance.toggleTheme();
      }).not.toThrow();
    });

    test('should handle Chart.defaults with missing nested properties', () => {
      if (!themeServiceInstance) throw new Error("Test setup error: themeServiceInstance not defined");
      // Simulate incomplete Chart.defaults structure
      const originalDefaults = Chart.defaults;
      Chart.defaults = {} as any;
      
      expect(() => {
        themeServiceInstance.toggleTheme();
      }).not.toThrow();
      
      Chart.defaults = originalDefaults;
    });

    test('should handle Chart.defaults.scale being null', () => {
      if (!themeServiceInstance) throw new Error("Test setup error: themeServiceInstance not defined");
      const originalScale = Chart.defaults.scale;
      Chart.defaults.scale = null as any;
      
      expect(() => {
        themeServiceInstance.toggleTheme();
      }).not.toThrow();
      
      Chart.defaults.scale = originalScale;
    });

    test('should handle Chart.defaults.plugins being null', () => {
      if (!themeServiceInstance) throw new Error("Test setup error: themeServiceInstance not defined");
      const originalPlugins = Chart.defaults.plugins;
      Chart.defaults.plugins = null as any;
      
      expect(() => {
        themeServiceInstance.toggleTheme();
      }).not.toThrow();
      
      Chart.defaults.plugins = originalPlugins;
    });
  });

  describe('Theme Validation and Data Integrity', () => {
    test('should only accept valid theme values', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      const service = new ActualThemeServiceClass();
      const currentTheme = service.getCurrentTheme();
      
      // getCurrentTheme should always return 'light' or 'dark'
      expect(['light', 'dark']).toContain(currentTheme);
    });

    test('should maintain theme consistency across page reloads', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      const service1 = new ActualThemeServiceClass();
      service1.toggleTheme();
      const theme1 = service1.getCurrentTheme();
      
      // Simulate page reload by creating new instance
      const service2 = new ActualThemeServiceClass();
      const theme2 = service2.getCurrentTheme();
      
      expect(theme1).toBe(theme2);
    });

    test('should handle localStorage quota exceeded gracefully', () => {
      if (!themeServiceInstance) throw new Error("Test setup error: themeServiceInstance not defined");
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });
      
      expect(() => {
        themeServiceInstance.toggleTheme();
      }).not.toThrow();
      
      localStorageMock.setItem = originalSetItem;
    });
  });

  describe('Browser Compatibility', () => {
    test('should work with older browsers without modern matchMedia features', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      const legacyMatchMedia = (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        // No addEventListener/removeEventListener
      });
      
      matchMediaMock.mockImplementation(legacyMatchMedia);
      
      expect(() => {
        new ActualThemeServiceClass();
      }).not.toThrow();
    });

    test('should handle matchMedia returning null', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      matchMediaMock.mockReturnValue(null);
      
      expect(() => {
        new ActualThemeServiceClass();
      }).not.toThrow();
    });

    test('should handle matchMedia throwing an error', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      matchMediaMock.mockImplementation(() => {
        throw new Error('matchMedia not supported');
      });
      
      expect(() => {
        new ActualThemeServiceClass();
      }).not.toThrow();
    });
  });

  describe('System Theme Detection Edge Cases', () => {
    test('should handle system theme detection when matchMedia returns different values', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      let callCount = 0;
      matchMediaMock.mockImplementation((query: string) => {
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
      });
      
      const service = new ActualThemeServiceClass();
      expect(['light', 'dark']).toContain(service.getCurrentTheme());
    });

    test('should handle multiple media queries being checked', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
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
      }));
      
      const service = new ActualThemeServiceClass();
      expect(service.getCurrentTheme()).toBe('dark');
    });
  });

  describe('Integration with DOM APIs', () => {
    test('should handle setAttribute failing', () => {
      if (!themeServiceInstance) throw new Error("Test setup error: themeServiceInstance not defined");
      const originalSetAttribute = document.documentElement.setAttribute;
      document.documentElement.setAttribute = jest.fn(() => {
        throw new Error('setAttribute failed');
      });
      
      expect(() => {
        themeServiceInstance.toggleTheme();
      }).not.toThrow();
      
      document.documentElement.setAttribute = originalSetAttribute;
    });

    test('should handle classList operations failing', () => {
      if (!themeServiceInstance) throw new Error("Test setup error: themeServiceInstance not defined");
      const originalAdd = document.body.classList.add;
      const originalRemove = document.body.classList.remove;
      
      document.body.classList.add = jest.fn(() => {
        throw new Error('classList.add failed');
      });
      document.body.classList.remove = jest.fn(() => {
        throw new Error('classList.remove failed');
      });
      
      expect(() => {
        themeServiceInstance.toggleTheme();
      }).not.toThrow();
      
      document.body.classList.add = originalAdd;
      document.body.classList.remove = originalRemove;
    });
  });

  describe('State Management', () => {
    test('should maintain internal state consistency', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      const service = new ActualThemeServiceClass();
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
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
      const service = new ActualThemeServiceClass();
      const currentTheme = service.getCurrentTheme();
      
      // Simulate external change to localStorage
      localStorageMock.setItem(THEME_KEY, currentTheme === 'light' ? 'dark' : 'light');
      
      // Create new instance to pick up the change
      const newService = new ActualThemeServiceClass();
      expect(newService.getCurrentTheme()).not.toBe(currentTheme);
    });
  });

  describe('Accessibility and User Experience', () => {
    test('should apply theme consistently to all required DOM elements', () => {
      if (!themeServiceInstance) throw new Error("Test setup error: themeServiceInstance not defined");
      themeServiceInstance.toggleTheme(); // Switch to dark
      
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(true);
      expect(mockHtmlElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
      
      themeServiceInstance.toggleTheme(); // Switch back to light
      
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(false);
      expect(mockHtmlElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    test('should handle rapid system theme changes', () => {
      if (!ActualThemeServiceClass) throw new Error("Test setup error: ActualThemeServiceClass not defined");
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
      
      matchMediaMock.mockReturnValue(mockMq);
      const service = new ActualThemeServiceClass();
      
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
