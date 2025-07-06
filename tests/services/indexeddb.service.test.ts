/*
 * #1 Updates
 * - This file should be expanded to re-introduce critical tests from the original version.
 * - Focus on restoring tests for error handling (e.g., transaction failures, quota limits),
 *   schema upgrades, and data integrity checks for complex objects.
 *
 * #2 Future Ideas
 * - Implement property-based testing to automatically generate a wide range of test data,
 *   which can help uncover edge cases in data validation and serialization.
 * - Add performance tests to benchmark database operations with large datasets.
 *
 * #3 Issues and Fixes
 * - Issue: The current test suite has significantly reduced coverage compared to the original.
 *   This increases the risk of regressions going undetected.
 * - Fix: Incrementally restore the deleted tests, prioritizing those that cover the most
 *   critical or complex logic in the IndexedDB service. Start with error handling and
 *   transaction management tests.
 *
 * This model is quite capable of analyzing code and providing structured feedback.
 */

// Note: dbService import will be done dynamically after mocks are set up.
// import { dbService } from '../../src/services/indexeddb.service';
import { Product, Location, InventoryState } from '../../src/models';
import { openDB, IDBPDatabase, IDBPTransaction, IDBPObjectStore } from 'idb';
// BarInventoryDBSchema and StoredInventoryState will also be imported dynamically or type-only.
import type { BarInventoryDBSchema as BarInventoryDBSchemaType, StoredInventoryState as StoredInventoryStateType } from '../../src/services/indexeddb.service';

const DATABASE_NAME = 'BarInventoryDB';
const DATABASE_VERSION = 1;

// Mock 'idb' library
// Mock store and transaction functionalities for more granular control
const mockStoreActions = () => ({
  add: jest.fn(),
  put: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  createIndex: jest.fn(), // For upgrade testing
  // Add other IDBPObjectStore methods if needed
});

let mockProductStoreActions = mockStoreActions();
let mockLocationStoreActions = mockStoreActions();
let mockInventoryStateStoreActions = mockStoreActions();

let mockTransactionInstance: {
  objectStore: jest.Mock;
  done: Promise<void> | jest.Mock<Promise<void>>;
  abort: jest.Mock;
  storeNames: any[];
  mode: 'readwrite' | 'readonly';
  commit: jest.Mock; // For explicit commit simulation if needed
  // onabort: () => void; // For simulating events
  // onerror: (event: Event) => void; // For simulating events
  // oncomplete: () => void; // For simulating events
};

const mockTransaction = jest.fn().mockImplementation((storeNames, mode) => {
  mockTransactionInstance = {
    objectStore: jest.fn((name) => {
      if (name === 'products') return mockProductStoreActions;
      if (name === 'locations') return mockLocationStoreActions;
      if (name === 'inventoryState') return mockInventoryStateStoreActions;
      throw new Error(`Mock Error: Unknown object store ${name}`);
    }),
    done: jest.fn().mockResolvedValue(undefined), // Default to resolve
    abort: jest.fn(),
    commit: jest.fn(),
    storeNames,
    mode,
  };
  return mockTransactionInstance;
});

const mockDBCallbacks: {
  upgrade?: (db: any, oldVersion: number, newVersion: number | null, tx: any, event: IDBVersionChangeEvent) => void;
  blocked?: (currentVersion: number, blockedVersion: number | null, event: IDBVersionChangeEvent) => void;
  blocking?: (currentVersion: number, blockedVersion: number | null, event: IDBVersionChangeEvent) => void;
  terminated?: () => void;
} = {};


