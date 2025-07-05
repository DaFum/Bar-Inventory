// Mock ui-manager (must be at the very top before any imports that might use it)
jest.mock('./ui/ui-manager', () => ({
  initializeApp: jest.fn(),
}));
// No top-level import of initializeApp from './ui/ui-manager' here

describe('Application Initialization (main.ts)', () => {
  let appContainerElement: HTMLElement; // Renamed to avoid confusion with module-level vars
  let originalDocumentReadyState: DocumentReadyState;
  let domContentLoadedListeners: EventListenerOrEventListenerObject[] = [];
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let initializeAppMock: jest.Mock; // To hold the specific mock instance

  beforeEach(() => {
    jest.resetModules(); // Crucial: Reset module cache before each test

    // Re-require ./ui/ui-manager to get the fresh mock after resetModules.
    // This ensures initializeAppMock is the mock that main.ts will get when it's required.
    initializeAppMock = require('./ui/ui-manager').initializeApp;
    initializeAppMock.mockClear(); // Clear calls from previous tests if any leakage

    // Create a mock app container
    appContainerElement = document.createElement('div');
    appContainerElement.id = 'app-container';
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
    if (appContainerElement.parentNode === document.body) {
      document.body.removeChild(appContainerElement);
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
    document.body.appendChild(appContainerElement); // Ensure container is in DOM
    (document.readyState as any) = 'complete';
    require('./main'); // main.ts runs and should use the initializeAppMock
    expect(consoleLogSpy).toHaveBeenCalledWith('Application initializing...');
    expect(consoleLogSpy).toHaveBeenCalledWith('DOM content loaded, app container found.');
    expect(initializeAppMock).toHaveBeenCalledWith(appContainerElement);
    expect(initializeAppMock).toHaveBeenCalledTimes(1);
  });

  test('should instantiate Application and call initializeApp after DOMContentLoaded event', () => {
    document.body.appendChild(appContainerElement); // Ensure container is in DOM
    (document.readyState as any) = 'loading';
    require('./main'); // main.ts runs and should use the initializeAppMock
    expect(consoleLogSpy).toHaveBeenCalledWith('Application initializing...');
    expect(initializeAppMock).not.toHaveBeenCalled(); // Should not be called yet

    simulateDOMLoaded(); // Simulate the DOMContentLoaded event

    expect(consoleLogSpy).toHaveBeenCalledWith('DOM content loaded, app container found.');
    expect(initializeAppMock).toHaveBeenCalledWith(appContainerElement);
    expect(initializeAppMock).toHaveBeenCalledTimes(1);
  });

  test('should log an error if app-container is not found', () => {
    // appContainerElement is NOT appended to body for this test
    (document.readyState as any) = 'complete';
    require('./main'); // main.ts runs and should use the initializeAppMock

    expect(consoleLogSpy).toHaveBeenCalledWith('Application initializing...');
    expect(initializeAppMock).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('App container not found in HTML.');
  });
});
