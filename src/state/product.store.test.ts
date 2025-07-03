import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createProductStore } from './product.store';
import type { Product, ProductStore } from './product.store'; // Removed ProductFilter

// Mock external dependencies that might be used
vi.mock('../services/api', () => ({
  fetchProducts: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
}));

vi.mock('../utils/storage', () => ({
  saveToStorage: vi.fn(),
  loadFromStorage: vi.fn(),
}));

describe('ProductStore', () => {
  let store: ProductStore;

  // Mock data for testing
  const mockProduct: Product = {
    id: '1',
    name: 'Test Product',
    price: 29.99,
    category: 'electronics',
    description: 'A comprehensive test product description',
    inStock: true,
    imageUrl: 'https://example.com/image.jpg',
    tags: ['popular', 'featured'],
    rating: 4.5,
    reviewCount: 123,
    sku: 'TEST-001',
    brand: 'TestBrand',
    weight: 1.2,
    dimensions: { length: 10, width: 5, height: 3 },
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  };

  const mockProducts: Product[] = [
    mockProduct,
    {
      id: '2',
      name: 'Another Product',
      price: 49.99,
      category: 'books',
      description: 'Another comprehensive test product',
      inStock: false,
      imageUrl: 'https://example.com/image2.jpg',
      tags: ['new', 'limited'],
      rating: 3.8,
      reviewCount: 67,
      sku: 'TEST-002',
      brand: 'AnotherBrand',
      weight: 0.5,
      dimensions: { length: 8, width: 6, height: 1 },
      createdAt: new Date('2023-01-02T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
    {
      id: '3',
      name: 'Premium Product',
      price: 199.99,
      category: 'electronics',
      description: 'A premium electronic device',
      inStock: true,
      imageUrl: 'https://example.com/image3.jpg',
      tags: ['premium', 'bestseller'],
      rating: 4.9,
      reviewCount: 456,
      sku: 'TEST-003',
      brand: 'PremiumBrand',
      weight: 2.5,
      dimensions: { length: 15, width: 10, height: 8 },
      createdAt: new Date('2023-01-03T00:00:00Z'),
      updatedAt: new Date('2023-01-03T00:00:00Z'),
    },
  ];

  beforeEach(() => {
    // Create a fresh store instance for each test
    store = createProductStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    vi.resetAllMocks();
    if (store && typeof store.destroy === 'function') {
      store.destroy();
    }
  });

  describe('Store Initialization', () => {
    it('should initialize with correct default state', () => {
      const state = store.getState();
      expect(state.products).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.filters).toEqual({});
      expect(state.selectedProduct).toBeNull();
      expect(state.selectedProducts).toEqual([]);
      expect(state.sortBy).toBeUndefined();
      expect(state.sortOrder).toBe('asc');
      expect(state.currentPage).toBe(1);
      expect(state.pageSize).toBe(20);
    });

    it('should accept initial state during creation', () => {
      const initialState = {
        products: [mockProduct],
        loading: true,
        pageSize: 10,
      };
      const customStore = createProductStore(initialState);
      const state = customStore.getState();

      expect(state.products).toEqual([mockProduct]);
      expect(state.loading).toBe(true);
      expect(state.pageSize).toBe(10);
    });

    it('should handle invalid initial state gracefully', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invalidState = {
        products: null,
        loading: 'invalid',
        pageSize: -1,
      } as any;

      expect(() => createProductStore(invalidState)).not.toThrow();
      const store = createProductStore(invalidState);
      const state = store.getState();

      // Should fallback to safe defaults
      expect(Array.isArray(state.products)).toBe(true);
      expect(typeof state.loading).toBe('boolean');
      expect(state.pageSize).toBeGreaterThan(0);
    });
  });

  describe('Product Data Management', () => {
    describe('Loading Products', () => {
      it('should set loading state correctly during fetch', async () => {
        const { fetchProducts } = await import('../services/api');
        vi.mocked(fetchProducts).mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve(mockProducts), 100))
        );

        const fetchPromise = store.fetchProducts();
        expect(store.getState().loading).toBe(true);

        await fetchPromise;
        expect(store.getState().loading).toBe(false);
      });

      it('should populate products on successful fetch', async () => {
        const { fetchProducts } = await import('../services/api');
        vi.mocked(fetchProducts).mockResolvedValue(mockProducts);

        await store.fetchProducts();

        expect(store.getState().products).toEqual(mockProducts);
        expect(store.getState().error).toBeNull();
      });

      it('should handle fetch errors gracefully', async () => {
        const { fetchProducts } = await import('../services/api');
        const errorMessage = 'Network error occurred';
        vi.mocked(fetchProducts).mockRejectedValue(new Error(errorMessage));

        await store.fetchProducts();

        expect(store.getState().loading).toBe(false);
        expect(store.getState().error).toBe(errorMessage);
        expect(store.getState().products).toEqual([]);
      });

      it('should handle fetch with query parameters', async () => {
        const { fetchProducts } = await import('../services/api');
        vi.mocked(fetchProducts).mockResolvedValue(mockProducts);

        const queryParams = { category: 'electronics', limit: 10 };
        await store.fetchProducts(queryParams);

        expect(fetchProducts).toHaveBeenCalledWith(queryParams);
        expect(store.getState().products).toEqual(mockProducts);
      });

      it('should merge products when append option is used', async () => {
        const { fetchProducts } = await import('../services/api');
        store.setState({ products: [mockProduct] });

        const newProducts = [mockProducts[1], mockProducts[2]];
        vi.mocked(fetchProducts).mockResolvedValue(newProducts);

        await store.fetchProducts({}, { append: true });

        expect(store.getState().products).toHaveLength(3);
        expect(store.getState().products).toContain(mockProduct);
        expect(store.getState().products).toContain(newProducts[0]);
      });

      it('should handle concurrent fetch requests', async () => {
        const { fetchProducts } = await import('../services/api');
        let resolveFirst: (value: Product[]) => void;
        let resolveSecond: (value: Product[]) => void;

        vi.mocked(fetchProducts)
          .mockImplementationOnce(
            () =>
              new Promise((resolve) => {
                resolveFirst = resolve;
              })
          )
          .mockImplementationOnce(
            () =>
              new Promise((resolve) => {
                resolveSecond = resolve;
              })
          );

        const firstFetch = store.fetchProducts();
        const secondFetch = store.fetchProducts();

        // Resolve second request first
        resolveSecond!([mockProducts[0]]);
        await secondFetch;

        // Resolve first request
        resolveFirst!(mockProducts);
        await firstFetch;

        // Second request should win
        expect(store.getState().products).toEqual([mockProducts[0]]);
      });
    });

    describe('Product CRUD Operations', () => {
      beforeEach(() => {
        store.setState({ products: [...mockProducts] });
      });

      describe('Creating Products', () => {
        it('should create a new product successfully', async () => {
          const { createProduct } = await import('../services/api');
          const newProductData = {
            name: 'New Product',
            price: 39.99,
            category: 'clothing',
            description: 'A brand new product',
          };
          const createdProduct = { ...mockProduct, id: '4', ...newProductData };
          vi.mocked(createProduct).mockResolvedValue(createdProduct);

          await store.createProduct(newProductData);

          expect(store.getState().products).toContainEqual(createdProduct);
          expect(store.getState().error).toBeNull();
        });

        it('should handle product creation errors', async () => {
          const { createProduct } = await import('../services/api');
          const error = new Error('Validation failed');
          vi.mocked(createProduct).mockRejectedValue(error);

          const newProductData = { name: 'Invalid Product', price: -1 };
          await store.createProduct(newProductData);

          expect(store.getState().error).toBe('Validation failed');
          expect(store.getState().products).toHaveLength(3); // Original count
        });

        it('should validate required fields before creation', async () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const invalidData = { name: '', price: null } as any;

          await store.createProduct(invalidData);

          expect(store.getState().error).toContain('required');
        });

        it('should optimize product list after creation', async () => {
          const { createProduct } = await import('../services/api');
          const newProduct = { ...mockProduct, id: '4', name: 'New Product' };
          vi.mocked(createProduct).mockResolvedValue(newProduct);

          await store.createProduct({ name: 'New Product', price: 25.99 });

          const products = store.getState().products;
          expect(products).toHaveLength(4);
          expect(products[products.length - 1]).toEqual(newProduct);
        });
      });

      describe('Updating Products', () => {
        it('should update an existing product', async () => {
          const { updateProduct } = await import('../services/api');
          const updates = { name: 'Updated Product', price: 35.99 };
          const updatedProduct = { ...mockProduct, ...updates };
          vi.mocked(updateProduct).mockResolvedValue(updatedProduct);

          await store.updateProduct('1', updates);

          const products = store.getState().products;
          const updated = products.find((p) => p.id === '1');
          expect(updated).toEqual(updatedProduct);
          expect(store.getState().error).toBeNull();
        });

        it('should handle update errors', async () => {
          const { updateProduct } = await import('../services/api');
          const error = new Error('Update failed');
          vi.mocked(updateProduct).mockRejectedValue(error);

          await store.updateProduct('1', { name: 'Failed Update' });

          expect(store.getState().error).toBe('Update failed');
          // Original product should remain unchanged
          const original = store.getState().products.find((p) => p.id === '1');
          expect(original?.name).toBe('Test Product');
        });

        it('should handle updating non-existent product', async () => {
          await store.updateProduct('999', { name: 'Non-existent' });

          expect(store.getState().error).toContain('not found');
        });

        it('should update selected product if it matches', async () => {
          const { updateProduct } = await import('../services/api');
          const updates = { name: 'Updated Selected' };
          const updatedProduct = { ...mockProduct, ...updates };
          vi.mocked(updateProduct).mockResolvedValue(updatedProduct);

          store.selectProduct('1');
          await store.updateProduct('1', updates);

          expect(store.getState().selectedProduct).toEqual(updatedProduct);
        });

        it('should handle partial updates', async () => {
          const { updateProduct } = await import('../services/api');
          const partialUpdate = { price: 99.99 };
          const updatedProduct = { ...mockProduct, ...partialUpdate };
          vi.mocked(updateProduct).mockResolvedValue(updatedProduct);

          await store.updateProduct('1', partialUpdate);

          const updated = store.getState().products.find((p) => p.id === '1');
          expect(updated?.price).toBe(99.99);
          expect(updated?.name).toBe('Test Product'); // Should remain unchanged
        });
      });

      describe('Deleting Products', () => {
        it('should delete a product successfully', async () => {
          const { deleteProduct } = await import('../services/api');
          vi.mocked(deleteProduct).mockResolvedValue(undefined);

          await store.deleteProduct('1');

          const products = store.getState().products;
          expect(products.find((p) => p.id === '1')).toBeUndefined();
          expect(products).toHaveLength(2);
        });

        it('should handle deletion errors', async () => {
          const { deleteProduct } = await import('../services/api');
          const error = new Error('Deletion failed');
          vi.mocked(deleteProduct).mockRejectedValue(error);

          await store.deleteProduct('1');

          expect(store.getState().error).toBe('Deletion failed');
          expect(store.getState().products).toHaveLength(3); // Should remain unchanged
        });

        it('should clear selected product if deleted', async () => {
          const { deleteProduct } = await import('../services/api');
          vi.mocked(deleteProduct).mockResolvedValue(undefined);

          store.selectProduct('1');
          await store.deleteProduct('1');

          expect(store.getState().selectedProduct).toBeNull();
        });

        it('should remove from multiple selection if deleted', async () => {
          const { deleteProduct } = await import('../services/api');
          vi.mocked(deleteProduct).mockResolvedValue(undefined);

          store.selectMultipleProducts(['1', '2', '3']);
          await store.deleteProduct('1');

          expect(store.getState().selectedProducts).toEqual(['2', '3']);
        });

        it('should handle deleting non-existent product gracefully', async () => {
          const { deleteProduct } = await import('../services/api');
          vi.mocked(deleteProduct).mockResolvedValue(undefined);

          await store.deleteProduct('999');

          expect(store.getState().products).toHaveLength(3);
          expect(store.getState().error).toBeNull();
        });
      });
    });
  });

  describe('Product Selection', () => {
    beforeEach(() => {
      store.setState({ products: [...mockProducts] });
    });

    describe('Single Selection', () => {
      it('should select product by id', () => {
        store.selectProduct('1');
        expect(store.getState().selectedProduct).toEqual(mockProduct);
      });

      it('should handle selecting non-existent product', () => {
        store.selectProduct('999');
        expect(store.getState().selectedProduct).toBeNull();
      });

      it('should clear selection when passed null', () => {
        store.selectProduct('1');
        store.selectProduct(null);
        expect(store.getState().selectedProduct).toBeNull();
      });

      it('should clear selection when passed undefined', () => {
        store.selectProduct('1');
        store.selectProduct(undefined);
        expect(store.getState().selectedProduct).toBeNull();
      });

      it('should handle rapid selection changes', () => {
        store.selectProduct('1');
        store.selectProduct('2');
        store.selectProduct('3');

        expect(store.getState().selectedProduct?.id).toBe('3');
      });
    });

    describe('Multiple Selection', () => {
      it('should select multiple products', () => {
        store.selectMultipleProducts(['1', '2']);
        expect(store.getState().selectedProducts).toEqual(['1', '2']);
      });

      it('should toggle product in multiple selection', () => {
        store.selectMultipleProducts(['1']);
        store.toggleProductSelection('2');
        expect(store.getState().selectedProducts).toEqual(['1', '2']);

        store.toggleProductSelection('1');
        expect(store.getState().selectedProducts).toEqual(['2']);
      });

      it('should clear multiple selection', () => {
        store.selectMultipleProducts(['1', '2', '3']);
        store.clearMultipleSelection();
        expect(store.getState().selectedProducts).toEqual([]);
      });

      it('should select all products', () => {
        store.selectAllProducts();
        expect(store.getState().selectedProducts).toEqual(['1', '2', '3']);
      });

      it('should handle selecting non-existent products', () => {
        store.selectMultipleProducts(['1', '999', '2']);
        expect(store.getState().selectedProducts).toEqual(['1', '2']);
      });

      it('should get selected product objects', () => {
        store.selectMultipleProducts(['1', '3']);
        const selectedProducts = store.getSelectedProducts();
        expect(selectedProducts).toHaveLength(2);
        expect(selectedProducts[0].id).toBe('1');
        expect(selectedProducts[1].id).toBe('3');
      });
    });
  });

  describe('Product Filtering', () => {
    beforeEach(() => {
      store.setState({ products: [...mockProducts] });
    });

    describe('Basic Filtering', () => {
      it('should filter products by category', () => {
        store.setFilters({ category: 'electronics' });
        const filtered = store.getFilteredProducts();

        expect(filtered).toHaveLength(2);
        expect(filtered.every((p) => p.category === 'electronics')).toBe(true);
      });

      it('should filter products by price range', () => {
        store.setFilters({ minPrice: 50, maxPrice: 150 });
        const filtered = store.getFilteredProducts();

        expect(filtered).toHaveLength(1);
        expect(filtered[0].price).toBe(49.99);
      });

      it('should filter products by stock status', () => {
        store.setFilters({ inStock: true });
        const filtered = store.getFilteredProducts();

        expect(filtered).toHaveLength(2);
        expect(filtered.every((p) => p.inStock === true)).toBe(true);
      });

      it('should filter products by text search', () => {
        store.setFilters({ search: 'Premium' });
        const filtered = store.getFilteredProducts();

        expect(filtered).toHaveLength(1);
        expect(filtered[0].name).toContain('Premium');
      });

      it('should perform case-insensitive search', () => {
        store.setFilters({ search: 'premium' });
        const filtered = store.getFilteredProducts();

        expect(filtered).toHaveLength(1);
        expect(filtered[0].name).toContain('Premium');
      });

      it('should search in multiple fields', () => {
        store.setFilters({ search: 'TestBrand' });
        const filtered = store.getFilteredProducts();

        expect(filtered).toHaveLength(1);
        expect(filtered[0].brand).toBe('TestBrand');
      });
    });

    describe('Advanced Filtering', () => {
      it('should filter by rating range', () => {
        store.setFilters({ minRating: 4.0, maxRating: 5.0 });
        const filtered = store.getFilteredProducts();

        expect(filtered).toHaveLength(2);
        expect(filtered.every((p) => p.rating >= 4.0 && p.rating <= 5.0)).toBe(true);
      });

      it('should filter by tags', () => {
        store.setFilters({ tags: ['popular'] });
        const filtered = store.getFilteredProducts();

        expect(filtered).toHaveLength(1);
        expect(filtered[0].tags).toContain('popular');
      });

      it('should filter by multiple tags (OR logic)', () => {
        store.setFilters({ tags: ['popular', 'premium'] });
        const filtered = store.getFilteredProducts();

        expect(filtered).toHaveLength(2);
      });

      it('should filter by brand', () => {
        store.setFilters({ brand: 'TestBrand' });
        const filtered = store.getFilteredProducts();

        expect(filtered).toHaveLength(1);
        expect(filtered[0].brand).toBe('TestBrand');
      });

      it('should filter by date range', () => {
        const startDate = new Date('2023-01-02');
        const endDate = new Date('2023-01-03');
        store.setFilters({ createdAfter: startDate, createdBefore: endDate });
        const filtered = store.getFilteredProducts();

        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe('2');
      });
    });

    describe('Complex Filtering', () => {
      it('should combine multiple filters with AND logic', () => {
        store.setFilters({
          category: 'electronics',
          inStock: true,
          minPrice: 25,
          minRating: 4.0,
        });
        const filtered = store.getFilteredProducts();

        expect(filtered).toHaveLength(2);
        expect(
          filtered.every(
            (p) =>
              p.category === 'electronics' && p.inStock === true && p.price >= 25 && p.rating >= 4.0
          )
        ).toBe(true);
      });

      it('should return empty array when no products match', () => {
        store.setFilters({ category: 'non-existent' });
        const filtered = store.getFilteredProducts();

        expect(filtered).toHaveLength(0);
      });

      it('should handle invalid filter values gracefully', () => {
        store.setFilters({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          minPrice: 'invalid' as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          maxPrice: null as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          inStock: 'yes' as any,
        });
        const filtered = store.getFilteredProducts();

        // Should not crash and return all products
        expect(filtered).toHaveLength(3);
      });

      it('should clear filters', () => {
        store.setFilters({ category: 'electronics' });
        store.clearFilters();

        expect(store.getState().filters).toEqual({});
        expect(store.getFilteredProducts()).toHaveLength(3);
      });

      it('should update filters incrementally', () => {
        store.setFilters({ category: 'electronics' });
        store.updateFilters({ inStock: true });

        const filters = store.getState().filters;
        expect(filters.category).toBe('electronics');
        expect(filters.inStock).toBe(true);
      });
    });
  });

  describe('Product Sorting', () => {
    beforeEach(() => {
      store.setState({ products: [...mockProducts] });
    });

    describe('Basic Sorting', () => {
      it('should sort products by name ascending', () => {
        store.setSorting({ field: 'name', direction: 'asc' });
        const sorted = store.getSortedProducts();

        expect(sorted[0].name).toBe('Another Product');
        expect(sorted[1].name).toBe('Premium Product');
        expect(sorted[2].name).toBe('Test Product');
      });

      it('should sort products by name descending', () => {
        store.setSorting({ field: 'name', direction: 'desc' });
        const sorted = store.getSortedProducts();

        expect(sorted[0].name).toBe('Test Product');
        expect(sorted[1].name).toBe('Premium Product');
        expect(sorted[2].name).toBe('Another Product');
      });

      it('should sort products by price ascending', () => {
        store.setSorting({ field: 'price', direction: 'asc' });
        const sorted = store.getSortedProducts();

        expect(sorted[0].price).toBe(29.99);
        expect(sorted[1].price).toBe(49.99);
        expect(sorted[2].price).toBe(199.99);
      });

      it('should sort products by price descending', () => {
        store.setSorting({ field: 'price', direction: 'desc' });
        const sorted = store.getSortedProducts();

        expect(sorted[0].price).toBe(199.99);
        expect(sorted[1].price).toBe(49.99);
        expect(sorted[2].price).toBe(29.99);
      });

      it('should sort products by rating', () => {
        store.setSorting({ field: 'rating', direction: 'desc' });
        const sorted = store.getSortedProducts();

        expect(sorted[0].rating).toBe(4.9);
        expect(sorted[1].rating).toBe(4.5);
        expect(sorted[2].rating).toBe(3.8);
      });

      it('should sort products by creation date', () => {
        store.setSorting({ field: 'createdAt', direction: 'desc' });
        const sorted = store.getSortedProducts();

        expect(sorted[0].id).toBe('3'); // Latest
        expect(sorted[1].id).toBe('2');
        expect(sorted[2].id).toBe('1'); // Earliest
      });
    });

    describe('Advanced Sorting', () => {
      it('should handle multi-level sorting', () => {
        // Add products with same category for testing
        const sameCategory = [
          { ...mockProduct, id: '4', name: 'A Product', category: 'electronics', price: 50 },
          { ...mockProduct, id: '5', name: 'B Product', category: 'electronics', price: 30 },
        ];
        store.setState({ products: [...mockProducts, ...sameCategory] });

        store.setSorting({
          field: 'category',
          direction: 'asc',
          secondaryField: 'price',
          secondaryDirection: 'asc',
        });

        const sorted = store.getSortedProducts();
        const electronics = sorted.filter((p) => p.category === 'electronics');

        // Within electronics category, should be sorted by price
        expect(electronics[0].price).toBeLessThan(electronics[1].price);
      });

      it('should handle sorting with null/undefined values', () => {
        const productsWithNulls = [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { ...mockProduct, price: null as any },
          { ...mockProduct, id: '4', price: 25.99 },
        ];
        store.setState({ products: productsWithNulls });

        store.setSorting({ field: 'price', direction: 'asc' });
        const sorted = store.getSortedProducts();

        // Should not crash and handle nulls appropriately
        expect(sorted).toHaveLength(2);
      });

      it('should maintain sort order when products are added', async () => {
        store.setSorting({ field: 'price', direction: 'asc' });

        const { createProduct } = await import('../services/api');
        const newProduct = { ...mockProduct, id: '4', price: 35.99 };
        vi.mocked(createProduct).mockResolvedValue(newProduct);

        await store.createProduct({ name: 'New Product', price: 35.99 });
        const sorted = store.getSortedProducts();

        expect(sorted.map((p) => p.price)).toEqual([29.99, 35.99, 49.99, 199.99]);
      });

      it('should clear sorting', () => {
        store.setSorting({ field: 'price', direction: 'desc' });
        store.clearSorting();

        const state = store.getState();
        expect(state.sortBy).toBeUndefined();
        expect(state.sortOrder).toBe('asc');
      });
    });
  });

  describe('Pagination', () => {
    const manyProducts = Array.from({ length: 25 }, (_, i) => ({
      ...mockProduct,
      id: String(i + 1),
      name: `Product ${i + 1}`,
      price: 10 + i * 5,
    }));

    beforeEach(() => {
      store.setState({ products: manyProducts });
    });

    describe('Basic Pagination', () => {
      it('should paginate products correctly', () => {
        store.setPagination({ page: 1, pageSize: 10 });
        const paginated = store.getPaginatedProducts();

        expect(paginated).toHaveLength(10);
        expect(paginated[0].name).toBe('Product 1');
        expect(paginated[9].name).toBe('Product 10');
      });

      it('should handle second page', () => {
        store.setPagination({ page: 2, pageSize: 10 });
        const paginated = store.getPaginatedProducts();

        expect(paginated).toHaveLength(10);
        expect(paginated[0].name).toBe('Product 11');
        expect(paginated[9].name).toBe('Product 20');
      });

      it('should handle last page with fewer items', () => {
        store.setPagination({ page: 3, pageSize: 10 });
        const paginated = store.getPaginatedProducts();

        expect(paginated).toHaveLength(5);
        expect(paginated[0].name).toBe('Product 21');
        expect(paginated[4].name).toBe('Product 25');
      });

      it('should calculate total pages correctly', () => {
        store.setPagination({ page: 1, pageSize: 10 });
        expect(store.getTotalPages()).toBe(3);

        store.setPagination({ page: 1, pageSize: 7 });
        expect(store.getTotalPages()).toBe(4);
      });

      it('should handle empty products for pagination', () => {
        store.setState({ products: [] });
        store.setPagination({ page: 1, pageSize: 10 });

        expect(store.getPaginatedProducts()).toEqual([]);
        expect(store.getTotalPages()).toBe(0);
      });
    });

    describe('Advanced Pagination', () => {
      it('should handle out of bounds page numbers', () => {
        store.setPagination({ page: 999, pageSize: 10 });
        const paginated = store.getPaginatedProducts();

        expect(paginated).toEqual([]);
      });

      it('should handle invalid page size', () => {
        store.setPagination({ page: 1, pageSize: 0 });
        const state = store.getState();

        expect(state.pageSize).toBeGreaterThan(0); // Should use default
      });

      it('should work with filtering and pagination', () => {
        store.setFilters({ search: 'Product 1' }); // Should match Product 1, 10-19
        store.setPagination({ page: 1, pageSize: 5 });

        const filtered = store.getFilteredProducts();
        const paginated = store.getPaginatedProducts();

        expect(filtered).toHaveLength(11); // Product 1, 10-19
        expect(paginated).toHaveLength(5); // First 5 of filtered
      });

      it('should work with sorting and pagination', () => {
        store.setSorting({ field: 'price', direction: 'desc' });
        store.setPagination({ page: 1, pageSize: 5 });

        const paginated = store.getPaginatedProducts();

        expect(paginated[0].price).toBeGreaterThan(paginated[4].price);
      });

      it('should reset to first page when filters change', () => {
        store.setPagination({ page: 3, pageSize: 10 });
        store.setFilters({ search: 'Product' });

        expect(store.getState().currentPage).toBe(1);
      });
    });
  });

  describe('Product Statistics and Analytics', () => {
    beforeEach(() => {
      store.setState({ products: [...mockProducts] });
    });

    describe('Basic Statistics', () => {
      it('should calculate total product count', () => {
        expect(store.getTotalProductCount()).toBe(3);
      });

      it('should calculate products in stock count', () => {
        expect(store.getInStockCount()).toBe(2);
      });

      it('should calculate out of stock count', () => {
        expect(store.getOutOfStockCount()).toBe(1);
      });

      it('should calculate average price', () => {
        const average = store.getAveragePrice();
        const expectedAverage = (29.99 + 49.99 + 199.99) / 3;
        expect(average).toBeCloseTo(expectedAverage, 2);
      });

      it('should get price range', () => {
        const range = store.getPriceRange();
        expect(range.min).toBe(29.99);
        expect(range.max).toBe(199.99);
      });

      it('should get unique categories', () => {
        const categories = store.getUniqueCategories();
        expect(categories).toContain('electronics');
        expect(categories).toContain('books');
        expect(categories).toHaveLength(2);
      });

      it('should get unique brands', () => {
        const brands = store.getUniqueBrands();
        expect(brands).toContain('TestBrand');
        expect(brands).toContain('AnotherBrand');
        expect(brands).toContain('PremiumBrand');
        expect(brands).toHaveLength(3);
      });
    });

    describe('Advanced Analytics', () => {
      it('should get category distribution', () => {
        const distribution = store.getCategoryDistribution();
        expect(distribution.electronics).toBe(2);
        expect(distribution.books).toBe(1);
      });

      it('should get price distribution by ranges', () => {
        const ranges = [0, 50, 100, 200];
        const distribution = store.getPriceDistribution(ranges);

        expect(distribution['0-50']).toBe(2);
        expect(distribution['100-200']).toBe(1);
      });

      it('should get top rated products', () => {
        const topRated = store.getTopRatedProducts(2);
        expect(topRated).toHaveLength(2);
        expect(topRated[0].rating).toBe(4.9);
        expect(topRated[1].rating).toBe(4.5);
      });

      it('should get products by stock status', () => {
        const stockStats = store.getStockStatistics();
        expect(stockStats.inStock).toBe(2);
        expect(stockStats.outOfStock).toBe(1);
        expect(stockStats.stockPercentage).toBeCloseTo(66.67, 1);
      });

      it('should handle empty product list for statistics', () => {
        store.setState({ products: [] });

        expect(store.getTotalProductCount()).toBe(0);
        expect(store.getInStockCount()).toBe(0);
        expect(store.getOutOfStockCount()).toBe(0);
        expect(store.getAveragePrice()).toBe(0);
        expect(store.getUniqueCategories()).toEqual([]);
        expect(store.getCategoryDistribution()).toEqual({});
      });
    });

    describe('Performance Metrics', () => {
      it('should track most viewed products', () => {
        store.trackProductView('1');
        store.trackProductView('1');
        store.trackProductView('2');

        const mostViewed = store.getMostViewedProducts(2);
        expect(mostViewed[0].id).toBe('1');
        expect(mostViewed[0].viewCount).toBe(2);
      });

      it('should get recently added products', () => {
        const recent = store.getRecentlyAddedProducts(2);
        expect(recent).toHaveLength(2);
        expect(recent[0].id).toBe('3'); // Most recent
        expect(recent[1].id).toBe('2');
      });

      it('should calculate inventory value', () => {
        const totalValue = store.getTotalInventoryValue();
        const expectedValue = 29.99 + 199.99; // Only in-stock items
        expect(totalValue).toBeCloseTo(expectedValue, 2);
      });
    });
  });

  describe('Bulk Operations', () => {
    beforeEach(() => {
      store.setState({ products: [...mockProducts] });
    });

    describe('Bulk Updates', () => {
      it('should bulk update multiple products', async () => {
        const { updateProduct } = await import('../services/api');
        const updatedProduct1 = { ...mockProducts[0], category: 'updated' };
        const updatedProduct2 = { ...mockProducts[1], category: 'updated' };

        vi.mocked(updateProduct)
          .mockResolvedValueOnce(updatedProduct1)
          .mockResolvedValueOnce(updatedProduct2);

        await store.bulkUpdateProducts(['1', '2'], { category: 'updated' });

        const products = store.getState().products;
        const updated1 = products.find((p) => p.id === '1');
        const updated2 = products.find((p) => p.id === '2');

        expect(updated1?.category).toBe('updated');
        expect(updated2?.category).toBe('updated');
      });

      it('should handle partial bulk update failures', async () => {
        const { updateProduct } = await import('../services/api');
        const updatedProduct = { ...mockProducts[0], category: 'updated' };

        vi.mocked(updateProduct)
          .mockResolvedValueOnce(updatedProduct)
          .mockRejectedValueOnce(new Error('Update failed'));

        await store.bulkUpdateProducts(['1', '2'], { category: 'updated' });

        const products = store.getState().products;
        const updated1 = products.find((p) => p.id === '1');
        const unchanged2 = products.find((p) => p.id === '2');

        expect(updated1?.category).toBe('updated');
        expect(unchanged2?.category).toBe('books'); // Should remain unchanged
        expect(store.getState().error).toContain('Some products failed to update');
      });

      it('should provide progress callback for bulk operations', async () => {
        const { updateProduct } = await import('../services/api');
        vi.mocked(updateProduct).mockResolvedValue({ ...mockProducts[0], category: 'updated' });

        const progressCallback = vi.fn();
        await store.bulkUpdateProducts(['1', '2', '3'], { category: 'updated' }, progressCallback);

        expect(progressCallback).toHaveBeenCalledWith(1, 3);
        expect(progressCallback).toHaveBeenCalledWith(2, 3);
        expect(progressCallback).toHaveBeenCalledWith(3, 3);
      });
    });

    describe('Bulk Deletions', () => {
      it('should bulk delete multiple products', async () => {
        const { deleteProduct } = await import('../services/api');
        vi.mocked(deleteProduct).mockResolvedValue(undefined);

        await store.bulkDeleteProducts(['1', '2']);

        const products = store.getState().products;
        expect(products).toHaveLength(1);
        expect(products[0].id).toBe('3');
      });

      it('should handle partial bulk deletion failures', async () => {
        const { deleteProduct } = await import('../services/api');

        vi.mocked(deleteProduct)
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error('Deletion failed'));

        await store.bulkDeleteProducts(['1', '2']);

        const products = store.getState().products;
        expect(products).toHaveLength(2); // One deleted, one failed
        expect(products.find((p) => p.id === '1')).toBeUndefined();
        expect(products.find((p) => p.id === '2')).toBeDefined();
      });

      it('should clear selections after bulk deletion', async () => {
        const { deleteProduct } = await import('../services/api');
        vi.mocked(deleteProduct).mockResolvedValue(undefined);

        store.selectMultipleProducts(['1', '2', '3']);
        await store.bulkDeleteProducts(['1', '2']);

        expect(store.getState().selectedProducts).toEqual(['3']);
      });
    });

    describe('Bulk Export/Import', () => {
      it('should export selected products', () => {
        store.selectMultipleProducts(['1', '2']);
        const exported = store.exportSelectedProducts();

        expect(exported).toHaveLength(2);
        expect(exported[0].id).toBe('1');
        expect(exported[1].id).toBe('2');
      });

      it('should export all products when none selected', () => {
        const exported = store.exportSelectedProducts();

        expect(exported).toHaveLength(3);
      });

      it('should import products from data', async () => {
        const { createProduct } = await import('../services/api');
        const importData = [
          { name: 'Imported 1', price: 25.99, category: 'imported' },
          { name: 'Imported 2', price: 35.99, category: 'imported' },
        ];

        vi.mocked(createProduct)
          .mockResolvedValueOnce({ ...mockProduct, id: '4', ...importData[0] })
          .mockResolvedValueOnce({ ...mockProduct, id: '5', ...importData[1] });

        const result = await store.importProducts(importData);

        expect(result.successful).toBe(2);
        expect(result.failed).toBe(0);
        expect(store.getState().products).toHaveLength(5);
      });

      it('should handle import validation errors', async () => {
        const invalidData = [
          { name: '', price: -1 }, // Invalid data
          { name: 'Valid', price: 25.99, category: 'valid' },
        ];

        const result = await store.importProducts(invalidData);

        expect(result.successful).toBe(1);
        expect(result.failed).toBe(1);
        expect(result.errors).toHaveLength(1);
      });
    });
  });

  describe('Store Persistence', () => {
    describe('Auto-save Functionality', () => {
      it('should auto-save state changes', async () => {
        const { saveToStorage } = await import('../utils/storage');

        store.enableAutoSave();
        store.setFilters({ category: 'electronics' });

        // Allow time for debounced save
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(saveToStorage).toHaveBeenCalledWith('productStore', store.getState());
      });

      it('should restore state from storage', async () => {
        const { loadFromStorage } = await import('../utils/storage');
        const savedState = {
          products: [mockProduct],
          filters: { category: 'electronics' },
          selectedProduct: mockProduct,
        };
        vi.mocked(loadFromStorage).mockReturnValue(savedState);

        const restoredStore = createProductStore();
        await restoredStore.restoreFromStorage();

        const state = restoredStore.getState();
        expect(state.products).toEqual([mockProduct]);
        expect(state.filters).toEqual({ category: 'electronics' });
        expect(state.selectedProduct).toEqual(mockProduct);
      });

      it('should handle storage errors gracefully', async () => {
        const { loadFromStorage } = await import('../utils/storage');
        vi.mocked(loadFromStorage).mockImplementation(() => {
          throw new Error('Storage error');
        });

        const restoredStore = createProductStore();
        await restoredStore.restoreFromStorage();

        // Should use default state when storage fails
        expect(restoredStore.getState().products).toEqual([]);
      });
    });

    describe('Manual Save/Load', () => {
      it('should manually save state', async () => {
        const { saveToStorage } = await import('../utils/storage');

        await store.saveState();

        expect(saveToStorage).toHaveBeenCalledWith('productStore', store.getState());
      });

      it('should manually load state', async () => {
        const { loadFromStorage } = await import('../utils/storage');
        const savedState = { products: [mockProduct] };
        vi.mocked(loadFromStorage).mockReturnValue(savedState);

        await store.loadState();

        expect(store.getState().products).toEqual([mockProduct]);
      });

      it('should clear saved state', async () => {
        const { saveToStorage } = await import('../utils/storage');

        await store.clearSavedState();

        expect(saveToStorage).toHaveBeenCalledWith('productStore', null);
      });
    });
  });

  describe('Store Subscriptions and Events', () => {
    describe('State Subscriptions', () => {
      it('should notify subscribers on state change', () => {
        const subscriber = vi.fn();
        const unsubscribe = store.subscribe(subscriber);

        store.setFilters({ category: 'electronics' });

        expect(subscriber).toHaveBeenCalledWith(store.getState());
        unsubscribe();
      });

      it('should not notify unsubscribed listeners', () => {
        const subscriber = vi.fn();
        const unsubscribe = store.subscribe(subscriber);
        unsubscribe();

        store.setFilters({ category: 'electronics' });

        expect(subscriber).not.toHaveBeenCalled();
      });

      it('should handle multiple subscribers', () => {
        const subscriber1 = vi.fn();
        const subscriber2 = vi.fn();

        const unsub1 = store.subscribe(subscriber1);
        const unsub2 = store.subscribe(subscriber2);

        store.setFilters({ category: 'electronics' });

        expect(subscriber1).toHaveBeenCalled();
        expect(subscriber2).toHaveBeenCalled();

        unsub1();
        unsub2();
      });

      it('should handle subscriber errors gracefully', () => {
        const errorSubscriber = vi.fn().mockImplementation(() => {
          throw new Error('Subscriber error');
        });
        const normalSubscriber = vi.fn();

        store.subscribe(errorSubscriber);
        store.subscribe(normalSubscriber);

        expect(() => store.setFilters({ category: 'electronics' })).not.toThrow();
        expect(normalSubscriber).toHaveBeenCalled();
      });
    });

    describe('Selective Subscriptions', () => {
      it('should subscribe to specific state changes', () => {
        const productsSubscriber = vi.fn();
        const filtersSubscriber = vi.fn();

        store.subscribeToProducts(productsSubscriber);
        store.subscribeToFilters(filtersSubscriber);

        store.setState({ products: [mockProduct] });
        expect(productsSubscriber).toHaveBeenCalled();
        expect(filtersSubscriber).not.toHaveBeenCalled();

        vi.clearAllMocks();

        store.setFilters({ category: 'electronics' });
        expect(filtersSubscriber).toHaveBeenCalled();
        expect(productsSubscriber).not.toHaveBeenCalled();
      });

      it('should subscribe to selection changes', () => {
        const selectionSubscriber = vi.fn();
        store.subscribeToSelection(selectionSubscriber);

        store.selectProduct('1');
        expect(selectionSubscriber).toHaveBeenCalledWith(null, '1');

        store.selectProduct('2');
        expect(selectionSubscriber).toHaveBeenCalledWith('1', '2');
      });
    });

    describe('Event System', () => {
      it('should emit events for major operations', async () => {
        const eventListener = vi.fn();
        store.addEventListener('productCreated', eventListener);

        const { createProduct } = await import('../services/api');
        const newProduct = { ...mockProduct, id: '4' };
        vi.mocked(createProduct).mockResolvedValue(newProduct);

        await store.createProduct({ name: 'New Product', price: 25.99 });

        expect(eventListener).toHaveBeenCalledWith({
          type: 'productCreated',
          product: newProduct,
          timestamp: expect.any(Date),
        });
      });

      it('should support event listener removal', async () => {
        const eventListener = vi.fn();
        const removeListener = store.addEventListener('productUpdated', eventListener);

        removeListener();

        const { updateProduct } = await import('../services/api');
        vi.mocked(updateProduct).mockResolvedValue({ ...mockProduct, name: 'Updated' });

        store.setState({ products: [mockProduct] });
        await store.updateProduct('1', { name: 'Updated' });

        expect(eventListener).not.toHaveBeenCalled();
      });
    });
  });

  describe('Performance and Optimization', () => {
    describe('Large Dataset Handling', () => {
      it('should handle large product datasets efficiently', () => {
        const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
          ...mockProduct,
          id: String(i + 1),
          name: `Product ${i + 1}`,
        }));

        const startTime = performance.now();
        store.setState({ products: largeDataset });
        store.setFilters({ category: 'electronics' });
        const filtered = store.getFilteredProducts();
        const endTime = performance.now();

        expect(filtered).toHaveLength(10000);
        expect(endTime - startTime).toBeLessThan(200); // Should complete reasonably fast
      });

      it('should optimize filtering with indexing', () => {
        const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
          ...mockProduct,
          id: String(i + 1),
          category: i % 2 === 0 ? 'electronics' : 'books',
        }));

        store.setState({ products: largeDataset });

        const startTime = performance.now();
        store.setFilters({ category: 'electronics' });
        const filtered = store.getFilteredProducts();
        const endTime = performance.now();

        expect(filtered).toHaveLength(500);
        expect(endTime - startTime).toBeLessThan(50);
      });

      it('should use virtual scrolling for large lists', () => {
        const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
          ...mockProduct,
          id: String(i + 1),
        }));

        store.setState({ products: largeDataset });

        const virtualList = store.getVirtualizedProducts({
          startIndex: 100,
          endIndex: 199,
          overscan: 5,
        });

        expect(virtualList.items).toHaveLength(100);
        expect(virtualList.startIndex).toBe(95); // With overscan
        expect(virtualList.endIndex).toBe(204);
      });
    });

    describe('Memory Management', () => {
      it('should properly cleanup resources on destroy', () => {
        const subscriber = vi.fn();
        const unsubscribe = store.subscribe(subscriber);

        store.destroy();

        store.setFilters({ category: 'electronics' });
        expect(subscriber).not.toHaveBeenCalled();
      });

      it('should debounce rapid state changes', async () => {
        const subscriber = vi.fn();
        store.subscribe(subscriber);

        // Rapid filter changes
        store.setFilters({ category: 'electronics' });
        store.setFilters({ category: 'books' });
        store.setFilters({ category: 'clothing' });

        // Wait for debounce
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Should only notify once for the final state
        expect(subscriber).toHaveBeenCalledTimes(1);
        expect(store.getState().filters.category).toBe('clothing');
      });

      it('should implement weak references for large objects', () => {
        const largeProduct = {
          ...mockProduct,
          largeData: new Array(10000).fill('data'),
        };

        store.setState({ products: [largeProduct] });
        store.selectProduct('1');

        // Simulate memory pressure
        if (global.gc) {
          global.gc();
        }

        // Selected product should still be accessible
        expect(store.getState().selectedProduct).toBeDefined();
      });
    });

    describe('Caching and Memoization', () => {
      it('should cache filtered results', () => {
        store.setState({ products: mockProducts });

        const filters = { category: 'electronics' };
        store.setFilters(filters);

        const firstCall = store.getFilteredProducts();
        const secondCall = store.getFilteredProducts();

        // Results should be the same object (cached)
        expect(firstCall).toBe(secondCall);
      });

      it('should invalidate cache when products change', async () => {
        store.setState({ products: mockProducts });
        store.setFilters({ category: 'electronics' });

        const beforeUpdate = store.getFilteredProducts();

        const { createProduct } = await import('../services/api');
        const newProduct = { ...mockProduct, id: '4', category: 'electronics' };
        vi.mocked(createProduct).mockResolvedValue(newProduct);

        await store.createProduct({ name: 'New Product' });

        const afterUpdate = store.getFilteredProducts();

        expect(beforeUpdate).not.toBe(afterUpdate);
        expect(afterUpdate).toHaveLength(3);
      });

      it('should memoize expensive computations', () => {
        const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
          ...mockProduct,
          id: String(i + 1),
          price: Math.random() * 100,
        }));

        store.setState({ products: largeDataset });

        const firstCalc = store.getAveragePrice();
        const secondCalc = store.getAveragePrice();

        expect(firstCalc).toBe(secondCalc);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    describe('API Error Handling', () => {
      it('should handle network timeouts', async () => {
        const { fetchProducts } = await import('../services/api');
        const timeoutError = new Error('Request timeout');
        timeoutError.name = 'TimeoutError';
        vi.mocked(fetchProducts).mockRejectedValue(timeoutError);

        await store.fetchProducts();

        expect(store.getState().error).toContain('timeout');
        expect(store.getState().loading).toBe(false);
      });

      it('should handle rate limiting', async () => {
        const { fetchProducts } = await import('../services/api');
        const rateLimitError = new Error('Too many requests');
        rateLimitError.name = 'RateLimitError';
        vi.mocked(fetchProducts).mockRejectedValue(rateLimitError);

        await store.fetchProducts();

        expect(store.getState().error).toContain('rate limit');
      });

      it('should implement retry logic for failed requests', async () => {
        const { fetchProducts } = await import('../services/api');
        vi.mocked(fetchProducts)
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce(mockProducts);

        await store.fetchProductsWithRetry({ maxRetries: 3 });

        expect(fetchProducts).toHaveBeenCalledTimes(3);
        expect(store.getState().products).toEqual(mockProducts);
      });

      it('should handle malformed API responses', async () => {
        const { fetchProducts } = await import('../services/api');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(fetchProducts).mockResolvedValue(null as any);

        await store.fetchProducts();

        expect(store.getState().error).toContain('Invalid response');
        expect(store.getState().products).toEqual([]);
      });
    });

    describe('Data Validation', () => {
      it('should validate product data structure', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invalidProduct = {
          id: '',
          name: null,
          price: 'invalid',
        } as any;

        expect(() => store.setState({ products: [invalidProduct] })).not.toThrow();

        // Should filter out invalid products
        expect(store.getState().products).toEqual([]);
      });

      it('should sanitize user input in filters', () => {
        const maliciousFilter = {
          search: '<script>alert("xss")</script>',
          category: "'; DROP TABLE products; --",
        };

        store.setFilters(maliciousFilter);

        const filters = store.getState().filters;
        expect(filters.search).not.toContain('<script>');
        expect(filters.category).not.toContain('DROP TABLE');
      });

      it('should handle circular references in product data', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const circularProduct: any = { ...mockProduct };
        circularProduct.self = circularProduct;

        expect(() => store.setState({ products: [circularProduct] })).not.toThrow();
      });
    });

    describe('Boundary Conditions', () => {
      it('should handle extremely large page sizes', () => {
        store.setState({ products: mockProducts });
        store.setPagination({ page: 1, pageSize: Number.MAX_SAFE_INTEGER });

        const paginated = store.getPaginatedProducts();
        expect(paginated).toEqual(mockProducts);
      });

      it('should handle negative prices in sorting', () => {
        const productsWithNegativePrices = [
          { ...mockProduct, price: -10 },
          { ...mockProduct, id: '2', price: 0 },
          { ...mockProduct, id: '3', price: 50 },
        ];

        store.setState({ products: productsWithNegativePrices });
        store.setSorting({ field: 'price', direction: 'asc' });

        const sorted = store.getSortedProducts();
        expect(sorted[0].price).toBe(-10);
        expect(sorted[2].price).toBe(50);
      });

      it('should handle Unicode in product names', () => {
        const unicodeProduct = {
          ...mockProduct,
          name: '🚀 Продукт тест 测试产品',
        };

        store.setState({ products: [unicodeProduct] });
        store.setFilters({ search: 'тест' });

        const filtered = store.getFilteredProducts();
        expect(filtered).toHaveLength(1);
      });

      it('should handle concurrent modifications', async () => {
        store.setState({ products: [...mockProducts] });

        // Simulate concurrent operations
        const operations = [
          store.updateProduct('1', { name: 'Update 1' }),
          store.updateProduct('1', { name: 'Update 2' }),
          store.deleteProduct('1'),
        ];

        const { updateProduct, deleteProduct } = await import('../services/api');
        vi.mocked(updateProduct).mockResolvedValue({ ...mockProduct, name: 'Updated' });
        vi.mocked(deleteProduct).mockResolvedValue(undefined);

        await Promise.allSettled(operations);

        // State should be consistent
        const products = store.getState().products;
        expect(products.find((p) => p.id === '1')).toBeUndefined();
      });
    });
  });

  describe('Integration and Compatibility', () => {
    describe('Framework Integration', () => {
      it('should work with React hooks pattern', () => {
        // let renderCount = 0; // Unused
        // const mockUseEffect = vi.fn((callback, deps) => { // Unused
        //   if (deps && deps.length === 0) {
        //     callback();
        //   }
        // });

        interface UseProductStoreReturn {
          products: Product[];
          loading: boolean;
          fetchProducts: (queryParams?: Record<string, unknown>, options?: { append?: boolean }) => Promise<void>;
        }

        const useProductStore = (): UseProductStoreReturn => {
          // renderCount++; // Unused
          return {
            products: store.getState().products,
            loading: store.getState().loading,
            fetchProducts: store.fetchProducts.bind(store),
          };
        };

        const hookResult = useProductStore();
        expect(hookResult.products).toBeDefined();
        expect(typeof hookResult.fetchProducts).toBe('function');
      });

      it('should integrate with state management libraries', () => {
        const reduxStyleDispatch = vi.fn();

        const enhancedStore = {
          ...store,
          dispatch: (action: { type: string; payload?: unknown }): void => {
            reduxStyleDispatch(action);
            switch (action.type) {
              case 'SET_FILTERS':
                store.setFilters(action.payload);
                break;
              case 'SELECT_PRODUCT':
                store.selectProduct(action.payload);
                break;
            }
          },
        };

        enhancedStore.dispatch({ type: 'SET_FILTERS', payload: { category: 'electronics' } });
        enhancedStore.dispatch({ type: 'SELECT_PRODUCT', payload: '1' });

        expect(reduxStyleDispatch).toHaveBeenCalledTimes(2);
        expect(store.getState().filters.category).toBe('electronics');
      });
    });

    describe('API Compatibility', () => {
      it('should maintain backward compatibility', () => {
        // Test legacy method names
        const legacyMethods = ['getProducts', 'setFilter', 'clearFilter', 'getFilteredData'];

        legacyMethods.forEach((method) => {
          if (typeof (store as any)[method] === 'function') {
            expect(() => (store as any)[method]()).not.toThrow();
          }
        });
      });

      it('should handle version migrations', () => {
        const oldFormatData = {
          version: '1.0.0',
          productList: mockProducts, // Old property name
          currentFilter: { category: 'electronics' }, // Old format
        };

        const migratedStore = createProductStore();
        const migrated = migratedStore.migrateFromOldFormat(oldFormatData);

        expect(migrated.products).toEqual(mockProducts);
        expect(migrated.filters).toEqual({ category: 'electronics' });
      });
    });

    describe('Browser Compatibility', () => {
      it('should work without modern JavaScript features', () => {
        // Mock missing features
        const originalPromise = global.Promise;
        delete (global as any).Promise;

        try {
          const basicStore = createProductStore();
          basicStore.setFilters({ category: 'electronics' });

          expect(basicStore.getState().filters.category).toBe('electronics');
        } finally {
          global.Promise = originalPromise;
        }
      });

      it('should handle localStorage unavailability', async () => {
        const originalLocalStorage = global.localStorage;
        delete (global as any).localStorage;

        try {
          await store.saveState();
          // Should not throw error
          expect(store.getState().error).toBeNull();
        } finally {
          global.localStorage = originalLocalStorage;
        }
      });
    });
  });
});
