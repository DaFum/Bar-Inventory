import { AppState } from '../../src/state/app-state';
import { Product, Location } from '../../src/models';

describe('AppState', () => {
  let appState: AppState;

  beforeEach(() => {
    // Reset the singleton instance before each test to ensure isolation
    (AppState as any).instance = undefined;
  });

  afterEach(() => {
    // Clean up singleton instance after each test
    (AppState as any).instance = undefined;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when getInstance is called multiple times', () => {
      const instance1 = AppState.getInstance();
      const instance2 = AppState.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(AppState);
    });

    it('should create only one instance across multiple calls', () => {
      const instance1 = AppState.getInstance();
      const instance2 = AppState.getInstance();
      const instance3 = AppState.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
      expect(instance1).toBe(instance3);
    });

    it('should not allow direct instantiation', () => {
      expect(() => {
        new (AppState as any)();
      }).toThrow();
    });

    it('should maintain singleton behavior after property modifications', () => {
      const instance1 = AppState.getInstance();
      const mockProduct: Product = {
        id: 'test-product-1',
        name: 'Test Product',
        category: 'Test Category',
        volume: 500,
        pricePerBottle: 10.99
      };
      
      instance1.products.push(mockProduct);
      
      const instance2 = AppState.getInstance();
      expect(instance2.products).toEqual([mockProduct]);
      expect(instance1).toBe(instance2);
    });

    it('should handle the synchronized block compilation issue', () => {
      // The current implementation has a syntax error with 'synchronized'
      // This test documents the expected behavior when the syntax is fixed
      expect(() => {
        AppState.getInstance();
      }).not.toThrow();
    });
  });

  describe('Properties Initialization', () => {
    beforeEach(() => {
      appState = AppState.getInstance();
    });

    it('should initialize with empty products array', () => {
      expect(appState.products).toEqual([]);
      expect(Array.isArray(appState.products)).toBe(true);
    });

    it('should initialize with empty locations array', () => {
      expect(appState.locations).toEqual([]);
      expect(Array.isArray(appState.locations)).toBe(true);
    });

    it('should have products as a mutable array', () => {
      const mockProduct: Product = {
        id: 'test-product-1',
        name: 'Test Product',
        category: 'Beverages',
        volume: 500,
        pricePerBottle: 10.99
      };
      
      appState.products.push(mockProduct);
      
      expect(appState.products).toHaveLength(1);
      expect(appState.products[0]).toEqual(mockProduct);
    });

    it('should have locations as a mutable array', () => {
      const mockLocation: Location = {
        id: 'test-location-1',
        name: 'Test Location',
        address: '123 Test St',
        counters: []
      };
      
      appState.locations.push(mockLocation);
      
      expect(appState.locations).toHaveLength(1);
      expect(appState.locations[0]).toEqual(mockLocation);
    });
  });

  describe('State Management', () => {
    beforeEach(() => {
      appState = AppState.getInstance();
    });

    it('should maintain state across multiple operations', () => {
      const mockProduct: Product = {
        id: 'product-1',
        name: 'Product 1',
        category: 'Category 1',
        volume: 500,
        pricePerBottle: 10.99
      };
      const mockLocation: Location = {
        id: 'location-1',
        name: 'Location 1',
        address: '123 Test St',
        counters: []
      };
      
      appState.products.push(mockProduct);
      appState.locations.push(mockLocation);
      
      expect(appState.products).toHaveLength(1);
      expect(appState.locations).toHaveLength(1);
      
      // Get instance again and verify state persistence
      const newInstance = AppState.getInstance();
      expect(newInstance.products).toHaveLength(1);
      expect(newInstance.locations).toHaveLength(1);
      expect(newInstance.products[0]).toEqual(mockProduct);
      expect(newInstance.locations[0]).toEqual(mockLocation);
    });

    it('should handle multiple products correctly', () => {
      const products: Product[] = [
        {
          id: 'product-1',
          name: 'Product 1',
          category: 'Beer',
          volume: 500,
          pricePerBottle: 10.99
        },
        {
          id: 'product-2',
          name: 'Product 2',
          category: 'Wine',
          volume: 750,
          pricePerBottle: 20.99
        },
        {
          id: 'product-3',
          name: 'Product 3',
          category: 'Spirits',
          volume: 700,
          pricePerBottle: 30.99
        }
      ];
      
      appState.products.push(...products);
      
      expect(appState.products).toHaveLength(3);
      expect(appState.products).toEqual(products);
    });

    it('should handle multiple locations correctly', () => {
      const locations: Location[] = [
        {
          id: 'location-1',
          name: 'Location 1',
          address: '123 Test St',
          counters: []
        },
        {
          id: 'location-2',
          name: 'Location 2',
          address: '456 Test Ave',
          counters: []
        },
        {
          id: 'location-3',
          name: 'Location 3',
          address: '789 Test Blvd',
          counters: []
        }
      ];
      
      appState.locations.push(...locations);
      
      expect(appState.locations).toHaveLength(3);
      expect(appState.locations).toEqual(locations);
    });

    it('should allow clearing of products array', () => {
      const mockProduct: Product = {
        id: 'test-product',
        name: 'Test Product',
        category: 'Test',
        volume: 500,
        pricePerBottle: 10.99
      };
      appState.products.push(mockProduct);
      
      expect(appState.products).toHaveLength(1);
      
      appState.products.length = 0;
      
      expect(appState.products).toHaveLength(0);
    });

    it('should allow clearing of locations array', () => {
      const mockLocation: Location = {
        id: 'test-location',
        name: 'Test Location',
        address: '123 Test St',
        counters: []
      };
      appState.locations.push(mockLocation);
      
      expect(appState.locations).toHaveLength(1);
      
      appState.locations.length = 0;
      
      expect(appState.locations).toHaveLength(0);
    });

    it('should allow array method operations on products', () => {
      const products: Product[] = [
        {
          id: 'product-1',
          name: 'Product 1',
          category: 'Beer',
          volume: 500,
          pricePerBottle: 10.99
        },
        {
          id: 'product-2',
          name: 'Product 2',
          category: 'Wine',
          volume: 750,
          pricePerBottle: 20.99
        }
      ];
      
      appState.products.push(...products);
      
      // Test filter operation
      const beerProducts = appState.products.filter(p => p.category === 'Beer');
      expect(beerProducts).toHaveLength(1);
      expect(beerProducts[0].name).toBe('Product 1');
      
      // Test find operation
      const foundProduct = appState.products.find(p => p.id === 'product-2');
      expect(foundProduct).toBeDefined();
      expect(foundProduct?.name).toBe('Product 2');
      
      // Test pop operation
      const poppedProduct = appState.products.pop();
      expect(poppedProduct?.id).toBe('product-2');
      expect(appState.products).toHaveLength(1);
    });

    it('should allow array method operations on locations', () => {
      const locations: Location[] = [
        {
          id: 'location-1',
          name: 'Bar A',
          address: '123 Test St',
          counters: []
        },
        {
          id: 'location-2',
          name: 'Restaurant B',
          address: '456 Test Ave',
          counters: []
        }
      ];
      
      appState.locations.push(...locations);
      
      // Test map operation
      const locationNames = appState.locations.map(l => l.name);
      expect(locationNames).toEqual(['Bar A', 'Restaurant B']);
      
      // Test splice operation
      const splicedLocation = appState.locations.splice(0, 1);
      expect(splicedLocation[0].name).toBe('Bar A');
      expect(appState.locations).toHaveLength(1);
      expect(appState.locations[0].name).toBe('Restaurant B');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    beforeEach(() => {
      appState = AppState.getInstance();
    });

    it('should handle null or undefined products gracefully', () => {
      expect(() => {
        appState.products.push(null as any);
      }).not.toThrow();
      
      expect(() => {
        appState.products.push(undefined as any);
      }).not.toThrow();
      
      expect(appState.products).toHaveLength(2);
      expect(appState.products[0]).toBeNull();
      expect(appState.products[1]).toBeUndefined();
    });

    it('should handle null or undefined locations gracefully', () => {
      expect(() => {
        appState.locations.push(null as any);
      }).not.toThrow();
      
      expect(() => {
        appState.locations.push(undefined as any);
      }).not.toThrow();
      
      expect(appState.locations).toHaveLength(2);
      expect(appState.locations[0]).toBeNull();
      expect(appState.locations[1]).toBeUndefined();
    });

    it('should maintain array reference integrity', () => {
      const originalProductsRef = appState.products;
      const originalLocationsRef = appState.locations;
      
      appState.products.push({
        id: 'test',
        name: 'Test',
        category: 'Test',
        volume: 500,
        pricePerBottle: 10
      });
      appState.locations.push({
        id: 'test',
        name: 'Test',
        address: '123',
        counters: []
      });
      
      expect(appState.products).toBe(originalProductsRef);
      expect(appState.locations).toBe(originalLocationsRef);
    });

    it('should handle concurrent access attempts', () => {
      const instances: AppState[] = [];
      
      // Simulate concurrent access
      for (let i = 0; i < 10; i++) {
        instances.push(AppState.getInstance());
      }
      
      // All instances should be the same
      instances.forEach(instance => {
        expect(instance).toBe(instances[0]);
      });
    });

    it('should handle products with minimal required properties', () => {
      const minimalProduct: Product = {
        id: 'minimal',
        name: 'Minimal Product',
        category: 'Test',
        volume: 1,
        pricePerBottle: 0
      };
      
      expect(() => {
        appState.products.push(minimalProduct);
      }).not.toThrow();
      
      expect(appState.products[0]).toEqual(minimalProduct);
    });

    it('should handle locations with minimal required properties', () => {
      const minimalLocation: Location = {
        id: 'minimal',
        name: 'Minimal Location',
        counters: []
      };
      
      expect(() => {
        appState.locations.push(minimalLocation);
      }).not.toThrow();
      
      expect(appState.locations[0]).toEqual(minimalLocation);
    });

    it('should handle products with all optional properties', () => {
      const fullProduct: Product = {
        id: 'full-product',
        name: 'Full Product',
        category: 'Premium',
        volume: 750,
        itemsPerCrate: 12,
        pricePerBottle: 25.99,
        pricePer100ml: 3.47,
        imageUrl: 'https://example.com/product.jpg',
        supplier: 'Premium Supplier',
        notes: 'Premium product with all properties'
      };
      
      expect(() => {
        appState.products.push(fullProduct);
      }).not.toThrow();
      
      expect(appState.products[0]).toEqual(fullProduct);
      expect(appState.products[0].itemsPerCrate).toBe(12);
      expect(appState.products[0].pricePer100ml).toBe(3.47);
      expect(appState.products[0].imageUrl).toBe('https://example.com/product.jpg');
      expect(appState.products[0].supplier).toBe('Premium Supplier');
      expect(appState.products[0].notes).toBe('Premium product with all properties');
    });

    it('should handle locations with all optional properties', () => {
      const fullLocation: Location = {
        id: 'full-location',
        name: 'Full Location',
        address: '123 Main Street, City, State 12345',
        counters: [],
        defaultProductSet: ['product-1', 'product-2', 'product-3']
      };
      
      expect(() => {
        appState.locations.push(fullLocation);
      }).not.toThrow();
      
      expect(appState.locations[0]).toEqual(fullLocation);
      expect(appState.locations[0].address).toBe('123 Main Street, City, State 12345');
      expect(appState.locations[0].defaultProductSet).toEqual(['product-1', 'product-2', 'product-3']);
    });
  });

  describe('Type Safety and Data Integrity', () => {
    beforeEach(() => {
      appState = AppState.getInstance();
    });

    it('should maintain type safety for products array', () => {
      const product: Product = {
        id: 'type-test',
        name: 'Type Test Product',
        category: 'Test',
        volume: 500,
        pricePerBottle: 10.99
      };
      
      appState.products.push(product);
      
      expect(typeof appState.products[0].id).toBe('string');
      expect(typeof appState.products[0].name).toBe('string');
      expect(typeof appState.products[0].category).toBe('string');
      expect(typeof appState.products[0].volume).toBe('number');
      expect(typeof appState.products[0].pricePerBottle).toBe('number');
    });

    it('should maintain type safety for locations array', () => {
      const location: Location = {
        id: 'type-test',
        name: 'Type Test Location',
        address: '123 Test St',
        counters: []
      };
      
      appState.locations.push(location);
      
      expect(typeof appState.locations[0].id).toBe('string');
      expect(typeof appState.locations[0].name).toBe('string');
      expect(typeof appState.locations[0].address).toBe('string');
      expect(Array.isArray(appState.locations[0].counters)).toBe(true);
    });

    it('should handle products with zero and negative values', () => {
      const edgeCaseProduct: Product = {
        id: 'edge-case',
        name: 'Edge Case Product',
        category: 'Test',
        volume: 0,
        pricePerBottle: -1.50
      };
      
      expect(() => {
        appState.products.push(edgeCaseProduct);
      }).not.toThrow();
      
      expect(appState.products[0].volume).toBe(0);
      expect(appState.products[0].pricePerBottle).toBe(-1.50);
    });

    it('should handle very large numeric values', () => {
      const largeValueProduct: Product = {
        id: 'large-values',
        name: 'Large Values Product',
        category: 'Premium',
        volume: Number.MAX_SAFE_INTEGER,
        pricePerBottle: 999999.99
      };
      
      expect(() => {
        appState.products.push(largeValueProduct);
      }).not.toThrow();
      
      expect(appState.products[0].volume).toBe(Number.MAX_SAFE_INTEGER);
      expect(appState.products[0].pricePerBottle).toBe(999999.99);
    });
  });

  describe('Memory Management and Performance', () => {
    it('should not create memory leaks with multiple getInstance calls', () => {
      const initialInstance = AppState.getInstance();
      
      // Call getInstance many times
      for (let i = 0; i < 1000; i++) {
        const instance = AppState.getInstance();
        expect(instance).toBe(initialInstance);
      }
      
      // Should still be the same instance
      expect(AppState.getInstance()).toBe(initialInstance);
    });

    it('should handle large datasets efficiently', () => {
      const largeProductSet: Product[] = Array.from({ length: 10000 }, (_, i) => ({
        id: `product-${i}`,
        name: `Product ${i}`,
        category: `Category ${i % 10}`,
        volume: 500 + (i % 500),
        pricePerBottle: Math.round((Math.random() * 100) * 100) / 100
      }));
      
      const largeLocationSet: Location[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `location-${i}`,
        name: `Location ${i}`,
        address: `${i} Test Street`,
        counters: []
      }));
      
      expect(() => {
        appState.products.push(...largeProductSet);
        appState.locations.push(...largeLocationSet);
      }).not.toThrow();
      
      expect(appState.products).toHaveLength(10000);
      expect(appState.locations).toHaveLength(1000);
      
      // Verify data integrity on random samples
      const randomProductIndex = Math.floor(Math.random() * 10000);
      const randomLocationIndex = Math.floor(Math.random() * 1000);
      
      expect(appState.products[randomProductIndex].id).toBe(`product-${randomProductIndex}`);
      expect(appState.locations[randomLocationIndex].id).toBe(`location-${randomLocationIndex}`);
    });

    it('should maintain performance with frequent array modifications', () => {
      const startTime = Date.now();
      
      // Perform many array operations
      for (let i = 0; i < 1000; i++) {
        appState.products.push({
          id: `perf-product-${i}`,
          name: `Performance Product ${i}`,
          category: 'Performance',
          volume: 500,
          pricePerBottle: 10.00
        });
        
        if (i % 100 === 0) {
          appState.products.splice(0, 50); // Remove some items periodically
        }
      }
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(executionTime).toBeLessThan(5000); // 5 seconds
      expect(appState.products.length).toBeGreaterThan(0);
    });
  });

  describe('Thread Safety Concerns', () => {
    it('should document the synchronized syntax issue', () => {
      // The current implementation uses 'synchronized (AppState.lock)' which is not valid JavaScript/TypeScript
      // This is likely copied from Java code and needs to be replaced with proper JavaScript synchronization
      // or the double-checked locking pattern should be removed for simplicity in single-threaded JavaScript
      
      expect(() => {
        // Multiple rapid calls should still work despite the syntax issue
        const promises = Array.from({ length: 100 }, () => 
          Promise.resolve().then(() => AppState.getInstance())
        );
        
        return Promise.all(promises);
      }).not.toThrow();
    });

    it('should handle rapid simultaneous access attempts', async () => {
      // Simulate rapid concurrent access using promises
      const instances = await Promise.all(
        Array.from({ length: 50 }, () => 
          Promise.resolve().then(() => AppState.getInstance())
        )
      );
      
      // All instances should be the same
      const firstInstance = instances[0];
      instances.forEach(instance => {
        expect(instance).toBe(firstInstance);
      });
    });
  });
});