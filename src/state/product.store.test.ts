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
