import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { Product } from '../models';
import { dbService } from '../services/indexeddb.service';
import { AppState } from './app-state';
import { productStore } from './product.store';

// Mock dependencies
vi.mock('../services/indexeddb.service');
vi.mock('./app-state');

describe('ProductStore', () => {
  const mockDbService = dbService as {
    loadProducts: Mock;
    saveProduct: Mock;
    delete: Mock;
  };

  const mockAppState = {
    products: [] as Product[],
  };

  const mockProduct: Product = {
    id: '1',
    name: 'Test Product',
    price: 10.99,
    description: 'A test product',
    category: 'test',
  };

  const mockProduct2: Product = {
    id: '2',
    name: 'Another Product',
    price: 20.99,
    description: 'Another test product',
    category: 'test',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset the app state
    mockAppState.products = [];
    
    // Mock AppState.getInstance to return our mock
    (AppState.getInstance as Mock).mockReturnValue(mockAppState);
    
    // Reset console methods to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with AppState instance', () => {
      expect(AppState.getInstance).toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    it('should add subscriber to the list', () => {
      const callback = vi.fn();
      const unsubscribe = productStore.subscribe(callback);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('should return unsubscribe function that removes the subscriber', () => {
      const callback = vi.fn();
      const unsubscribe = productStore.subscribe(callback);
      
      // Verify subscriber was added by triggering notification
      productStore['notifySubscribers']();
      expect(callback).toHaveBeenCalledWith([]);
      
      // Unsubscribe and verify callback is no longer called
      unsubscribe();
      callback.mockClear();
      productStore['notifySubscribers']();
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      productStore.subscribe(callback1);
      productStore.subscribe(callback2);
      
      productStore['notifySubscribers']();
      
      expect(callback1).toHaveBeenCalledWith([]);
      expect(callback2).toHaveBeenCalledWith([]);
    });
  });

  describe('unsubscribe', () => {
    it('should remove specific subscriber from the list', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      productStore.subscribe(callback1);
      productStore.subscribe(callback2);
      
      productStore.unsubscribe(callback1);
      productStore['notifySubscribers']();
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith([]);
    });

    it('should handle unsubscribing non-existent callback gracefully', () => {
      const callback = vi.fn();
      
      expect(() => productStore.unsubscribe(callback)).not.toThrow();
    });

    it('should handle empty subscriber list', () => {
      const callback = vi.fn();
      
      expect(() => productStore.unsubscribe(callback)).not.toThrow();
    });
  });

  describe('notifySubscribers', () => {
    it('should call all subscribers with current products', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      mockAppState.products = [mockProduct];
      productStore.subscribe(callback1);
      productStore.subscribe(callback2);
      
      productStore['notifySubscribers']();
      
      expect(callback1).toHaveBeenCalledWith([mockProduct]);
      expect(callback2).toHaveBeenCalledWith([mockProduct]);
    });

    it('should pass a copy of products array to prevent mutation', () => {
      const callback = vi.fn();
      mockAppState.products = [mockProduct];
      
      productStore.subscribe(callback);
      productStore['notifySubscribers']();
      
      const receivedProducts = callback.mock.calls[0][0];
      expect(receivedProducts).toEqual([mockProduct]);
      expect(receivedProducts).not.toBe(mockAppState.products);
    });

    it('should handle subscriber errors gracefully', () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Subscriber error');
      });
      const normalCallback = vi.fn();
      
      productStore.subscribe(errorCallback);
      productStore.subscribe(normalCallback);
      
      expect(() => productStore['notifySubscribers']()).not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        'ProductStore: Error in subscriber during notify:',
        expect.any(Error)
      );
      expect(normalCallback).toHaveBeenCalled();
    });

    it('should continue notifying other subscribers even if one throws', () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Subscriber error');
      });
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      productStore.subscribe(callback1);
      productStore.subscribe(errorCallback);
      productStore.subscribe(callback2);
      
      productStore['notifySubscribers']();
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getProducts', () => {
    it('should return a copy of current products', () => {
      mockAppState.products = [mockProduct, mockProduct2];
      
      const result = productStore.getProducts();
      
      expect(result).toEqual([mockProduct, mockProduct2]);
      expect(result).not.toBe(mockAppState.products);
    });

    it('should return empty array when no products exist', () => {
      mockAppState.products = [];
      
      const result = productStore.getProducts();
      
      expect(result).toEqual([]);
    });

    it('should return immutable copy that does not affect internal state', () => {
      mockAppState.products = [mockProduct];
      
      const result = productStore.getProducts();
      result.push(mockProduct2);
      
      expect(mockAppState.products).toEqual([mockProduct]);
      expect(mockAppState.products.length).toBe(1);
    });
  });

  describe('loadProducts', () => {
    it('should load products from database and notify subscribers', async () => {
      const callback = vi.fn();
      const mockProducts = [mockProduct, mockProduct2];
      
      mockDbService.loadProducts.mockResolvedValue(mockProducts);
      productStore.subscribe(callback);
      
      await productStore.loadProducts();
      
      expect(mockDbService.loadProducts).toHaveBeenCalledTimes(1);
      expect(mockAppState.products).toEqual(mockProducts);
      expect(callback).toHaveBeenCalledWith(mockProducts);
    });

    it('should handle empty product list from database', async () => {
      const callback = vi.fn();
      
      mockDbService.loadProducts.mockResolvedValue([]);
      productStore.subscribe(callback);
      
      await productStore.loadProducts();
      
      expect(mockAppState.products).toEqual([]);
      expect(callback).toHaveBeenCalledWith([]);
    });

    it('should handle database errors and rethrow them', async () => {
      const dbError = new Error('Database connection failed');
      mockDbService.loadProducts.mockRejectedValue(dbError);
      
      await expect(productStore.loadProducts()).rejects.toThrow('Database connection failed');
      expect(console.error).toHaveBeenCalledWith(
        'ProductStore: Error loading products from DB',
        dbError
      );
    });

    it('should not notify subscribers when database load fails', async () => {
      const callback = vi.fn();
      mockDbService.loadProducts.mockRejectedValue(new Error('DB Error'));
      productStore.subscribe(callback);
      
      try {
        await productStore.loadProducts();
      } catch {
        // Expected to throw
      }
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should replace existing products when loading from database', async () => {
      const newProducts = [mockProduct2];
      mockAppState.products = [mockProduct];
      mockDbService.loadProducts.mockResolvedValue(newProducts);
      
      await productStore.loadProducts();
      
      expect(mockAppState.products).toEqual(newProducts);
      expect(mockAppState.products).not.toContain(mockProduct);
    });
  });

  describe('addProduct', () => {
    it('should add product to database and state, then notify subscribers', async () => {
      const callback = vi.fn();
      mockDbService.saveProduct.mockResolvedValue(undefined);
      productStore.subscribe(callback);
      
      const result = await productStore.addProduct(mockProduct);
      
      expect(mockDbService.saveProduct).toHaveBeenCalledWith(mockProduct);
      expect(mockAppState.products).toContain(mockProduct);
      expect(callback).toHaveBeenCalledWith([mockProduct]);
      expect(result).toEqual(mockProduct);
    });

    it('should add multiple products correctly', async () => {
      mockDbService.saveProduct.mockResolvedValue(undefined);
      
      await productStore.addProduct(mockProduct);
      await productStore.addProduct(mockProduct2);
      
      expect(mockAppState.products).toEqual([mockProduct, mockProduct2]);
      expect(mockDbService.saveProduct).toHaveBeenCalledTimes(2);
    });

    it('should handle database save errors and rethrow them', async () => {
      const saveError = new Error('Failed to save product');
      mockDbService.saveProduct.mockRejectedValue(saveError);
      
      await expect(productStore.addProduct(mockProduct)).rejects.toThrow('Failed to save product');
      expect(console.error).toHaveBeenCalledWith(
        'ProductStore: Error adding product',
        saveError
      );
    });

    it('should not update state or notify subscribers when database save fails', async () => {
      const callback = vi.fn();
      mockDbService.saveProduct.mockRejectedValue(new Error('Save failed'));
      productStore.subscribe(callback);
      
      try {
        await productStore.addProduct(mockProduct);
      } catch {
        // Expected to throw
      }
      
      expect(mockAppState.products).not.toContain(mockProduct);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle null or undefined product gracefully', async () => {
      mockDbService.saveProduct.mockResolvedValue(undefined);
      
      const result = await productStore.addProduct(null as any);
      
      expect(mockDbService.saveProduct).toHaveBeenCalledWith(null);
      expect(result).toBeNull();
    });
  });

  describe('updateProduct', () => {
    beforeEach(() => {
      mockAppState.products = [mockProduct];
    });

    it('should update existing product in database and state, then notify subscribers', async () => {
      const callback = vi.fn();
      const updatedProduct = { ...mockProduct, name: 'Updated Product' };
      
      mockDbService.saveProduct.mockResolvedValue(undefined);
      productStore.subscribe(callback);
      
      const result = await productStore.updateProduct(updatedProduct);
      
      expect(mockDbService.saveProduct).toHaveBeenCalledWith(updatedProduct);
      expect(mockAppState.products[0]).toEqual(updatedProduct);
      expect(callback).toHaveBeenCalledWith([updatedProduct]);
      expect(result).toEqual(updatedProduct);
    });

    it('should add product to state if not found (upsert behavior)', async () => {
      const callback = vi.fn();
      mockDbService.saveProduct.mockResolvedValue(undefined);
      productStore.subscribe(callback);
      
      await productStore.updateProduct(mockProduct2);
      
      expect(mockAppState.products).toEqual([mockProduct, mockProduct2]);
      expect(callback).toHaveBeenCalledWith([mockProduct, mockProduct2]);
    });

    it('should handle database save errors and rethrow them', async () => {
      const saveError = new Error('Failed to update product');
      mockDbService.saveProduct.mockRejectedValue(saveError);
      
      await expect(productStore.updateProduct(mockProduct)).rejects.toThrow('Failed to update product');
      expect(console.error).toHaveBeenCalledWith(
        'ProductStore: Error updating product',
        saveError
      );
    });

    it('should not update state or notify subscribers when database save fails', async () => {
      const callback = vi.fn();
      const originalProduct = { ...mockProduct };
      const updatedProduct = { ...mockProduct, name: 'Updated Product' };
      
      mockDbService.saveProduct.mockRejectedValue(new Error('Save failed'));
      productStore.subscribe(callback);
      
      try {
        await productStore.updateProduct(updatedProduct);
      } catch {
        // Expected to throw
      }
      
      expect(mockAppState.products[0]).toEqual(originalProduct);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle updating product with same ID but different reference', async () => {
      const updatedProduct = { ...mockProduct, name: 'Updated Name' };
      mockDbService.saveProduct.mockResolvedValue(undefined);
      
      await productStore.updateProduct(updatedProduct);
      
      expect(mockAppState.products.length).toBe(1);
      expect(mockAppState.products[0]).toEqual(updatedProduct);
      expect(mockAppState.products[0]).not.toBe(mockProduct);
    });

    it('should handle empty product array when updating non-existent product', async () => {
      mockAppState.products = [];
      mockDbService.saveProduct.mockResolvedValue(undefined);
      
      await productStore.updateProduct(mockProduct);
      
      expect(mockAppState.products).toEqual([mockProduct]);
    });
  });

  describe('deleteProduct', () => {
    beforeEach(() => {
      mockAppState.products = [mockProduct, mockProduct2];
    });

    it('should delete product from database and state, then notify subscribers', async () => {
      const callback = vi.fn();
      mockDbService.delete.mockResolvedValue(undefined);
      productStore.subscribe(callback);
      
      await productStore.deleteProduct(mockProduct.id);
      
      expect(mockDbService.delete).toHaveBeenCalledWith('products', mockProduct.id);
      expect(mockAppState.products).toEqual([mockProduct2]);
      expect(callback).toHaveBeenCalledWith([mockProduct2]);
    });

    it('should handle deleting non-existent product gracefully', async () => {
      const callback = vi.fn();
      mockDbService.delete.mockResolvedValue(undefined);
      productStore.subscribe(callback);
      
      await productStore.deleteProduct('non-existent-id');
      
      expect(mockDbService.delete).toHaveBeenCalledWith('products', 'non-existent-id');
      expect(mockAppState.products).toEqual([mockProduct, mockProduct2]);
      expect(callback).toHaveBeenCalledWith([mockProduct, mockProduct2]);
    });

    it('should handle database delete errors and rethrow them', async () => {
      const deleteError = new Error('Failed to delete product');
      mockDbService.delete.mockRejectedValue(deleteError);
      
      await expect(productStore.deleteProduct(mockProduct.id)).rejects.toThrow('Failed to delete product');
      expect(console.error).toHaveBeenCalledWith(
        'ProductStore: Error deleting product',
        deleteError
      );
    });

    it('should not update state or notify subscribers when database delete fails', async () => {
      const callback = vi.fn();
      mockDbService.delete.mockRejectedValue(new Error('Delete failed'));
      productStore.subscribe(callback);
      
      try {
        await productStore.deleteProduct(mockProduct.id);
      } catch {
        // Expected to throw
      }
      
      expect(mockAppState.products).toEqual([mockProduct, mockProduct2]);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should delete all products with the same ID if duplicates exist', async () => {
      const duplicateProduct = { ...mockProduct };
      mockAppState.products = [mockProduct, duplicateProduct, mockProduct2];
      mockDbService.delete.mockResolvedValue(undefined);
      
      await productStore.deleteProduct(mockProduct.id);
      
      expect(mockAppState.products).toEqual([mockProduct2]);
    });

    it('should handle empty product array', async () => {
      mockAppState.products = [];
      mockDbService.delete.mockResolvedValue(undefined);
      
      await productStore.deleteProduct('any-id');
      
      expect(mockAppState.products).toEqual([]);
      expect(mockDbService.delete).toHaveBeenCalledWith('products', 'any-id');
    });

    it('should handle null or undefined productId', async () => {
      mockDbService.delete.mockResolvedValue(undefined);
      
      await productStore.deleteProduct(null as any);
      await productStore.deleteProduct(undefined as any);
      
      expect(mockDbService.delete).toHaveBeenCalledWith('products', null);
      expect(mockDbService.delete).toHaveBeenCalledWith('products', undefined);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex workflow: load, add, update, delete', async () => {
      const callback = vi.fn();
      
      // Setup mocks
      mockDbService.loadProducts.mockResolvedValue([mockProduct]);
      mockDbService.saveProduct.mockResolvedValue(undefined);
      mockDbService.delete.mockResolvedValue(undefined);
      
      productStore.subscribe(callback);
      
      // Load products
      await productStore.loadProducts();
      expect(callback).toHaveBeenCalledWith([mockProduct]);
      
      // Add new product
      await productStore.addProduct(mockProduct2);
      expect(callback).toHaveBeenCalledWith([mockProduct, mockProduct2]);
      
      // Update existing product
      const updatedProduct = { ...mockProduct, name: 'Updated' };
      await productStore.updateProduct(updatedProduct);
      expect(callback).toHaveBeenCalledWith([updatedProduct, mockProduct2]);
      
      // Delete product
      await productStore.deleteProduct(mockProduct2.id);
      expect(callback).toHaveBeenCalledWith([updatedProduct]);
      
      expect(callback).toHaveBeenCalledTimes(4);
    });

    it('should handle concurrent operations correctly', async () => {
      mockDbService.saveProduct.mockResolvedValue(undefined);
      
      const promises = [
        productStore.addProduct(mockProduct),
        productStore.addProduct(mockProduct2),
      ];
      
      await Promise.all(promises);
      
      expect(mockAppState.products).toHaveLength(2);
      expect(mockDbService.saveProduct).toHaveBeenCalledTimes(2);
    });

    it('should maintain subscriber state across multiple operations', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      mockDbService.saveProduct.mockResolvedValue(undefined);
      
      const unsubscribe1 = productStore.subscribe(callback1);
      productStore.subscribe(callback2);
      
      await productStore.addProduct(mockProduct);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      
      unsubscribe1();
      
      await productStore.addProduct(mockProduct2);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    it('should handle products with special characters in ID', async () => {
      const specialProduct = { ...mockProduct, id: 'test-id-with-🎉-emoji' };
      mockDbService.saveProduct.mockResolvedValue(undefined);
      mockDbService.delete.mockResolvedValue(undefined);
      
      await productStore.addProduct(specialProduct);
      expect(mockAppState.products).toContain(specialProduct);
      
      await productStore.deleteProduct(specialProduct.id);
      expect(mockAppState.products).not.toContain(specialProduct);
    });

    it('should handle very large product arrays', async () => {
      const largeProductArray = Array.from({ length: 1000 }, (_, i) => ({
        ...mockProduct,
        id: `product-${i}`,
        name: `Product ${i}`,
      }));
      
      mockDbService.loadProducts.mockResolvedValue(largeProductArray);
      
      await productStore.loadProducts();
      
      expect(mockAppState.products).toHaveLength(1000);
    });

    it('should handle rapid subscribe/unsubscribe operations', () => {
      const callbacks = Array.from({ length: 100 }, () => vi.fn());
      const unsubscribers = callbacks.map(cb => productStore.subscribe(cb));
      
      // Unsubscribe half of them
      unsubscribers.slice(0, 50).forEach(unsub => unsub());
      
      productStore['notifySubscribers']();
      
      // First 50 should not be called, last 50 should be called
      callbacks.slice(0, 50).forEach(cb => expect(cb).not.toHaveBeenCalled());
      callbacks.slice(50).forEach(cb => expect(cb).toHaveBeenCalled());
    });
  });
});