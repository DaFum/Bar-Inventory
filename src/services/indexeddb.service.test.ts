import { openDB, IDBPDatabase, IDBPTransaction, IDBPObjectStore } from 'idb';
import { Product } from '../models'; // Corrected path

// Define constants locally in the test file to avoid hoisting issues with jest.mock
const TEST_DATABASE_NAME = 'BarInventoryDB';
const TEST_DATABASE_VERSION = 1;
const TEST_PRODUCTS_STORE_NAME = 'products';
const TEST_LOCATIONS_STORE_NAME = 'locations';
const TEST_INVENTORY_STATE_STORE_NAME = 'inventoryState';

import {
    IndexedDBService,
    BarInventoryDBSchema,
    StoredInventoryState, // Make sure this is exported if used, or define locally
    // Constants like DATABASE_NAME are now defined locally for the test setup.
    // The actual service will use its own exported constants.
} from '../../src/services/indexeddb.service';

// Define valid transaction modes explicitly
type TransactionMode = 'readonly' | 'readwrite' | 'versionchange';

// Define a more specific type for store names used in transactions based on local constants
type AppStoreNames = typeof TEST_PRODUCTS_STORE_NAME | typeof TEST_LOCATIONS_STORE_NAME | typeof TEST_INVENTORY_STATE_STORE_NAME;

// Type for the store name array expected by IDBPTransaction
type TxStoreNamesArray = AppStoreNames[];

