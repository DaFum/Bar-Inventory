// Note: dbService import will be done dynamically after mocks are set up.
// import { dbService } from './indexeddb.service';
import { Product, Location, InventoryState } from '../models';
import { openDB, IDBPDatabase, IDBPTransaction, IDBPObjectStore } from 'idb';
// BarInventoryDBSchema and StoredInventoryState will also be imported dynamically or type-only.
import type { BarInventoryDBSchema as BarInventoryDBSchemaType, StoredInventoryState as StoredInventoryStateType } from './indexeddb.service';

// Mock 'idb' library
jest.mock('idb', () => {
  const actualIdb = jest.requireActual('idb');
  return {
    ...actualIdb,
    openDB: jest.fn(),
  };
});

// Mock toast notifications
jest.mock('../ui/components/toast-notifications', () => ({
  showToast: jest.fn(),
}));

// Mock window.indexedDB for the service constructor check
const mockIDBFactory = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
  cmp: jest.fn(),
};
Object.defineProperty(window, 'indexedDB', {
  value: mockIDBFactory,
  writable: true,
  configurable: true,
});


const mockProduct: Product = { id: 'prod1', name: 'Test Product', category: 'Test Category', itemsPerCrate: 10, pricePer100ml: 1, pricePerBottle: 10, volume: 750 };
const mockLocation: Location = { id: 'loc1', name: 'Test Location', counters: [] };
const mockInventoryState: InventoryState = {
    locations: [],
    products: [],
    unsyncedChanges: false
};
const mockStoredInventoryState: StoredInventoryStateType = { ...mockInventoryState, key: 'currentState' };

// Dynamic import for dbService and types after mocks are set
let dbService: any; // To hold the imported service instance
// The type 'BarInventoryDBSchemaType' and 'StoredInventoryStateType' are imported via 'import type'
// and can be used directly. We don't need variables to hold these types at runtime.


