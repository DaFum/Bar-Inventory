import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProductManager } from './product-manager';

describe('ProductManager', () => {
  let productManager: ProductManager;

  beforeEach(() => {
    productManager = new ProductManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with empty products array', () => {
      expect(productManager.getProducts()).toEqual([]);
    });

    it('should initialize with default configuration', () => {
      expect(productManager.getConfig()).toBeDefined();
    });
  });

  describe('addProduct', () => {
    it('should add a valid product successfully', () => {
      const product = {
        id: '1',
        name: 'Test Product',
        price: 99.99,
        category: 'electronics'
      };

      const result = productManager.addProduct(product);
      
      expect(result).toBe(true);
      expect(productManager.getProducts()).toContain(product);
      expect(productManager.getProducts()).toHaveLength(1);
    });

    it('should reject product with duplicate id', () => {
      const product1 = {
        id: '1',
        name: 'Product 1',
        price: 50.00,
        category: 'books'
      };
      const product2 = {
        id: '1',
        name: 'Product 2',
        price: 75.00,
        category: 'electronics'
      };

      productManager.addProduct(product1);
      const result = productManager.addProduct(product2);

      expect(result).toBe(false);
      expect(productManager.getProducts()).toHaveLength(1);
      expect(productManager.getProducts()[0].name).toBe('Product 1');
    });

    it('should reject product with invalid price', () => {
      const product = {
        id: '1',
        name: 'Test Product',
        price: -10,
        category: 'electronics'
      };

      const result = productManager.addProduct(product);
      
      expect(result).toBe(false);
      expect(productManager.getProducts()).toHaveLength(0);
    });

    it('should reject product with missing required fields', () => {
      const incompleteProduct = {
        id: '1',
        name: 'Test Product'
        // missing price and category
      };

      const result = productManager.addProduct(incompleteProduct as any);
      
      expect(result).toBe(false);
      expect(productManager.getProducts()).toHaveLength(0);
    });

    it('should reject product with empty name', () => {
      const product = {
        id: '1',
        name: '',
        price: 99.99,
        category: 'electronics'
      };

      const result = productManager.addProduct(product);
      
      expect(result).toBe(false);
      expect(productManager.getProducts()).toHaveLength(0);
    });

    it('should handle extremely large price values', () => {
      const product = {
        id: '1',
        name: 'Expensive Product',
        price: Number.MAX_SAFE_INTEGER,
        category: 'luxury'
      };

      const result = productManager.addProduct(product);
      
      expect(result).toBe(true);
      expect(productManager.getProducts()).toContain(product);
    });
  });

  describe('removeProduct', () => {
    beforeEach(() => {
      productManager.addProduct({
        id: '1',
        name: 'Product 1',
        price: 50.00,
        category: 'books'
      });
      productManager.addProduct({
        id: '2',
        name: 'Product 2',
        price: 75.00,
        category: 'electronics'
      });
    });

    it('should remove existing product successfully', () => {
      const result = productManager.removeProduct('1');

      expect(result).toBe(true);
      expect(productManager.getProducts()).toHaveLength(1);
      expect(productManager.findProductById('1')).toBeNull();
    });

    it('should return false when removing non-existent product', () => {
      const result = productManager.removeProduct('999');

      expect(result).toBe(false);
      expect(productManager.getProducts()).toHaveLength(2);
    });

    it('should handle empty string id', () => {
      const result = productManager.removeProduct('');

      expect(result).toBe(false);
      expect(productManager.getProducts()).toHaveLength(2);
    });

    it('should handle null/undefined id gracefully', () => {
      const result1 = productManager.removeProduct(null as any);
      const result2 = productManager.removeProduct(undefined as any);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(productManager.getProducts()).toHaveLength(2);
    });
  });

  describe('findProductById', () => {
    beforeEach(() => {
      productManager.addProduct({
        id: '1',
        name: 'Product 1',
        price: 50.00,
        category: 'books'
      });
    });

    it('should find existing product by id', () => {
      const product = productManager.findProductById('1');

      expect(product).not.toBeNull();
      expect(product?.id).toBe('1');
      expect(product?.name).toBe('Product 1');
    });

    it('should return null for non-existent id', () => {
      const product = productManager.findProductById('999');

      expect(product).toBeNull();
    });

    it('should return null for invalid id types', () => {
      const result1 = productManager.findProductById(null as any);
      const result2 = productManager.findProductById(undefined as any);
      const result3 = productManager.findProductById('' as any);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
    });
  });

  describe('updateProduct', () => {
    beforeEach(() => {
      productManager.addProduct({
        id: '1',
        name: 'Original Product',
        price: 50.00,
        category: 'books'
      });
    });

    it('should update existing product successfully', () => {
      const updatedProduct = {
        id: '1',
        name: 'Updated Product',
        price: 75.00,
        category: 'electronics'
      };

      const result = productManager.updateProduct('1', updatedProduct);

      expect(result).toBe(true);
      const product = productManager.findProductById('1');
      expect(product?.name).toBe('Updated Product');
      expect(product?.price).toBe(75.00);
      expect(product?.category).toBe('electronics');
    });

    it('should return false when updating non-existent product', () => {
      const updatedProduct = {
        id: '999',
        name: 'Updated Product',
        price: 75.00,
        category: 'electronics'
      };

      const result = productManager.updateProduct('999', updatedProduct);

      expect(result).toBe(false);
    });

    it('should reject update with invalid price', () => {
      const updatedProduct = {
        id: '1',
        name: 'Updated Product',
        price: -50.00,
        category: 'electronics'
      };

      const result = productManager.updateProduct('1', updatedProduct);

      expect(result).toBe(false);
      const product = productManager.findProductById('1');
      expect(product?.name).toBe('Original Product');
      expect(product?.price).toBe(50.00);
    });

    it('should handle partial updates', () => {
      const partialUpdate = {
        name: 'Partially Updated Product'
      };

      const result = productManager.updateProduct('1', partialUpdate);

      expect(result).toBe(true);
      const product = productManager.findProductById('1');
      expect(product?.name).toBe('Partially Updated Product');
      expect(product?.price).toBe(50.00); // Should remain unchanged
      expect(product?.category).toBe('books'); // Should remain unchanged
    });
  });

  describe('getProductsByCategory', () => {
    beforeEach(() => {
      productManager.addProduct({
        id: '1',
        name: 'Book 1',
        price: 25.00,
        category: 'books'
      });
      productManager.addProduct({
        id: '2',
        name: 'Book 2',
        price: 35.00,
        category: 'books'
      });
      productManager.addProduct({
        id: '3',
        name: 'Phone',
        price: 500.00,
        category: 'electronics'
      });
    });

    it('should return all products in specified category', () => {
      const books = productManager.getProductsByCategory('books');

      expect(books).toHaveLength(2);
      expect(books.every(p => p.category === 'books')).toBe(true);
    });

    it('should return empty array for non-existent category', () => {
      const clothing = productManager.getProductsByCategory('clothing');

      expect(clothing).toEqual([]);
    });

    it('should handle case sensitivity', () => {
      const books = productManager.getProductsByCategory('BOOKS');

      expect(books).toEqual([]);
    });

    it('should handle empty category string', () => {
      const result = productManager.getProductsByCategory('');

      expect(result).toEqual([]);
    });
  });

  describe('getTotalValue', () => {
    it('should return 0 for empty product list', () => {
      const total = productManager.getTotalValue();

      expect(total).toBe(0);
    });

    it('should calculate total value correctly', () => {
      productManager.addProduct({
        id: '1',
        name: 'Product 1',
        price: 25.50,
        category: 'books'
      });
      productManager.addProduct({
        id: '2',
        name: 'Product 2',
        price: 74.50,
        category: 'electronics'
      });

      const total = productManager.getTotalValue();

      expect(total).toBe(100.00);
    });

    it('should handle floating point precision', () => {
      productManager.addProduct({
        id: '1',
        name: 'Product 1',
        price: 0.1,
        category: 'test'
      });
      productManager.addProduct({
        id: '2',
        name: 'Product 2',
        price: 0.2,
        category: 'test'
      });

      const total = productManager.getTotalValue();

      expect(total).toBeCloseTo(0.3, 2);
    });
  });

  describe('sortProducts', () => {
    beforeEach(() => {
      productManager.addProduct({
        id: '1',
        name: 'Zebra Product',
        price: 100.00,
        category: 'animals'
      });
      productManager.addProduct({
        id: '2',
        name: 'Apple Product',
        price: 50.00,
        category: 'fruits'
      });
      productManager.addProduct({
        id: '3',
        name: 'Bear Product',
        price: 150.00,
        category: 'animals'
      });
    });

    it('should sort by name ascending by default', () => {
      const sorted = productManager.sortProducts();

      expect(sorted[0].name).toBe('Apple Product');
      expect(sorted[1].name).toBe('Bear Product');
      expect(sorted[2].name).toBe('Zebra Product');
    });

    it('should sort by price ascending', () => {
      const sorted = productManager.sortProducts('price', 'asc');

      expect(sorted[0].price).toBe(50.00);
      expect(sorted[1].price).toBe(100.00);
      expect(sorted[2].price).toBe(150.00);
    });

    it('should sort by price descending', () => {
      const sorted = productManager.sortProducts('price', 'desc');

      expect(sorted[0].price).toBe(150.00);
      expect(sorted[1].price).toBe(100.00);
      expect(sorted[2].price).toBe(50.00);
    });

    it('should sort by category', () => {
      const sorted = productManager.sortProducts('category', 'asc');

      expect(sorted[0].category).toBe('animals');
      expect(sorted[1].category).toBe('animals');
      expect(sorted[2].category).toBe('fruits');
    });

    it('should handle invalid sort field', () => {
      const sorted = productManager.sortProducts('invalid' as any);

      expect(sorted).toHaveLength(3);
      // Should fall back to default sorting
    });
  });

  describe('clearProducts', () => {
    beforeEach(() => {
      productManager.addProduct({
        id: '1',
        name: 'Product 1',
        price: 50.00,
        category: 'books'
      });
    });

    it('should clear all products', () => {
      productManager.clearProducts();

      expect(productManager.getProducts()).toHaveLength(0);
      expect(productManager.getTotalValue()).toBe(0);
    });

    it('should handle clearing empty product list', () => {
      productManager.clearProducts();
      productManager.clearProducts(); // Clear again

      expect(productManager.getProducts()).toHaveLength(0);
    });
  });

  describe('getProductCount', () => {
    it('should return 0 for empty product list', () => {
      expect(productManager.getProductCount()).toBe(0);
    });

    it('should return correct count after adding products', () => {
      productManager.addProduct({
        id: '1',
        name: 'Product 1',
        price: 50.00,
        category: 'books'
      });
      productManager.addProduct({
        id: '2',
        name: 'Product 2',
        price: 75.00,
        category: 'electronics'
      });

      expect(productManager.getProductCount()).toBe(2);
    });

    it('should return correct count after removing products', () => {
      productManager.addProduct({
        id: '1',
        name: 'Product 1',
        price: 50.00,
        category: 'books'
      });
      productManager.addProduct({
        id: '2',
        name: 'Product 2',
        price: 75.00,
        category: 'electronics'
      });
      productManager.removeProduct('1');

      expect(productManager.getProductCount()).toBe(1);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle memory constraints gracefully', () => {
      // Add a large number of products to test memory handling
      for (let i = 0; i < 1000; i++) {
        productManager.addProduct({
          id: i.toString(),
          name: `Product ${i}`,
          price: Math.random() * 1000,
          category: `category${i % 10}`
        });
      }

      expect(productManager.getProductCount()).toBe(1000);
      expect(productManager.getTotalValue()).toBeGreaterThan(0);
    });

    it('should handle concurrent modifications safely', () => {
      const product1 = {
        id: '1',
        name: 'Product 1',
        price: 50.00,
        category: 'books'
      };

      productManager.addProduct(product1);
      
      // Simulate concurrent access
      const found = productManager.findProductById('1');
      const updated = productManager.updateProduct('1', { name: 'Updated Product' });
      
      expect(found).not.toBeNull();
      expect(updated).toBe(true);
    });

    it('should validate product schema strictly', () => {
      const invalidProducts = [
        { id: 123, name: 'Product', price: 50, category: 'test' }, // id should be string
        { id: '1', name: null, price: 50, category: 'test' }, // name should be string
        { id: '1', name: 'Product', price: '50', category: 'test' }, // price should be number
        { id: '1', name: 'Product', price: 50, category: 123 } // category should be string
      ];

      invalidProducts.forEach(product => {
        const result = productManager.addProduct(product as any);
        expect(result).toBe(false);
      });

      expect(productManager.getProductCount()).toBe(0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete product lifecycle', () => {
      // Add products
      const product1 = {
        id: '1',
        name: 'Original Product',
        price: 100.00,
        category: 'electronics'
      };
      
      expect(productManager.addProduct(product1)).toBe(true);
      expect(productManager.getProductCount()).toBe(1);

      // Update product
      expect(productManager.updateProduct('1', { price: 150.00 })).toBe(true);
      expect(productManager.findProductById('1')?.price).toBe(150.00);

      // Add more products
      productManager.addProduct({
        id: '2',
        name: 'Second Product',
        price: 75.00,
        category: 'books'
      });

      // Test aggregations
      expect(productManager.getProductCount()).toBe(2);
      expect(productManager.getTotalValue()).toBe(225.00);
      expect(productManager.getProductsByCategory('electronics')).toHaveLength(1);

      // Remove product
      expect(productManager.removeProduct('1')).toBe(true);
      expect(productManager.getProductCount()).toBe(1);
      expect(productManager.getTotalValue()).toBe(75.00);

      // Clear all
      productManager.clearProducts();
      expect(productManager.getProductCount()).toBe(0);
      expect(productManager.getTotalValue()).toBe(0);
    });
  });
});