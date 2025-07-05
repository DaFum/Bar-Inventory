import type { ThemeService as ThemeServiceType } from './theme.service'; // Type-only import
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
  let themeServiceInstance: ThemeServiceType;
  let mockHtmlElement: HTMLElement;
  let ActualThemeServiceClass: new () => ThemeServiceType; // To store the dynamically imported class

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
      const themeServiceModule = await import('./theme.service');
      ActualThemeServiceClass = themeServiceModule.ThemeService;
    });

    themeServiceInstance = new ActualThemeServiceClass();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor (Initialization)', () => {
    test('should initialize to "light" theme if no stored theme and system prefers light', () => {
      systemPrefersDark = false;
      localStorageMock.clear();
      const service = new ActualThemeServiceClass();
      expect(service.getCurrentTheme()).toBe('light');
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(false);
      expect(mockHtmlElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    test('should initialize to "dark" theme if no stored theme and system prefers dark', () => {
      systemPrefersDark = true;
      localStorageMock.clear();
      const service = new ActualThemeServiceClass();
      expect(service.getCurrentTheme()).toBe('dark');
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(true);
      expect(mockHtmlElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    test('should initialize to stored theme ("light") if it exists, ignoring system preference', () => {
      systemPrefersDark = true; // System prefers dark
      localStorageMock.setItem(THEME_KEY, 'light'); // But stored is light
      const service = new ActualThemeServiceClass();
      expect(service.getCurrentTheme()).toBe('light');
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(false);
    });

    test('should initialize to stored theme ("dark") if it exists, ignoring system preference', () => {
      systemPrefersDark = false; // System prefers light
      localStorageMock.setItem(THEME_KEY, 'dark'); // But stored is dark
      const service = new ActualThemeServiceClass();
      expect(service.getCurrentTheme()).toBe('dark');
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(true);
    });

    test('should apply theme and update chart defaults on initialization', () => {
        // Spy on the prototype method before instantiation
        const updateChartDefaultsSpy = jest.spyOn(ActualThemeServiceClass.prototype as any, 'updateChartDefaults');
        new ActualThemeServiceClass(); // Instantiate
        expect(updateChartDefaultsSpy).toHaveBeenCalled();
        updateChartDefaultsSpy.mockRestore(); // Clean up spy
      });
  });

  describe('toggleTheme', () => {
    test('should switch from light to dark theme', () => {
      // Initial state is light (default or set by beforeEach)
      themeServiceInstance.toggleTheme();
      expect(themeServiceInstance.getCurrentTheme()).toBe('dark');
      expect(localStorageMock.getItem(THEME_KEY)).toBe('dark');
      expect(document.body.classList.contains(DARK_MODE_CLASS)).toBe(true);
      expect(mockHtmlElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    test('should switch from dark to light theme', () => {
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
        const applyThemeSpy = jest.spyOn(themeServiceInstance as any, 'applyTheme');
        const updateChartsSpy = jest.spyOn(themeServiceInstance as any, 'updateChartDefaults');
        themeServiceInstance.toggleTheme();
        expect(applyThemeSpy).toHaveBeenCalled();
        expect(updateChartsSpy).toHaveBeenCalled();
      });
  });

  describe('getCurrentTheme', () => {
    test('should return the current theme value', () => {
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
      localStorageMock.setItem(THEME_KEY, 'light');
      const service = new ActualThemeServiceClass(); // Init as light

      expect(Chart.defaults.color).toBe('#333');
      if (Chart.defaults.scale) {
        expect(Chart.defaults.scale.ticks.color).toBe('#333');
        expect(Chart.defaults.scale.grid.color).toBe('rgba(0, 0, 0, 0.1)');
      }
    });

    test('should set Chart.defaults for dark theme', () => {
      localStorageMock.setItem(THEME_KEY, 'dark');
      const service = new ActualThemeServiceClass(); // Init as dark

      expect(Chart.defaults.color).toBe('#e0e0e0');
      if (Chart.defaults.scale) {
        expect(Chart.defaults.scale.ticks.color).toBe('#e0e0e0');
        expect(Chart.defaults.scale.grid.color).toBe('rgba(255, 255, 255, 0.1)');
      }
    });

    test('should call update on all active Chart instances', () => {
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
});