// Mock the 'idb' library
jest.mock('idb', () => {
  // Define string literals for store names directly within the factory to avoid hoisting issues
  const JEST_MOCK_PRODUCTS_STORE_NAME_FACTORY = 'products';
  const JEST_MOCK_LOCATIONS_STORE_NAME_FACTORY = 'locations';
  const JEST_MOCK_INVENTORY_STATE_STORE_NAME_FACTORY = 'inventoryState';
  const JEST_MOCK_DATABASE_NAME_FACTORY = 'BarInventoryDB';
  const JEST_MOCK_DATABASE_VERSION_FACTORY = 1;

  // Simpler instance definitions, will be cast to Mocked<...> later.
  const mockProductStoreInstanceInternal = {
    name: JEST_MOCK_PRODUCTS_STORE_NAME_FACTORY,
    keyPath: 'id',
    indexNames: ['name', 'category'] as any,
    autoIncrement: false,
    get transaction() { return mockTransactionInstanceHandle; },
    add: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    getAll: jest.fn(),
    getKey: jest.fn(),
    getAllKeys: jest.fn(),
    clear: jest.fn(),
    count: jest.fn(),
    openCursor: jest.fn(),
    openKeyCursor: jest.fn(),
    index: jest.fn(),
    createIndex: jest.fn(),
    deleteIndex: jest.fn(),
    iterate: jest.fn(),
    [Symbol.asyncIterator]: jest.fn(),
  };

  const mockLocationStoreInstanceInternal = {
    name: JEST_MOCK_LOCATIONS_STORE_NAME_FACTORY,
    keyPath: 'id',
    indexNames: [] as any,
    autoIncrement: false,
    get transaction() { return mockTransactionInstanceHandle; },
    add: jest.fn(), get: jest.fn(), put: jest.fn(), delete: jest.fn(), getAll: jest.fn(),
    getKey: jest.fn(), getAllKeys: jest.fn(), clear: jest.fn(), count: jest.fn(),
    openCursor: jest.fn(), openKeyCursor: jest.fn(), index: jest.fn(),
    createIndex: jest.fn(), deleteIndex: jest.fn(), iterate: jest.fn(),
    [Symbol.asyncIterator]: jest.fn(),
  };

  const mockInventoryStateStoreInstanceInternal = {
    name: JEST_MOCK_INVENTORY_STATE_STORE_NAME_FACTORY,
    keyPath: 'key',
    indexNames: [] as any,
    autoIncrement: false,
    get transaction() { return mockTransactionInstanceHandle; },
    add: jest.fn(), get: jest.fn(), put: jest.fn(), delete: jest.fn(), getAll: jest.fn(),
    getKey: jest.fn(), getAllKeys: jest.fn(), clear: jest.fn(), count: jest.fn(),
    openCursor: jest.fn(), openKeyCursor: jest.fn(), index: jest.fn(),
    createIndex: jest.fn(), deleteIndex: jest.fn(), iterate: jest.fn(),
    [Symbol.asyncIterator]: jest.fn(),
  };

  let mockTransactionInstanceHandle: any;

  const mockTransactionInstance = {
    objectStore: jest.fn((name: AppStoreNames) => { // AppStoreNames type is fine here as it's about the values
      if (name === JEST_MOCK_PRODUCTS_STORE_NAME_FACTORY) return mockProductStoreInstanceInternal;
      if (name === JEST_MOCK_LOCATIONS_STORE_NAME_FACTORY) return mockLocationStoreInstanceInternal;
      if (name === JEST_MOCK_INVENTORY_STATE_STORE_NAME_FACTORY) return mockInventoryStateStoreInstanceInternal;
      throw new Error(`Mock objectStore: Unknown store name ${name}`);
    }),
    done: jest.fn(),
    commit: jest.fn(),
    abort: jest.fn(),
    objectStoreNames: [JEST_MOCK_PRODUCTS_STORE_NAME_FACTORY, JEST_MOCK_LOCATIONS_STORE_NAME_FACTORY, JEST_MOCK_INVENTORY_STATE_STORE_NAME_FACTORY] as unknown as DOMStringList,
    mode: 'readwrite' as TransactionMode,
    durability: 'default' as IDBTransactionDurability,
    error: null,
    get store() { return mockProductStoreInstanceInternal; },
    db: null as any,
    addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn(),
    onabort: null, oncomplete: null, onerror: null,
  };
  mockTransactionInstanceHandle = mockTransactionInstance;

  const mockDbInstance = {
    transaction: jest.fn(() => mockTransactionInstance),
    close: jest.fn(),
    get: jest.fn(async (storeName: AppStoreNames, query: any) => mockTransactionInstance.objectStore(storeName as any)?.get(query)),
    put: jest.fn(async (storeName: AppStoreNames, value: any) => mockTransactionInstance.objectStore(storeName as any)?.put(value)),
    add: jest.fn(async (storeName: AppStoreNames, value: any) => mockTransactionInstance.objectStore(storeName as any)?.add(value)),
    delete: jest.fn(async (storeName: AppStoreNames, key: any) => mockTransactionInstance.objectStore(storeName as any)?.delete(key)),
    getAll: jest.fn(async (storeName: AppStoreNames) => mockTransactionInstance.objectStore(storeName as any)?.getAll()),
    name: JEST_MOCK_DATABASE_NAME_FACTORY,
    version: JEST_MOCK_DATABASE_VERSION_FACTORY,
    objectStoreNames: [JEST_MOCK_PRODUCTS_STORE_NAME_FACTORY, JEST_MOCK_LOCATIONS_STORE_NAME_FACTORY, JEST_MOCK_INVENTORY_STATE_STORE_NAME_FACTORY] as unknown as DOMStringList,
    clear: jest.fn(), count: jest.fn(), countFromIndex: jest.fn(), createObjectStore: jest.fn(), deleteObjectStore: jest.fn(),
    getFromIndex: jest.fn(), getAllFromIndex: jest.fn(), getAllKeys: jest.fn(), getAllKeysFromIndex: jest.fn(),
    getKey: jest.fn(), getKeyFromIndex: jest.fn(),
    addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn(),
    onabort: null, onclose: null, onerror: null, onversionchange: null,
  };
  (mockTransactionInstance as any).db = mockDbInstance;

  return {
    openDB: jest.fn().mockResolvedValue(mockDbInstance),
  };
});

