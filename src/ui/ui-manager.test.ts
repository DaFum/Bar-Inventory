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

  describe('Edge Cases and Error Handling', () => {
    test('should handle multiple consecutive initializations gracefully', () => {
      initializeApp(appContainer);
      const firstNavCount = appContainer.querySelectorAll('#main-nav .nav-button').length;
      
      // Initialize again
      initializeApp(appContainer);
      const secondNavCount = appContainer.querySelectorAll('#main-nav .nav-button').length;
      
      // Should not duplicate elements
      expect(firstNavCount).toBe(secondNavCount);
      expect(appContainer.querySelector('#main-nav')).not.toBeNull();
      expect(appContainer.querySelector('#view-container')).not.toBeNull();
    });

    test('should handle null container parameter gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => initializeApp(null as any)).not.toThrow();
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle undefined container parameter gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => initializeApp(undefined as any)).not.toThrow();
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle container without proper DOM structure', () => {
      const invalidContainer = document.createElement('span'); // Not a proper container
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => initializeApp(invalidContainer)).not.toThrow();
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle rapid successive navigation clicks', () => {
      initializeApp(appContainer);
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      const locationsButton = appContainer.querySelector('button[data-view="locations"]') as HTMLButtonElement;
      
      // Rapid clicks
      productsButton.click();
      locationsButton.click();
      productsButton.click();
      
      expect(initProductManagerSpy).toHaveBeenCalledTimes(2);
      expect(initLocationManagerSpy).toHaveBeenCalledTimes(1);
      expect(productsButton.classList.contains('active')).toBe(true);
      expect(locationsButton.classList.contains('active')).toBe(false);
    });

    test('should handle navigation when view container is replaced', () => {
      initializeApp(appContainer);
      const originalViewContainer = appContainer.querySelector('#view-container');
      
      // Replace the view container
      const newViewContainer = document.createElement('main');
      newViewContainer.id = 'view-container';
      newViewContainer.className = 'view-content';
      originalViewContainer?.replaceWith(newViewContainer);
      
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      productsButton.click();
      
      expect(initProductManagerSpy).toHaveBeenCalledWith(newViewContainer);
    });
  });

  describe('Accessibility and ARIA Attributes', () => {
    test('should set proper ARIA attributes on navigation buttons', () => {
      initializeApp(appContainer);
      
      const navButtons = appContainer.querySelectorAll('#main-nav .nav-button');
      navButtons.forEach(button => {
        expect(button.getAttribute('role')).toBe('button');
        expect(button.getAttribute('tabindex')).toBe('0');
      });
    });

    test('should update aria-current attribute when navigation changes', () => {
      initializeApp(appContainer);
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      const inventoryButton = appContainer.querySelector('button[data-view="inventory"]') as HTMLButtonElement;
      
      // Initial state
      expect(inventoryButton.getAttribute('aria-current')).toBe('page');
      expect(productsButton.getAttribute('aria-current')).toBe('false');
      
      // Navigate to products
      productsButton.click();
      expect(productsButton.getAttribute('aria-current')).toBe('page');
      expect(inventoryButton.getAttribute('aria-current')).toBe('false');
    });

    test('should maintain proper focus management during navigation', () => {
      initializeApp(appContainer);
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      
      productsButton.focus();
      productsButton.click();
      
      expect(document.activeElement).toBe(productsButton);
    });

    test('should have proper keyboard navigation support', () => {
      initializeApp(appContainer);
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      
      // Simulate Enter key press
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' });
      productsButton.dispatchEvent(enterEvent);
      
      // Simulate Space key press
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ', code: 'Space' });
      productsButton.dispatchEvent(spaceEvent);
      
      // Should be accessible via keyboard
      expect(productsButton.tabIndex).toBe(0);
    });
  });

  describe('Theme Toggle Functionality', () => {
    test('should call theme service exactly once per click', () => {
      initializeApp(appContainer);
      const themeToggleButton = appContainer.querySelector('#theme-toggle-btn') as HTMLButtonElement;
      
      themeToggleButton.click();
      themeToggleButton.click();
      themeToggleButton.click();
      
      expect(toggleThemeSpy).toHaveBeenCalledTimes(3);
    });

    test('should maintain theme toggle button state after navigation', () => {
      initializeApp(appContainer);
      const themeToggleButton = appContainer.querySelector('#theme-toggle-btn') as HTMLButtonElement;
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      
      // Click theme toggle, then navigate
      themeToggleButton.click();
      productsButton.click();
      
      // Theme button should still be present and functional
      const themeButtonAfterNav = appContainer.querySelector('#theme-toggle-btn') as HTMLButtonElement;
      expect(themeButtonAfterNav).not.toBeNull();
      expect(themeButtonAfterNav).toBe(themeToggleButton);
      
      themeButtonAfterNav.click();
      expect(toggleThemeSpy).toHaveBeenCalledTimes(2);
    });

    test('should handle theme toggle when theme service is unavailable', () => {
      // Temporarily break the theme service
      toggleThemeSpy.mockImplementation(() => {
        throw new Error('Theme service unavailable');
      });
      
      initializeApp(appContainer);
      const themeToggleButton = appContainer.querySelector('#theme-toggle-btn') as HTMLButtonElement;
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => themeToggleButton.click()).not.toThrow();
      
      consoleErrorSpy.mockRestore();
      toggleThemeSpy.mockRestore();
    });
  });

  describe('View Container State Management', () => {
    test('should properly clear view container content between navigations', () => {
      initializeApp(appContainer);
      const viewContainer = appContainer.querySelector('#view-container') as HTMLElement;
      
      // Add some content to simulate populated view
      viewContainer.innerHTML = '<div class="existing-content">Previous Content</div>';
      
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      productsButton.click();
      
      expect(viewContainer.innerHTML).not.toContain('Previous Content');
      expect(initProductManagerSpy).toHaveBeenCalledWith(viewContainer);
    });

    test('should preserve view container attributes during navigation', () => {
      initializeApp(appContainer);
      const viewContainer = appContainer.querySelector('#view-container') as HTMLElement;
      
      // Verify initial attributes
      expect(viewContainer.getAttribute('role')).toBe('main');
      expect(viewContainer.getAttribute('aria-live')).toBe('polite');
      expect(viewContainer.classList.contains('view-content')).toBe(true);
      
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      productsButton.click();
      
      // Attributes should be preserved
      expect(viewContainer.getAttribute('role')).toBe('main');
      expect(viewContainer.getAttribute('aria-live')).toBe('polite');
      expect(viewContainer.classList.contains('view-content')).toBe(true);
    });

    test('should handle empty view container scenarios', () => {
      initializeApp(appContainer);
      const viewContainer = appContainer.querySelector('#view-container') as HTMLElement;
      
      // Ensure container starts empty after navigation
      const settingsButton = appContainer.querySelector('button[data-view="settings"]') as HTMLButtonElement;
      settingsButton.click();
      
      expect(viewContainer.innerHTML).toContain('<h2>Einstellungen (Demnächst)</h2>');
      
      // Navigate to another view
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      productsButton.click();
      
      expect(viewContainer.innerHTML).not.toContain('Einstellungen (Demnächst)');
    });
  });

  describe('Navigation Button State Consistency', () => {
    test('should ensure only one button has active state at any time', () => {
      initializeApp(appContainer);
      const allNavButtons = appContainer.querySelectorAll('#main-nav .nav-button');
      
      allNavButtons.forEach((button, index) => {
        (button as HTMLButtonElement).click();
        
        // Count active buttons
        const activeButtons = appContainer.querySelectorAll('#main-nav .nav-button.active');
        expect(activeButtons.length).toBe(1);
        expect(activeButtons[0]).toBe(button);
        
        // Verify all other buttons are inactive
        allNavButtons.forEach((otherButton) => {
          if (otherButton !== button) {
            expect(otherButton.classList.contains('active')).toBe(false);
          }
        });
      });
    });

    test('should handle missing data-view attribute gracefully', () => {
      initializeApp(appContainer);
      const buttonWithoutDataView = document.createElement('button');
      buttonWithoutDataView.className = 'nav-button';
      buttonWithoutDataView.textContent = 'Invalid';
      
      const nav = appContainer.querySelector('#main-nav');
      nav?.appendChild(buttonWithoutDataView);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      buttonWithoutDataView.click();
      
      const viewContainer = appContainer.querySelector('#view-container');
      expect(viewContainer?.innerHTML).toContain('<p>Unbekannte Ansicht.</p>');
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle button clicks when view container is missing ID', () => {
      initializeApp(appContainer);
      const viewContainer = appContainer.querySelector('#view-container') as HTMLElement;
      viewContainer.removeAttribute('id');
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      productsButton.click();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('View container not found!');
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Memory Management and Cleanup', () => {
    test('should not create memory leaks with repeated initializations', () => {
      // Track initial event listener count (approximation)
      const initialChildCount = appContainer.childElementCount;
      
      for (let i = 0; i < 10; i++) {
        initializeApp(appContainer);
      }
      
      // Container should not accumulate excessive elements
      expect(appContainer.childElementCount).toBeLessThanOrEqual(initialChildCount + 5);
    });

    test('should handle DOM cleanup when container is removed', () => {
      initializeApp(appContainer);
      const themeToggleButton = appContainer.querySelector('#theme-toggle-btn') as HTMLButtonElement;
      
      // Remove container from DOM
      document.body.removeChild(appContainer);
      
      // Clicking should not cause errors (event listeners should handle missing DOM)
      expect(() => themeToggleButton.click()).not.toThrow();
      
      // Re-add for cleanup
      document.body.appendChild(appContainer);
    });
  });

  describe('Integration-like Scenarios', () => {
    test('should handle complete user workflow navigation', () => {
      initializeApp(appContainer);
      
      // Simulate user navigating through all views
      const workflow = ['locations', 'products', 'analytics', 'settings', 'inventory'];
      
      workflow.forEach((viewName, index) => {
        const button = appContainer.querySelector(`button[data-view="${viewName}"]`) as HTMLButtonElement;
        button.click();
        
        expect(button.classList.contains('active')).toBe(true);
        
        // Verify view content is appropriate
        const viewContainer = appContainer.querySelector('#view-container') as HTMLElement;
        if (viewName === 'settings') {
          expect(viewContainer.innerHTML).toContain('Einstellungen (Demnächst)');
        } else {
          expect(viewContainer.innerHTML).not.toContain('Einstellungen (Demnächst)');
        }
      });
    });

    test('should maintain state consistency during complex interaction patterns', () => {
      initializeApp(appContainer);
      
      // Complex interaction: theme toggle + navigation + theme toggle
      const themeToggleButton = appContainer.querySelector('#theme-toggle-btn') as HTMLButtonElement;
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      const locationsButton = appContainer.querySelector('button[data-view="locations"]') as HTMLButtonElement;
      
      themeToggleButton.click(); // Toggle theme
      productsButton.click(); // Navigate to products
      themeToggleButton.click(); // Toggle theme again
      locationsButton.click(); // Navigate to locations
      
      expect(toggleThemeSpy).toHaveBeenCalledTimes(2);
      expect(initProductManagerSpy).toHaveBeenCalledTimes(1);
      expect(initLocationManagerSpy).toHaveBeenCalledTimes(1);
      expect(locationsButton.classList.contains('active')).toBe(true);
      expect(productsButton.classList.contains('active')).toBe(false);
    });

    test('should handle rapid user interactions without breaking state', () => {
      initializeApp(appContainer);
      
      const buttons = [
        appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement,
        appContainer.querySelector('button[data-view="locations"]') as HTMLButtonElement,
        appContainer.querySelector('button[data-view="analytics"]') as HTMLButtonElement,
        appContainer.querySelector('#theme-toggle-btn') as HTMLButtonElement
      ];
      
      // Rapid fire clicks
      for (let i = 0; i < 20; i++) {
        const randomButton = buttons[Math.floor(Math.random() * buttons.length)];
        randomButton.click();
      }
      
      // Should maintain valid state
      const activeNavButtons = appContainer.querySelectorAll('#main-nav .nav-button.active');
      expect(activeNavButtons.length).toBe(1);
      
      const viewContainer = appContainer.querySelector('#view-container');
      expect(viewContainer).not.toBeNull();
      expect(viewContainer?.innerHTML).toBeDefined();
    });
  });

  describe('Browser Compatibility Edge Cases', () => {
    test('should handle missing querySelector support gracefully', () => {
      const originalQuerySelector = document.querySelector;
      document.querySelector = undefined as any;
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => initializeApp(appContainer)).not.toThrow();
      
      document.querySelector = originalQuerySelector;
      consoleErrorSpy.mockRestore();
    });

    test('should handle missing classList support gracefully', () => {
      initializeApp(appContainer);
      const button = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      
      // Mock missing classList
      const originalClassList = button.classList;
      Object.defineProperty(button, 'classList', {
        value: undefined,
        configurable: true
      });
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => button.click()).not.toThrow();
      
      // Restore
      Object.defineProperty(button, 'classList', {
        value: originalClassList,
        configurable: true
      });
      consoleErrorSpy.mockRestore();
    });

    test('should handle missing addEventListener gracefully', () => {
      const testContainer = document.createElement('div');
      const originalAddEventListener = testContainer.addEventListener;
      testContainer.addEventListener = undefined as any;
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => initializeApp(testContainer)).not.toThrow();
      
      testContainer.addEventListener = originalAddEventListener;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Mock Validation', () => {
    test('should verify all mocked functions are properly reset between tests', () => {
      // This test ensures our mocking strategy is sound
      expect(jest.isMockFunction(ThemeServiceModule.themeService.toggleTheme)).toBe(true);
      expect(jest.isMockFunction(InventoryViewModule.initInventoryView)).toBe(true);
      expect(jest.isMockFunction(LocationManagerModule.initLocationManager)).toBe(true);
      expect(jest.isMockFunction(ProductManagerModule.initProductManager)).toBe(true);
      expect(jest.isMockFunction(AnalyticsViewModule.initAnalyticsView)).toBe(true);
      
      // Verify call counts are reset
      expect(toggleThemeSpy).toHaveBeenCalledTimes(0);
      expect(initInventoryViewSpy).toHaveBeenCalledTimes(0);
      expect(initLocationManagerSpy).toHaveBeenCalledTimes(0);
      expect(initProductManagerSpy).toHaveBeenCalledTimes(0);
      expect(initAnalyticsViewSpy).toHaveBeenCalledTimes(0);
    });

    test('should verify mock implementations can be customized per test', () => {
      // Test that we can override mock behavior
      initInventoryViewSpy.mockImplementationOnce(() => {
        throw new Error('Inventory view failed');
      });
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      initializeApp(appContainer);
      
      expect(initInventoryViewSpy).toHaveBeenCalledTimes(1);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Performance and Resource Usage', () => {
    test('should not exceed reasonable DOM manipulation limits', () => {
      const startTime = performance.now();
      
      initializeApp(appContainer);
      
      // Navigation should be fast
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      productsButton.click();
      
      const endTime = performance.now();
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(100); // 100ms threshold
    });

    test('should handle large container sizes without performance degradation', () => {
      // Create a large container with many elements
      const largeContainer = document.createElement('div');
      for (let i = 0; i < 1000; i++) {
        const child = document.createElement('div');
        child.textContent = `Child ${i}`;
        largeContainer.appendChild(child);
      }
      document.body.appendChild(largeContainer);
      
      const startTime = performance.now();
      initializeApp(largeContainer);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(200); // 200ms threshold for large container
      
      document.body.removeChild(largeContainer);
    });
  });
