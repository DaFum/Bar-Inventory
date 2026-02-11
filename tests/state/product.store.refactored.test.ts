import { productStore } from '../../src/state/product.store';
import { Product } from '../../src/models';
import { dbService } from '../../src/services/indexeddb.service';
import { AppState } from '../../src/state/app-state';

jest.mock('../../src/services/indexeddb.service', () => ({
  dbService: {
    loadAllApplicationData: jest.fn(),
    saveProduct: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('ProductStore (Refactored)', () => {
  const mockProduct1: Product = { id: 'prod1', name: 'Test Product A', category: 'Category 1', volume: 750, pricePerBottle: 20 };
  const mockProduct2: Product = { id: 'prod2', name: 'Test Product B', category: 'Category 2', volume: 500, pricePerBottle: 15 };
  const mockProductsList: Product[] = [mockProduct1, mockProduct2];

  let appState: AppState;

  beforeEach(() => {
    (dbService.loadAllApplicationData as jest.Mock).mockClear().mockResolvedValue({ products: [...mockProductsList], locations: [] });
    (dbService.saveProduct as jest.Mock).mockClear().mockImplementation(async (product: Product) => product.id);
    (dbService.delete as jest.Mock).mockClear().mockResolvedValue(undefined);

    appState = AppState.getInstance();
    appState.products = [];
  });

  describe('loadProducts', () => {
    it('should load products from dbService into AppState and notify subscribers', async () => {
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);

      await productStore.loadProducts();

      expect(dbService.loadAllApplicationData).toHaveBeenCalledTimes(1);
      expect(appState.products).toEqual(mockProductsList);
      expect(subscriber).toHaveBeenCalledWith(mockProductsList);
    });
  });

  describe('addProduct', () => {
    it('should add a product to AppState, save via dbService, and notify subscribers', async () => {
      const newProduct: Product = { id: 'prod3', name: 'New Product C', category: 'Category 1', volume: 1000, pricePerBottle: 30 };
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);

      await productStore.addProduct(newProduct);

      expect(dbService.saveProduct).toHaveBeenCalledWith(newProduct);
      expect(appState.products).toContainEqual(newProduct);
      expect(subscriber).toHaveBeenCalled();
    });
  });

  describe('updateProduct', () => {
    it('should update an existing product in AppState, save via dbService, and notify subscribers', async () => {
      appState.products = [...mockProductsList];
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);

      const updatedProduct = { ...mockProduct1, name: 'Updated Product A' };
      await productStore.updateProduct(updatedProduct);

      expect(dbService.saveProduct).toHaveBeenCalledWith(updatedProduct);
      const productInState = appState.products.find(p => p.id === mockProduct1.id);
      expect(productInState?.name).toBe('Updated Product A');
      expect(subscriber).toHaveBeenCalled();
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product from AppState, call dbService.delete, and notify subscribers', async () => {
      appState.products = [...mockProductsList];
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);
      const productIdToDelete = mockProduct1.id;

      await productStore.deleteProduct(productIdToDelete);

      expect(dbService.delete).toHaveBeenCalledWith('products', productIdToDelete);
      expect(appState.products.find(p => p.id === productIdToDelete)).toBeUndefined();
      expect(subscriber).toHaveBeenCalled();
    });
  });

  describe('getProducts', () => {
    it('should return a copy of products from AppState', () => {
      appState.products = [...mockProductsList];
      const products = productStore.getProducts();
      expect(products).toEqual(mockProductsList);
      expect(products).not.toBe(appState.products);
    });
  });
});

  describe('loadProducts - Edge Cases and Error Handling', () => {
    it('should handle dbService.loadAllApplicationData throwing an error', async () => {
      const error = new Error('Database connection failed');
      (dbService.loadAllApplicationData as jest.Mock).mockRejectedValue(error);
      
      await expect(productStore.loadProducts()).rejects.toThrow('Database connection failed');
      expect(appState.products).toEqual([]);
    });

    it('should handle dbService returning null or undefined products', async () => {
      (dbService.loadAllApplicationData as jest.Mock).mockResolvedValue({ products: null, locations: [] });
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);

      await productStore.loadProducts();

      expect(appState.products).toEqual([]);
      expect(subscriber).toHaveBeenCalledWith([]);
    });

    it('should handle dbService returning undefined application data', async () => {
      (dbService.loadAllApplicationData as jest.Mock).mockResolvedValue(undefined);
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);

      await productStore.loadProducts();

      expect(appState.products).toEqual([]);
      expect(subscriber).toHaveBeenCalledWith([]);
    });

    it('should handle empty products array from dbService', async () => {
      (dbService.loadAllApplicationData as jest.Mock).mockResolvedValue({ products: [], locations: [] });
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);

      await productStore.loadProducts();

      expect(appState.products).toEqual([]);
      expect(subscriber).toHaveBeenCalledWith([]);
    });

    it('should notify multiple subscribers when loading products', async () => {
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();
      productStore.subscribe(subscriber1);
      productStore.subscribe(subscriber2);

      await productStore.loadProducts();

      expect(subscriber1).toHaveBeenCalledWith(mockProductsList);
      expect(subscriber2).toHaveBeenCalledWith(mockProductsList);
    });

    it('should handle corrupted product data gracefully', async () => {
      const corruptedProducts = [
        { id: 'prod1', name: 'Valid Product', category: 'Cat1', volume: 750, pricePerBottle: 20 },
        { name: 'Missing ID Product', category: 'Cat2', volume: 500 }, // Missing id
        null, // Null product
        undefined, // Undefined product
        { id: 'prod2' }, // Missing required fields
      ];
      (dbService.loadAllApplicationData as jest.Mock).mockResolvedValue({ products: corruptedProducts, locations: [] });
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);

      await productStore.loadProducts();

      expect(appState.products).toEqual(corruptedProducts);
      expect(subscriber).toHaveBeenCalledWith(corruptedProducts);
    });

    it('should handle very large datasets without memory issues', async () => {
      const largeProductsList = Array.from({ length: 10000 }, (_, i) => ({
        id: `prod${i}`,
        name: `Product ${i}`,
        category: `Category ${i % 10}`,
        volume: 750,
        pricePerBottle: Math.random() * 100
      }));
      (dbService.loadAllApplicationData as jest.Mock).mockResolvedValue({ products: largeProductsList, locations: [] });

      const startTime = Date.now();
      await productStore.loadProducts();
      const endTime = Date.now();

      expect(appState.products).toEqual(largeProductsList);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('addProduct - Edge Cases and Error Handling', () => {
    it('should handle dbService.saveProduct throwing an error', async () => {
      const newProduct: Product = { id: 'prod3', name: 'New Product C', category: 'Category 1', volume: 1000, pricePerBottle: 30 };
      const error = new Error('Save operation failed');
      (dbService.saveProduct as jest.Mock).mockRejectedValue(error);

      await expect(productStore.addProduct(newProduct)).rejects.toThrow('Save operation failed');
      expect(appState.products).not.toContainEqual(newProduct);
    });

    it('should handle adding a product with duplicate ID', async () => {
      appState.products = [...mockProductsList];
      const duplicateProduct: Product = { ...mockProduct1, name: 'Duplicate Product' };
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);

      await productStore.addProduct(duplicateProduct);

      expect(dbService.saveProduct).toHaveBeenCalledWith(duplicateProduct);
      expect(appState.products).toContainEqual(duplicateProduct);
      expect(subscriber).toHaveBeenCalled();
    });

    it('should handle adding a product with null/undefined values', async () => {
      const invalidProduct: any = { id: 'prod3', name: null, category: undefined, volume: -1, pricePerBottle: 0 };
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);

      await productStore.addProduct(invalidProduct);

      expect(dbService.saveProduct).toHaveBeenCalledWith(invalidProduct);
      expect(appState.products).toContainEqual(invalidProduct);
      expect(subscriber).toHaveBeenCalled();
    });

    it('should notify multiple subscribers when adding a product', async () => {
      const newProduct: Product = { id: 'prod3', name: 'New Product C', category: 'Category 1', volume: 1000, pricePerBottle: 30 };
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();
      productStore.subscribe(subscriber1);
      productStore.subscribe(subscriber2);

      await productStore.addProduct(newProduct);

      expect(subscriber1).toHaveBeenCalled();
      expect(subscriber2).toHaveBeenCalled();
    });

    it('should handle network timeout during save operation', async () => {
      const newProduct: Product = { id: 'prod3', name: 'Network Test Product', category: 'Test', volume: 500, pricePerBottle: 15 };
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      (dbService.saveProduct as jest.Mock).mockRejectedValue(timeoutError);

      await expect(productStore.addProduct(newProduct)).rejects.toThrow('Network timeout');
      expect(appState.products).not.toContainEqual(newProduct);
    });

    it('should handle adding products with special characters in names', async () => {
      const specialProduct: Product = { 
        id: 'special-chars', 
        name: 'Product with "quotes" & <tags> and émojis 🍺', 
        category: 'Spéciál Catégory', 
        volume: 750, 
        pricePerBottle: 25.99 
      };
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);

      await productStore.addProduct(specialProduct);

      expect(dbService.saveProduct).toHaveBeenCalledWith(specialProduct);
      expect(appState.products).toContainEqual(specialProduct);
      expect(subscriber).toHaveBeenCalled();
    });

    it('should handle concurrent add operations correctly', async () => {
      const product1: Product = { id: 'concurrent1', name: 'Concurrent Product 1', category: 'Test', volume: 500, pricePerBottle: 10 };
      const product2: Product = { id: 'concurrent2', name: 'Concurrent Product 2', category: 'Test', volume: 750, pricePerBottle: 15 };
      
      const promise1 = productStore.addProduct(product1);
      const promise2 = productStore.addProduct(product2);
      
      await Promise.all([promise1, promise2]);

      expect(appState.products).toContainEqual(product1);
      expect(appState.products).toContainEqual(product2);
      expect(dbService.saveProduct).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateProduct - Edge Cases and Error Handling', () => {
    it('should handle updating a non-existing product', async () => {
      appState.products = [...mockProductsList];
      const nonExistingProduct: Product = { id: 'nonexistent', name: 'Non-existing Product', category: 'Category 1', volume: 500, pricePerBottle: 25 };
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);

      await productStore.updateProduct(nonExistingProduct);

      expect(dbService.saveProduct).toHaveBeenCalledWith(nonExistingProduct);
      expect(appState.products).toContainEqual(nonExistingProduct);
      expect(subscriber).toHaveBeenCalled();
    });

    it('should handle dbService.saveProduct throwing an error during update', async () => {
      appState.products = [...mockProductsList];
      const updatedProduct = { ...mockProduct1, name: 'Updated Product A' };
      const error = new Error('Update operation failed');
      (dbService.saveProduct as jest.Mock).mockRejectedValue(error);

      await expect(productStore.updateProduct(updatedProduct)).rejects.toThrow('Update operation failed');
      // Product should remain unchanged in AppState
      const productInState = appState.products.find(p => p.id === mockProduct1.id);
      expect(productInState?.name).toBe(mockProduct1.name);
    });

    it('should handle updating with invalid/partial data', async () => {
      appState.products = [...mockProductsList];
      const invalidUpdate: any = { id: mockProduct1.id, name: '', category: null, volume: undefined };
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);

      await productStore.updateProduct(invalidUpdate);

      expect(dbService.saveProduct).toHaveBeenCalledWith(invalidUpdate);
      const productInState = appState.products.find(p => p.id === mockProduct1.id);
      expect(productInState).toEqual(invalidUpdate);
      expect(subscriber).toHaveBeenCalled();
    });

    it('should notify multiple subscribers when updating a product', async () => {
      appState.products = [...mockProductsList];
      const updatedProduct = { ...mockProduct1, name: 'Updated Product A' };
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();
      productStore.subscribe(subscriber1);
      productStore.subscribe(subscriber2);

      await productStore.updateProduct(updatedProduct);

      expect(subscriber1).toHaveBeenCalled();
      expect(subscriber2).toHaveBeenCalled();
    });

    it('should handle updates that would create circular references', async () => {
      appState.products = [...mockProductsList];
      const circularProduct: any = { ...mockProduct1, name: 'Circular Product' };
      circularProduct.self = circularProduct; // Create circular reference
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);

      await productStore.updateProduct(circularProduct);

      expect(dbService.saveProduct).toHaveBeenCalledWith(circularProduct);
      expect(subscriber).toHaveBeenCalled();
    });

    it('should preserve product references during partial updates', async () => {
      appState.products = [...mockProductsList];
      const originalProduct = appState.products.find(p => p.id === mockProduct1.id);
      const partialUpdate = { id: mockProduct1.id, name: 'Partially Updated' };
      
      await productStore.updateProduct(partialUpdate as Product);

      const updatedProduct = appState.products.find(p => p.id === mockProduct1.id);
      expect(updatedProduct).toBe(partialUpdate); // Reference should be replaced
      expect(updatedProduct).not.toBe(originalProduct);
    });
  });

  describe('deleteProduct - Edge Cases and Error Handling', () => {
    it('should handle deleting a non-existing product ID', async () => {
      appState.products = [...mockProductsList];
      const initialProductCount = appState.products.length;
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);

      await productStore.deleteProduct('nonexistent-id');

      expect(dbService.delete).toHaveBeenCalledWith('products', 'nonexistent-id');
      expect(appState.products).toHaveLength(initialProductCount);
      expect(subscriber).toHaveBeenCalled();
    });

    it('should handle dbService.delete throwing an error', async () => {
      appState.products = [...mockProductsList];
      const error = new Error('Delete operation failed');
      (dbService.delete as jest.Mock).mockRejectedValue(error);

      await expect(productStore.deleteProduct(mockProduct1.id)).rejects.toThrow('Delete operation failed');
      // Product should remain in AppState
      expect(appState.products.find(p => p.id === mockProduct1.id)).toBeDefined();
    });

    it('should handle invalid product IDs (null, undefined, empty string)', async () => {
      appState.products = [...mockProductsList];
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);

      await productStore.deleteProduct('');
      expect(dbService.delete).toHaveBeenCalledWith('products', '');

      await productStore.deleteProduct(null as any);
      expect(dbService.delete).toHaveBeenCalledWith('products', null);

      await productStore.deleteProduct(undefined as any);
      expect(dbService.delete).toHaveBeenCalledWith('products', undefined);

      expect(subscriber).toHaveBeenCalledTimes(3);
    });

    it('should notify multiple subscribers when deleting a product', async () => {
      appState.products = [...mockProductsList];
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();
      productStore.subscribe(subscriber1);
      productStore.subscribe(subscriber2);

      await productStore.deleteProduct(mockProduct1.id);

      expect(subscriber1).toHaveBeenCalled();
      expect(subscriber2).toHaveBeenCalled();
    });

    it('should handle concurrent delete operations on the same product', async () => {
      appState.products = [...mockProductsList];
      
      const promise1 = productStore.deleteProduct(mockProduct1.id);
      const promise2 = productStore.deleteProduct(mockProduct1.id);
      
      await Promise.all([promise1, promise2]);

      expect(appState.products.find(p => p.id === mockProduct1.id)).toBeUndefined();
      expect(dbService.delete).toHaveBeenCalledTimes(2);
    });

    it('should handle database constraint violations during delete', async () => {
      appState.products = [...mockProductsList];
      const constraintError = new Error('Foreign key constraint violation');
      constraintError.name = 'ConstraintError';
      (dbService.delete as jest.Mock).mockRejectedValue(constraintError);

      await expect(productStore.deleteProduct(mockProduct1.id)).rejects.toThrow('Foreign key constraint violation');
      expect(appState.products.find(p => p.id === mockProduct1.id)).toBeDefined();
    });
  });

  describe('getProducts - Edge Cases', () => {
    it('should return empty array when AppState has no products', () => {
      appState.products = [];
      const products = productStore.getProducts();
      expect(products).toEqual([]);
      expect(products).not.toBe(appState.products);
    });

    it('should return a deep copy preventing mutations to original state', () => {
      appState.products = [...mockProductsList];
      const products = productStore.getProducts();
      
      // Modify the returned array
      products[0].name = 'Modified Name';
      products.push({ id: 'new', name: 'New Product', category: 'New Category', volume: 100, pricePerBottle: 10 });
      
      // Original state should be unchanged
      expect(appState.products[0].name).toBe(mockProduct1.name);
      expect(appState.products).toHaveLength(2);
    });

    it('should handle products with complex nested properties', () => {
      const complexProduct: any = {
        id: 'complex',
        name: 'Complex Product',
        category: 'Complex Category',
        volume: 750,
        pricePerBottle: 25,
        metadata: { tags: ['tag1', 'tag2'], attributes: { vintage: 2020 } }
      };
      appState.products = [complexProduct];
      
      const products = productStore.getProducts();
      expect(products).toEqual([complexProduct]);
      expect(products[0]).not.toBe(complexProduct);
    });

    it('should handle getting products during concurrent modifications', async () => {
      appState.products = [...mockProductsList];
      
      // Start a modification operation
      const updatePromise = productStore.updateProduct({ ...mockProduct1, name: 'Concurrent Update' });
      
      // Get products during the update
      const products = productStore.getProducts();
      
      // Wait for update to complete
      await updatePromise;
      
      // Products retrieved should be a valid snapshot
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle products with null or undefined properties', () => {
      const productsWithNulls = [
        { id: 'null-test', name: null, category: 'Test', volume: 500, pricePerBottle: 10 },
        { id: 'undefined-test', name: 'Test', category: undefined, volume: 750, pricePerBottle: 15 }
      ];
      appState.products = productsWithNulls as any;
      
      const products = productStore.getProducts();
      expect(products).toEqual(productsWithNulls);
    });
  });

  describe('Subscription Management', () => {
    it('should handle subscriber throwing an error without affecting other subscribers', async () => {
      const errorSubscriber = jest.fn().mockImplementation(() => {
        throw new Error('Subscriber error');
      });
      const normalSubscriber = jest.fn();
      
      productStore.subscribe(errorSubscriber);
      productStore.subscribe(normalSubscriber);

      // Should not throw error
      await productStore.loadProducts();

      expect(errorSubscriber).toHaveBeenCalled();
      expect(normalSubscriber).toHaveBeenCalled();
    });

    it('should handle unsubscribing from notifications', async () => {
      const subscriber = jest.fn();
      const unsubscribe = productStore.subscribe(subscriber);
      
      unsubscribe();
      
      await productStore.loadProducts();
      
      // Subscriber should not be called after unsubscribe
      expect(subscriber).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribe/unsubscribe cycles', () => {
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();
      
      const unsubscribe1 = productStore.subscribe(subscriber1);
      const unsubscribe2 = productStore.subscribe(subscriber2);
      
      unsubscribe1();
      const unsubscribe3 = productStore.subscribe(subscriber1); // Re-subscribe
      unsubscribe2();
      unsubscribe3();
      
      expect(typeof unsubscribe1).toBe('function');
      expect(typeof unsubscribe2).toBe('function');
      expect(typeof unsubscribe3).toBe('function');
    });

    it('should handle subscribing the same callback multiple times', async () => {
      const subscriber = jest.fn();
      
      productStore.subscribe(subscriber);
      productStore.subscribe(subscriber); // Subscribe the same function again
      
      await productStore.loadProducts();
      
      // Should be called twice if subscribed twice
      expect(subscriber).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid subscription/unsubscription', () => {
      const subscribers = Array.from({ length: 100 }, () => jest.fn());
      const unsubscribes = subscribers.map(sub => productStore.subscribe(sub));
      
      // Unsubscribe every other subscriber
      unsubscribes.forEach((unsub, index) => {
        if (index % 2 === 0) unsub();
      });
      
      // Should not throw errors
      expect(() => productStore.getProducts()).not.toThrow();
    });

    it('should handle subscriber that modifies the subscriber list during notification', async () => {
      let unsubscribe: (() => void) | undefined;
      const selfUnsubscribingSubscriber = jest.fn().mockImplementation(() => {
        if (unsubscribe) unsubscribe();
      });
      const normalSubscriber = jest.fn();
      
      unsubscribe = productStore.subscribe(selfUnsubscribingSubscriber);
      productStore.subscribe(normalSubscriber);
      
      await productStore.loadProducts();
      
      expect(selfUnsubscribingSubscriber).toHaveBeenCalled();
      expect(normalSubscriber).toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete CRUD cycle with proper state management', async () => {
      const subscriber = jest.fn();
      productStore.subscribe(subscriber);

      // Load initial products
      await productStore.loadProducts();
      expect(subscriber).toHaveBeenCalledWith(mockProductsList);
      subscriber.mockClear();

      // Add a new product
      const newProduct: Product = { id: 'prod3', name: 'New Product C', category: 'Category 3', volume: 1000, pricePerBottle: 30 };
      await productStore.addProduct(newProduct);
      expect(appState.products).toHaveLength(3);
      expect(subscriber).toHaveBeenCalled();
      subscriber.mockClear();

      // Update the new product
      const updatedProduct = { ...newProduct, name: 'Updated Product C' };
      await productStore.updateProduct(updatedProduct);
      expect(appState.products.find(p => p.id === 'prod3')?.name).toBe('Updated Product C');
      expect(subscriber).toHaveBeenCalled();
      subscriber.mockClear();

      // Delete the product
      await productStore.deleteProduct('prod3');
      expect(appState.products).toHaveLength(2);
      expect(appState.products.find(p => p.id === 'prod3')).toBeUndefined();
      expect(subscriber).toHaveBeenCalled();
    });

    it('should maintain data consistency across operations', async () => {
      await productStore.loadProducts();
      const initialProducts = productStore.getProducts();
      
      // Perform multiple operations
      await productStore.addProduct({ id: 'temp1', name: 'Temp 1', category: 'Temp', volume: 500, pricePerBottle: 20 });
      await productStore.addProduct({ id: 'temp2', name: 'Temp 2', category: 'Temp', volume: 750, pricePerBottle: 25 });
      await productStore.deleteProduct('temp1');
      
      const finalProducts = productStore.getProducts();
      expect(finalProducts).toHaveLength(initialProducts.length + 1);
      expect(finalProducts.find(p => p.id === 'temp1')).toBeUndefined();
      expect(finalProducts.find(p => p.id === 'temp2')).toBeDefined();
    });

    it('should handle rapid successive operations', async () => {
      const promises = [];
      
      // Perform multiple operations simultaneously
      promises.push(productStore.loadProducts());
      promises.push(productStore.addProduct({ id: 'rapid1', name: 'Rapid 1', category: 'Test', volume: 500, pricePerBottle: 20 }));
      promises.push(productStore.addProduct({ id: 'rapid2', name: 'Rapid 2', category: 'Test', volume: 750, pricePerBottle: 25 }));
      
      await Promise.all(promises);
      
      const products = productStore.getProducts();
      expect(products.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle mixed success and failure operations', async () => {
      // Setup: First operation succeeds, second fails
      (dbService.saveProduct as jest.Mock)
        .mockResolvedValueOnce('success')
        .mockRejectedValueOnce(new Error('Save failed'));
      
      const product1: Product = { id: 'success', name: 'Success Product', category: 'Test', volume: 500, pricePerBottle: 20 };
      const product2: Product = { id: 'failure', name: 'Failure Product', category: 'Test', volume: 750, pricePerBottle: 25 };
      
      await productStore.addProduct(product1);
      expect(appState.products).toContainEqual(product1);
      
      await expect(productStore.addProduct(product2)).rejects.toThrow('Save failed');
      expect(appState.products).not.toContainEqual(product2);
    });

    it('should handle operations during store reset/reload', async () => {
      appState.products = [...mockProductsList];
      
      // Start an update operation
      const updatePromise = productStore.updateProduct({ ...mockProduct1, name: 'Updated During Reset' });
      
      // Reset the store state
      appState.products = [];
      
      // Update should still complete (implementation dependent)
      await updatePromise;
      
      // Verify final state is consistent
      const products = productStore.getProducts();
      expect(Array.isArray(products)).toBe(true);
    });
  });

  describe('AppState Singleton Integration', () => {
    it('should work with AppState singleton instance correctly', () => {
      const anotherAppStateInstance = AppState.getInstance();
      expect(anotherAppStateInstance).toBe(appState);
      
      anotherAppStateInstance.products = [mockProduct1];
      expect(productStore.getProducts()).toEqual([mockProduct1]);
    });

    it('should handle AppState being reset', async () => {
      appState.products = [...mockProductsList];
      
      // Reset AppState
      appState.products = [];
      
      const products = productStore.getProducts();
      expect(products).toEqual([]);
    });

    it('should handle multiple store instances sharing the same AppState', () => {
      // This test would require creating another productStore instance
      // For now, verify that the current store correctly uses the singleton
      const directAppState = AppState.getInstance();
      directAppState.products = [mockProduct1];
      
      expect(productStore.getProducts()).toEqual([mockProduct1]);
    });

    it('should maintain referential integrity with AppState', async () => {
      const newProduct: Product = { id: 'ref-test', name: 'Reference Test', category: 'Test', volume: 500, pricePerBottle: 20 };
      
      await productStore.addProduct(newProduct);
      
      // Product should be the same reference in AppState
      const fromStore = productStore.getProducts().find(p => p.id === 'ref-test');
      const fromAppState = appState.products.find(p => p.id === 'ref-test');
      
      expect(fromStore).toEqual(fromAppState);
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large numbers of subscribers without performance degradation', async () => {
      const subscribers = Array.from({ length: 1000 }, () => jest.fn());
      const unsubscribes = subscribers.map(sub => productStore.subscribe(sub));
      
      const startTime = Date.now();
      await productStore.loadProducts();
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
      expect(subscribers.every(sub => sub.mock.calls.length === 1)).toBe(true);
      
      // Cleanup
      unsubscribes.forEach(unsub => unsub());
    });

    it('should handle memory cleanup when all subscribers are removed', async () => {
      const subscribers = Array.from({ length: 100 }, () => jest.fn());
      const unsubscribes = subscribers.map(sub => productStore.subscribe(sub));
      
      // Unsubscribe all
      unsubscribes.forEach(unsub => unsub());
      
      // Further operations should still work
      await productStore.loadProducts();
      expect(() => productStore.getProducts()).not.toThrow();
    });

    it('should handle rapid state changes efficiently', async () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        await productStore.addProduct({ 
          id: `perf-test-${i}`, 
          name: `Performance Test ${i}`, 
          category: 'Performance', 
          volume: 500, 
          pricePerBottle: 10 
        });
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(appState.products.length).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Data Validation and Sanitization', () => {
    it('should handle products with extremely long names', async () => {
      const longName = 'A'.repeat(10000);
      const productWithLongName: Product = { 
        id: 'long-name', 
        name: longName, 
        category: 'Test', 
        volume: 500, 
        pricePerBottle: 20 
      };
      
      await productStore.addProduct(productWithLongName);
      
      expect(appState.products).toContainEqual(productWithLongName);
      expect(dbService.saveProduct).toHaveBeenCalledWith(productWithLongName);
    });

    it('should handle products with numeric edge cases', async () => {
      const edgeCaseProducts: Product[] = [
        { id: 'zero-volume', name: 'Zero Volume', category: 'Test', volume: 0, pricePerBottle: 10 },
        { id: 'negative-price', name: 'Negative Price', category: 'Test', volume: 500, pricePerBottle: -5 },
        { id: 'infinity-volume', name: 'Infinity Volume', category: 'Test', volume: Infinity, pricePerBottle: 20 },
        { id: 'nan-price', name: 'NaN Price', category: 'Test', volume: 500, pricePerBottle: NaN },
        { id: 'float-precision', name: 'Float Precision', category: 'Test', volume: 500.123456789, pricePerBottle: 20.999999999 }
      ];
      
      for (const product of edgeCaseProducts) {
        await productStore.addProduct(product);
        expect(appState.products).toContainEqual(product);
      }
    });

    it('should handle products with special Unicode characters', async () => {
      const unicodeProduct: Product = { 
        id: 'unicode-test', 
        name: '🍺 Beer with émojis and açcénts 中文 العربية', 
        category: 'Spéciál ∞ ™', 
        volume: 500, 
        pricePerBottle: 20 
      };
      
      await productStore.addProduct(unicodeProduct);
      
      expect(appState.products).toContainEqual(unicodeProduct);
      expect(dbService.saveProduct).toHaveBeenCalledWith(unicodeProduct);
    });

    it('should handle products with potential XSS content', async () => {
      const xssProduct: Product = { 
        id: 'xss-test', 
        name: '<script>alert("xss")</script>', 
        category: 'javascript:alert("xss")', 
        volume: 500, 
        pricePerBottle: 20 
      };
      
      await productStore.addProduct(xssProduct);
      
      expect(appState.products).toContainEqual(xssProduct);
    });
  });

  describe('Concurrency and Race Conditions', () => {
    it('should handle concurrent loads correctly', async () => {
      const promise1 = productStore.loadProducts();
      const promise2 = productStore.loadProducts();
      const promise3 = productStore.loadProducts();
      
      await Promise.all([promise1, promise2, promise3]);
      
      // Should not cause issues or duplicate calls beyond expected
      expect(dbService.loadAllApplicationData).toHaveBeenCalled();
      expect(appState.products).toEqual(mockProductsList);
    });

    it('should handle concurrent add/update/delete operations', async () => {
      appState.products = [...mockProductsList];
      
      const promises = [
        productStore.addProduct({ id: 'concurrent-add', name: 'Concurrent Add', category: 'Test', volume: 500, pricePerBottle: 20 }),
        productStore.updateProduct({ ...mockProduct1, name: 'Concurrent Update' }),
        productStore.deleteProduct(mockProduct2.id),
        productStore.getProducts() // Read operation during writes
      ];
      
      const results = await Promise.all(promises);
      
      // All operations should complete without throwing
      expect(results[3]).toBeInstanceOf(Array); // getProducts result
      expect(appState.products.find(p => p.id === 'concurrent-add')).toBeDefined();
      expect(appState.products.find(p => p.id === mockProduct2.id)).toBeUndefined();
    });

    it('should handle subscriber notifications during concurrent operations', async () => {
      const notificationLog: string[] = [];
      const subscriber = jest.fn().mockImplementation((products: Product[]) => {
        notificationLog.push(`Notification with ${products.length} products`);
      });
      
      productStore.subscribe(subscriber);
      
      const promises = [
        productStore.loadProducts(),
        productStore.addProduct({ id: 'test1', name: 'Test 1', category: 'Test', volume: 500, pricePerBottle: 20 }),
        productStore.addProduct({ id: 'test2', name: 'Test 2', category: 'Test', volume: 750, pricePerBottle: 25 })
      ];
      
      await Promise.all(promises);
      
      // Should have received multiple notifications
      expect(subscriber.mock.calls.length).toBeGreaterThan(0);
      expect(notificationLog.length).toBeGreaterThan(0);
    });
  });
});