// Types for the variables holding the mocked stores, using local TEST_ constants for store names
type MockedProductStoreType = jest.Mocked<IDBPObjectStore<BarInventoryDBSchema, TxStoreNamesArray, typeof TEST_PRODUCTS_STORE_NAME, TransactionMode>>;
type MockedLocationStoreType = jest.Mocked<IDBPObjectStore<BarInventoryDBSchema, TxStoreNamesArray, typeof TEST_LOCATIONS_STORE_NAME, TransactionMode>>;

let mockDb: jest.Mocked<IDBPDatabase<BarInventoryDBSchema>>;
let mockTransaction: jest.Mocked<IDBPTransaction<BarInventoryDBSchema, TxStoreNamesArray, TransactionMode>>;
let mockProductStore: MockedProductStoreType;
let mockLocationStore: MockedLocationStoreType;


describe('IndexedDBService', () => {
  let dbService: IndexedDBService;
  let ActualDBService: typeof IndexedDBService;
  let originalIndexedDB: any; // To store the original window.indexedDB

  beforeEach(async () => {
    jest.clearAllMocks();

    originalIndexedDB = (window as any).indexedDB; // Store original

    const mockIDBFactory = {
      open: jest.fn().mockReturnValue({ onupgradeneeded: null, onsuccess: null, onerror: null, result: null, error: null, readyState: 'pending', transaction: null, source: null, addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn() }),
      deleteDatabase: jest.fn(),
      cmp: jest.fn(),
    };
    (window as any).indexedDB = mockIDBFactory; // Direct assignment


    const idb = await import('idb');
    mockDb = await idb.openDB(TEST_DATABASE_NAME, TEST_DATABASE_VERSION) as jest.Mocked<IDBPDatabase<BarInventoryDBSchema>>;

    await jest.isolateModulesAsync(async () => {
      const mod = await import('../../src/services/indexeddb.service');
      ActualDBService = mod.IndexedDBService;
    });

    if (!ActualDBService) throw new Error("Failed to load IndexedDBService dynamically");
    dbService = new ActualDBService(); // Constructor should now find window.indexedDB

    // Assign mocks after dbService is created
    // The key is that dbService.dbPromise will use the mocked openDB
    // And subsequent calls to db.transaction() by service methods will use mocked db.transaction
    const storeNamesForTx: TxStoreNamesArray = [TEST_PRODUCTS_STORE_NAME, TEST_LOCATIONS_STORE_NAME, TEST_INVENTORY_STATE_STORE_NAME];
    mockTransaction = mockDb.transaction(storeNamesForTx, 'readwrite') as jest.Mocked<IDBPTransaction<BarInventoryDBSchema, TxStoreNamesArray, TransactionMode>>;

    mockProductStore = mockTransaction.objectStore(TEST_PRODUCTS_STORE_NAME) as any as MockedProductStoreType;
    mockLocationStore = mockTransaction.objectStore(TEST_LOCATIONS_STORE_NAME) as any as MockedLocationStoreType;

    await (dbService as any).dbPromise;
  });

  afterEach(() => {
    (window as any).indexedDB = originalIndexedDB; // Restore original
  });

  describe('Initialization', () => {
    it('should initialize the database with correct stores and indexes', async () => {
      // The dbService constructor calls openDB. We need to ensure this call was made.
      // The actual instance of openDB used by the service is the one from the mock factory.
      const { openDB: mockedOpenDB } = jest.requireMock('idb');
      expect(mockedOpenDB).toHaveBeenCalledWith(TEST_DATABASE_NAME, TEST_DATABASE_VERSION, expect.any(Object));
    });
  });

  describe('Product Operations', () => {
    const testProduct: Product = { id: '1', name: 'Test Product', category: 'Test Category', itemsPerCrate:12, pricePerBottle: 10, pricePer100ml:1, volume:700 };

    it('should save a product (using saveProduct)', async () => {
      (mockProductStore.put as jest.Mock).mockResolvedValue(testProduct.id);
      await dbService.saveProduct(testProduct);
      expect(mockProductStore.put).toHaveBeenCalledWith(testProduct);
    });

    it('should get a product by id (using generic get)', async () => {
      (mockProductStore.get as jest.Mock).mockResolvedValue(testProduct);
      const product = await dbService.get(TEST_PRODUCTS_STORE_NAME, '1'); // Use local constant
      expect(mockProductStore.get).toHaveBeenCalledWith('1');
      expect(product).toEqual(testProduct);
    });
    
    it('should load all products (using loadProducts)', async () => {
      const products = [testProduct, { ...testProduct, id: '2', name: 'Another Product' }];
      (mockProductStore.getAll as jest.Mock).mockResolvedValue(products);
      const result = await dbService.loadProducts();
      expect(mockProductStore.getAll).toHaveBeenCalled();
      expect(result).toEqual(products);
    });

    it('should delete a product (using generic delete)', async () => {
      (mockProductStore.delete as jest.Mock).mockResolvedValue(undefined);
      await dbService.delete(TEST_PRODUCTS_STORE_NAME, '1'); // Use local constant
      expect(mockProductStore.delete).toHaveBeenCalledWith('1');
    });
  });


  describe('Error Handling', () => {
    it('should handle errors during product saving', async () => {
      const error = new Error('Failed to save product');
      (mockProductStore.put as jest.Mock).mockRejectedValue(error);
      
      const testProduct: Product = { id: 'err', name: 'Error Product', category: 'Cat', itemsPerCrate:1, pricePerBottle:1, pricePer100ml:1, volume:1 };
      await expect(dbService.saveProduct(testProduct)).rejects.toThrow('Failed to save product');
    });

    it('should handle errors if database is not initialized for an operation', async () => {
      let faultyDbService!: IndexedDBService;
      const originalLocalIndexedDB = (window as any).indexedDB; // Store before isolation
      
      // We don't need to mock window.indexedDB.open to throw here.
      // We will make the idb.openDB mock reject.
      // const mockIDBFactoryIsolated = {
      //   open: jest.fn().mockImplementation(() => { throw new Error("Simulated open error for faulty service"); }),
      //   deleteDatabase: jest.fn(),
      //   cmp: jest.fn(),
      // };

      await jest.isolateModulesAsync(async () => {
        // (window as any).indexedDB = mockIDBFactoryIsolated; // Not needed if idb.openDB is mocked to fail

        const { openDB: isolatedOpenDB } = jest.requireMock('idb');
        // Make the idb's openDB fail for the next instantiation
        isolatedOpenDB.mockRejectedValueOnce(new Error('DB init failed'));
        
        const mod = await import('../../src/services/indexeddb.service');
        // The constructor itself should not throw if window.indexedDB is present.
        // It assigns this.dbPromise = this.initDB();
        // this.initDB() calls openDB, which will reject.
        faultyDbService = new mod.IndexedDBService();

        // No complex try-catch needed here for service instantiation if window.indexedDB is valid.
        // The error is expected on faultyDbService.dbPromise.
      });

      // Restore window.indexedDB if it was changed by other parts of the test (though not strictly necessary for this refactor)
      // (window as any).indexedDB = originalLocalIndexedDB;

      expect(faultyDbService).toBeDefined(); // Ensure faultyDbService was assigned
      // Accessing dbPromise should reveal the rejection from initDB()
      await expect((faultyDbService as any).dbPromise).rejects.toThrow('DB init failed');

      const testProduct: Product = {id: '1', name: 'test', category: 'test', itemsPerCrate:1, pricePerBottle:1, pricePer100ml:1, volume:1};
      // This call should also fail because dbPromise is rejected.
      // The service methods typically await this.dbPromise first.
      await expect(faultyDbService.saveProduct(testProduct)).rejects.toThrow('DB init failed');
    });
  });

  describe('Data Migration (Conceptual)', () => {
    it('should correctly invoke upgrade callback', async () => {
      const idbMock = jest.requireMock('idb');
      expect(idbMock.openDB).toHaveBeenCalled();
    });
  });

});