const mockDbInstance = {
  transaction: mockTransaction,
  get: jest.fn(),
  getAll: jest.fn(),
  put: jest.fn(),
  add: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  name: 'BarInventoryDB',
  version: 1,
  objectStoreNames: {
    contains: jest.fn((name: string) => { // Simulate existing stores for upgrade tests
        if (name === 'products' && mockDbInstance.objectStoreNames.mockContainsProductStore) return true;
        if (name === 'locations' && mockDbInstance.objectStoreNames.mockContainsLocationStore) return true;
        if (name === 'inventoryState' && mockDbInstance.objectStoreNames.mockContainsInventoryStateStore) return true;
        return false;
    }),
    mockContainsProductStore: false, // Control flags for testing upgrades
    mockContainsLocationStore: false,
    mockContainsInventoryStateStore: false,
    length: 0, // Will be updated by createObjectStore
    item: jest.fn(), // Not typically used directly with 'idb' like this but good for completeness
  } as any,
  close: jest.fn(),
  createObjectStore: jest.fn().mockImplementation((storeName, options) => {
    // Simulate store creation and return a mock store that can have indexes created
    const newMockStore = mockStoreActions();
    if (storeName === 'products') mockProductStoreActions = newMockStore;
    else if (storeName === 'locations') mockLocationStoreActions = newMockStore;
    else if (storeName === 'inventoryState') mockInventoryStateStoreActions = newMockStore;

    // Update objectStoreNames
    if (!mockDbInstance.objectStoreNames.contains(storeName)) {
        (mockDbInstance.objectStoreNames as any)[storeName] = true; // simplified tracking
        mockDbInstance.objectStoreNames.length++;
        if (storeName === 'products') mockDbInstance.objectStoreNames.mockContainsProductStore = true;
        if (storeName === 'locations') mockDbInstance.objectStoreNames.mockContainsLocationStore = true;
        if (storeName === 'inventoryState') mockDbInstance.objectStoreNames.mockContainsInventoryStateStore = true;
    }
    return newMockStore;
  }),
  deleteObjectStore: jest.fn(),
  // Add other IDBPDatabase methods if needed
};

const mockOpenDB = jest.fn().mockImplementation(async (name, version, { upgrade, blocked, blocking, terminated } = {}) => {
  mockDBCallbacks.upgrade = upgrade;
  mockDBCallbacks.blocked = blocked;
  mockDBCallbacks.blocking = blocking;
  mockDBCallbacks.terminated = terminated;

  // Simulate upgrade callback if versions differ or stores don't exist
  if (upgrade && (version > mockDbInstance.version ||
      !mockDbInstance.objectStoreNames.contains('products') ||
      !mockDbInstance.objectStoreNames.contains('locations') ||
      !mockDbInstance.objectStoreNames.contains('inventoryState'))) {
    // Pass a mock transaction to upgrade, as the real one is complex to fully mock here
    // The key is that db.createObjectStore is called on mockDbInstance
    await Promise.resolve(upgrade(mockDbInstance as any, mockDbInstance.version, version, mockTransactionInstance as any, {} as IDBVersionChangeEvent));
    mockDbInstance.version = version!;
  }
  return Promise.resolve(mockDbInstance);
});


jest.mock('idb', () => {
  const actualIdb = jest.requireActual('idb'); // Keep actual types if needed
  return {
    ...actualIdb, // Spread actual to keep types and other exports
    openDB: mockOpenDB,
    // Potentially mock other exports if the service uses them directly
  };
});

// Mock toast notifications
jest.mock('../../src/ui/components/toast-notifications', () => ({
  showToast: jest.fn(),
}));

// Mock window.indexedDB for the service constructor check
const mockIDBFactory = {
  open: jest.fn(), // This might not be directly used by 'idb' promise wrapper but good to have
  deleteDatabase: jest.fn(),
  cmp: jest.fn(),
};
// Ensure window.indexedDB is defined for the service's initial check
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
let dbService: any; // Instance of IndexedDBService
let IndexedDBServiceClass: any; // The class itself for testing constructor errors
let showToastMock: jest.Mock;

// To store and restore mockTransaction's implementation
let originalMockTransactionImplementation: any;