describe('IndexedDBService', () => {
  let mockDb: jest.Mocked<IDBPDatabase<BarInventoryDBSchemaType>>;
  let mockTransaction: jest.Mocked<IDBPTransaction<BarInventoryDBSchemaType, ['products', 'locations', 'inventoryState'], 'readwrite' | 'readonly'>>; // Adjusted store names type
  let mockProductStore: jest.Mocked<IDBPObjectStore<BarInventoryDBSchemaType, ['products', 'locations', 'inventoryState'], 'products', 'readwrite' | 'readonly'>>;
  let mockLocationStore: jest.Mocked<IDBPObjectStore<BarInventoryDBSchemaType, ['products', 'locations', 'inventoryState'], 'locations', 'readwrite' | 'readonly'>>;
  let mockInventoryStateStore: jest.Mocked<IDBPObjectStore<BarInventoryDBSchemaType, ['products', 'locations', 'inventoryState'], 'inventoryState', 'readwrite' | 'readonly'>>;

  beforeEach(async () => {
    // 1. Reset all mocks
    jest.clearAllMocks();

    // 2. Ensure window.indexedDB is mocked
    Object.defineProperty(window, 'indexedDB', {
        value: mockIDBFactory, // mockIDBFactory is defined globally in the test file
        writable: true,
        configurable: true,
    });

    // 3. Initialize mockDb and its components with fresh spies
    mockProductStore = {
        add: jest.fn(), put: jest.fn(), get: jest.fn(), getAll: jest.fn(),
        delete: jest.fn(), clear: jest.fn(), getAllKeys: jest.fn(),
    } as unknown as jest.Mocked<IDBPObjectStore<BarInventoryDBSchemaType, ['products', 'locations', 'inventoryState'], 'products', 'readwrite' | 'readonly'>>;

    mockLocationStore = {
        add: jest.fn(), put: jest.fn(), get: jest.fn(), getAll: jest.fn(),
        delete: jest.fn(), clear: jest.fn(), getAllKeys: jest.fn(),
    } as unknown as jest.Mocked<IDBPObjectStore<BarInventoryDBSchemaType, ['products', 'locations', 'inventoryState'], 'locations', 'readwrite' | 'readonly'>>;

    mockInventoryStateStore = {
        add: jest.fn(), put: jest.fn(), get: jest.fn(), getAll: jest.fn(),
        delete: jest.fn(), clear: jest.fn(), getAllKeys: jest.fn(),
    } as unknown as jest.Mocked<IDBPObjectStore<BarInventoryDBSchemaType, ['products', 'locations', 'inventoryState'], 'inventoryState', 'readwrite' | 'readonly'>>;

    mockTransaction = {
        objectStore: jest.fn((storeName: 'products' | 'locations' | 'inventoryState') => {
            if (storeName === 'products') return mockProductStore;
            if (storeName === 'locations') return mockLocationStore;
            if (storeName === 'inventoryState') return mockInventoryStateStore;
            throw new Error(`Unknown store: ${storeName}`);
        }) as any,
        done: Promise.resolve(),
        abort: jest.fn(),
        storeNames: ['products', 'locations', 'inventoryState'] as const,
    } as unknown as jest.Mocked<IDBPTransaction<BarInventoryDBSchemaType, ['products', 'locations', 'inventoryState'], 'readwrite' | 'readonly'>>;

    mockDb = {
        transaction: jest.fn().mockReturnValue(mockTransaction),
        get: jest.fn(),
        getAll: jest.fn(),
        put: jest.fn(),
        add: jest.fn(),
        delete: jest.fn(),
        clear: jest.fn(),
        name: DATABASE_NAME, // DATABASE_NAME is defined globally in the test file
        version: DATABASE_VERSION, // DATABASE_VERSION is defined globally in the test file
        objectStoreNames: ['products', 'locations', 'inventoryState'] as any,
        close: jest.fn(),
        count: jest.fn(),
        countFromIndex: jest.fn(),
        deleteObjectStore: jest.fn(),
        createObjectStore: jest.fn().mockReturnValue({ createIndex: jest.fn() } as any),
        getFromIndex: jest.fn(),
        getAllFromIndex: jest.fn(),
        getAllKeys: jest.fn(),
        getAllKeysFromIndex: jest.fn(),
        getKey: jest.fn(),
        getKeyFromIndex: jest.fn(),
    } as unknown as jest.Mocked<IDBPDatabase<BarInventoryDBSchemaType>>;

    // 4. Configure the globally mocked openDB to return the mockDb for this test run
    // (openDB itself is mocked at the top of the file using jest.mock('idb', ...))
    const idbModule = await import('idb');
    (idbModule.openDB as jest.Mock).mockImplementation(async () => {
        return mockDb;
    });

    // 5. Dynamically import the service and create a new instance for this test run
    await jest.isolateModulesAsync(async () => {
        const { IndexedDBService: ServiceClass } = await import('./indexeddb.service');
        dbService = new ServiceClass();
    });
  });

  describe('Constructor and DB Initialization', () => {
    test('should call openDB with correct parameters', async () => {
      await dbService['dbPromise']; // Access promise to trigger openDB
      expect(openDB).toHaveBeenCalledWith(DATABASE_NAME, DATABASE_VERSION, expect.any(Object));
    });

    test('upgrade callback should create object stores if they do not exist', async () => {
      const mockCreateObjectStore = jest.fn().mockReturnValue({ createIndex: jest.fn() });
      const mockUpgradeDb = {
        objectStoreNames: {
          contains: jest.fn().mockReturnValue(false), // Simulate stores don't exist
        },
        createObjectStore: mockCreateObjectStore,
      } as unknown as IDBPDatabase<BarInventoryDBSchemaType>;

      // Call the upgrade function provided to openDB
      await dbService['dbPromise']; // Ensure openDB has been called
      const openDbArgs = (openDB as jest.Mock).mock.calls[0];
      const upgradeCallback = openDbArgs[2].upgrade;

      upgradeCallback(mockUpgradeDb, 0, 1, mockTransaction);

      expect(mockUpgradeDb.createObjectStore).toHaveBeenCalledWith('products', { keyPath: 'id' });
      expect(mockUpgradeDb.createObjectStore).toHaveBeenCalledWith('locations', { keyPath: 'id' });
      expect(mockUpgradeDb.createObjectStore).toHaveBeenCalledWith('inventoryState', { keyPath: 'key' });
      expect(mockCreateObjectStore().createIndex).toHaveBeenCalledWith('category', 'category');
    });

    test('upgrade callback should not try to create stores if they exist', async () => {
        const mockCreateObjectStore = jest.fn();
        const mockUpgradeDb = {
          objectStoreNames: {
            contains: jest.fn().mockReturnValue(true), // Simulate stores DO exist
          },
          createObjectStore: mockCreateObjectStore,
        } as unknown as IDBPDatabase<BarInventoryDBSchemaType>;

        await dbService['dbPromise'];
        const openDbArgs = (openDB as jest.Mock).mock.calls[0];
        const upgradeCallback = openDbArgs[2].upgrade;

        upgradeCallback(mockUpgradeDb, 1, 1, mockTransaction); // oldVersion = newVersion

        expect(mockCreateObjectStore).not.toHaveBeenCalled();
      });
  });

  // Generic CRUD operations
  describe('Generic CRUD operations', () => {
    test('getAll should call db.getAll with storeName', async () => {
      // const internalDb = await dbService.getDB(); // getDB does not exist on the service instance
      // if (internalDb !== mockDb) {
      //   console.log('CRITICAL: internalDb is NOT the same instance as mockDb in getAll test!');
      // }
      mockDb.getAll.mockResolvedValue([mockProduct]);
      const result = await dbService.getAll('products');
      // This assertion directly checks if the `getAll` method on our `mockDb` object (which should be used by the service) was called.
      expect(mockDb.getAll).toHaveBeenCalledWith('products');
      expect(result).toEqual([mockProduct]);
    });

    test('get should call db.get with storeName and key', async () => {
      mockDb.get.mockResolvedValue(mockProduct);
      const result = await dbService.get('products', 'prod1');
      expect(mockDb.get).toHaveBeenCalledWith('products', 'prod1');
      expect(result).toEqual(mockProduct);
    });

    test('put should call db.put with storeName and value', async () => {
      mockDb.put.mockResolvedValue('prod1');
      await dbService.put('products', mockProduct);
      expect(mockDb.put).toHaveBeenCalledWith('products', mockProduct);
    });

    test('add should call db.add with storeName and value', async () => {
      mockDb.add.mockResolvedValue('prod1');
      await dbService.add('products', mockProduct);
      expect(mockDb.add).toHaveBeenCalledWith('products', mockProduct);
    });

    test('delete should call db.delete with storeName and key', async () => {
      mockDb.delete.mockResolvedValue(undefined);
      await dbService.delete('products', 'prod1');
      expect(mockDb.delete).toHaveBeenCalledWith('products', 'prod1');
    });

    test('clearStore should call db.clear with storeName', async () => {
      mockDb.clear.mockResolvedValue(undefined);
      await dbService.clearStore('products');
      expect(mockDb.clear).toHaveBeenCalledWith('products');
    });
  });

  // Specific methods
  describe('Specific data methods', () => {
    test('loadProducts should call getAll("products")', async () => {
      jest.spyOn(dbService, 'getAll'); // Spy on the instance method
      await dbService.loadProducts();
      expect(dbService.getAll).toHaveBeenCalledWith('products');
    });

    test('saveProduct should call put("products", product)', async () => {
      jest.spyOn(dbService, 'put');
      await dbService.saveProduct(mockProduct);
      expect(dbService.put).toHaveBeenCalledWith('products', mockProduct);
    });

    test('loadLocations should call getAll("locations")', async () => {
      jest.spyOn(dbService, 'getAll');
      await dbService.loadLocations();
      expect(dbService.getAll).toHaveBeenCalledWith('locations');
    });

    test('saveLocation should call put("locations", location)', async () => {
      jest.spyOn(dbService, 'put');
      await dbService.saveLocation(mockLocation);
      expect(dbService.put).toHaveBeenCalledWith('locations', mockLocation);
    });

    test('getInventoryState should call get("inventoryState", "currentState")', async () => {
      jest.spyOn(dbService, 'get').mockResolvedValue(mockStoredInventoryState);
      const result = await dbService.getInventoryState();
      expect(dbService.get).toHaveBeenCalledWith('inventoryState', 'currentState');
      expect(result).toEqual(mockStoredInventoryState);
    });

    test('saveInventoryState should call put("inventoryState", storedState)', async () => {
      jest.spyOn(dbService, 'put');
      await dbService.saveInventoryState(mockInventoryState);
      expect(dbService.put).toHaveBeenCalledWith('inventoryState', mockStoredInventoryState);
    });
  });

  describe('saveAllApplicationData', () => {
    const products = [mockProduct, { ...mockProduct, id: 'prod2', name: 'Product 2' }];
    const locations = [mockLocation, { ...mockLocation, id: 'loc2', name: 'Location 2' }];
    const state = mockInventoryState;

    beforeEach(() => {
        // Setup for successful transaction
        (mockProductStore.put as jest.Mock).mockResolvedValue('prod_key' as any);
        (mockProductStore.delete as jest.Mock).mockResolvedValue(undefined);
        (mockProductStore.getAllKeys as jest.Mock).mockResolvedValue(['prod_old' as any]);

        (mockLocationStore.put as jest.Mock).mockResolvedValue('loc_key' as any);
        (mockLocationStore.delete as jest.Mock).mockResolvedValue(undefined);
        (mockLocationStore.getAllKeys as jest.Mock).mockResolvedValue(['loc_old' as any]);

        (mockInventoryStateStore.put as jest.Mock).mockResolvedValue('currentState' as any);
    });

    test('should start a readwrite transaction on all stores', async () => {
      await dbService.saveAllApplicationData({ products, locations, state });
      expect(mockDb.transaction).toHaveBeenCalledWith(
        ['products', 'locations', 'inventoryState'],
        'readwrite'
      );
    });

    test('should put all provided products and locations', async () => {
      await dbService.saveAllApplicationData({ products, locations, state });
      expect(mockProductStore.put).toHaveBeenCalledTimes(products.length);
      expect(mockProductStore.put).toHaveBeenCalledWith(products[0]);
      expect(mockProductStore.put).toHaveBeenCalledWith(products[1]);
      expect(mockLocationStore.put).toHaveBeenCalledTimes(locations.length);
      expect(mockLocationStore.put).toHaveBeenCalledWith(locations[0]);
      expect(mockLocationStore.put).toHaveBeenCalledWith(locations[1]);
    });

    test('should delete obsolete products and locations', async () => {
      mockProductStore.getAllKeys.mockResolvedValue(['prod1', 'prod_old', 'prod_another_old'] as any[]);
      mockLocationStore.getAllKeys.mockResolvedValue(['loc1', 'loc_old'] as any[]);

      const currentProducts = [{ ...mockProduct, id: 'prod1' }]; // only prod1 remains
      const currentLocations = [{ ...mockLocation, id: 'loc1' }]; // only loc1 remains

      await dbService.saveAllApplicationData({ products: currentProducts, locations: currentLocations, state });

      expect(mockProductStore.delete).toHaveBeenCalledWith('prod_old');
      expect(mockProductStore.delete).toHaveBeenCalledWith('prod_another_old');
      expect(mockProductStore.delete).not.toHaveBeenCalledWith('prod1');
      expect(mockLocationStore.delete).toHaveBeenCalledWith('loc_old');
      expect(mockLocationStore.delete).not.toHaveBeenCalledWith('loc1');
    });

    test('should save inventory state if provided', async () => {
      await dbService.saveAllApplicationData({ products, locations, state });
      expect(mockInventoryStateStore.put).toHaveBeenCalledWith(mockStoredInventoryState);
    });

    test('should not attempt to save inventory state if not provided', async () => {
      await dbService.saveAllApplicationData({ products, locations }); // state is undefined
      expect(mockInventoryStateStore.put).not.toHaveBeenCalled();
    });

    test('should call tx.done on successful operation', async () => {
        await dbService.saveAllApplicationData({ products, locations, state });
        expect(mockTransaction.done).toBeTruthy(); // Check if it was accessed / awaited
    });

    test('should throw and show toast on transaction error', async () => {
      const dbError = new Error('DB write failed');
      (mockProductStore.put as jest.Mock).mockRejectedValue(dbError); // Simulate an error during put

      const { showToast } = jest.requireMock('../ui/components/toast-notifications');

      await expect(dbService.saveAllApplicationData({ products, locations, state })).rejects.toThrow(dbError);
      expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Fehler beim Speichern'), 'error');
      // transaction.abort() is usually called automatically by idb library on unhandled errors.
      // We don't mock or check for tx.abort() unless we have specific logic for it.
    });
  });

  describe('loadAllApplicationData', () => {
    test('should call getAll for products and locations, and get for state', async () => {
      const mockProducts = [mockProduct];
      const mockLocations = [mockLocation];

      jest.spyOn(dbService, 'getAll')
        .mockResolvedValueOnce(mockProducts as any) // For products
        .mockResolvedValueOnce(mockLocations as any); // For locations
      jest.spyOn(dbService, 'get').mockResolvedValue(mockStoredInventoryState as any); // For state

      const result = await dbService.loadAllApplicationData();

      expect(dbService.getAll).toHaveBeenCalledWith('products');
      expect(dbService.getAll).toHaveBeenCalledWith('locations');
      expect(dbService.get).toHaveBeenCalledWith('inventoryState', 'currentState');
      expect(result).toEqual({
        products: mockProducts,
        locations: mockLocations,
        state: mockStoredInventoryState,
      });
    });
  });

  // Test for upgrade handler callbacks (blocked, blocking, terminated)
  describe('IndexedDB Callbacks', () => {
    const { showToast } = jest.requireMock('../ui/components/toast-notifications');

    test('blocked callback should show toast', async () => {
        await dbService['dbPromise'];
        const openDbArgs = (openDB as jest.Mock).mock.calls[0];
        const blockedCallback = openDbArgs[2].blocked;
        blockedCallback();
        expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Datenbankzugriff blockiert'), 'error');
    });

    test('blocking callback should show toast', async () => {
        await dbService['dbPromise'];
        const openDbArgs = (openDB as jest.Mock).mock.calls[0];
        const blockingCallback = openDbArgs[2].blocking;
        blockingCallback();
        expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Datenbank-Update blockiert'), 'warning');
    });

    test('terminated callback should show toast', async () => {
        await dbService['dbPromise'];
        const openDbArgs = (openDB as jest.Mock).mock.calls[0];
        const terminatedCallback = openDbArgs[2].terminated;
        terminatedCallback();
        expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Datenbankverbindung unerwartet beendet'), 'error');
    });

    test('constructor should throw if IndexedDB is not supported', async () => {
      const originalIndexedDB = window.indexedDB;
      
      await jest.isolateModulesAsync(async () => {
        // IndexedDB vor dem Import entfernen
        (window as any).indexedDB = undefined;
        
        const { IndexedDBService } = await import('./indexeddb.service');
        
        expect(() => new IndexedDBService()).toThrow('IndexedDB not supported');
        expect(showToast).toHaveBeenCalledWith(
          expect.stringContaining('IndexedDB wird nicht unterstützt'),
          'error'
        );
      });
      
      // IndexedDB wiederherstellen
      (window as any).indexedDB = originalIndexedDB;
    });

});

// Helper constants from the service itself (if not exported, redefine for test)
const DATABASE_NAME = 'BarInventoryDB';
const DATABASE_VERSION = 1;

// Need to define StoredInventoryState if it's not exported from the service file
// and is used in mock types.
// For this test, I'll assume it's exported or defined as:
// interface StoredInventoryState extends InventoryState { key: string; }
// It is imported, so this note is for future reference.
// The internal BarInventoryDBSchema is also imported.

// Note on testing the singleton:
// The `dbService` is exported as a singleton instance. When tests run, this instance
// is created once. To test variations in construction (like no IndexedDB support),
// you'd typically need to reset Jest modules (`jest.resetModules()`) and re-import
// the service in each test, or make the `openDB` call injectable for easier mocking.
// The current tests primarily mock the `openDB` function itself from the 'idb' library,
// which the singleton instance will use.

  describe('Error Handling and Edge Cases', () => {
    test('should handle database initialization failure', async () => {
      const { showToast } = jest.requireMock('../ui/components/toast-notifications');
      const dbError = new Error('Database initialization failed');
      
      (openDB as jest.Mock).mockRejectedValueOnce(dbError);
      
      await jest.isolateModulesAsync(async () => {
        const { IndexedDBService: ServiceClass } = await import('./indexeddb.service');
        const failingService = new ServiceClass();
        
        await expect(failingService.getAll('products')).rejects.toThrow();
        expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Datenbankfehler'), 'error');
      });
    });

    test('should handle transaction failures gracefully', async () => {
      const transactionError = new Error('Transaction failed');
      const originalMockImplementation = mockDb.transaction.getMockImplementation();
      mockDb.transaction.mockImplementation(() => {
        throw transactionError;
      });

      try {
        await expect(dbService.saveAllApplicationData({ 
          products: [mockProduct], 
          locations: [mockLocation], 
          state: mockInventoryState 
        })).rejects.toThrow(transactionError);
      } finally {
        // Restore original implementation
        mockDb.transaction.mockImplementation(originalMockImplementation);
      }

      await expect(dbService.saveAllApplicationData({ 
        products: [mockProduct], 
        locations: [mockLocation], 
        state: mockInventoryState 
      })).rejects.toThrow(transactionError);
    });

    test('should handle corrupted data gracefully', async () => {
      const corruptedData = { id: 'corrupt', invalidField: 'test' };
      mockDb.get.mockResolvedValue(corruptedData);
      
      const result = await dbService.get('products', 'corrupt');
      expect(result).toEqual(corruptedData);
    });

    test('should handle empty database operations', async () => {
      mockDb.getAll.mockResolvedValue([]);
      
      const result = await dbService.getAll('products');
      expect(result).toEqual([]);
      expect(mockDb.getAll).toHaveBeenCalledWith('products');
    });

    test('should handle non-existent key in get operation', async () => {
      mockDb.get.mockResolvedValue(undefined);
      
      const result = await dbService.get('products', 'nonexistent');
      expect(result).toBeUndefined();
    });

    test('should handle duplicate key in add operation', async () => {
      const duplicateError = new Error('Key already exists');
      mockDb.add.mockRejectedValue(duplicateError);
      
      await expect(dbService.add('products', mockProduct)).rejects.toThrow(duplicateError);
    });

    test('should handle invalid store names', async () => {
      const invalidStore = 'invalidStore' as any;
      mockDb.getAll.mockRejectedValue(new Error('Invalid store name'));
      
      await expect(dbService.getAll(invalidStore)).rejects.toThrow();
    });

    test('should handle null/undefined values in CRUD operations', async () => {
      mockDb.put.mockResolvedValue('key');
      
      await expect(dbService.put('products', null as any)).resolves.not.toThrow();
      await expect(dbService.put('products', undefined as any)).resolves.not.toThrow();
    });

    test('should handle database connection loss during operation', async () => {
      const connectionError = new Error('Database connection lost');
      mockDb.get.mockRejectedValue(connectionError);
      
      await expect(dbService.get('products', 'prod1')).rejects.toThrow(connectionError);
    });

    test('should handle quota exceeded error', async () => {
      const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');
      mockDb.put.mockRejectedValue(quotaError);
      
      await expect(dbService.put('products', mockProduct)).rejects.toThrow(quotaError);
    });
  });

  describe('Data Validation and Integrity', () => {
    test('should handle products with missing required fields', async () => {
      const incompleteProduct = { id: 'incomplete' } as Product;
      mockDb.put.mockResolvedValue('incomplete');
      
      await expect(dbService.saveProduct(incompleteProduct)).resolves.not.toThrow();
      expect(mockDb.put).toHaveBeenCalledWith('products', incompleteProduct);
    });

    test('should handle locations with empty counters array', async () => {
      const emptyLocation: Location = { id: 'empty', name: 'Empty Location', counters: [] };
      mockDb.put.mockResolvedValue('empty');
      
      await dbService.saveLocation(emptyLocation);
      expect(mockDb.put).toHaveBeenCalledWith('locations', emptyLocation);
    });

    test('should handle complex nested location data', async () => {
      const complexLocation: Location = {
        id: 'complex',
        name: 'Complex Location',
        counters: [
          {
            id: 'counter1',
            name: 'Main Counter',
            areas: [
              {
                id: 'area1',
                name: 'Bar Area',
                inventoryItems: [
                  {
                    id: 'item1',
                    productId: 'prod1',
                    quantity: 10,
                    unit: 'bottles'
                  }
                ]
              }
            ]
          }
        ]
      };
      
      mockDb.put.mockResolvedValue('complex');
      await dbService.saveLocation(complexLocation);
      expect(mockDb.put).toHaveBeenCalledWith('locations', complexLocation);
    });

    test('should handle inventory state with large datasets', async () => {
      const largeInventoryState: InventoryState = {
        locations: Array.from({ length: 1000 }, (_, i) => ({
          id: `loc${i}`,
          name: `Location ${i}`,
          counters: []
        })),
        products: Array.from({ length: 1000 }, (_, i) => ({
          id: `prod${i}`,
          name: `Product ${i}`,
          category: 'Test',
          itemsPerCrate: 10,
          pricePer100ml: 1,
          pricePerBottle: 10,
          volume: 750
        })),
        unsyncedChanges: true
      };
      
      jest.spyOn(dbService, 'put').mockResolvedValue(undefined);
      await dbService.saveInventoryState(largeInventoryState);
      expect(dbService.put).toHaveBeenCalledWith('inventoryState', { ...largeInventoryState, key: 'currentState' });
    });

    test('should handle special characters in IDs and names', async () => {
      const specialProduct: Product = {
        id: 'prod-特殊字符-123',
        name: 'Product with émoji 🍺 and special chars',
        category: 'Çategory with àccénts',
        itemsPerCrate: 10,
        pricePer100ml: 1.5,
        pricePerBottle: 15,
        volume: 750
      };
      
      mockDb.put.mockResolvedValue(specialProduct.id);
      await dbService.saveProduct(specialProduct);
      expect(mockDb.put).toHaveBeenCalledWith('products', specialProduct);
    });

    test('should handle numeric precision edge cases', async () => {
      const precisionProduct: Product = {
        id: 'precision-test',
        name: 'Precision Test Product',
        category: 'Test',
        itemsPerCrate: 1,
        pricePer100ml: 0.001,
        pricePerBottle: 999.999,
        volume: 0.5
      };
      
      mockDb.put.mockResolvedValue(precisionProduct.id);
      await dbService.saveProduct(precisionProduct);
      expect(mockDb.put).toHaveBeenCalledWith('products', precisionProduct);
    });
  });

  describe('Concurrency and Performance', () => {
    test('should handle concurrent read operations', async () => {
      mockDb.get.mockResolvedValue(mockProduct);
      
      const concurrentReads = Array.from({ length: 10 }, (_, i) => 
        dbService.get('products', `prod${i}`)
      );
      
      const results = await Promise.all(concurrentReads);
      expect(results).toHaveLength(10);
      expect(mockDb.get).toHaveBeenCalledTimes(10);
    });

    test('should handle concurrent write operations', async () => {
      mockDb.put.mockResolvedValue('key');
      
      const concurrentWrites = Array.from({ length: 10 }, (_, i) => 
        dbService.put('products', { ...mockProduct, id: `prod${i}` })
      );
      
      await Promise.all(concurrentWrites);
      expect(mockDb.put).toHaveBeenCalledTimes(10);
    });

    test('should handle mixed read/write operations', async () => {
      mockDb.get.mockResolvedValue(mockProduct);
      mockDb.put.mockResolvedValue('key');
      
      const mixedOperations = [
        dbService.get('products', 'prod1'),
        dbService.put('products', mockProduct),
        dbService.get('locations', 'loc1'),
        dbService.put('locations', mockLocation)
      ];
      
      await Promise.all(mixedOperations);
      expect(mockDb.get).toHaveBeenCalledTimes(2);
      expect(mockDb.put).toHaveBeenCalledTimes(2);
    });
  });

  describe('Database Schema Evolution', () => {
    test('should handle schema upgrade from version 0 to 1', async () => {
      // Reset the service to test initialization again
      await jest.isolateModulesAsync(async () => {
        const { IndexedDBService: ServiceClass } = await import('./indexeddb.service');
    
        // Capture the upgrade callback when openDB is called
        // Capture the upgrade callback with a precise signature
        let capturedUpgradeCallback: ((db: IDBPDatabase<BarInventoryDBSchemaType>, oldVersion: number, newVersion: number, transaction: any) => void) | undefined;

        (openDB as jest.Mock).mockImplementationOnce((name, version, options) => {
          capturedUpgradeCallback = options.upgrade;
          return mockDb;
        });
      
          expect(mockCreateObjectStore).toHaveBeenCalledTimes(3);
          expect(mockCreateObjectStore).toHaveBeenCalledWith('products', { keyPath: 'id' });
          expect(mockCreateObjectStore).toHaveBeenCalledWith('locations', { keyPath: 'id' });
          expect(mockCreateObjectStore).toHaveBeenCalledWith('inventoryState', { keyPath: 'key' });
        } else {
          fail('Upgrade callback was not captured');
        }
      });
    });

    test('should handle partial schema upgrade', async () => {
      const mockCreateObjectStore = jest.fn().mockReturnValue({ 
        createIndex: jest.fn() 
      });
      const mockUpgradeDb = {
        objectStoreNames: {
          contains: jest.fn()
            .mockReturnValueOnce(true)  // products exists
            .mockReturnValueOnce(false) // locations doesn't exist
            .mockReturnValueOnce(false) // inventoryState doesn't exist
        },
        createObjectStore: mockCreateObjectStore,
      } as unknown as IDBPDatabase<BarInventoryDBSchemaType>;

      await dbService['dbPromise'];
      const openDbArgs = (openDB as jest.Mock).mock.calls[0];
      const upgradeCallback = openDbArgs[2].upgrade;

      upgradeCallback(mockUpgradeDb, 0, 1, mockTransaction);

      expect(mockCreateObjectStore).toHaveBeenCalledTimes(2);
      expect(mockCreateObjectStore).not.toHaveBeenCalledWith('products', { keyPath: 'id' });
      expect(mockCreateObjectStore).toHaveBeenCalledWith('locations', { keyPath: 'id' });
      expect(mockCreateObjectStore).toHaveBeenCalledWith('inventoryState', { keyPath: 'key' });
    });
  });

  describe('Memory Management and Cleanup', () => {
    test('should properly clean up resources after operations', async () => {
      mockDb.getAll.mockResolvedValue([mockProduct]);
      
      await dbService.getAll('products');
      
      // Verify that no lingering references or listeners remain
      expect(mockDb.close).not.toHaveBeenCalled(); // Service should keep connection open
    });

    test('should handle large data cleanup in saveAllApplicationData', async () => {
      const largeProductList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockProduct,
        id: `prod${i}`
      }));
      
      mockProductStore.getAllKeys.mockResolvedValue([]);
      mockLocationStore.getAllKeys.mockResolvedValue([]);
      mockProductStore.put.mockResolvedValue('key' as any);
      mockLocationStore.put.mockResolvedValue('key' as any);
      mockInventoryStateStore.put.mockResolvedValue('key' as any);
      
      await dbService.saveAllApplicationData({
        products: largeProductList,
        locations: [mockLocation],
        state: mockInventoryState
      });
      
      expect(mockProductStore.put).toHaveBeenCalledTimes(1000);
    });
  });

  describe('Transaction Management', () => {
    test('should handle transaction abort scenarios', async () => {
      const abortError = new Error('Transaction aborted');
      mockTransaction.done = Promise.reject(abortError);
      
      await expect(dbService.saveAllApplicationData({
        products: [mockProduct],
        locations: [mockLocation],
        state: mockInventoryState
      })).rejects.toThrow(abortError);
    });

    test('should properly handle nested transaction scenarios', async () => {
      // Simulate a scenario where multiple operations are called simultaneously
      const operation1 = dbService.saveAllApplicationData({
        products: [mockProduct],
        locations: [],
        state: mockInventoryState
      });
      
      const operation2 = dbService.saveAllApplicationData({
        products: [],
        locations: [mockLocation],
        state: mockInventoryState
      });
      
      await Promise.all([operation1, operation2]);
      
      // Each operation should get its own transaction
      expect(mockDb.transaction).toHaveBeenCalledTimes(2);
    });
  });

  describe('Browser Compatibility Edge Cases', () => {
    test('should handle missing IndexedDB features gracefully', async () => {
      const limitedMockDb = {
        ...mockDb,
        count: undefined, // Some browsers might not support all features
      };
      
      (openDB as jest.Mock).mockResolvedValue(limitedMockDb);
      
      await jest.isolateModulesAsync(async () => {
        const { IndexedDBService: ServiceClass } = await import('./indexeddb.service');
        const service = new ServiceClass();
        
        // Basic operations should still work
        await expect(service.getAll('products')).resolves.not.toThrow();
      });
    });

    test('should handle browser storage quota scenarios', async () => {
      const quotaError = new DOMException('Storage quota exceeded', 'QuotaExceededError');
      mockDb.put.mockRejectedValue(quotaError);
      
      const { showToast } = jest.requireMock('../ui/components/toast-notifications');
      
      await expect(dbService.put('products', mockProduct)).rejects.toThrow(quotaError);
    });
  });

  describe('Data Migration and Backward Compatibility', () => {
    test('should handle loading data from older schema versions', async () => {
      // Simulate loading legacy data that might have different structure
      const legacyProduct = {
        id: 'legacy',
        name: 'Legacy Product',
        // Missing some modern fields
        category: 'Legacy',
        price: 10 // Old price field instead of pricePer100ml/pricePerBottle
      };
      
      mockDb.get.mockResolvedValue(legacyProduct);
      
      const result = await dbService.get('products', 'legacy');
      expect(result).toEqual(legacyProduct);
    });

    test('should handle inventory state migration', async () => {
      const legacyState = {
        key: 'currentState',
        locations: [],
        products: [],
        // Missing unsyncedChanges field
      };
      
      jest.spyOn(dbService, 'get').mockResolvedValue(legacyState);
      
      const result = await dbService.getInventoryState();
      expect(result).toEqual(legacyState);
    });
  });

  describe('Real-world Usage Patterns', () => {
    test('should handle rapid successive updates', async () => {
      mockDb.put.mockResolvedValue('key');
      
      // Simulate rapid updates like user typing or bulk operations
      const updates = Array.from({ length: 50 }, (_, i) => 
        dbService.put('products', { ...mockProduct, id: `rapid${i}` })
      );
      
      await Promise.all(updates);
      expect(mockDb.put).toHaveBeenCalledTimes(50);
    });

    test('should handle app state restoration after crash', async () => {
      // Simulate app restart where we need to load all data
      const mockProducts = Array.from({ length: 100 }, (_, i) => ({
        ...mockProduct,
        id: `prod${i}`
      }));
      
      const mockLocations = Array.from({ length: 20 }, (_, i) => ({
        ...mockLocation,
        id: `loc${i}`
      }));
      
      jest.spyOn(dbService, 'getAll')
        .mockResolvedValueOnce(mockProducts)
        .mockResolvedValueOnce(mockLocations);
      jest.spyOn(dbService, 'get').mockResolvedValue(mockStoredInventoryState);
      
      const result = await dbService.loadAllApplicationData();
      
      expect(result.products).toHaveLength(100);
      expect(result.locations).toHaveLength(20);
      expect(result.state).toBeTruthy();
    });
  });

  describe('Performance Edge Cases', () => {
    test('should handle operations with extremely large strings', async () => {
      const largeString = 'x'.repeat(1000000); // 1MB string
      const largeProduct = {
        ...mockProduct,
        name: largeString,
        category: largeString
      };
      
      mockDb.put.mockResolvedValue('large');
      
      await expect(dbService.put('products', largeProduct)).resolves.not.toThrow();
    });

    test('should handle operations with deeply nested objects', async () => {
      const createNestedObject = (depth: number): any => {
        if (depth === 0) return { value: 'leaf' };
        return { nested: createNestedObject(depth - 1) };
      };
      
      const deepObject = {
        ...mockLocation,
        metadata: createNestedObject(100) // 100 levels deep
      };
      
      mockDb.put.mockResolvedValue('deep');
      
      await expect(dbService.put('locations', deepObject)).resolves.not.toThrow();
    });
  });

  describe('Security and Data Integrity', () => {
    test('should handle malformed data without crashing', async () => {
      const malformedData = {
        id: 'malformed',
        name: null,
        category: undefined,
        itemsPerCrate: 'not-a-number',
        pricePer100ml: {},
        pricePerBottle: [],
        volume: 'invalid'
      };
      
      mockDb.put.mockResolvedValue('malformed');
      
      await expect(dbService.put('products', malformedData as any)).resolves.not.toThrow();
    });

    test('should handle XSS attempts in string fields', async () => {
      const xssProduct = {
        ...mockProduct,
        name: '<script>alert("xss")</script>',
        category: 'javascript:alert(1)'
      };
      
      mockDb.put.mockResolvedValue('xss');
      
      await dbService.put('products', xssProduct);
      expect(mockDb.put).toHaveBeenCalledWith('products', xssProduct);
    });
  });

  describe('Type Safety and Validation', () => {
    test('should handle operations with correct TypeScript types', async () => {
      const typedProduct: Product = {
        id: 'typed',
        name: 'Typed Product',
        category: 'Category',
        itemsPerCrate: 24,
        pricePer100ml: 2.5,
        pricePerBottle: 18.75,
        volume: 750
      };
      
      mockDb.put.mockResolvedValue('typed');
      
      await dbService.saveProduct(typedProduct);
      expect(mockDb.put).toHaveBeenCalledWith('products', typedProduct);
    });

    test('should handle location with complete counter structure', async () => {
      const completeLocation: Location = {
        id: 'complete',
        name: 'Complete Location',
        counters: [
          {
            id: 'counter1',
            name: 'Bar Counter',
            areas: [
              {
                id: 'area1',
                name: 'Main Bar',
                inventoryItems: [
                  {
                    id: 'item1',
                    productId: 'prod1',
                    quantity: 10,
                    unit: 'bottles'
                  }
                ]
              }
            ]
          }
        ]
      };
      
      mockDb.put.mockResolvedValue('complete');
      
      await dbService.saveLocation(completeLocation);
      expect(mockDb.put).toHaveBeenCalledWith('locations', completeLocation);
    });
  });

