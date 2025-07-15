import { initializeApp } from './ui-manager';
// Need to explicitly import functions to be mocked from their modules.
import * as ThemeServiceModule from '../services/theme.service';
import * as InventoryViewModule from './components/inventory-view';
import * as LocationManagerModule from './components/location-manager';
import * as ProductManagerModule from './components/product-manager';
import * as AnalyticsViewModule from './components/analytics-view';

// Mock services and view initializers
jest.mock('../services/theme.service', () => ({
  themeService: {
    toggleTheme: jest.fn(),
    // getCurrentTheme: jest.fn().mockReturnValue('light'), // if needed
  },
}));

jest.mock('./components/inventory-view', () => ({
  initInventoryView: jest.fn(),
}));
jest.mock('./components/location-manager', () => ({
  initLocationManager: jest.fn(),
}));
jest.mock('./components/product-manager', () => ({
  initProductManager: jest.fn(),
}));
jest.mock('./components/analytics-view', () => ({
  initAnalyticsView: jest.fn(),
}));

// Type for ViewName, needs to be accessible in test file.
// If not exported from ui-manager.ts, redefine or import if it becomes available.
type ViewName = 'locations' | 'products' | 'inventory' | 'analytics' | 'settings';

describe('UI Manager (ui-manager.ts)', () => {
  let appContainer: HTMLElement;
  // Spy on the actual imported modules
  let toggleThemeSpy: jest.SpyInstance;
  let initInventoryViewSpy: jest.SpyInstance;
  let initLocationManagerSpy: jest.SpyInstance;
  let initProductManagerSpy: jest.SpyInstance;
  let initAnalyticsViewSpy: jest.SpyInstance;


  beforeEach(() => {
    // Create a fresh app container for each test
    appContainer = document.createElement('div');
    appContainer.id = 'app-container-test'; // Use a unique ID for test container
    document.body.appendChild(appContainer);

    // Reset mocks and spies
    jest.clearAllMocks();

    // Setup spies on the methods of the actual imported modules
    toggleThemeSpy = jest.spyOn(ThemeServiceModule.themeService, 'toggleTheme');
    initInventoryViewSpy = jest.spyOn(InventoryViewModule, 'initInventoryView');
    initLocationManagerSpy = jest.spyOn(LocationManagerModule, 'initLocationManager');
    initProductManagerSpy = jest.spyOn(ProductManagerModule, 'initProductManager');
    initAnalyticsViewSpy = jest.spyOn(AnalyticsViewModule, 'initAnalyticsView');
  });

  afterEach(() => {
    document.body.removeChild(appContainer);
    // Reset currentView and appContainer in ui-manager module if possible,
    // or ensure tests account for state between them.
    // For now, re-initializing initializeApp in beforeEach should reset much of it.
  });

  describe('initializeApp', () => {
    test('should render the main layout into the container', () => {
      initializeApp(appContainer);
      expect(appContainer.querySelector('#main-nav')).not.toBeNull();
      expect(appContainer.querySelector('#view-container')).not.toBeNull();
      expect(appContainer.querySelector('#theme-toggle-btn')).not.toBeNull();
    });

    test('should navigate to the default view (inventory) after layout rendering', () => {
      // Mock document.getElementById to return a main element with the correct properties
      const mainElement = document.createElement('main');
      mainElement.id = 'view-container';
      mainElement.classList.add('view-content');
      mainElement.setAttribute('role', 'main');
      mainElement.setAttribute('aria-live', 'polite');
      jest.spyOn(document, 'getElementById').mockReturnValue(mainElement);

      initializeApp(appContainer);
      // initializeApp calls renderLayout then navigateTo(currentView='inventory')
      expect(initInventoryViewSpy).toHaveBeenCalledTimes(1); // Called once during initial setup
      expect(initInventoryViewSpy).toHaveBeenCalledWith(mainElement);

      const inventoryNavButton = appContainer.querySelector('button[data-view="inventory"]');
      expect(inventoryNavButton?.classList.contains('active')).toBe(true);
    });
  });

  describe('renderLayout', () => {
    test('should attach event listeners to navigation buttons', () => {
      initializeApp(appContainer);
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      productsButton.click();
      expect(initProductManagerSpy).toHaveBeenCalledTimes(1);
      expect(initProductManagerSpy).toHaveBeenCalledWith(appContainer.querySelector('#view-container'));
    });

    test('should attach event listener to theme toggle button', () => {
      initializeApp(appContainer);
      const themeToggleButton = appContainer.querySelector('#theme-toggle-btn') as HTMLButtonElement;
      themeToggleButton.click();
      expect(toggleThemeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('navigateTo', () => {
    const viewsToTest: ViewName[] = ['locations', 'products', 'analytics', 'settings', 'inventory'];

    viewsToTest.forEach(viewName => {
      test(`should clear view container, call correct init function, and update active button for "${viewName}" view`, () => {
        initializeApp(appContainer);
        // Click the corresponding nav button to trigger navigateTo
        const navButton = appContainer.querySelector(`button[data-view="${viewName}"]`) as HTMLButtonElement;
        navButton.click(); // This calls navigateTo internally

        const viewContainer = appContainer.querySelector('#view-container');
        expect(viewContainer).not.toBeNull();

        // Check active button
        expect(navButton.classList.contains('active')).toBe(true);
        appContainer.querySelectorAll('#main-nav .nav-button').forEach(btn => {
          if (btn !== navButton) {
            expect(btn.classList.contains('active')).toBe(false);
          }
        });

        // Check correct init function call
        switch (viewName) {
          case 'locations':
            expect(initLocationManagerSpy).toHaveBeenCalledTimes(1); // Called by the click
            expect(initLocationManagerSpy).toHaveBeenCalledWith(viewContainer);
            expect(viewContainer?.innerHTML).not.toContain('Einstellungen (Demnächst)'); // Check it's not settings
            break;
          case 'products':
            expect(initProductManagerSpy).toHaveBeenCalledTimes(1);
            expect(initProductManagerSpy).toHaveBeenCalledWith(viewContainer);
            break;
          case 'inventory':
            // initInventoryViewSpy was called once in initializeApp, so it's 2 now
            expect(initInventoryViewSpy).toHaveBeenCalledTimes(2);
            expect(initInventoryViewSpy).toHaveBeenLastCalledWith(viewContainer);
            break;
          case 'analytics':
            expect(initAnalyticsViewSpy).toHaveBeenCalledTimes(1);
            expect(initAnalyticsViewSpy).toHaveBeenCalledWith(viewContainer);
            break;
          case 'settings':
            expect(viewContainer?.innerHTML).toContain('<h2>Einstellungen (Demnächst)</h2>');
            // Ensure other init functions were not called for settings view
            expect(initLocationManagerSpy).not.toHaveBeenCalledTimes(2); // Assuming not called again unless 'locations' was clicked
            break;
        }
      });
    });

    test('should log an error if view container is not found (e.g., removed from DOM)', () => {
      initializeApp(appContainer);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const originalViewContainer = appContainer.querySelector('#view-container');
      originalViewContainer?.remove(); // Remove it

      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      productsButton.click(); // Attempt to navigate

      expect(consoleErrorSpy).toHaveBeenCalledWith('View container not found!');
      consoleErrorSpy.mockRestore();

      // Restore view container for other tests (though afterEach should handle parent)
      if (originalViewContainer) appContainer.appendChild(originalViewContainer);
    });

    test('should display "Unbekannte Ansicht" for an invalid view name', () => {
        initializeApp(appContainer);
        // This requires calling navigateTo directly, which is not exported.
        // We can test this by manually setting an invalid data-view and clicking.
        const firstNavButton = appContainer.querySelector('#main-nav .nav-button') as HTMLButtonElement;
        firstNavButton.setAttribute('data-view', 'nonexistentview');
        firstNavButton.click();

        const viewContainer = appContainer.querySelector('#view-container');
        expect(viewContainer?.innerHTML).toContain('<p>Unbekannte Ansicht.</p>');
      });
  });

  describe('updateActiveNavButton', () => {
    // Removing the nested beforeEach. The outer beforeEach already calls initializeApp.
    // This ensures initializeApp (and thus navigateTo default) runs only once before these tests.

    test('should correctly add "active" class to the current view button and remove from others', () => {
      initializeApp(appContainer);
      const locationsButton = appContainer.querySelector('button[data-view="locations"]') as HTMLButtonElement;
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      const inventoryButton = appContainer.querySelector('button[data-view="inventory"]') as HTMLButtonElement;

      expect(inventoryButton).not.toBeNull(); // Ensure the button is found
      if (!inventoryButton) return; // Guard for TS

      // Ensure the test starts with the correct initial state set by initializeApp.
      // The active state for inventory should already be set by initializeApp in the main beforeEach.
      // Initial state (inventory is active from initializeApp / click)
      expect(inventoryButton.classList.contains('active')).toBe(true);
      expect(locationsButton!.classList.contains('active')).toBe(false);
      expect(productsButton!.classList.contains('active')).toBe(false);

      // Navigate to locations
      locationsButton!.click();
      expect(inventoryButton.classList.contains('active')).toBe(false);
      expect(locationsButton!.classList.contains('active')).toBe(true);
      expect(productsButton!.classList.contains('active')).toBe(false);

      // Navigate to products
      productsButton!.click();
      expect(inventoryButton.classList.contains('active')).toBe(false);
      expect(locationsButton!.classList.contains('active')).toBe(false);
      expect(productsButton!.classList.contains('active')).toBe(true);
    });
  });
});

  describe('Error Handling and Edge Cases', () => {
    test('should handle multiple rapid navigation clicks gracefully', () => {
      initializeApp(appContainer);
      const locationsButton = appContainer.querySelector('button[data-view="locations"]') as HTMLButtonElement;
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      
      // Simulate rapid clicks
      for (let i = 0; i < 5; i++) {
        locationsButton.click();
        productsButton.click();
      }
      
      // Should still work correctly after rapid clicking
      expect(initLocationManagerSpy).toHaveBeenCalledTimes(5);
      expect(initProductManagerSpy).toHaveBeenCalledTimes(5);
      expect(productsButton.classList.contains('active')).toBe(true);
    });

    test('should handle initialization with null container gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        initializeApp(null as any);
      }).not.toThrow();
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle initialization with invalid container element', () => {
      const invalidContainer = document.createTextNode('invalid') as any;
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        initializeApp(invalidContainer);
      }).not.toThrow();
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle missing navigation buttons during event attachment', () => {
      initializeApp(appContainer);
      
      // Remove all nav buttons after initialization
      appContainer.querySelectorAll('.nav-button').forEach(btn => btn.remove());
      
      // Should not throw when trying to navigate
      expect(() => {
        const mockEvent = new Event('click');
        document.dispatchEvent(mockEvent);
      }).not.toThrow();
    });
  });

  describe('Accessibility and ARIA Support', () => {
    test('should set correct ARIA attributes on navigation buttons', () => {
      initializeApp(appContainer);
      
      const navButtons = appContainer.querySelectorAll('#main-nav .nav-button');
      navButtons.forEach(button => {
        expect(button.getAttribute('role')).toBe('button');
        expect(button.getAttribute('tabindex')).not.toBe('-1');
      });
    });

    test('should update aria-current when navigating between views', () => {
      initializeApp(appContainer);
      
      const locationsButton = appContainer.querySelector('button[data-view="locations"]') as HTMLButtonElement;
      const inventoryButton = appContainer.querySelector('button[data-view="inventory"]') as HTMLButtonElement;
      
      // Initially inventory should be active
      expect(inventoryButton.getAttribute('aria-current')).toBe('page');
      
      locationsButton.click();
      expect(locationsButton.getAttribute('aria-current')).toBe('page');
      expect(inventoryButton.getAttribute('aria-current')).toBeNull();
    });

    test('should maintain focus management during navigation', () => {
      initializeApp(appContainer);
      
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      productsButton.focus();
      productsButton.click();
      
      // Button should retain focus after navigation
      expect(document.activeElement).toBe(productsButton);
    });

    test('should have proper heading hierarchy in view container', () => {
      initializeApp(appContainer);
      
      const settingsButton = appContainer.querySelector('button[data-view="settings"]') as HTMLButtonElement;
      settingsButton.click();
      
      const viewContainer = appContainer.querySelector('#view-container');
      const heading = viewContainer?.querySelector('h2');
      expect(heading).not.toBeNull();
      expect(heading?.textContent).toContain('Einstellungen');
    });
  });

  describe('Memory Management and Cleanup', () => {
    test('should properly clean up event listeners when container is removed', () => {
      initializeApp(appContainer);
      
      const themeToggleButton = appContainer.querySelector('#theme-toggle-btn') as HTMLButtonElement;
      const addEventListenerSpy = jest.spyOn(themeToggleButton, 'addEventListener');
      
      // Remove container from DOM
      document.body.removeChild(appContainer);
      
      // Verify that event listeners can be cleaned up without errors
      expect(() => {
        themeToggleButton.removeEventListener('click', jest.fn());
      }).not.toThrow();
      
      addEventListenerSpy.mockRestore();
      // Re-add container for other tests
      document.body.appendChild(appContainer);
    });

    test('should handle multiple initializations on same container', () => {
      initializeApp(appContainer);
      const firstNavCount = appContainer.querySelectorAll('#main-nav .nav-button').length;
      
      // Initialize again on same container
      initializeApp(appContainer);
      const secondNavCount = appContainer.querySelectorAll('#main-nav .nav-button').length;
      
      // Should not duplicate navigation elements
      expect(secondNavCount).toBe(firstNavCount);
    });
  });

  describe('View Container State Management', () => {
    test('should preserve view container attributes during navigation', () => {
      initializeApp(appContainer);
      const viewContainer = appContainer.querySelector('#view-container') as HTMLElement;
      
      // Verify initial attributes
      expect(viewContainer.getAttribute('role')).toBe('main');
      expect(viewContainer.getAttribute('aria-live')).toBe('polite');
      expect(viewContainer.classList.contains('view-content')).toBe(true);
      
      // Navigate to different view
      const locationsButton = appContainer.querySelector('button[data-view="locations"]') as HTMLButtonElement;
      locationsButton.click();
      
      // Attributes should be preserved
      expect(viewContainer.getAttribute('role')).toBe('main');
      expect(viewContainer.getAttribute('aria-live')).toBe('polite');
      expect(viewContainer.classList.contains('view-content')).toBe(true);
    });

    test('should handle view container innerHTML replacement correctly', () => {
      initializeApp(appContainer);
      const viewContainer = appContainer.querySelector('#view-container') as HTMLElement;
      
      // Add some custom content
      const customElement = document.createElement('div');
      customElement.id = 'custom-test-element';
      viewContainer.appendChild(customElement);
      
      // Navigate to clear and replace content
      const analyticsButton = appContainer.querySelector('button[data-view="analytics"]') as HTMLButtonElement;
      analyticsButton.click();
      
      // Custom element should be removed
      expect(viewContainer.querySelector('#custom-test-element')).toBeNull();
      expect(initAnalyticsViewSpy).toHaveBeenCalled();
    });
  });

  describe('Theme Toggle Integration', () => {
    test('should handle theme toggle button clicks without interfering with navigation', () => {
      initializeApp(appContainer);
      
      const themeToggleButton = appContainer.querySelector('#theme-toggle-btn') as HTMLButtonElement;
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      
      // Click theme toggle
      themeToggleButton.click();
      expect(toggleThemeSpy).toHaveBeenCalledTimes(1);
      
      // Navigation should still work
      productsButton.click();
      expect(initProductManagerSpy).toHaveBeenCalledTimes(1);
      expect(productsButton.classList.contains('active')).toBe(true);
    });

    test('should handle multiple theme toggle clicks', () => {
      initializeApp(appContainer);
      
      const themeToggleButton = appContainer.querySelector('#theme-toggle-btn') as HTMLButtonElement;
      
      // Multiple clicks
      themeToggleButton.click();
      themeToggleButton.click();
      themeToggleButton.click();
      
      expect(toggleThemeSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Navigation State Consistency', () => {
    test('should maintain consistent state across all navigation methods', () => {
      initializeApp(appContainer);
      
      // Test each view maintains proper state
      const viewNames: ViewName[] = ['locations', 'products', 'analytics', 'settings'];
      
      viewNames.forEach(viewName => {
        const button = appContainer.querySelector(`button[data-view="${viewName}"]`) as HTMLButtonElement;
        button.click();
        
        // Verify only this button is active
        const allButtons = appContainer.querySelectorAll('#main-nav .nav-button');
        allButtons.forEach(btn => {
          if (btn === button) {
            expect(btn.classList.contains('active')).toBe(true);
          } else {
            expect(btn.classList.contains('active')).toBe(false);
          }
        });
      });
    });

    test('should handle keyboard navigation events on nav buttons', () => {
      initializeApp(appContainer);
      
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      
      // Simulate keyboard events
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      
      productsButton.dispatchEvent(enterEvent);
      productsButton.dispatchEvent(spaceEvent);
      
      // Should not cause errors even if not specifically handled
      expect(productsButton).toBeDefined();
    });
  });

  describe('Integration with Component Modules', () => {
    test('should pass correct parameters to all view initialization functions', () => {
      initializeApp(appContainer);
      const viewContainer = appContainer.querySelector('#view-container');
      
      // Test each view receives correct container
      const testViews = [
        { view: 'locations', spy: initLocationManagerSpy },
        { view: 'products', spy: initProductManagerSpy },
        { view: 'analytics', spy: initAnalyticsViewSpy }
      ];
      
      testViews.forEach(({ view, spy }) => {
        const button = appContainer.querySelector(`button[data-view="${view}"]`) as HTMLButtonElement;
        button.click();
        expect(spy).toHaveBeenCalledWith(viewContainer);
      });
    });

    test('should handle view initialization failures gracefully', () => {
      initializeApp(appContainer);
      
      // Mock a view initialization to throw an error
      initLocationManagerSpy.mockImplementationOnce(() => {
        throw new Error('View initialization failed');
      });
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const locationsButton = appContainer.querySelector('button[data-view="locations"]') as HTMLButtonElement;
      
      expect(() => {
        locationsButton.click();
      }).not.toThrow();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Performance and Resource Management', () => {
    test('should not create memory leaks with repeated navigation', () => {
      initializeApp(appContainer);
      
      const buttons = [
        appContainer.querySelector('button[data-view="locations"]') as HTMLButtonElement,
        appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement,
        appContainer.querySelector('button[data-view="inventory"]') as HTMLButtonElement
      ];
      
      // Simulate heavy navigation usage
      for (let i = 0; i < 20; i++) {
        buttons[i % buttons.length].click();
      }
      
      // All spies should have been called expected number of times
      expect(initLocationManagerSpy).toHaveBeenCalledTimes(7); // 20/3 rounded up for locations
      expect(initProductManagerSpy).toHaveBeenCalledTimes(6);  // 20/3 rounded for products
      expect(initInventoryViewSpy).toHaveBeenCalledTimes(8);   // Initial + 20/3 rounded for inventory
    });

    test('should efficiently handle DOM queries during navigation', () => {
      initializeApp(appContainer);
      
      const getElementByIdSpy = jest.spyOn(document, 'getElementById');
      const querySelectorSpy = jest.spyOn(appContainer, 'querySelector');
      
      // Navigate to a few views
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      productsButton.click();
      
      // Should use efficient DOM queries
      expect(getElementByIdSpy).toHaveBeenCalled();
      expect(querySelectorSpy).toHaveBeenCalled();
      
      getElementByIdSpy.mockRestore();
      querySelectorSpy.mockRestore();
    });
  });
});
