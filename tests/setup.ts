// jest.setup.ts

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    length: 0,
    key: jest.fn((index: number) => null)
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: jest.fn(query => ({
    matches: query === '(prefers-color-scheme: dark)',
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Chart.js
jest.mock('chart.js', () => {
  const actualChartJs = jest.requireActual('chart.js');
  const mockChartInstance = {
    update: jest.fn(),
    destroy: jest.fn(),
  };

  const ChartConstructorMock = jest.fn().mockImplementation(() => mockChartInstance);

  (ChartConstructorMock as any).instances = {};
  (ChartConstructorMock as any).defaults = {
    color: '',
    scale: {
      ticks: { color: '' },
      grid: { color: '' },
      title: { color: '' },
    },
    plugins: {
      legend: { labels: { color: '' } },
      title: { color: '' },
    },
  };
  (ChartConstructorMock as any).register = (...args: any[]) => actualChartJs.Chart.register(...args);

  return {
    ...actualChartJs,
    Chart: ChartConstructorMock,
  };
});


// Add any other global mocks or setup logic here
// For example, you might want to mock other browser APIs:
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: (prop: any) => {
      return '';
    }
  })
});

// You can also set up a basic DOM structure if your components need it
beforeEach(() => {
  document.body.innerHTML = `
    <div id="app-container">
      <div id="view-container"></div>
    </div>
  `;
  // Reset mocks before each test
  localStorageMock.clear();
  (window.matchMedia as jest.Mock).mockClear();
});