describe('IndexedDBService', () => {
  // Re-assign mocks for each test to ensure isolation
  let mockDb: jest.Mocked<IDBPDatabase<BarInventoryDBSchemaType>>;
  let currentMockProductStore: jest.Mocked<ReturnType<typeof mockStoreActions>>;
  let currentMockLocationStore: jest.Mocked<ReturnType<typeof mockStoreActions>>;
  let currentMockInventoryStateStore: jest.Mocked<ReturnType<typeof mockStoreActions>>;


  beforeEach(async () => {
    jest.clearAllMocks(); // Clears all mocks, including openDB, showToast etc.

    // Reset store action mocks for each test
    mockProductStoreActions = mockStoreActions();
    mockLocationStoreActions = mockStoreActions();
    mockInventoryStateStoreActions = mockStoreActions();

    // Reset control flags for store existence in upgrade tests
    mockDbInstance.objectStoreNames.mockContainsProductStore = false;
    mockDbInstance.objectStoreNames.mockContainsLocationStore = false;
    mockDbInstance.objectStoreNames.mockContainsInventoryStateStore = false;
    mockDbInstance.objectStoreNames.length = 0;
    mockDbInstance.version = 0; // Start with version 0 to ensure upgrade runs for version 1

    // Redefine window.indexedDB for each test if it was cleared or modified
    if (typeof window !== 'undefined') {
        Object.defineProperty(window, 'indexedDB', {
            value: mockIDBFactory,
            writable: true,
            configurable: true,
        });
    }

    // Dynamically import showToast to get the mock
    const toastNotifications = await import('../../src/ui/components/toast-notifications');
    showToastMock = toastNotifications.showToast as jest.Mock;


    // Setup the mockDb references for convenience in tests, though openDB returns mockDbInstance directly
    mockDb = mockDbInstance as any;
    // Assign currentMockXStore before service instantiation
    currentMockProductStore = mockProductStoreActions as any;
    currentMockLocationStore = mockLocationStoreActions as any;
    currentMockInventoryStateStore = mockInventoryStateStoreActions as any;

    // Configure openDB to return the reset mockDbInstance by default
    // The mockOpenDB function itself is already defined and will be used.
    // We just need to ensure its internal state (mockDbInstance) is reset.

    // Isolate module loading for IndexedDBService to get a fresh instance with fresh mocks
    await jest.isolateModulesAsync(async () => {
        const { IndexedDBService } = await import('../../src/services/indexeddb.service');
        IndexedDBServiceClass = IndexedDBService; // Store the class
        dbService = new IndexedDBService(); // Create instance for most tests
    });

    // After service instantiation, re-assign currentMockXStore to point to the
    // potentially updated mockXStoreActions if createObjectStore was called during upgrade.
    currentMockProductStore = mockProductStoreActions as any;
    currentMockLocationStore = mockLocationStoreActions as any;
    currentMockInventoryStateStore = mockInventoryStateStoreActions as any;

    // After dbService is instantiated, mockTransactionInstance will be set if a transaction was started
    // by the service itself (e.g. during openDB upgrade if it used transactions, though current idb pattern for upgrade doesn't directly expose this).
    // For methods like saveAllApplicationData, a new transaction is created, and mockTransactionInstance will be updated then.

    // Store the original implementation of mockTransaction before any test modifies it
    if (!originalMockTransactionImplementation) {
      originalMockTransactionImplementation = mockTransaction.getMockImplementation();
    }
  });

  afterEach(() => {
    // Restore mockTransaction to its original implementation after each test if it was changed
    if (originalMockTransactionImplementation) {
      mockTransaction.mockImplementation(originalMockTransactionImplementation);
    }
  });

  describe('Constructor and Initialization', () => {
    test('should throw error and show toast if IndexedDB is not supported', () => {
      // Directly require the mock for this synchronous test case to ensure the reference is correct.
      // jest.clearAllMocks() in beforeEach has cleared its call history.
      const { showToast: requiredShowToastMock } = require('../../src/ui/components/toast-notifications');

      Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true });
      expect(() => new IndexedDBServiceClass()).toThrow('IndexedDB not supported');
      expect(requiredShowToastMock).toHaveBeenCalledWith(
        'IndexedDB wird nicht unterstützt. Daten können nicht gespeichert werden.',
        'error'
      );
    });

    test('should call openDB with correct parameters', () => {
      // dbService is already instantiated in beforeEach
      expect(mockOpenDB).toHaveBeenCalledWith(
        DATABASE_NAME,
        DATABASE_VERSION,
        expect.objectContaining({
          upgrade: expect.any(Function),
          blocked: expect.any(Function),
          blocking: expect.any(Function),
          terminated: expect.any(Function),
        })
      );
    });

    test('should handle blocked event from openDB', () => {
        expect(mockDBCallbacks.blocked).toBeDefined();
        mockDBCallbacks.blocked!(DATABASE_VERSION, DATABASE_VERSION + 1, {} as IDBVersionChangeEvent);
        expect(showToastMock).toHaveBeenCalledWith('Datenbankzugriff blockiert. Bitte andere Tabs schließen.', 'error');
    });

    test('should handle blocking event from openDB', () => {
        expect(mockDBCallbacks.blocking).toBeDefined();
        mockDBCallbacks.blocking!(DATABASE_VERSION, DATABASE_VERSION -1, {} as IDBVersionChangeEvent);
        expect(showToastMock).toHaveBeenCalledWith(
            'Datenbank-Update blockiert. Bitte andere Tabs der App schließen und neu laden.',
            'warning'
        );
    });

    test('should handle terminated event from openDB', () => {
        expect(mockDBCallbacks.terminated).toBeDefined();
        mockDBCallbacks.terminated!();
        expect(showToastMock).toHaveBeenCalledWith('Datenbankverbindung unerwartet beendet. Bitte App neu laden.', 'error');
    });
  });

  describe('Schema Upgrades (upgrade callback)', () => {
    beforeEach(() => {
        // Reset store creation status for each upgrade test
        mockDbInstance.objectStoreNames.mockContainsProductStore = false;
        mockDbInstance.objectStoreNames.mockContainsLocationStore = false;
        mockDbInstance.objectStoreNames.mockContainsInventoryStateStore = false;
        mockDbInstance.objectStoreNames.length = 0;
        // Ensure createObjectStore is clear of previous calls for specific store names in a test
        mockDbInstance.createObjectStore.mockClear();
        // Reset version to 0 to force upgrade logic for version 1
        mockDbInstance.version = 0;
    });

    test('should create all object stores and indexes if db is new (oldVersion < 1)', async () => {
        // The upgrade callback is passed to openDB, we need to simulate openDB calling it.
        // This is handled by the mockOpenDB implementation if version is different or stores don't exist.
        // Here, we explicitly call the upgrade function obtained by openDB
        // to ensure it's testable in isolation if needed, or rely on the mockOpenDB behavior.

        // Re-initialize service to trigger openDB with specific conditions
        // For this test, we ensure stores are marked as not existing.
        mockDbInstance.objectStoreNames.mockContainsProductStore = false;
        mockDbInstance.objectStoreNames.mockContainsLocationStore = false;
        mockDbInstance.objectStoreNames.mockContainsInventoryStateStore = false;

        // Instantiate service, which calls openDB, which calls upgrade
        dbService = new IndexedDBServiceClass();
        const lastCallIndex = mockOpenDB.mock.calls.length - 1;
        if (lastCallIndex >= 0 && mockOpenDB.mock.results[lastCallIndex]) {
          await mockOpenDB.mock.results[lastCallIndex].value; // Wait for openDB to resolve
        }


        // Verify stores were created
        expect(mockDbInstance.createObjectStore).toHaveBeenCalledWith('products', { keyPath: 'id' });
        expect(mockDbInstance.createObjectStore).toHaveBeenCalledWith('locations', { keyPath: 'id' });
        expect(mockDbInstance.createObjectStore).toHaveBeenCalledWith('inventoryState', { keyPath: 'key' });

        // Verify index was created on product store
        // The mockProductStoreActions should now point to the one created by createObjectStore
        // We need to ensure the correct mock store instance is checked.
        // The createObjectStore mock now returns the specific mockStoreActions, so check that one.
        expect(currentMockProductStore.createIndex).toHaveBeenCalledWith('category', 'category');
    });

    test('should not attempt to create stores if they exist and version is current', async () => {
        mockDbInstance.version = DATABASE_VERSION; // Current version
        mockDbInstance.objectStoreNames.mockContainsProductStore = true;
        mockDbInstance.objectStoreNames.mockContainsLocationStore = true;
        mockDbInstance.objectStoreNames.mockContainsInventoryStateStore = true;
        mockDbInstance.objectStoreNames.length = 3;

        mockDbInstance.createObjectStore.mockClear(); // Clear past calls

        // Instantiate service
        dbService = new IndexedDBServiceClass();
        const lastCallIndex = mockOpenDB.mock.calls.length - 1;
        if (lastCallIndex >= 0 && mockOpenDB.mock.results[lastCallIndex]) {
          await mockOpenDB.mock.results[lastCallIndex].value; // Wait for openDB to resolve
        }

        // Verify createObjectStore was NOT called
        expect(mockDbInstance.createObjectStore).not.toHaveBeenCalled();
    });

    test('should call upgrade callback with correct versions for a future upgrade (e.g., v1 to v2)', async () => {
      // Ensure the db is initially at version 1 and all stores exist
      mockDbInstance.version = 1;
      mockDbInstance.objectStoreNames.mockContainsProductStore = true;
      mockDbInstance.objectStoreNames.mockContainsLocationStore = true;
      mockDbInstance.objectStoreNames.mockContainsInventoryStateStore = true;
      mockDbInstance.objectStoreNames.length = 3;

      mockDbInstance.createObjectStore.mockClear(); // Clear any previous calls

      // The `upgrade` function is captured in `mockDBCallbacks.upgrade` when the service is instantiated.
      // We will call this captured function directly, simulating how `openDB` would invoke it.
      expect(mockDBCallbacks.upgrade).toBeDefined();

      const consoleSpy = jest.spyOn(console, 'log');

      // Simulate openDB calling the upgrade function for an upgrade from v1 to v2
      if (mockDBCallbacks.upgrade) {
        await mockDBCallbacks.upgrade(
          mockDbInstance as any, // The mock IDBPDatabase instance
          1,                     // oldVersion
          2,                     // newVersion
          mockTransactionInstance as any, // A mock transaction, not deeply used by current upgrade logic beyond being passed
          {} as IDBVersionChangeEvent // A mock event
        );
      }

      // Verify the console log inside the service's upgrade function
      expect(consoleSpy).toHaveBeenCalledWith('Upgrading database from version 1 to 2');

      // Currently, no schema changes are defined for v2, so no new stores/indexes should be created.
      expect(mockDbInstance.createObjectStore).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('getAll should propagate errors from db.getAll', async () => {
      const error = new Error('DB getAll failed');
      mockDb.getAll.mockRejectedValue(error);
      await expect(dbService.getAll('products')).rejects.toThrow('DB getAll failed');
    });

    test('get should propagate errors from db.get', async () => {
      const error = new Error('DB get failed');
      mockDb.get.mockRejectedValue(error);
      await expect(dbService.get('products', 'prod1')).rejects.toThrow('DB get failed');
    });

    test('put should propagate errors from db.put', async () => {
      const error = new Error('DB put failed');
      mockDb.put.mockRejectedValue(error);
      await expect(dbService.put('products', mockProduct)).rejects.toThrow('DB put failed');
    });

    test('add should propagate errors from db.add (e.g. QuotaExceededError)', async () => {
      const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');
      mockDb.add.mockRejectedValue(quotaError);
      await expect(dbService.add('products', mockProduct)).rejects.toThrow(quotaError);
    });

    test('delete should propagate errors from db.delete', async () => {
      const error = new Error('DB delete failed');
      mockDb.delete.mockRejectedValue(error);
      await expect(dbService.delete('products', 'prod1')).rejects.toThrow('DB delete failed');
    });

    test('clearStore should propagate errors from db.clear', async () => {
      const error = new Error('DB clear failed');
      mockDb.clear.mockRejectedValue(error);
      await expect(dbService.clearStore('products')).rejects.toThrow('DB clear failed');
    });

    describe('saveAllApplicationData transaction errors', () => {
      const testData = {
        products: [mockProduct],
        locations: [mockLocation],
        state: mockInventoryState,
      };

      test('should handle error during product put and abort transaction', async () => {
        const error = new Error('Product put failed');
        currentMockProductStore.put.mockRejectedValue(error); // Simulate error in product store

        // Ensure transaction.done is a mock that can be rejected
        const mockDonePromise = jest.fn().mockRejectedValue(error); // Simulate transaction abort
        mockTransaction.mockImplementation((storeNames, mode) => ({
            ...mockTransactionInstance, // Spread the default instance
            objectStore: jest.fn((name) => { // Keep objectStore logic
                if (name === 'products') return currentMockProductStore;
                if (name === 'locations') return currentMockLocationStore;
                if (name === 'inventoryState') return currentMockInventoryStateStore;
                throw new Error(`Mock Error: Unknown object store ${name}`);
            }),
            done: mockDonePromise, // Use the mock for done
        }));

        // Re-initialize service to pick up the new transaction mock behavior for the next transaction
        dbService = new IndexedDBServiceClass();
        const lastCallIndexForProductError = mockOpenDB.mock.calls.length - 1;
        if (lastCallIndexForProductError >= 0 && mockOpenDB.mock.results[lastCallIndexForProductError]) {
          await mockOpenDB.mock.results[lastCallIndexForProductError].value;
        }


        await expect(dbService.saveAllApplicationData(testData)).rejects.toThrow('Product put failed');
        expect(currentMockProductStore.put).toHaveBeenCalledWith(mockProduct);
        expect(showToastMock).toHaveBeenCalledWith(
          'Fehler beim Speichern der Anwendungsdaten. Änderungen wurden nicht gespeichert.',
          'error'
        );
        // In a real scenario, tx.abort() would be called internally by idb library on error,
        // or tx.done would reject. We check that tx.done was indeed rejected.
        await expect(mockDonePromise()).rejects.toThrow('Product put failed');
      });

      test('should handle error if transaction.done rejects for other reasons', async () => {
        const error = new Error('Transaction failed');
        // Ensure getAllKeys returns iterables for this test path
        currentMockProductStore.getAllKeys.mockResolvedValue([]);
        currentMockLocationStore.getAllKeys.mockResolvedValue([]);

        currentMockProductStore.put.mockResolvedValue('prod1'); // Product put succeeds
        currentMockLocationStore.put.mockResolvedValue('loc1'); // Location put succeeds
        currentMockInventoryStateStore.put.mockResolvedValue('currentState'); // State put succeeds

        // Simulate transaction.done rejecting
        const mockRejectedDonePromise = Promise.reject(error); // This IS a promise
        mockTransaction.mockImplementation((storeNames, mode) => ({
            // ...mockTransactionInstance, // Avoid spreading the old instance's .done
            objectStore: jest.fn((name) => {
                if (name === 'products') return currentMockProductStore;
                if (name === 'locations') return currentMockLocationStore;
                if (name === 'inventoryState') return currentMockInventoryStateStore;
                throw new Error(`Mock Error: Unknown object store ${name}`);
            }),
            done: mockRejectedDonePromise, // Assign the actual promise
            abort: jest.fn(), // Ensure abort is still there
            commit: jest.fn(), // Ensure commit is still there
            storeNames, // Ensure storeNames is still there
            mode, // Ensure mode is still there
        }));

        dbService = new IndexedDBServiceClass();
        const lastCallIndexForTxError = mockOpenDB.mock.calls.length - 1;
        if (lastCallIndexForTxError >= 0 && mockOpenDB.mock.results[lastCallIndexForTxError]) {
          await mockOpenDB.mock.results[lastCallIndexForTxError].value;
        }

        await expect(dbService.saveAllApplicationData(testData)).rejects.toThrow('Transaction failed');
        expect(showToastMock).toHaveBeenCalledWith(
          'Fehler beim Speichern der Anwendungsdaten. Änderungen wurden nicht gespeichert.',
          'error'
        );
      });
    });
  });

  describe('Generic CRUD operations', () => {
    test('getAll should call db.getAll with storeName', async () => {
      mockDb.getAll.mockResolvedValue([mockProduct] as any);
      const result = await dbService.getAll('products');
      expect(mockDb.getAll).toHaveBeenCalledWith('products');
      expect(result).toEqual([mockProduct]);
    });

    test('get should call db.get with storeName and key', async () => {
      mockDb.get.mockResolvedValue(mockProduct as any);
      const result = await dbService.get('products', 'prod1');
      expect(mockDb.get).toHaveBeenCalledWith('products', 'prod1');
      expect(result).toEqual(mockProduct);
    });

    test('put should call db.put with storeName and value', async () => {
      mockDb.put.mockResolvedValue('prod1' as any);
      await dbService.put('products', mockProduct);
      expect(mockDb.put).toHaveBeenCalledWith('products', mockProduct);
    });

    test('add should call db.add with storeName and value', async () => {
      mockDb.add.mockResolvedValue('prod1' as any);
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

  describe('Complex Data Operations (saveAllApplicationData / loadAllApplicationData)', () => {
    const product1: Product = { id: 'p1', name: 'Product 1', category: 'Cat A', itemsPerCrate: 10, pricePer100ml:1, pricePerBottle:10, volume:700 };
    const product2: Product = { id: 'p2', name: 'Product 2', category: 'Cat B', itemsPerCrate: 12, pricePer100ml:2, pricePerBottle:12, volume:750 };
    const product3: Product = { id: 'p3', name: 'Product 3', category: 'Cat A', itemsPerCrate: 6, pricePer100ml:3, pricePerBottle:15, volume:1000 };

    const location1: Location = { id: 'l1', name: 'Location 1', counters: [] };
    const location2: Location = { id: 'l2', name: 'Location 2', counters: [] };
    const location3: Location = { id: 'l3', name: 'Location 3', counters: [] };

    const inventoryState1: InventoryState = { products: [product1], locations: [location1], unsyncedChanges: false };
    const storedInventoryState1: StoredInventoryStateType = { ...inventoryState1, key: 'currentState' };
    const inventoryState2: InventoryState = { products: [product2], locations: [location2], unsyncedChanges: true };
    const storedInventoryState2: StoredInventoryStateType = { ...inventoryState2, key: 'currentState' };


    beforeEach(() => {
      // Reset all store method mocks
      Object.values(currentMockProductStore).forEach(mockFn => mockFn.mockReset());
      Object.values(currentMockLocationStore).forEach(mockFn => mockFn.mockReset());
      Object.values(currentMockInventoryStateStore).forEach(mockFn => mockFn.mockReset());

      // Default mock implementations for getAllKeys
      currentMockProductStore.getAllKeys.mockResolvedValue([]);
      currentMockLocationStore.getAllKeys.mockResolvedValue([]);
      // Default for put operations (can be overridden in tests)
      currentMockProductStore.put.mockImplementation(async (item: Product) => item.id);
      currentMockLocationStore.put.mockImplementation(async (item: Location) => item.id);
      currentMockInventoryStateStore.put.mockImplementation(async (item: StoredInventoryStateType) => item.key);
    });

    describe('saveAllApplicationData', () => {
      test('should add all new items and state if DB is empty', async () => {
        const dataToSave = {
          products: [product1, product2],
          locations: [location1],
          state: inventoryState1,
        };

        await dbService.saveAllApplicationData(dataToSave);

        expect(currentMockProductStore.getAllKeys).toHaveBeenCalledTimes(1);
        expect(currentMockLocationStore.getAllKeys).toHaveBeenCalledTimes(1);

        expect(currentMockProductStore.put).toHaveBeenCalledWith(product1);
        expect(currentMockProductStore.put).toHaveBeenCalledWith(product2);
        expect(currentMockLocationStore.put).toHaveBeenCalledWith(location1);
        expect(currentMockInventoryStateStore.put).toHaveBeenCalledWith(storedInventoryState1);

        expect(currentMockProductStore.delete).not.toHaveBeenCalled();
        expect(currentMockLocationStore.delete).not.toHaveBeenCalled();
        // Verifying operations on stores is sufficient; tx.done success is implied by lack of error.
      });

      test('should update existing items and add new ones', async () => {
        currentMockProductStore.getAllKeys.mockResolvedValue(['p1'] as any[]); // Product p1 exists
        currentMockLocationStore.getAllKeys.mockResolvedValue([]);       // No locations exist

        const updatedProduct1 = { ...product1, name: 'Updated Product 1' };
        const dataToSave = {
          products: [updatedProduct1, product2], // p1 updated, p2 new
          locations: [location1],             // l1 new
        };

        await dbService.saveAllApplicationData(dataToSave);

        expect(currentMockProductStore.put).toHaveBeenCalledWith(updatedProduct1);
        expect(currentMockProductStore.put).toHaveBeenCalledWith(product2);
        expect(currentMockLocationStore.put).toHaveBeenCalledWith(location1);

        expect(currentMockProductStore.delete).not.toHaveBeenCalled();
        expect(currentMockLocationStore.delete).not.toHaveBeenCalled();
        // Verifying operations on stores is sufficient; tx.done success is implied by lack of error.
      });

      test('should delete obsolete items not present in input data', async () => {
        currentMockProductStore.getAllKeys.mockResolvedValue(['p1', 'p3'] as any[]); // p1, p3 exist
        currentMockLocationStore.getAllKeys.mockResolvedValue(['l2', 'l3'] as any[]); // l2, l3 exist

        const dataToSave = {
          products: [product1], // p1 kept, p3 should be deleted
          locations: [],        // l2, l3 should be deleted
        };

        await dbService.saveAllApplicationData(dataToSave);

        expect(currentMockProductStore.put).toHaveBeenCalledWith(product1);
        expect(currentMockProductStore.delete).toHaveBeenCalledWith('p3');

        expect(currentMockLocationStore.put).not.toHaveBeenCalled();
        expect(currentMockLocationStore.delete).toHaveBeenCalledWith('l2');
        expect(currentMockLocationStore.delete).toHaveBeenCalledWith('l3');
        // Verifying operations on stores is sufficient; tx.done success is implied by lack of error.
      });

      test('should handle mixed add, update, and delete operations correctly', async () => {
        currentMockProductStore.getAllKeys.mockResolvedValue(['p1', 'pOld'] as any[]);    // p1, pOld exist
        currentMockLocationStore.getAllKeys.mockResolvedValue(['l1', 'lOld'] as any[]); // l1, lOld exist

        const updatedProduct1 = { ...product1, name: 'Updated P1 Again' };
        const updatedLocation1 = { ...location1, name: 'Updated L1 Again' };

        const dataToSave = {
          products: [updatedProduct1, product2], // p1 updated, p2 new, pOld deleted
          locations: [updatedLocation1, location2], // l1 updated, l2 new, lOld deleted
          state: inventoryState2,
        };

        await dbService.saveAllApplicationData(dataToSave);

        // Products
        expect(currentMockProductStore.put).toHaveBeenCalledWith(updatedProduct1);
        expect(currentMockProductStore.put).toHaveBeenCalledWith(product2);
        expect(currentMockProductStore.delete).toHaveBeenCalledWith('pOld');

        // Locations
        expect(currentMockLocationStore.put).toHaveBeenCalledWith(updatedLocation1);
        expect(currentMockLocationStore.put).toHaveBeenCalledWith(location2);
        expect(currentMockLocationStore.delete).toHaveBeenCalledWith('lOld');

        // State
        expect(currentMockInventoryStateStore.put).toHaveBeenCalledWith(storedInventoryState2);
        // Verifying operations on stores is sufficient; tx.done success is implied by lack of error.
      });

      test('should preserve existing state if no state is provided in input', async () => {
        // Simulate some existing state by not clearing the mock or by pre-setting a get value if needed.
        // The service logic currently doesn't read existing state if new state isn't provided, so this is mostly about not calling put.
        currentMockInventoryStateStore.get.mockResolvedValue(storedInventoryState1); // Simulate existing state

        const dataToSave = {
          products: [product1],
          locations: [location1],
          // No state property here
        };

        await dbService.saveAllApplicationData(dataToSave);

        expect(currentMockInventoryStateStore.put).not.toHaveBeenCalled();
        // Verifying operations on stores is sufficient; tx.done success is implied by lack of error.
      });
    });

    describe('loadAllApplicationData', () => {
        test('should load all data correctly when stores have data', async () => {
            mockDb.getAll
                .mockImplementation(async (storeName: string) => {
                    if (storeName === 'products') return [product1, product2];
                    if (storeName === 'locations') return [location1];
                    return [];
                });
            mockDb.get.mockResolvedValue(storedInventoryState1); // For inventoryState

            const result = await dbService.loadAllApplicationData();

            expect(mockDb.getAll).toHaveBeenCalledWith('products');
            expect(mockDb.getAll).toHaveBeenCalledWith('locations');
            expect(mockDb.get).toHaveBeenCalledWith('inventoryState', 'currentState');

            expect(result.products).toEqual([product1, product2]);
            expect(result.locations).toEqual([location1]);
            expect(result.state).toEqual(storedInventoryState1);
        });

        test('should return empty arrays and undefined state if stores are empty/state missing', async () => {
            mockDb.getAll.mockResolvedValue([]); // All stores return empty
            mockDb.get.mockResolvedValue(undefined); // No state

            const result = await dbService.loadAllApplicationData();

            expect(result.products).toEqual([]);
            expect(result.locations).toEqual([]);
            expect(result.state).toBeUndefined();
        });
    });
  });
});
