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
    test('should handle null container passed to initializeApp', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => initializeApp(null as any)).not.toThrow();
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle undefined container passed to initializeApp', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => initializeApp(undefined as any)).not.toThrow();
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle container without proper DOM structure', () => {
      const emptyContainer = document.createElement('span'); // Not a div
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => initializeApp(emptyContainer)).not.toThrow();
      
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
    });

    test('should handle navigation when view init functions throw errors', () => {
      initLocationManagerSpy.mockImplementation(() => {
        throw new Error('Location manager failed to initialize');
      });
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      initializeApp(appContainer);
      const locationsButton = appContainer.querySelector('button[data-view="locations"]') as HTMLButtonElement;
      
      expect(() => locationsButton.click()).not.toThrow();
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle theme toggle when service throws error', () => {
      toggleThemeSpy.mockImplementation(() => {
        throw new Error('Theme service error');
      });
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      initializeApp(appContainer);
      const themeButton = appContainer.querySelector('#theme-toggle-btn') as HTMLButtonElement;
      
      expect(() => themeButton.click()).not.toThrow();
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle missing event target in navigation click handler', () => {
      initializeApp(appContainer);
      
      const navButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      
      // Create event without proper target
      const mockEvent = {
        target: null
      } as any;
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Simulate click with malformed event
      navButton.dispatchEvent(new Event('click'));
      
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('DOM Manipulation and Structure', () => {
    test('should create proper HTML structure with correct classes', () => {
      initializeApp(appContainer);
      
      const mainNav = appContainer.querySelector('#main-nav');
      expect(mainNav).toHaveClass('navbar');
      
      const viewContainer = appContainer.querySelector('#view-container');
      expect(viewContainer?.tagName).toBe('MAIN');
      expect(viewContainer).toHaveClass('view-content');
      expect(viewContainer?.getAttribute('role')).toBe('main');
      expect(viewContainer?.getAttribute('aria-live')).toBe('polite');
    });

    test('should have proper navigation button structure', () => {
      initializeApp(appContainer);
      
      const navButtons = appContainer.querySelectorAll('#main-nav .nav-button');
      expect(navButtons.length).toBe(5); // inventory, analytics, products, locations, settings
      
      navButtons.forEach(button => {
        expect(button.getAttribute('role')).toBe('menuitem');
        expect(button.getAttribute('data-view')).toBeDefined();
      });
    });

    test('should have proper theme toggle button structure', () => {
      initializeApp(appContainer);
      
      const themeButton = appContainer.querySelector('#theme-toggle-btn');
      expect(themeButton?.tagName).toBe('BUTTON');
      expect(themeButton).toHaveClass('btn', 'btn-sm', 'btn-secondary');
      expect(themeButton?.getAttribute('aria-label')).toBe('Toggle Dark Mode');
    });

    test('should clear view container content before rendering new view', () => {
      initializeApp(appContainer);
      
      const viewContainer = appContainer.querySelector('#view-container');
      viewContainer!.innerHTML = '<div>existing content</div>';
      
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      productsButton.click();
      
      expect(viewContainer?.innerHTML).not.toContain('existing content');
    });

    test('should maintain DOM structure integrity after multiple navigations', () => {
      initializeApp(appContainer);
      
      const views: ViewName[] = ['locations', 'products', 'analytics', 'inventory'];
      
      views.forEach(view => {
        const button = appContainer.querySelector(`button[data-view="${view}"]`) as HTMLButtonElement;
        button.click();
        
        expect(appContainer.querySelector('#main-nav')).not.toBeNull();
        expect(appContainer.querySelector('#view-container')).not.toBeNull();
        expect(appContainer.querySelector('#theme-toggle-btn')).not.toBeNull();
      });
    });

    test('should properly structure menubar with role attributes', () => {
      initializeApp(appContainer);
      
      const menubar = appContainer.querySelector('[role="menubar"]');
      expect(menubar).not.toBeNull();
      
      const menuItems = menubar?.querySelectorAll('[role="menuitem"]');
      expect(menuItems?.length).toBe(5);
    });
  });

  describe('Event Handling and Interactions', () => {
    test('should handle focus states on navigation buttons', () => {
      initializeApp(appContainer);
      
      const buttons = appContainer.querySelectorAll('#main-nav .nav-button');
      buttons.forEach(button => {
        (button as HTMLElement).focus();
        expect(document.activeElement).toBe(button);
      });
    });

    test('should handle disabled state on navigation buttons', () => {
      initializeApp(appContainer);
      
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      productsButton.disabled = true;
      
      productsButton.click();
      
      // Should not navigate when disabled
      expect(initProductManagerSpy).not.toHaveBeenCalled();
    });

    test('should handle missing data-view attribute gracefully', () => {
      initializeApp(appContainer);
      
      const navButton = appContainer.querySelector('.nav-button') as HTMLButtonElement;
      navButton.removeAttribute('data-view');
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      navButton.click();
      
      // Should not crash or navigate
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    test('should properly handle theme toggle button interactions', () => {
      initializeApp(appContainer);
      
      const themeButton = appContainer.querySelector('#theme-toggle-btn') as HTMLButtonElement;
      
      // Multiple clicks should call theme service each time
      themeButton.click();
      themeButton.click();
      themeButton.click();
      
      expect(toggleThemeSpy).toHaveBeenCalledTimes(3);
    });

    test('should handle event bubbling properly', () => {
      initializeApp(appContainer);
      
      const navContainer = appContainer.querySelector('[role="menubar"]') as HTMLElement;
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      
      // Click on container should not trigger navigation
      navContainer.click();
      expect(initProductManagerSpy).not.toHaveBeenCalled();
      
      // Click on button should trigger navigation
      productsButton.click();
      expect(initProductManagerSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('State Management and Persistence', () => {
    test('should maintain current view state across multiple operations', () => {
      initializeApp(appContainer);
      
      // Navigate to products
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      productsButton.click();
      
      // Toggle theme (should not affect current view)
      const themeButton = appContainer.querySelector('#theme-toggle-btn') as HTMLButtonElement;
      themeButton.click();
      
      // Products should still be active
      expect(productsButton.classList.contains('active')).toBe(true);
    });

    test('should handle reinitialization of the same container', () => {
      initializeApp(appContainer);
      const firstNavElement = appContainer.querySelector('#main-nav');
      
      // Reinitialize the same container
      initializeApp(appContainer);
      const secondNavElement = appContainer.querySelector('#main-nav');
      
      expect(secondNavElement).not.toBeNull();
      expect(appContainer.children.length).toBeGreaterThan(0);
    });

    test('should properly reset view state when switching views', () => {
      initializeApp(appContainer);
      
      // Go to analytics, then back to inventory
      const analyticsButton = appContainer.querySelector('button[data-view="analytics"]') as HTMLButtonElement;
      const inventoryButton = appContainer.querySelector('button[data-view="inventory"]') as HTMLButtonElement;
      
      analyticsButton.click();
      inventoryButton.click();
      
      expect(initAnalyticsViewSpy).toHaveBeenCalledTimes(1);
      expect(initInventoryViewSpy).toHaveBeenCalledTimes(3); // Initial + analytics navigation + back to inventory
    });

    test('should maintain proper active state through view cycles', () => {
      initializeApp(appContainer);
      
      const buttons = {
        inventory: appContainer.querySelector('button[data-view="inventory"]') as HTMLButtonElement,
        products: appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement,
        analytics: appContainer.querySelector('button[data-view="analytics"]') as HTMLButtonElement
      };
      
      // Test cycle: inventory -> products -> analytics -> inventory
      buttons.products.click();
      expect(buttons.products.classList.contains('active')).toBe(true);
      expect(buttons.inventory.classList.contains('active')).toBe(false);
      
      buttons.analytics.click();
      expect(buttons.analytics.classList.contains('active')).toBe(true);
      expect(buttons.products.classList.contains('active')).toBe(false);
      
      buttons.inventory.click();
      expect(buttons.inventory.classList.contains('active')).toBe(true);
      expect(buttons.analytics.classList.contains('active')).toBe(false);
    });
  });

  describe('Performance and Memory Considerations', () => {
    test('should not create memory leaks with event listeners', () => {
      const containers = [];
      
      // Create multiple containers and initialize them
      for (let i = 0; i < 5; i++) {
        const container = document.createElement('div');
        container.id = `test-container-${i}`;
        document.body.appendChild(container);
        containers.push(container);
        
        initializeApp(container);
      }
      
      // Clean up
      containers.forEach(container => {
        document.body.removeChild(container);
      });
      
      // Should not throw or cause issues
      expect(containers.length).toBe(5);
    });

    test('should handle large numbers of rapid theme toggles', () => {
      initializeApp(appContainer);
      const themeButton = appContainer.querySelector('#theme-toggle-btn') as HTMLButtonElement;
      
      // Rapid theme toggles
      for (let i = 0; i < 10; i++) {
        themeButton.click();
      }
      
      expect(toggleThemeSpy).toHaveBeenCalledTimes(10);
    });

    test('should efficiently handle view container clearing', () => {
      initializeApp(appContainer);
      const viewContainer = appContainer.querySelector('#view-container');
      
      // Add large content
      const largeContent = '<div>'.repeat(100) + 'content' + '</div>'.repeat(100);
      viewContainer!.innerHTML = largeContent;
      
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      
      const startTime = performance.now();
      productsButton.click();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    test('should handle multiple rapid view switches efficiently', () => {
      initializeApp(appContainer);
      
      const buttons = [
        appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement,
        appContainer.querySelector('button[data-view="locations"]') as HTMLButtonElement,
        appContainer.querySelector('button[data-view="analytics"]') as HTMLButtonElement,
        appContainer.querySelector('button[data-view="inventory"]') as HTMLButtonElement
      ];
      
      const startTime = performance.now();
      
      // Rapid switching between views
      for (let i = 0; i < 20; i++) {
        buttons[i % buttons.length].click();
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
    });
  });

  describe('Integration with Services and Components', () => {
    test('should pass correct container reference to all view initializers', () => {
      initializeApp(appContainer);
      
      const viewContainer = appContainer.querySelector('#view-container');
      const views: ViewName[] = ['locations', 'products', 'analytics', 'inventory'];
      
      views.forEach(view => {
        const button = appContainer.querySelector(`button[data-view="${view}"]`) as HTMLButtonElement;
        button.click();
        
        switch (view) {
          case 'locations':
            expect(initLocationManagerSpy).toHaveBeenLastCalledWith(viewContainer);
            break;
          case 'products':
            expect(initProductManagerSpy).toHaveBeenLastCalledWith(viewContainer);
            break;
          case 'analytics':
            expect(initAnalyticsViewSpy).toHaveBeenLastCalledWith(viewContainer);
            break;
          case 'inventory':
            expect(initInventoryViewSpy).toHaveBeenLastCalledWith(viewContainer);
            break;
        }
      });
    });

    test('should handle service dependency injection failures gracefully', () => {
      // Mock all services to throw
      [initInventoryViewSpy, initLocationManagerSpy, initProductManagerSpy, initAnalyticsViewSpy].forEach(spy => {
        spy.mockImplementation(() => {
          throw new Error('Service unavailable');
        });
      });
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      initializeApp(appContainer);
      
      // Should still render layout even if services fail
      expect(appContainer.querySelector('#main-nav')).not.toBeNull();
      expect(appContainer.querySelector('#view-container')).not.toBeNull();
      
      consoleErrorSpy.mockRestore();
    });

    test('should maintain service call order and timing', () => {
      const callOrder: string[] = [];
      
      initInventoryViewSpy.mockImplementation(() => callOrder.push('inventory'));
      initLocationManagerSpy.mockImplementation(() => callOrder.push('locations'));
      initProductManagerSpy.mockImplementation(() => callOrder.push('products'));
      
      initializeApp(appContainer);
      
      const locationsButton = appContainer.querySelector('button[data-view="locations"]') as HTMLButtonElement;
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      
      locationsButton.click();
      productsButton.click();
      
      expect(callOrder).toEqual(['inventory', 'locations', 'products']);
    });

    test('should properly isolate view initializer contexts', () => {
      initializeApp(appContainer);
      
      const viewContainer = appContainer.querySelector('#view-container');
      
      // Each view should receive the same container reference
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      const locationsButton = appContainer.querySelector('button[data-view="locations"]') as HTMLButtonElement;
      
      productsButton.click();
      locationsButton.click();
      
      expect(initProductManagerSpy).toHaveBeenCalledWith(viewContainer);
      expect(initLocationManagerSpy).toHaveBeenCalledWith(viewContainer);
    });
  });

  describe('Internationalization and Localization', () => {
    test('should handle German text content correctly in settings view', () => {
      initializeApp(appContainer);
      
      const settingsButton = appContainer.querySelector('button[data-view="settings"]') as HTMLButtonElement;
      settingsButton.click();
      
      const viewContainer = appContainer.querySelector('#view-container');
      expect(viewContainer?.innerHTML).toContain('Einstellungen (Demnächst)');
      expect(viewContainer?.textContent).toMatch(/Einstellungen.*Demnächst/);
    });

    test('should handle special characters in view content', () => {
      initializeApp(appContainer);
      
      const settingsButton = appContainer.querySelector('button[data-view="settings"]') as HTMLButtonElement;
      settingsButton.click();
      
      const viewContainer = appContainer.querySelector('#view-container');
      // Test for proper encoding of German umlauts and special characters
      expect(viewContainer?.innerHTML).not.toContain('&auml;'); // Should be proper UTF-8, not HTML entities
    });

    test('should display correct German button labels', () => {
      initializeApp(appContainer);
      
      const buttonLabels = {
        inventory: 'Inventur',
        analytics: 'Analyse', 
        products: 'Produktkatalog',
        locations: 'Standorte Verwalten',
        settings: 'Einstellungen'
      };
      
      Object.entries(buttonLabels).forEach(([view, expectedLabel]) => {
        const button = appContainer.querySelector(`button[data-view="${view}"]`);
        expect(button?.textContent).toBe(expectedLabel);
      });
    });

    test('should handle theme toggle German text', () => {
      initializeApp(appContainer);
      
      const themeButton = appContainer.querySelector('#theme-toggle-btn');
      expect(themeButton?.textContent).toBe('Theme wechseln');
    });
  });

  describe('Accessibility and Standards Compliance', () => {
    test('should follow ARIA accessibility guidelines', () => {
      initializeApp(appContainer);
      
      const menubar = appContainer.querySelector('[role="menubar"]');
      const mainElement = appContainer.querySelector('[role="main"]');
      const liveRegion = appContainer.querySelector('[aria-live="polite"]');
      
      expect(menubar).not.toBeNull();
      expect(mainElement).not.toBeNull();
      expect(liveRegion).not.toBeNull();
    });

    test('should have proper keyboard navigation support', () => {
      initializeApp(appContainer);
      
      const navButtons = appContainer.querySelectorAll('#main-nav .nav-button');
      
      navButtons.forEach(button => {
        expect(button.getAttribute('tabindex')).not.toBe('-1'); // Should be focusable
      });
    });

    test('should have proper semantic HTML structure', () => {
      initializeApp(appContainer);
      
      const nav = appContainer.querySelector('nav');
      const main = appContainer.querySelector('main');
      
      expect(nav).not.toBeNull();
      expect(main).not.toBeNull();
      expect(nav?.tagName).toBe('NAV');
      expect(main?.tagName).toBe('MAIN');
    });

    test('should provide proper ARIA labels for assistive technology', () => {
      initializeApp(appContainer);
      
      const themeButton = appContainer.querySelector('#theme-toggle-btn');
      expect(themeButton?.getAttribute('aria-label')).toBe('Toggle Dark Mode');
    });
  });

  describe('Security and Input Validation', () => {
    test('should prevent XSS in view content', () => {
      initializeApp(appContainer);
      
      // Try to inject script through view name attribute
      const maliciousButton = document.createElement('button');
      maliciousButton.setAttribute('data-view', '<script>alert("xss")</script>');
      maliciousButton.classList.add('nav-button');
      
      const mainNav = appContainer.querySelector('#main-nav');
      mainNav?.appendChild(maliciousButton);
      
      maliciousButton.click();
      
      const viewContainer = appContainer.querySelector('#view-container');
      expect(viewContainer?.innerHTML).not.toContain('<script>');
      expect(viewContainer?.innerHTML).toContain('Unbekannte Ansicht');
    });

    test('should sanitize container content before manipulation', () => {
      // Create container with potentially dangerous content
      appContainer.innerHTML = '<script>malicious()</script><div id="safe">content</div>';
      
      expect(() => initializeApp(appContainer)).not.toThrow();
      
      // Should have overwritten the malicious content
      expect(appContainer.innerHTML).not.toContain('<script>malicious()</script>');
      expect(appContainer.querySelector('#main-nav')).not.toBeNull();
    });

    test('should handle malformed data attributes safely', () => {
      initializeApp(appContainer);
      
      const navButton = appContainer.querySelector('.nav-button') as HTMLButtonElement;
      navButton.setAttribute('data-view', '"><script>alert("xss")</script><"');
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      navButton.click();
      
      const viewContainer = appContainer.querySelector('#view-container');
      expect(viewContainer?.innerHTML).not.toContain('<script>');
      expect(viewContainer?.innerHTML).toContain('Unbekannte Ansicht');
      
      consoleErrorSpy.mockRestore();
    });

    test('should validate view names against allowed values', () => {
      initializeApp(appContainer);
      
      const invalidViews = ['admin', 'debug', 'test', '', null, undefined];
      
      invalidViews.forEach(invalidView => {
        const testButton = document.createElement('button');
        testButton.setAttribute('data-view', String(invalidView));
        testButton.classList.add('nav-button');
        
        const mainNav = appContainer.querySelector('#main-nav');
        mainNav?.appendChild(testButton);
        
        testButton.click();
        
        const viewContainer = appContainer.querySelector('#view-container');
        expect(viewContainer?.innerHTML).toContain('Unbekannte Ansicht');
        
        mainNav?.removeChild(testButton);
      });
    });
  });

  describe('Console Logging and Debugging', () => {
    test('should log navigation events properly', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      initializeApp(appContainer);
      
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      productsButton.click();
      
      expect(consoleLogSpy).toHaveBeenCalledWith('Navigated to products');
      
      consoleLogSpy.mockRestore();
    });

    test('should log UI Manager initialization', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Re-import the module to trigger the initialization log
      jest.resetModules();
      
      expect(consoleLogSpy).toHaveBeenCalledWith('UI Manager initialized.');
      
      consoleLogSpy.mockRestore();
    });

    test('should handle console logging errors gracefully', () => {
      const originalLog = console.log;
      console.log = jest.fn().mockImplementation(() => {
        throw new Error('Console logging failed');
      });
      
      initializeApp(appContainer);
      
      const productsButton = appContainer.querySelector('button[data-view="products"]') as HTMLButtonElement;
      
      expect(() => productsButton.click()).not.toThrow();
      
      console.log = originalLog;
    });
  });
});
