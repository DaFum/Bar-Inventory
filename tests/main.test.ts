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

describe('App Module (main.ts)', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should log module load message when loaded, but not instantiate Application automatically in test env', () => {
    jest.isolateModules(() => {
        require('../src/main');
    });

    expect(consoleLogSpy).toHaveBeenCalledWith("App module (app.ts) loaded and application instantiated.");
    expect(consoleLogSpy).not.toHaveBeenCalledWith('Application initializing...');
  });

  test('should log initialization messages when Application is manually instantiated', () => {
    new Application();
    expect(consoleLogSpy).toHaveBeenCalledWith('Application initializing...');
  });
});
