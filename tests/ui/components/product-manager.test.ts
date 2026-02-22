import { Product } from '../../../src/models'; // Type import can stay

// Mocks - These should be defined before they are used by jest.mock,
// and before the describe block if they are referenced by isolated modules.

// Mock dependencies that don't rely on window.indexedDB first
jest.mock('../../../src/ui/components/toast-notifications', () => ({
  showToast: jest.fn(),
}));

jest.mock('../../../src/services/export.service', () => ({
  exportService: {
    exportProductsToCsv: jest.fn(),
  },
}));


// Define mock instances outside and before jest.mock calls that might use them indirectly
const mockProductListComponentInstance = {
    appendTo: jest.fn(),
    setProducts: jest.fn(),
};
const mockProductFormComponentInstance = {
    appendTo: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    getElement: jest.fn().mockReturnValue(document.createElement('div')),
};

jest.mock('../../../src/ui/components/product-list.component', () => {
    return { ProductListComponent: jest.fn(() => mockProductListComponentInstance) };
});

jest.mock('../../../src/ui/components/product-form.component', () => {
    return { ProductFormComponent: jest.fn(() => mockProductFormComponentInstance) };
});


// Mock product.store separately as it's a key dependency that pulls in IndexedDB
// This mock will be used by the dynamically imported product.store
jest.mock('../../../src/state/product.store', () => {
    // Ensure Product type is available if needed by the mock's logic
    // For this specific mock, it's not directly using Product type in its signature,
    // but if it did, we'd need to handle that (e.g. dynamic import or careful placement)
    let currentProducts: any[] = []; // Using any for simplicity within the mock
    let currentSubscribers: Array<(products: any[]) => void> = []; // Using any for simplicity

    const mockStoreInstance = {
        loadProducts: jest.fn().mockImplementation(async () => {
            currentProducts = mockStoreInstance._initialMockProducts || [];
            mockStoreInstance._notifySubscribers();
        }),
        addProduct: jest.fn().mockImplementation(async (product: any) => {
            currentProducts.push(product);
            mockStoreInstance._notifySubscribers();
            return product;
        }),
        updateProduct: jest.fn().mockImplementation(async (product: any) => {
            const index = currentProducts.findIndex(p => p.id === product.id);
            if (index !== -1) currentProducts[index] = product;
            else currentProducts.push(product);
            mockStoreInstance._notifySubscribers();
            return product;
        }),
        deleteProduct: jest.fn().mockImplementation(async (productId: string) => {
            currentProducts = currentProducts.filter(p => p.id !== productId);
            mockStoreInstance._notifySubscribers();
        }),
        getProducts: jest.fn().mockImplementation(() => currentProducts),
        subscribe: jest.fn((callback: (products: any[]) => void) => {
            currentSubscribers.push(callback);
            callback(currentProducts);
            return () => {
                currentSubscribers = currentSubscribers.filter(cb => cb !== callback);
            };
        }),
        _notifySubscribers: () => {
            currentSubscribers.forEach(cb => cb([...currentProducts]));
        },
        _initialMockProducts: [] as any[], // Will be set by tests
        _setInitialMockProducts: (products: any[]) => {
            mockStoreInstance._initialMockProducts = products; // Store on the instance
            currentProducts = products; // Also update currentProducts directly
        }
    };
    return { productStore: mockStoreInstance };
});


const mockIDBFactory = { // This mock needs to be defined globally
    open: jest.fn(),
    deleteDatabase: jest.fn(),
    cmp: jest.fn(),
};
Object.defineProperty(window, 'indexedDB', {
    value: mockIDBFactory,
    writable: true,
    configurable: true,
});


Object.defineProperty(window, 'indexedDB', { // Apply the mock to window
    value: mockIDBFactory,
    writable: true,
    configurable: true,
});

