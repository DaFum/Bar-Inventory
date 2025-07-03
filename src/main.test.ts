import { initializeApp } from './ui/ui-manager';
// Import Application from main.ts. Adjust the path if main.ts exports it differently.
// Assuming Application class is exported from main.ts for testing.
// If not, we might need to refactor main.ts or use a different testing strategy.
// For now, let's assume it's possible to import or test its side effects.

// Mock ui-manager
jest.mock('./ui/ui-manager', () => ({
  initializeApp: jest.fn(),
}));

describe('Application Initialization (main.ts)', () => {
  let appContainer: HTMLElement;
  let originalDocumentReadyState: DocumentReadyState;
  let domContentLoadedListeners: EventListenerOrEventListenerObject[] = [];
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules(); // Crucial: Reset module cache before each test

    // Reset mocks
    (initializeApp as jest.Mock).mockClear();

    // Create a mock app container
    appContainer = document.createElement('div');
    appContainer.id = 'app-container';
    // Appending to body only if not the "container not found" test

    // Mock document.readyState and addEventListener
    originalDocumentReadyState = document.readyState;
    domContentLoadedListeners = []; // Reset listeners
    Object.defineProperty(document, 'readyState', {
      writable: true,
      configurable: true, // Ensure it can be reconfigured
    });
    jest.spyOn(document, 'addEventListener').mockImplementation((event, listener) => {
      if (event === 'DOMContentLoaded') {
        domContentLoadedListeners.push(listener);
      }
    });
    jest.spyOn(document, 'removeEventListener');

    // Spy on console methods BEFORE main.ts is required
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    if (appContainer.parentNode === document.body) {
      document.body.removeChild(appContainer);
    }
    Object.defineProperty(document, 'readyState', {
      value: originalDocumentReadyState,
      writable: true,
    });
    jest.restoreAllMocks(); // This will restore console spies as well
  });

  const simulateDOMLoaded = () => {
    domContentLoadedListeners.forEach(listener => {
      if (typeof listener === 'function') {
        listener({} as Event);
      } else {
        listener.handleEvent({} as Event);
      }
    });
  };

  test('should instantiate Application and call initializeApp if DOM is already loaded', () => {
    document.body.appendChild(appContainer); // Ensure container is in DOM
    (document.readyState as any) = 'complete';
    require('./main');
    expect(consoleLogSpy).toHaveBeenCalledWith('Application initializing...');
    expect(consoleLogSpy).toHaveBeenCalledWith('DOM content loaded, app container found.');
    expect(initializeApp).toHaveBeenCalledWith(appContainer);
    expect(initializeApp).toHaveBeenCalledTimes(1);
  });

  test('should instantiate Application and call initializeApp after DOMContentLoaded event', () => {
    document.body.appendChild(appContainer); // Ensure container is in DOM
    (document.readyState as any) = 'loading';
    require('./main');
    expect(consoleLogSpy).toHaveBeenCalledWith('Application initializing...');
    expect(initializeApp).not.toHaveBeenCalled(); // Should not be called yet

    simulateDOMLoaded(); // Simulate the DOMContentLoaded event

    expect(consoleLogSpy).toHaveBeenCalledWith('DOM content loaded, app container found.');
    expect(initializeApp).toHaveBeenCalledWith(appContainer);
    expect(initializeApp).toHaveBeenCalledTimes(1);
  });

  test('should log an error if app-container is not found', () => {
    // appContainer is NOT appended to body for this test
    (document.readyState as any) = 'complete';
    require('./main');

    expect(consoleLogSpy).toHaveBeenCalledWith('Application initializing...');
    expect(initializeApp).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('App container not found in HTML.');
  });
});
