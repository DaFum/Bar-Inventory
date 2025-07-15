import { productStore } from '../../src/state/product.store';
import { Product } from '../../src/models';
import { dbService } from '../../src/services/indexeddb.service';
import { AppState } from '../../src/state/app-state';

jest.mock('../../src/services/indexeddb.service', () => ({
  dbService: {
    loadProducts: jest.fn(),
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
    (dbService.loadProducts as jest.Mock).mockClear().mockResolvedValue([...mockProductsList]);
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

      expect(dbService.loadProducts).toHaveBeenCalledTimes(1);
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
