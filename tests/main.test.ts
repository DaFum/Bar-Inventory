import { Application } from '../src/app';
import { initializeApp } from '../src/ui/ui-manager';

// Mock the ui-manager module
jest.mock('../ui/ui-manager', () => ({
  initializeApp: jest.fn()
}));

// Mock console methods to test logging
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation()
};

// Mock DOM methods
const mockAddEventListener = jest.fn();
const mockGetElementById = jest.fn();

// Setup DOM mocks before each test
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  consoleSpy.log.mockClear();
  consoleSpy.error.mockClear();
  
  // Mock document methods
  Object.defineProperty(document, 'addEventListener', {
    value: mockAddEventListener,
    writable: true
  });
  
  Object.defineProperty(document, 'getElementById', {
    value: mockGetElementById,
    writable: true
  });
  
  // Reset DOM readyState
  Object.defineProperty(document, 'readyState', {
    value: 'loading',
    writable: true,
    configurable: true
  });
});

afterEach(() => {
  // Clean up any remaining event listeners or DOM modifications
  mockAddEventListener.mockReset();
  mockGetElementById.mockReset();
});

describe('Application', () => {
  describe('Constructor and Initialization', () => {
    it('should create an instance and call initialize', () => {
      const initializeSpy = jest.spyOn(Application.prototype, 'initialize');
      
      new Application();
      
      expect(initializeSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy.log).toHaveBeenCalledWith('Application initializing...');
      
      initializeSpy.mockRestore();
    });

    it('should log application instantiation message', () => {
      new Application();
      
      expect(consoleSpy.log).toHaveBeenCalledWith('Application initializing...');
    });
  });

  describe('initialize() method', () => {
    let app: Application;

    beforeEach(() => {
      // Spy on setupApp method
      jest.spyOn(Application.prototype, 'setupApp').mockImplementation();
    });

    it('should add DOMContentLoaded event listener when document is loading', () => {
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true
      });

      app = new Application();

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'DOMContentLoaded', 
        expect.any(Function)
      );
    });

    it('should call setupApp immediately when DOM is already loaded (complete)', () => {
      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true
      });
      
      const setupAppSpy = jest.spyOn(Application.prototype, 'setupApp');

      app = new Application();

      expect(setupAppSpy).toHaveBeenCalledTimes(1);
      expect(mockAddEventListener).not.toHaveBeenCalled();
      
      setupAppSpy.mockRestore();
    });

    it('should call setupApp immediately when DOM is interactive', () => {
      Object.defineProperty(document, 'readyState', {
        value: 'interactive',
        writable: true
      });
      
      const setupAppSpy = jest.spyOn(Application.prototype, 'setupApp');

      app = new Application();

      expect(setupAppSpy).toHaveBeenCalledTimes(1);
      expect(mockAddEventListener).not.toHaveBeenCalled();
      
      setupAppSpy.mockRestore();
    });

    it('should call setupApp when DOMContentLoaded event fires', () => {
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true
      });
      
      const setupAppSpy = jest.spyOn(Application.prototype, 'setupApp');
      
      app = new Application();
      
      // Simulate DOMContentLoaded event firing
      const eventListener = mockAddEventListener.mock.calls[0][1];
      eventListener();

      expect(setupAppSpy).toHaveBeenCalledTimes(1);
      
      setupAppSpy.mockRestore();
    });
  });

  describe('setupApp() method', () => {
    let app: Application;

    beforeEach(() => {
      // Mock initialize to avoid triggering setupApp automatically
      jest.spyOn(Application.prototype, 'initialize').mockImplementation();
      app = new Application();
    });

    it('should successfully initialize UI when app-container is found', () => {
      const mockElement = document.createElement('div');
      mockElement.id = 'app-container';
      mockGetElementById.mockReturnValue(mockElement);

      app['setupApp']();

      expect(mockGetElementById).toHaveBeenCalledWith('app-container');
      expect(initializeApp).toHaveBeenCalledWith(mockElement);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'DOM content loaded, app container found. Initializing UI.'
      );
    });

    it('should log error when app-container is not found', () => {
      mockGetElementById.mockReturnValue(null);

      app['setupApp']();

      expect(mockGetElementById).toHaveBeenCalledWith('app-container');
      expect(initializeApp).not.toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "App container 'app-container' not found in HTML. UI cannot be initialized."
      );
    });

    it('should handle undefined return from getElementById', () => {
      mockGetElementById.mockReturnValue(undefined);

      app['setupApp']();

      expect(mockGetElementById).toHaveBeenCalledWith('app-container');
      expect(initializeApp).not.toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "App container 'app-container' not found in HTML. UI cannot be initialized."
      );
    });

    it('should not crash if initializeApp throws an error', () => {
      const mockElement = document.createElement('div');
      mockGetElementById.mockReturnValue(mockElement);
      (initializeApp as jest.Mock).mockImplementation(() => {
        throw new Error('UI initialization failed');
      });

      expect(() => app['setupApp']()).toThrow('UI initialization failed');
      expect(initializeApp).toHaveBeenCalledWith(mockElement);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full initialization flow when DOM is loading', (done) => {
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true
      });

      const mockElement = document.createElement('div');
      mockGetElementById.mockReturnValue(mockElement);

      new Application();

      // Simulate DOMContentLoaded event
      setTimeout(() => {
        const eventListener = mockAddEventListener.mock.calls[0][1];
        eventListener();

        expect(initializeApp).toHaveBeenCalledWith(mockElement);
        expect(consoleSpy.log).toHaveBeenCalledWith('Application initializing...');
        expect(consoleSpy.log).toHaveBeenCalledWith(
          'DOM content loaded, app container found. Initializing UI.'
        );
        done();
      }, 0);
    });

    it('should complete full initialization flow when DOM is already loaded', () => {
      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true
      });

      const mockElement = document.createElement('div');
      mockGetElementById.mockReturnValue(mockElement);

      new Application();

      expect(initializeApp).toHaveBeenCalledWith(mockElement);
      expect(consoleSpy.log).toHaveBeenCalledWith('Application initializing...');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'DOM content loaded, app container found. Initializing UI.'
      );
    });

    it('should handle complete failure path gracefully', () => {
      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true
      });

      mockGetElementById.mockReturnValue(null);

      new Application();

      expect(initializeApp).not.toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "App container 'app-container' not found in HTML. UI cannot be initialized."
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle multiple instantiations without conflict', () => {
      const mockElement = document.createElement('div');
      mockGetElementById.mockReturnValue(mockElement);

      const app1 = new Application();
      const app2 = new Application();

      expect(initializeApp).toHaveBeenCalledTimes(2);
      expect(consoleSpy.log).toHaveBeenCalledTimes(4); // 2 initializations + 2 setupApp calls
    });

    it('should handle null document.readyState gracefully', () => {
      Object.defineProperty(document, 'readyState', {
        value: null,
        writable: true
      });

      const setupAppSpy = jest.spyOn(Application.prototype, 'setupApp');

      new Application();

      // Should treat null as not loading and call setupApp immediately
      expect(setupAppSpy).toHaveBeenCalledTimes(1);
      expect(mockAddEventListener).not.toHaveBeenCalled();
      
      setupAppSpy.mockRestore();
    });

    it('should handle empty string readyState', () => {
      Object.defineProperty(document, 'readyState', {
        value: '',
        writable: true
      });

      const setupAppSpy = jest.spyOn(Application.prototype, 'setupApp');

      new Application();

      // Should treat empty string as not loading and call setupApp immediately
      expect(setupAppSpy).toHaveBeenCalledTimes(1);
      expect(mockAddEventListener).not.toHaveBeenCalled();
      
      setupAppSpy.mockRestore();
    });

    it('should handle case where addEventListener is not available', () => {
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true
      });

      Object.defineProperty(document, 'addEventListener', {
        value: undefined,
        writable: true
      });

      expect(() => new Application()).toThrow();
    });

    it('should handle case where getElementById is not available', () => {
      Object.defineProperty(document, 'getElementById', {
        value: undefined,
        writable: true
      });

      expect(() => new Application()).toThrow();
    });
  });

  describe('Performance and Memory', () => {
    it('should not create memory leaks with event listeners', () => {
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true
      });

      // Create multiple instances
      for (let i = 0; i < 5; i++) {
        new Application();
      }

      // Should have added 5 event listeners
      expect(mockAddEventListener).toHaveBeenCalledTimes(5);
      
      // Each should be for DOMContentLoaded
      mockAddEventListener.mock.calls.forEach(call => {
        expect(call[0]).toBe('DOMContentLoaded');
        expect(typeof call[1]).toBe('function');
      });
    });

    it('should handle rapid successive calls to setupApp', () => {
      const mockElement = document.createElement('div');
      mockGetElementById.mockReturnValue(mockElement);
      
      jest.spyOn(Application.prototype, 'initialize').mockImplementation();
      const app = new Application();

      // Call setupApp multiple times rapidly
      app['setupApp']();
      app['setupApp']();
      app['setupApp']();

      expect(initializeApp).toHaveBeenCalledTimes(3);
      expect(mockGetElementById).toHaveBeenCalledTimes(3);
    });
  });
});

// Test the module-level instantiation and logging
describe('Module Level Behavior', () => {
  it('should log module loading message', () => {
    // This test verifies the console.log at the module level
    expect(consoleSpy.log).toHaveBeenCalledWith(
      'App module (app.ts) loaded and application instantiated.'
    );
  });
});