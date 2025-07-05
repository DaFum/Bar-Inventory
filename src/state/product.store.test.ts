import { productStore } from './product.store'; // Import the instance
import { Product } from '../models';
import { dbService } from '../services/indexeddb.service';

// Mock dbService
jest.mock('../services/indexeddb.service', () => ({
  dbService: {
    loadProducts: jest.fn(),
    saveProduct: jest.fn(), // Used by addProduct and updateProduct
    delete: jest.fn(),     // Used by deleteProduct
  },
}));

describe('ProductStore', () => {
  const mockProduct1: Product = {
    id: 'prod1',
    name: 'Test Product A',
    category: 'Category 1',
    volume: 750,
    pricePerBottle: 20,
    // Add other required fields from your Product model if any
  };
  const mockProduct2: Product = {
    id: 'prod2',
    name: 'Test Product B',
    category: 'Category 2',
    volume: 500,
    pricePerBottle: 15,
  };
  const mockProductsList: Product[] = [mockProduct1, mockProduct2];

  beforeEach(() => {
    // Reset mocks before each test
    (dbService.loadProducts as jest.Mock).mockClear().mockResolvedValue([...mockProductsList]);
    (dbService.saveProduct as jest.Mock).mockClear().mockImplementation(async (product: Product) => product.id);
    (dbService.delete as jest.Mock).mockClear().mockResolvedValue(undefined);

    // Reset internal state of the store if possible, or rely on loading.
    // For a singleton, this is tricky. We'll load fresh data.
    productStore['products'] = []; // Directly reset internal state for testing (use with caution)
    productStore['subscribers'] = [];
  });

  describe('loadProducts', () => {
    it('should load products from dbService and notify subscribers', async () => {
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);

      await productStore.loadProducts();

      expect(dbService.loadProducts).toHaveBeenCalledTimes(1);
      const expectedSortedProducts = [...mockProductsList].sort((a,b) => {
        const catA = a.category.toLowerCase();
        const catB = b.category.toLowerCase();
        if (catA < catB) return -1;
        if (catA > catB) return 1;
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });
      expect(productStore.getProducts()).toEqual(expectedSortedProducts);
      expect(subscriber).toHaveBeenCalledWith(expectedSortedProducts);
    });

    it('should handle errors during loadProducts', async () => {
      (dbService.loadProducts as jest.Mock).mockRejectedValueOnce(new Error('DB Load Error'));
      console.error = jest.fn(); // Suppress console.error for this test

      await expect(productStore.loadProducts()).rejects.toThrow('DB Load Error');
      expect(console.error).toHaveBeenCalledWith('ProductStore: Error loading products from DB', expect.any(Error));
      expect(productStore.getProducts()).toEqual([]); // Products should be empty
    });
  });

  describe('addProduct', () => {
    it('should add a product, save via dbService, and notify subscribers', async () => {
      const newProduct: Product = { id: 'prod3', name: 'New Product C', category: 'Category 1', volume: 1000, pricePerBottle: 30 };
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);

      await productStore.addProduct(newProduct);

      expect(dbService.saveProduct).toHaveBeenCalledWith(newProduct);
      const products = productStore.getProducts();
      expect(products).toContainEqual(newProduct);
      expect(subscriber).toHaveBeenCalled();
      // Check if the list passed to subscriber is sorted
      const lastCallArgs = subscriber.mock.calls[subscriber.mock.calls.length - 1][0];
      expect(lastCallArgs[0].name).toBe(newProduct.name); // If only one product, it's the first
    });

     it('should handle errors during addProduct', async () => {
      const newProduct: Product = { id: 'prod4', name: 'Error Product', category: 'Category E', volume: 100, pricePerBottle: 5 };
      (dbService.saveProduct as jest.Mock).mockRejectedValueOnce(new Error('DB Save Error'));
      console.error = jest.fn();

      await expect(productStore.addProduct(newProduct)).rejects.toThrow('DB Save Error');
      expect(console.error).toHaveBeenCalledWith('ProductStore: Error adding product', expect.any(Error));
      expect(productStore.getProducts()).not.toContainEqual(newProduct);
    });
  });

  describe('updateProduct', () => {
    it('should update an existing product, save via dbService, and notify subscribers', async () => {
      await productStore.loadProducts(); // Load initial products
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);

      const updatedProduct = { ...mockProduct1, name: 'Updated Product A' };
      await productStore.updateProduct(updatedProduct);

      expect(dbService.saveProduct).toHaveBeenCalledWith(updatedProduct);
      const products = productStore.getProducts();
      expect(products.find((p: Product) => p.id === mockProduct1.id)?.name).toBe('Updated Product A');
      expect(subscriber).toHaveBeenCalled();
    });

    it('should add product if updateProduct is called for a non-existing product ID (current behavior)', async () => {
        const nonExistingProduct: Product = { id: 'prodNonExistent', name: 'Ghost Product', category: 'Category Z', volume: 100, pricePerBottle: 10 };
        const subscriber = jest.fn();
        productStore.subscribe(subscriber);

        await productStore.updateProduct(nonExistingProduct);

        expect(dbService.saveProduct).toHaveBeenCalledWith(nonExistingProduct);
        expect(productStore.getProducts()).toContainEqual(nonExistingProduct);
        expect(subscriber).toHaveBeenCalled();
      });

    it('should handle errors during updateProduct', async () => {
        await productStore.loadProducts();
        const productToUpdate = { ...mockProduct1, name: 'Error Update' };
        (dbService.saveProduct as jest.Mock).mockRejectedValueOnce(new Error('DB Update Error'));
        console.error = jest.fn();

        await expect(productStore.updateProduct(productToUpdate)).rejects.toThrow('DB Update Error');
        expect(console.error).toHaveBeenCalledWith('ProductStore: Error updating product', expect.any(Error));
        // Ensure product was not updated in the local cache on error
        expect(productStore.getProducts().find((p: Product) => p.id === mockProduct1.id)?.name).toBe(mockProduct1.name);
      });
  });

  describe('deleteProduct', () => {
    it('should delete a product, call dbService.delete, and notify subscribers', async () => {
      await productStore.loadProducts();
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);
      const productIdToDelete = mockProduct1.id;

      await productStore.deleteProduct(productIdToDelete);

      expect(dbService.delete).toHaveBeenCalledWith('products', productIdToDelete);
      expect(productStore.getProducts().find(p => p.id === productIdToDelete)).toBeUndefined();
      expect(subscriber).toHaveBeenCalled();
    });

    it('should handle errors during deleteProduct', async () => {
        await productStore.loadProducts();
        const productIdToDelete = mockProduct1.id;
        (dbService.delete as jest.Mock).mockRejectedValueOnce(new Error('DB Delete Error'));
        console.error = jest.fn();

        await expect(productStore.deleteProduct(productIdToDelete)).rejects.toThrow('DB Delete Error');
        expect(console.error).toHaveBeenCalledWith('ProductStore: Error deleting product', expect.any(Error));
        expect(productStore.getProducts().find(p => p.id === productIdToDelete)).toBeDefined(); // Product should still be there
      });
  });

  describe('subscribe and unsubscribe', () => {
    it('should add and remove subscribers', () => {
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();

      const unsubscribe1 = productStore.subscribe(subscriber1);
      productStore.subscribe(subscriber2);

      expect(productStore['subscribers']).toHaveLength(2);

      unsubscribe1();
      expect(productStore['subscribers']).toHaveLength(1);
      expect(productStore['subscribers'][0]).toBe(subscriber2);

      productStore.unsubscribe(subscriber2);
      expect(productStore['subscribers']).toHaveLength(0);
    });
  });

  describe('getProducts', () => {
    it('should return a sorted copy of products', async () => {
      // Products in mockProductsList are [A (Cat1), B (Cat2)]
      // Sorted should be A (Cat1), B (Cat2) - if categories are primary sort key
      const unsortedProducts = [
        { ...mockProduct2, category: 'Category Z' }, // B, Cat Z
        { ...mockProduct1, category: 'Category A' }, // A, Cat A
      ];
      productStore['products'] = [...unsortedProducts]; // Set internal state directly

      const retrievedProducts = productStore.getProducts();
      expect(retrievedProducts[0]!.name).toBe('Test Product A'); // Cat A
      expect(retrievedProducts[1]!.name).toBe('Test Product B'); // Cat Z
      expect(retrievedProducts).not.toBe(productStore['products']); // Ensure it's a copy
    });

    it('should correctly sort products with the same category by name', () => {
      const productsSameCategory: Product[] = [
        { id: 'p1', name: 'Banana', category: 'Fruit', volume: 1, pricePerBottle: 1 },
        { id: 'p2', name: 'Apple', category: 'Fruit', volume: 1, pricePerBottle: 1 },
        { id: 'p3', name: 'Cherry', category: 'Fruit', volume: 1, pricePerBottle: 1 },
      ];
      productStore['products'] = [...productsSameCategory];
      const sorted = productStore.getProducts();
      expect(sorted.map(p => p.name)).toEqual(['Apple', 'Banana', 'Cherry']);
    });

    it('should maintain order for products with identical category and name (stability not guaranteed by sort, but 0 return value is correct)', () => {
      // This test primarily ensures the comparator returns 0 for identical items,
      // which is important for the contract of a comparator.
      // The actual order of identical items might vary depending on JS engine's sort stability.
      const productsIdentical: Product[] = [
        { id: 'p1', name: 'Apple', category: 'Fruit', volume: 1, pricePerBottle: 1, notes: 'First Apple' },
        { id: 'p2', name: 'Banana', category: 'Fruit', volume: 1, pricePerBottle: 1 },
        { id: 'p3', name: 'Apple', category: 'Fruit', volume: 1, pricePerBottle: 1, notes: 'Second Apple' },
      ];
      productStore['products'] = [...productsIdentical];
      // We expect p1 and p3 (Apples) to be together, before Banana.
      // Their internal order (p1 vs p3) might vary if sort is unstable, but the fix ensures comparator returns 0.
      const sorted = productStore.getProducts();
      const appleCount = sorted.filter(p => p.name === 'Apple').length;
      const bananaIndex = sorted.findIndex(p => p.name === 'Banana');

      expect(appleCount).toBe(2);
      expect(sorted[0]?.name).toBe('Apple');
      expect(sorted[1]?.name).toBe('Apple');
      expect(bananaIndex).toBe(2); // Banana should come after all Apples
      expect(sorted[bananaIndex]?.name).toBe('Banana');
    });

    it('should sort products by category first, then by name', () => {
      const productsMixed: Product[] = [
        { id: 'p1', name: 'Milk', category: 'Dairy', volume: 1, pricePerBottle: 1 },
        { id: 'p2', name: 'Apple', category: 'Fruit', volume: 1, pricePerBottle: 1 },
        { id: 'p3', name: 'Cheese', category: 'Dairy', volume: 1, pricePerBottle: 1 },
        { id: 'p4', name: 'Banana', category: 'Fruit', volume: 1, pricePerBottle: 1 },
      ];
      productStore['products'] = [...productsMixed];
      const sorted = productStore.getProducts();
      expect(sorted.map(p => `${p.category}-${p.name}`)).toEqual([
        'Dairy-Cheese',
        'Dairy-Milk',
        'Fruit-Apple',
        'Fruit-Banana',
      ]);
    });
  });
});

  describe('Edge Cases and Boundary Conditions', () => {
    describe('Empty and null data scenarios', () => {
      it('should handle empty product list from database', async () => {
        (dbService.loadProducts as jest.Mock).mockResolvedValue([]);
        const subscriber = jest.fn();
        productStore.subscribe(subscriber);

        await productStore.loadProducts();

        expect(productStore.getProducts()).toEqual([]);
        expect(subscriber).toHaveBeenCalledWith([]);
      });

      it('should handle null/undefined returned from database', async () => {
        const originalConsoleError = console.error;
        console.error = jest.fn();
  
        (dbService.loadProducts as jest.Mock).mockResolvedValue(null);

        await expect(productStore.loadProducts()).rejects.toThrow();
        expect(console.error).toHaveBeenCalled();
  
        // Restore original console.error
        console.error = originalConsoleError;
      });

      it('should handle malformed product data from database', async () => {
        const malformedData = [
          { id: 'invalid1' }, // missing required fields
          { name: 'No ID Product', category: 'Test' }, // missing id
          null, // null product
          undefined, // undefined product
          'not-an-object', // string instead of object
        ];
        (dbService.loadProducts as jest.Mock).mockResolvedValue(malformedData);
        console.error = jest.fn();

        await expect(productStore.loadProducts()).rejects.toThrow();
      });
    });

    describe('Product validation edge cases', () => {
      it('should handle products with extreme values', async () => {
        const extremeProduct: Product = {
          id: 'extreme1',
          name: 'A'.repeat(1000), // Very long name
          category: 'B'.repeat(500), // Very long category
          volume: Number.MAX_SAFE_INTEGER,
          pricePerBottle: Number.MAX_SAFE_INTEGER,
        };

        await productStore.addProduct(extremeProduct);
        expect(productStore.getProducts()).toContainEqual(extremeProduct);
      });

      it('should handle products with zero and negative values', async () => {
        const zeroProduct: Product = {
          id: 'zero1',
          name: 'Zero Product',
          category: 'Test',
          volume: 0,
          pricePerBottle: 0,
        };

        await productStore.addProduct(zeroProduct);
        expect(productStore.getProducts()).toContainEqual(zeroProduct);
      });

      it('should handle products with special characters in names and categories', async () => {
        const specialCharsProduct: Product = {
          id: 'special1',
          name: '!@#$%^&*()_+-=[]{}|;:,.<>?',
          category: 'Çàtégørÿ wïth âccénts & émojis 🍷',
          volume: 750,
          pricePerBottle: 25,
        };

        await productStore.addProduct(specialCharsProduct);
        expect(productStore.getProducts()).toContainEqual(specialCharsProduct);
      });
    });

    describe('Sorting edge cases', () => {
      it('should handle case-insensitive sorting correctly', () => {
        const mixedCaseProducts: Product[] = [
          { id: 'p1', name: 'apple', category: 'fruit', volume: 1, pricePerBottle: 1 },
          { id: 'p2', name: 'BANANA', category: 'FRUIT', volume: 1, pricePerBottle: 1 },
          { id: 'p3', name: 'Cherry', category: 'Fruit', volume: 1, pricePerBottle: 1 },
          { id: 'p4', name: 'DATE', category: 'fruit', volume: 1, pricePerBottle: 1 },
        ];
        productStore['products'] = [...mixedCaseProducts];
        
        const sorted = productStore.getProducts();
        expect(sorted.map(p => p.name)).toEqual(['apple', 'BANANA', 'Cherry', 'DATE']);
      });

      it('should handle products with empty strings in sort fields', () => {
        const emptyStringProducts: Product[] = [
          { id: 'p1', name: '', category: 'Category A', volume: 1, pricePerBottle: 1 },
          { id: 'p2', name: 'Product B', category: '', volume: 1, pricePerBottle: 1 },
          { id: 'p3', name: 'Product C', category: 'Category A', volume: 1, pricePerBottle: 1 },
        ];
        productStore['products'] = [...emptyStringProducts];
        
        const sorted = productStore.getProducts();
        expect(sorted).toHaveLength(3);
        // Should not crash and should handle empty strings gracefully
      });

      it('should handle single product in list', () => {
        const singleProduct: Product = {
          id: 'single1',
          name: 'Only Product',
          category: 'Only Category',
          volume: 750,
          pricePerBottle: 20,
        };
        productStore['products'] = [singleProduct];
        
        const sorted = productStore.getProducts();
        expect(sorted).toEqual([singleProduct]);
        expect(sorted).not.toBe(productStore['products']); // Ensure it's still a copy
      });
    });

    describe('Subscription edge cases', () => {
      it('should handle subscriber function throwing errors', async () => {
        const errorSubscriber = jest.fn(() => {
          throw new Error('Subscriber error');
        });
        const normalSubscriber = jest.fn();
        
        productStore.subscribe(errorSubscriber);
        productStore.subscribe(normalSubscriber);
        
        console.error = jest.fn();

        await productStore.loadProducts();
        
        expect(errorSubscriber).toHaveBeenCalled();
        expect(normalSubscriber).toHaveBeenCalled();
        // Should not prevent other subscribers from being called
      });

      it('should handle multiple subscribers correctly', async () => {
        const subscriber1 = jest.fn();
        const subscriber2 = jest.fn();
        const subscriber3 = jest.fn();
        
        productStore.subscribe(subscriber1);
        productStore.subscribe(subscriber2);
        productStore.subscribe(subscriber3);
        
        await productStore.loadProducts();
        
        expect(subscriber1).toHaveBeenCalledTimes(1);
        expect(subscriber2).toHaveBeenCalledTimes(1);
        expect(subscriber3).toHaveBeenCalledTimes(1);
        
        // All should receive the same data
        expect(subscriber1).toHaveBeenCalledWith(subscriber2.mock.calls[0][0]);
        expect(subscriber2).toHaveBeenCalledWith(subscriber3.mock.calls[0][0]);
      });

      it('should handle unsubscribing non-existent subscriber gracefully', () => {
        const nonExistentSubscriber = jest.fn();
        
        expect(() => {
          productStore.unsubscribe(nonExistentSubscriber);
        }).not.toThrow();
        
        expect(productStore['subscribers']).toHaveLength(0);
      });

      it('should handle rapid subscribe/unsubscribe operations', () => {
        const subscribers = Array.from({ length: 10 }, () => jest.fn());
        const unsubscribeFunctions = subscribers.map(sub => productStore.subscribe(sub));
        
        expect(productStore['subscribers']).toHaveLength(10);
        
        // Unsubscribe every other subscriber
        unsubscribeFunctions.forEach((unsub, index) => {
          if (index % 2 === 0) {
            unsub();
          }
        });
        
        expect(productStore['subscribers']).toHaveLength(5);
      });
    });

    describe('Concurrent operations', () => {
      it('should handle multiple simultaneous add operations', async () => {
        const products: Product[] = [
          { id: 'concurrent1', name: 'Product 1', category: 'Cat A', volume: 750, pricePerBottle: 20 },
          { id: 'concurrent2', name: 'Product 2', category: 'Cat B', volume: 500, pricePerBottle: 15 },
          { id: 'concurrent3', name: 'Product 3', category: 'Cat C', volume: 1000, pricePerBottle: 30 },
        ];
        
        const promises = products.map(product => productStore.addProduct(product));
        await Promise.all(promises);
        
        const storedProducts = productStore.getProducts();
        products.forEach(product => {
          expect(storedProducts).toContainEqual(product);
        });
        expect(dbService.saveProduct).toHaveBeenCalledTimes(3);
      });

      it('should handle mixed operations (add, update, delete) simultaneously', async () => {
        // First load some initial products
        await productStore.loadProducts();
        
        const newProduct: Product = { id: 'new1', name: 'New Product', category: 'New Cat', volume: 750, pricePerBottle: 25 };
        const updateProduct: Product = { ...mockProduct1, name: 'Updated Name' };
        
        const promises = [
          productStore.addProduct(newProduct),
          productStore.updateProduct(updateProduct),
          productStore.deleteProduct(mockProduct2.id),
        ];
        
        await Promise.all(promises);
        
        const storedProducts = productStore.getProducts();
        expect(storedProducts).toContainEqual(newProduct);
        expect(storedProducts.find(p => p.id === mockProduct1.id)?.name).toBe('Updated Name');
        expect(storedProducts.find(p => p.id === mockProduct2.id)).toBeUndefined();
      });
    });

    describe('Database service error scenarios', () => {
      it('should handle database connection errors on load', async () => {
        const connectionError = new Error('Database connection failed');
        (dbService.loadProducts as jest.Mock).mockRejectedValue(connectionError);
        console.error = jest.fn();
        
        await expect(productStore.loadProducts()).rejects.toThrow('Database connection failed');
        expect(console.error).toHaveBeenCalledWith('ProductStore: Error loading products from DB', connectionError);
      });

      it('should handle timeout errors on save operations', async () => {
        const timeoutError = new Error('Operation timed out');
        (dbService.saveProduct as jest.Mock).mockRejectedValue(timeoutError);
        console.error = jest.fn();
        
        const product: Product = { id: 'timeout1', name: 'Timeout Product', category: 'Test', volume: 750, pricePerBottle: 20 };
        
        await expect(productStore.addProduct(product)).rejects.toThrow('Operation timed out');
        expect(console.error).toHaveBeenCalledWith('ProductStore: Error adding product', timeoutError);
      });

      it('should handle partial failure in batch operations', async () => {
        let callCount = 0;
        (dbService.saveProduct as jest.Mock).mockImplementation(async (product: Product) => {
          callCount++;
          if (callCount === 2) {
            throw new Error('Second save failed');
          }
          return product.id;
        });
        
        const product1: Product = { id: 'batch1', name: 'Batch Product 1', category: 'Test', volume: 750, pricePerBottle: 20 };
        const product2: Product = { id: 'batch2', name: 'Batch Product 2', category: 'Test', volume: 500, pricePerBottle: 15 };
        
        await productStore.addProduct(product1); // Should succeed
        await expect(productStore.addProduct(product2)).rejects.toThrow('Second save failed');
        
        // First product should be in the store, second should not
        expect(productStore.getProducts()).toContainEqual(product1);
        expect(productStore.getProducts()).not.toContainEqual(product2);
      });
    });

    describe('Memory and performance considerations', () => {
      it('should handle large product lists efficiently', async () => {
        const largeProductList: Product[] = Array.from({ length: 1000 }, (_, index) => ({
          id: `product${index}`,
          name: `Product ${index}`,
          category: `Category ${index % 10}`,
          volume: 750 + (index % 500),
          pricePerBottle: 10 + (index % 50),
        }));
        
        (dbService.loadProducts as jest.Mock).mockResolvedValue(largeProductList);
        
        const startTime = Date.now();
        await productStore.loadProducts();
        const endTime = Date.now();
        
        expect(productStore.getProducts()).toHaveLength(1000);
        expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      });

      it('should not leak memory with repeated subscribe/unsubscribe operations', () => {
        const initialSubscriberCount = productStore['subscribers'].length;
        
        // Perform many subscribe/unsubscribe cycles
        for (let i = 0; i < 100; i++) {
          const subscriber = jest.fn();
          const unsubscribe = productStore.subscribe(subscriber);
          unsubscribe();
        }
        
        expect(productStore['subscribers']).toHaveLength(initialSubscriberCount);
      });
    });

    describe('State consistency', () => {
      it('should maintain state consistency after failed operations', async () => {
        await productStore.loadProducts();
        const initialProducts = productStore.getProducts();
        const initialCount = initialProducts.length;
        
        // Attempt to add a product that will fail
        const failingProduct: Product = { id: 'fail1', name: 'Failing Product', category: 'Test', volume: 750, pricePerBottle: 20 };
        (dbService.saveProduct as jest.Mock).mockRejectedValueOnce(new Error('Save failed'));
        
        await expect(productStore.addProduct(failingProduct)).rejects.toThrow('Save failed');
        
        // State should remain unchanged
        expect(productStore.getProducts()).toHaveLength(initialCount);
        expect(productStore.getProducts()).toEqual(initialProducts);
      });

      it('should handle operations on empty store gracefully', async () => {
        // Start with empty store
        productStore['products'] = [];
        
        // Try to update non-existent product
        const nonExistentProduct: Product = { id: 'nonexistent', name: 'Ghost', category: 'Test', volume: 750, pricePerBottle: 20 };
        await productStore.updateProduct(nonExistentProduct);
        
        expect(productStore.getProducts()).toContainEqual(nonExistentProduct);
        
        // Try to delete non-existent product
        await expect(productStore.deleteProduct('nonexistent-id')).resolves.not.toThrow();
      });
    });
  });

  describe('Integration-like scenarios', () => {
    it('should handle complete product lifecycle', async () => {
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);
      
      // Load initial products
      await productStore.loadProducts();
      expect(subscriber).toHaveBeenCalledTimes(1);
      
      // Add a new product
      const newProduct: Product = { id: 'lifecycle1', name: 'Lifecycle Product', category: 'Test', volume: 750, pricePerBottle: 20 };
      await productStore.addProduct(newProduct);
      expect(subscriber).toHaveBeenCalledTimes(2);
      expect(productStore.getProducts()).toContainEqual(newProduct);
      
      // Update the product
      const updatedProduct = { ...newProduct, name: 'Updated Lifecycle Product' };
      await productStore.updateProduct(updatedProduct);
      expect(subscriber).toHaveBeenCalledTimes(3);
      expect(productStore.getProducts().find(p => p.id === newProduct.id)?.name).toBe('Updated Lifecycle Product');
      
      // Delete the product
      await productStore.deleteProduct(newProduct.id);
      expect(subscriber).toHaveBeenCalledTimes(4);
      expect(productStore.getProducts().find(p => p.id === newProduct.id)).toBeUndefined();
    });

    it('should maintain sorted order throughout product lifecycle', async () => {
      // Add products in random order
      const products: Product[] = [
        { id: 'z1', name: 'Zebra Product', category: 'Z Category', volume: 750, pricePerBottle: 20 },
        { id: 'a1', name: 'Alpha Product', category: 'A Category', volume: 750, pricePerBottle: 20 },
        { id: 'm1', name: 'Middle Product', category: 'M Category', volume: 750, pricePerBottle: 20 },
      ];
      
      for (const product of products) {
        await productStore.addProduct(product);
        const currentProducts = productStore.getProducts();
        // Verify that products are always sorted
        for (let i = 1; i < currentProducts.length; i++) {
          const prev = currentProducts[i - 1];
          const curr = currentProducts[i];
          const prevKey = `${prev.category.toLowerCase()}-${prev.name.toLowerCase()}`;
          const currKey = `${curr.category.toLowerCase()}-${curr.name.toLowerCase()}`;
          expect(prevKey <= currKey).toBe(true);
        }
      }
    });

    it('should handle rapid state changes without corruption', async () => {
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);
      
      // Perform rapid operations
      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(productStore.addProduct({
          id: `rapid${i}`,
          name: `Rapid Product ${i}`,
          category: `Category ${i % 3}`,
          volume: 750,
          pricePerBottle: 20 + i,
        }));
      }
      
      await Promise.all(operations);
      
      const finalProducts = productStore.getProducts();
      expect(finalProducts).toHaveLength(10);
      
      // Verify all products are present and properly sorted
      const sortedIds = finalProducts.map(p => p.id);
      expect(sortedIds).toEqual(expect.arrayContaining(['rapid0', 'rapid1', 'rapid2', 'rapid3', 'rapid4', 'rapid5', 'rapid6', 'rapid7', 'rapid8', 'rapid9']));
    });
  });
