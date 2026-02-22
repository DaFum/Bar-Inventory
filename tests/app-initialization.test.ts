// Mock ui-manager
jest.mock('../src/ui/ui-manager', () => ({
  initializeApp: jest.fn(),
}));

// Mock storage service
jest.mock('../src/services/storage.service', () => ({
  storageService: {
    loadState: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock AppState
jest.mock('../src/state/app-state', () => ({
  AppState: {
    getInstance: jest.fn().mockReturnValue({}),
  },
}));

import { Application } from '../src/main';
import { initializeApp } from '../src/ui/ui-manager';
import { storageService } from '../src/services/storage.service';

describe('Application Initialization (app.ts)', () => {
  let appContainerElement: HTMLElement;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    appContainerElement = document.createElement('div');
    appContainerElement.id = 'app-container';

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should instantiate Application and call initializeApp if DOM is already loaded', async () => {
    document.body.appendChild(appContainerElement);
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });

    const app = new Application();
    await app.initPromise;

    expect(storageService.loadState).toHaveBeenCalled();
    expect(initializeApp).toHaveBeenCalledWith(appContainerElement);
  });

  test('should instantiate Application and wait for DOMContentLoaded if loading', async () => {
    document.body.appendChild(appContainerElement);
    Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true });

    // Create a way to capture the event listener
    let domLoadedCallback: EventListener | null = null;
    jest.spyOn(document, 'addEventListener').mockImplementation((event, callback) => {
      if (event === 'DOMContentLoaded') {
        domLoadedCallback = callback as EventListener;
      }
    });

    const app = new Application();
    await app.initPromise; // Wait for initial setup (adding listener)

    expect(initializeApp).not.toHaveBeenCalled();
    expect(domLoadedCallback).not.toBeNull();

    // Trigger callback
    if (domLoadedCallback) {
        await (domLoadedCallback as any)(); // Execute the callback logic
    }

    expect(storageService.loadState).toHaveBeenCalled();
    expect(initializeApp).toHaveBeenCalledWith(appContainerElement);
  });

  test('should log error if app-container is not found', async () => {
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
    // Don't append appContainerElement

    const app = new Application();
    await app.initPromise;

    expect(storageService.loadState).toHaveBeenCalled();
    expect(initializeApp).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("App container 'app-container' not found"));
  });
});
