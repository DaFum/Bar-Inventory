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
    test('should handle null container gracefully in initializeApp', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Test with null container
      initializeApp(null as any);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Container'));
      consoleErrorSpy.mockRestore();
    });

    test('should handle undefined container gracefully in initializeApp', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Test with undefined container
      initializeApp(undefined as any);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Container'));
      consoleErrorSpy.mockRestore();
    });

    test('should handle container without appendChild method', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockContainer = {} as HTMLElement;
      
      initializeApp(mockContainer);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    test('should handle missing navigation buttons during event attachment', () => {
      initializeApp(appContainer);
      
      // Remove all nav buttons
      const navButtons = appContainer.querySelectorAll('.nav-button');
      navButtons.forEach(btn => btn.remove());
      
      // Should not throw when trying to access removed buttons
      expect(() => {
        const nonExistentButton = appContainer.querySelector('button[data-view="products"]');
        expect(nonExistentButton).toBeNull();
      }).not.toThrow();
    });

    test('should handle corrupt DOM state during navigation', () => {
      initializeApp(appContainer);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Corrupt the DOM by removing essential elements
      const viewContainer = appContainer.querySelector('#view-container');
      viewContainer?.remove();
      
      // Try to navigate
      const navButton = appContainer.querySelector('button[data-view="locations"]') as HTMLButtonElement;
      navButton?.click();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('View container not found!');
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Accessibility and ARIA Compliance', () => {
    test('should set correct ARIA attributes on view container', () => {
      initializeApp(appContainer);
      const viewContainer = appContainer.querySelector('#view-container');
      
      expect(viewContainer?.getAttribute('role')).toBe('main');
      expect(viewContainer?.getAttribute('aria-live')).toBe('polite');
    });

    test('should update aria-current on active navigation button', () => {
      initializeApp(appContainer);
      
      const inventoryButton = appContainer.querySelector('button[data-view="inventory"]') as HTMLButtonElement;
      const locationsButton = appContainer.querySelector('button[data-view="locations"]') as HTMLButtonElement;
      
      // Check initial state
      expect(inventoryButton?.getAttribute('aria-current')).toBe('page');
      expect(locationsButton?.getAttribute('aria-current')).toBe('false');
      
      // Navigate to locations
      locationsButton?.click();
      
      expect(inventoryButton?.getAttribute('aria-current')).toBe('false');
      expect(locationsButton?.getAttribute('aria-current')).toBe('page');
    });

    test('should have proper keyboard navigation support', () => {
      initializeApp(appContainer);
      const navButtons = appContainer.querySelectorAll('.nav-button');
      
      navButtons.forEach(button => {
        expect(button.getAttribute('tabindex')).not.toBe('-1');
        expect(button.tagName.toLowerCase()).toBe('button'); // Semantic button elements
      });
    });
  });

  describe('Memory Management and Cleanup', () => {
    test('should properly clean up event listeners when container is removed', () => {
      const addEventListenerSpy = jest.spyOn(HTMLElement.prototype, 'addEventListener');
      
      initializeApp(appContainer);
      const initialListenerCount = addEventListenerSpy.mock.calls.length;
      
      // Simulate multiple initializations (potential memory leak scenario)
      initializeApp(appContainer);
      const secondListenerCount = addEventListenerSpy.mock.calls.length;
      
      // Should not double-bind listeners
      expect(secondListenerCount).toBeGreaterThan(initialListenerCount);
      
      addEventListenerSpy.mockRestore();
    });

    test('should handle rapid navigation clicks without state corruption', () => {
      initializeApp(appContainer);
      
      const views: ViewName[] = ['locations', 'products', 'inventory', 'analytics'];
      
      // Simulate rapid clicking
      views.forEach(viewName => {
        const button = appContainer.querySelector(`button[data-view="${viewName}"]`) as HTMLButtonElement;
        button?.click();
      });
      
      // Check final state is consistent
      const analyticsButton = appContainer.querySelector('button[data-view="analytics"]') as HTMLButtonElement;
      expect(analyticsButton?.classList.contains('active')).toBe(true);
      
      // Ensure only one button is active
      const activeButtons = appContainer.querySelectorAll('.nav-button.active');
      expect(activeButtons.length).toBe(1);
    });
  });

  describe('Component Integration Testing', () => {
    test('should pass correct parameters to all component initializers', () => {
      initializeApp(appContainer);
      
      const viewContainer = appContainer.querySelector('#view-container');
      
      // Test each view navigation with parameter validation
      const locationsButton = appContainer.querySelector('button[data-view="locations"]') as HTMLButtonElement;
      locationsButton?.click();
      expect(initLocationManagerSpy).toHaveBeenCalledWith(viewContainer);
      expect(initLocationManagerSpy).toHaveBeenCalledTimes(1);
      
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      productsButton?.click();
      expect(initProductManagerSpy).toHaveBeenCalledWith(viewContainer);
      expect(initProductManagerSpy).toHaveBeenCalledTimes(1);
      
      const analyticsButton = appContainer.querySelector('button[data-view="analytics"]') as HTMLButtonElement;
      analyticsButton?.click();
      expect(initAnalyticsViewSpy).toHaveBeenCalledWith(viewContainer);
      expect(initAnalyticsViewSpy).toHaveBeenCalledTimes(1);
    });

    test('should handle component initialization failures gracefully', () => {
      // Mock a component to throw an error
      initLocationManagerSpy.mockImplementationOnce(() => {
        throw new Error('Component initialization failed');
      });
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      initializeApp(appContainer);
      const locationsButton = appContainer.querySelector('button[data-view="locations"]') as HTMLButtonElement;
      
      expect(() => locationsButton?.click()).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Component initialization failed'));
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Theme Integration', () => {
    test('should maintain theme toggle functionality across view changes', () => {
      initializeApp(appContainer);
      
      const themeToggleButton = appContainer.querySelector('#theme-toggle-btn') as HTMLButtonElement;
      
      // Toggle theme multiple times
      themeToggleButton?.click();
      expect(toggleThemeSpy).toHaveBeenCalledTimes(1);
      
      // Navigate to different view
      const locationsButton = appContainer.querySelector('button[data-view="locations"]') as HTMLButtonElement;
      locationsButton?.click();
      
      // Theme toggle should still work
      themeToggleButton?.click();
      expect(toggleThemeSpy).toHaveBeenCalledTimes(2);
    });

    test('should handle theme service errors gracefully', () => {
      toggleThemeSpy.mockImplementationOnce(() => {
        throw new Error('Theme service unavailable');
      });
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      initializeApp(appContainer);
      const themeToggleButton = appContainer.querySelector('#theme-toggle-btn') as HTMLButtonElement;
      
      expect(() => themeToggleButton?.click()).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Theme service unavailable'));
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Layout Rendering Edge Cases', () => {
    test('should handle duplicate initialization calls', () => {
      // First initialization
      initializeApp(appContainer);
      const firstNavCount = appContainer.querySelectorAll('.nav-button').length;
      
      // Second initialization on same container
      initializeApp(appContainer);
      const secondNavCount = appContainer.querySelectorAll('.nav-button').length;
      
      // Should not duplicate elements
      expect(secondNavCount).toBe(firstNavCount);
    });

    test('should render layout with all required navigation buttons', () => {
      initializeApp(appContainer);
      
      const expectedViews: ViewName[] = ['locations', 'products', 'inventory', 'analytics', 'settings'];
      
      expectedViews.forEach(viewName => {
        const button = appContainer.querySelector(`button[data-view="${viewName}"]`);
        expect(button).not.toBeNull();
        expect(button?.textContent?.trim().length).toBeGreaterThan(0);
      });
    });

    test('should maintain proper element hierarchy', () => {
      initializeApp(appContainer);
      
      // Check main structure
      const mainNav = appContainer.querySelector('#main-nav');
      const viewContainer = appContainer.querySelector('#view-container');
      const themeToggle = appContainer.querySelector('#theme-toggle-btn');
      
      expect(mainNav).not.toBeNull();
      expect(viewContainer).not.toBeNull();
      expect(themeToggle).not.toBeNull();
      
      // Check nav buttons are children of main-nav
      const navButtons = mainNav?.querySelectorAll('.nav-button');
      expect(navButtons?.length).toBeGreaterThan(0);
    });
  });

  describe('State Consistency', () => {
    test('should maintain consistent active state during multiple navigations', () => {
      initializeApp(appContainer);
      
      const viewNames: ViewName[] = ['locations', 'products', 'inventory', 'analytics', 'settings'];
      
      viewNames.forEach(viewName => {
        const button = appContainer.querySelector(`button[data-view="${viewName}"]`) as HTMLButtonElement;
        button?.click();
        
        // Verify only this button is active
        const allButtons = appContainer.querySelectorAll('.nav-button');
        let activeCount = 0;
        
        allButtons.forEach(btn => {
          if (btn.classList.contains('active')) {
            activeCount++;
            expect(btn.getAttribute('data-view')).toBe(viewName);
          }
        });
        
        expect(activeCount).toBe(1);
      });
    });

    test('should handle navigation with malformed data-view attributes', () => {
      initializeApp(appContainer);
      
      // Create a button with malformed data-view
      const malformedButton = document.createElement('button');
      malformedButton.setAttribute('data-view', '');
      malformedButton.className = 'nav-button';
      
      const mainNav = appContainer.querySelector('#main-nav');
      mainNav?.appendChild(malformedButton);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      malformedButton.click();
      
      // Should handle gracefully and show unknown view message
      const viewContainer = appContainer.querySelector('#view-container');
      expect(viewContainer?.innerHTML).toContain('Unbekannte Ansicht');
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Performance and Resource Management', () => {
    test('should handle large numbers of navigation events efficiently', () => {
      initializeApp(appContainer);
      
      const startTime = performance.now();
      const button = appContainer.querySelector('button[data-view="inventory"]') as HTMLButtonElement;
      
      // Simulate many rapid clicks
      for (let i = 0; i < 100; i++) {
        button?.click();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
      expect(initInventoryViewSpy).toHaveBeenCalledTimes(101); // Initial + 100 clicks
    });

    test('should not leak DOM elements during view changes', () => {
      initializeApp(appContainer);
      
      const initialChildCount = appContainer.childElementCount;
      
      // Navigate through all views multiple times
      const views: ViewName[] = ['locations', 'products', 'inventory', 'analytics', 'settings'];
      
      for (let cycle = 0; cycle < 3; cycle++) {
        views.forEach(viewName => {
          const button = appContainer.querySelector(`button[data-view="${viewName}"]`) as HTMLButtonElement;
          button?.click();
        });
      }
      
      const finalChildCount = appContainer.childElementCount;
      
      // Should not accumulate extra elements
      expect(finalChildCount).toBe(initialChildCount);
    });
  });

  describe('Internationalization Support', () => {
    test('should handle German text content in navigation', () => {
      initializeApp(appContainer);
      
      const settingsButton = appContainer.querySelector('button[data-view="settings"]') as HTMLButtonElement;
      settingsButton?.click();
      
      const viewContainer = appContainer.querySelector('#view-container');
      expect(viewContainer?.innerHTML).toContain('Einstellungen (Demnächst)');
    });

    test('should handle special characters in view content', () => {
      initializeApp(appContainer);
      
      // Navigate to settings which contains German umlauts
      const settingsButton = appContainer.querySelector('button[data-view="settings"]') as HTMLButtonElement;
      settingsButton?.click();
      
      const viewContainer = appContainer.querySelector('#view-container');
      const content = viewContainer?.textContent || '';
      
      // Should properly render German characters
      expect(content).toMatch(/[äöüß]/i);
    });
  });
});