describe('Product Manager (initProductManager)', () => {
  let container: HTMLElement;
  let mockProduct1: Product; // Type can be used here
  let mockProduct2: Product; // Type can be used here

  // Variables to hold dynamically imported modules
  let currentInitProductManager: any;
  let currentProductStore: any;
  let currentProductListComponent: any;
  let currentProductFormComponent: any;
  let currentShowToast: any;
  let currentExportService: any;

  beforeEach(async () => {
    // Set up window.indexedDB mock *before* isolating modules
    Object.defineProperty(window, 'indexedDB', {
        value: mockIDBFactory,
        writable: true,
        configurable: true,
    });

    jest.clearAllMocks(); // Clear any previous mock states, especially for globally defined mocks

    await jest.isolateModulesAsync(async () => {
        // Dynamically import modules that might be affected by the indexedDB mock
        // or that depend on other dynamically loaded modules.
        const pmModule = await import('../../../src/ui/components/product-manager');
        currentInitProductManager = pmModule.initProductManager;

        const storeModule = await import('../../../src/state/product.store');
        currentProductStore = storeModule.productStore;

        // Component constructor mocks are defined globally, so we just need their types for casting if necessary
        // but the actual mock functions (ProductListComponent, ProductFormComponent) will be from the global scope.
        // We still need to import them if we want to assert on `toHaveBeenCalled` on the constructor itself.
        currentProductListComponent = (await import('../../../src/ui/components/product-list.component')).ProductListComponent;
        currentProductFormComponent = (await import('../../../src/ui/components/product-form.component')).ProductFormComponent;

        currentShowToast = (await import('../../../src/ui/components/toast-notifications')).showToast;
        currentExportService = (await import('../../../src/services/export.service')).exportService;
    });

    // Initialize mock data after dynamic imports
    mockProduct1 = { id: 'p1', name: 'Vodka', category: 'Spirits', volume: 700, pricePerBottle: 20, lastUpdated: new Date() };
    mockProduct2 = { id: 'p2', name: 'Gin', category: 'Spirits', volume: 750, pricePerBottle: 22, lastUpdated: new Date() };

    container = document.createElement('div');
    document.body.appendChild(container);
    // jest.clearAllMocks(); // Already called above

    // Set initial products for the dynamically loaded (and mocked) store
    if (currentProductStore && currentProductStore._setInitialMockProducts) {
        currentProductStore._setInitialMockProducts([mockProduct1, mockProduct2]);
    }

    await currentInitProductManager(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('should initialize UI structure, components, and load products', () => {
    expect(container.querySelector('#product-manager-content-wrapper')).not.toBeNull();
    expect(currentProductListComponent).toHaveBeenCalled();
    expect(mockProductListComponentInstance.appendTo).toHaveBeenCalled();
    expect(currentProductFormComponent).toHaveBeenCalled();
    expect(mockProductFormComponentInstance.appendTo).toHaveBeenCalled();
    expect(mockProductFormComponentInstance.hide).toHaveBeenCalled();

    expect(currentProductStore.subscribe).toHaveBeenCalled();
    expect(currentProductStore.loadProducts).toHaveBeenCalled();
  });

  test('"Add New Product" button should show ProductFormComponent', () => {
    const addBtn = container.querySelector('#add-new-product-btn') as HTMLButtonElement;
    addBtn.click();
    expect(mockProductFormComponentInstance.show).toHaveBeenCalledWith();
  });

  test('"Export Products CSV" button should call exportService', () => {
    const exportBtn = container.querySelector('#export-products-csv-btn') as HTMLButtonElement;
    exportBtn.click();
    expect(currentExportService.exportProductsToCsv).toHaveBeenCalledWith([mockProduct1, mockProduct2]);
    expect(currentShowToast).toHaveBeenCalledWith(expect.stringContaining('successfully exported to CSV'), 'success');
  });

  test('should show info toast when exporting empty product catalog', () => {
    // Ensure product store returns an empty list for this test
    if (currentProductStore && currentProductStore._setInitialMockProducts) {
        currentProductStore._setInitialMockProducts([]);
        // The getProducts mock will now return [] because currentProducts is updated by _setInitialMockProducts
    }

    const exportBtn = container.querySelector('#export-products-csv-btn') as HTMLButtonElement;
    expect(exportBtn).not.toBeNull(); // Ensure button exists
    exportBtn.click();

    // Verify toast is shown with the correct message and type
    expect(currentShowToast).toHaveBeenCalledWith(
      "No products available to export.",
      "info"
    );
    // Also ensure that exportProductsToCsv was NOT called
    expect(currentExportService.exportProductsToCsv).not.toHaveBeenCalled();
  });

  test('handleEditProduct callback should show ProductFormComponent with product data', () => {
    const productListCtorArgs = (currentProductListComponent as jest.Mock).mock.calls[0];
    const listItemCallbacks = productListCtorArgs[1];
    listItemCallbacks.onEdit(mockProduct1);

    expect(mockProductFormComponentInstance.show).toHaveBeenCalledWith(mockProduct1);
  });

  describe('handleDeleteProductRequest callback', () => {
    let deleteCallback: (productId: string, productName: string) => Promise<void>;

    beforeEach(() => {
        const productListCtorArgs = (currentProductListComponent as jest.Mock).mock.calls[0];
        deleteCallback = productListCtorArgs[1].onDelete;
    });

    it('should call productStore.deleteProduct and show toast on confirmation', async () => {
        window.confirm = jest.fn(() => true);
        (currentProductStore.deleteProduct as jest.Mock).mockResolvedValue(undefined);

        await deleteCallback('p1', 'Vodka');

        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete product "Vodka"?');
        expect(currentProductStore.deleteProduct).toHaveBeenCalledWith('p1');
        expect(currentShowToast).toHaveBeenCalledWith('Product "Vodka" deleted.', 'success');
        expect(mockProductFormComponentInstance.hide).toHaveBeenCalled();
    });

    it('should not call deleteProduct if not confirmed', async () => {
        window.confirm = jest.fn(() => false);
        await deleteCallback('p1', 'Vodka');
        expect(currentProductStore.deleteProduct).not.toHaveBeenCalled();
    });
  });

  describe('handleProductFormSubmit callback', () => {
    let submitCallback: (product: Product) => Promise<void>;

    beforeEach(() => {
        const formCtorArgs = (currentProductFormComponent as jest.Mock).mock.calls[0];
        submitCallback = formCtorArgs[0].onSubmit;
    });

    it('should call productStore.addProduct for new product', async () => {
        const newProductData = { name: 'Rum', category: 'Spirits', volume: 700, pricePerBottle: 18, lastUpdated: new Date() };
        const newProductWithId = {id: 'form-gen-id', ...newProductData };
        (currentProductStore.getProducts as jest.Mock).mockReturnValue([]);
        (currentProductStore.addProduct as jest.Mock).mockResolvedValue(newProductWithId);

        await submitCallback(newProductWithId);

        expect(currentProductStore.addProduct).toHaveBeenCalledWith(newProductWithId);
        expect(currentShowToast).toHaveBeenCalledWith(expect.stringContaining('successfully created'), 'success');
        expect(mockProductFormComponentInstance.hide).toHaveBeenCalled();
    });

    it('should call productStore.updateProduct for existing product', async () => {
        (currentProductStore.getProducts as jest.Mock).mockReturnValue([mockProduct1]);
        (currentProductStore.updateProduct as jest.Mock).mockResolvedValue(mockProduct1);

        const updatedProductData = { ...mockProduct1, name: "Vodka Premium" };
        await submitCallback(updatedProductData);

        expect(currentProductStore.updateProduct).toHaveBeenCalledWith(updatedProductData);
        expect(currentShowToast).toHaveBeenCalledWith(expect.stringContaining('successfully updated'), 'success');
        expect(mockProductFormComponentInstance.hide).toHaveBeenCalled();
    });

    it('should show error toast if store operation fails', async () => {
        const productData = { ...mockProduct1, name: "Error Case" };
        (currentProductStore.updateProduct as jest.Mock).mockRejectedValue(new Error("Store failed"));
        (currentProductStore.getProducts as jest.Mock).mockReturnValue([mockProduct1]);

        await expect(submitCallback(productData)).rejects.toThrow("Store failed");
        expect(currentShowToast).toHaveBeenCalledWith(expect.stringContaining('Error saving'), "error");
    });
  });

  test('handleProductFormCancel callback should hide ProductFormComponent', () => {
    const formCtorArgs = (currentProductFormComponent as jest.Mock).mock.calls[0];
    const cancelCallback = formCtorArgs[0].onCancel;
    cancelCallback();
    expect(mockProductFormComponentInstance.hide).toHaveBeenCalled();
  });

  test('productStore subscription should call setProducts on ProductListComponent', () => {
    // The store is initialized with mockProduct1 and mockProduct2 in beforeEach.
    // The subscribe callback is called immediately upon subscription with the current list.
    // Then, initProductManager calls loadProducts, which in the mock also notifies.
    // Then, _setInitialMockProducts is called again in beforeEach, which notifies.
    // So, setProducts will be called multiple times. We are interested in the calls
    // that reflect the products set by _setInitialMockProducts.

    // Check the last call, or any call that matches the full initial set.
    // The mock for subscribe calls the callback immediately with currentProducts.
    // _setInitialMockProducts also updates currentProducts and calls _notifySubscribers.
    // loadProducts (mocked) also calls _notifySubscribers.

    // Let's verify the products that were set by the last _setInitialMockProducts call in beforeEach
    const expectedProducts = [mockProduct1, mockProduct2];

    // Manually trigger the notification part of the mocked subscribe,
    // simulating a scenario where the store notifies AFTER initial setup.
    // This might not be strictly necessary if the mock already covers it,
    // but can make the test assertion more specific to a state update.
    // (currentProductStore as any)._setInitialMockProducts(expectedProducts); // This would be redundant if beforeEach does it
    if (currentProductStore && (currentProductStore as any)._notifySubscribers) {
        (currentProductStore as any)._notifySubscribers(); // This will use the products from beforeEach's last set
    }

    // It might have been called multiple times, check the last call or if any call matches
    expect(mockProductListComponentInstance.setProducts).toHaveBeenCalledWith(expectedProducts);
  });

});
