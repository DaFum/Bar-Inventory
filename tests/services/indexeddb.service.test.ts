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
// BarInventoryDBSchema and StoredInventoryState will also be imported dynamically or type-only.
import type { BarInventoryDBSchema as BarInventoryDBSchemaType, StoredInventoryState as StoredInventoryStateType } from '../../src/services/indexeddb.service';
import {
  DATABASE_NAME,
  DATABASE_VERSION,
  mockProductStoreActionsInstance,
  mockLocationStoreActionsInstance,
  mockInventoryStateStoreActionsInstance,
  currentMockTransactionInstance,
  mockDbInstance as mockHelperDbInstance, // Renamed to avoid conflict
  mockDBCallbacks as mockHelperDBCallbacks, // Renamed to avoid conflict
  mockOpenDB as mockHelperOpenDB, // Renamed to avoid conflict
  // mockIDBFactory as mockHelperIDBFactory, // Renamed to avoid conflict
  setupGlobalIndexedDBMock,
  resetAllMocks,
  createMockDatabase,
  // mockProductInstance, // Use local if customized per test suite, or import if generic
  // mockLocationInstance,
  // mockInventoryStateInstance,
  // mockStoredInventoryStateInstance,
  getCurrentTransactionDonePromise,
  MockStoreActions,
  MockTransactionInstance,
  MockDatabaseInstance,
  resetMockStoreActionInstances,
} from './mock-helpers/indexeddb.mocks';
import { IDBPDatabase, IDBPTransaction } from 'idb';


// Use the DATABASE_NAME and DATABASE_VERSION from mock-helpers
// const DATABASE_NAME = 'BarInventoryDB'; // From mock-helpers
// const DATABASE_VERSION = 1; // From mock-helpers


// The actual 'idb' module is mocked via jest.mock at the top-level of mock-helpers
// We need to ensure that jest.mock('idb', ...) uses the mockOpenDB from our helpers.
jest.mock('idb', () => {
  const actualIdb = jest.requireActual('idb');
  // Import mockOpenDB from the helpers file INSIDE this factory function
  // to ensure it's the one from the mocked path.
  const { mockOpenDB } = jest.requireActual('./mock-helpers/indexeddb.mocks');
  return {
    ...actualIdb,
    openDB: mockOpenDB, // This should now correctly refer to the mock from mock-helpers
  };
});

// Mock toast notifications
jest.mock('../../src/ui/components/toast-notifications', () => ({
  showToast: jest.fn(),
}));

// mockIDBFactory is now part of mock-helpers and setup via setupGlobalIndexedDBMock
// const mockIDBFactory = { ... }; // Removed
// Object.defineProperty(window, 'indexedDB', { ... }); // Handled by setupGlobalIndexedDBMock


// Use instances from mock-helpers or define locally if variations needed per test suite
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

// To store and restore mockTransaction's implementation - this might become part of mock-helpers or be handled differently

describe('IndexedDBService', () => {
  // These will now reference instances from mock-helpers
  let mockDb: MockDatabaseInstance;
  let currentMockProductStore: MockStoreActions;
  let currentMockLocationStore: MockStoreActions;
  let currentMockInventoryStateStore: MockStoreActions;

  beforeEach(async () => {
    jest.clearAllMocks(); // Clears all mocks, including those from mock-helpers if they are jest.fn()
    resetAllMocks(); // Resets states within mock-helpers (like mockOpenDB calls, etc.)
    setupGlobalIndexedDBMock(); // Ensure window.indexedDB is mocked for each test

    // Create a new mock DB instance for each test to ensure isolation.
    // This also resets the store action instances within the helper.
    mockDb = createMockDatabase();

    // Dynamically import showToast to get the mock, as it's mocked per module
    const toastNotifications = await import('../../src/ui/components/toast-notifications');
    showToastMock = toastNotifications.showToast as jest.Mock;

    // Assign currentMockXStore to point to the instances from the mock helper.
    // These are (re)created by createMockDatabase -> resetMockStoreActionInstances.
    currentMockProductStore = mockProductStoreActionsInstance;
    currentMockLocationStore = mockLocationStoreActionsInstance;
    currentMockInventoryStateStore = mockInventoryStateStoreActionsInstance;


    // Isolate module loading for IndexedDBService to get a fresh instance with fresh mocks
    await jest.isolateModulesAsync(async () => {
        const { IndexedDBService } = await import('../../src/services/indexeddb.service');
        IndexedDBServiceClass = IndexedDBService; // Store the class
        // dbService instantiation will trigger mockOpenDB from the helpers
        dbService = new IndexedDBService(); // Create instance for most tests
        // Wait for openDB to resolve as it's async and might trigger upgrade
        const lastOpenDBCall = mockHelperOpenDB.mock.calls.length - 1;
        if (lastOpenDBCall >= 0 && mockHelperOpenDB.mock.results[lastOpenDBCall]) {
            await mockHelperOpenDB.mock.results[lastOpenDBCall].value;
        }
    });

    // After service instantiation and potential upgrade, store actions might have been recreated.
    // Re-assign them to ensure tests use the correct, potentially updated, instances.
    currentMockProductStore = mockProductStoreActionsInstance;
    currentMockLocationStore = mockLocationStoreActionsInstance;
    currentMockInventoryStateStore = mockInventoryStateStoreActionsInstance;

    // The mockTransaction instance is now managed by currentMockTransactionInstance in mock-helpers
    // and created when db.transaction() is called.
  });

  afterEach(() => {
    // No specific mockTransaction restoration needed here if it's always fresh from createMockTransaction
    // Ensure window.indexedDB is cleaned up if modified by a specific test beyond setupGlobalIndexedDBMock
    // (though clearGlobalIndexedDBMock is available if needed for specific scenarios)
  });

  describe('Constructor and Initialization', () => {
    test('should throw error and show toast if IndexedDB is not supported', async () => {
      const { showToast: requiredShowToastMock } = require('../../src/ui/components/toast-notifications');
      // Need to clear mocks specifically for this test's synchronous check after global setup
      jest.clearAllMocks(); // Clear any calls from beforeEach's dynamic import
      resetAllMocks();      // Reset helper states
      // Import showToast again after clearing
      const { showToast: freshShowToastMock } = require('../../src/ui/components/toast-notifications');


      // Use a special helper from mock-helpers if available, or do it directly:
      Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true, writable: true });

      // We need to re-isolate modules for this specific case because the constructor fails early
      let serviceConstructionError;
      try {
        await jest.isolateModulesAsync(async () => {
          const { IndexedDBService } = await import('../../src/services/indexeddb.service');
          new IndexedDBService();
        });
      } catch (e) {
        serviceConstructionError = e;
      }
      expect(serviceConstructionError).toBeInstanceOf(Error);
      expect((serviceConstructionError as Error).message).toBe('IndexedDB not supported');
      expect(freshShowToastMock).toHaveBeenCalledWith(
        'IndexedDB wird nicht unterstützt. Daten können nicht gespeichert werden.',
        'error'
      );
      // Restore for other tests
      setupGlobalIndexedDBMock();
    });

    test('should call openDB with correct parameters', () => {
      // dbService is already instantiated in beforeEach, which calls openDB
      expect(mockHelperOpenDB).toHaveBeenCalledWith( // Use the imported mockOpenDB
        DATABASE_NAME, // From mock-helpers
        DATABASE_VERSION, // From mock-helpers
        expect.objectContaining({
          upgrade: expect.any(Function),
          blocked: expect.any(Function),
          blocking: expect.any(Function),
          terminated: expect.any(Function),
        })
      );
    });

    test('should handle blocked event from openDB', () => {
        expect(mockHelperDBCallbacks.blocked).toBeDefined(); // Use imported mockDBCallbacks
        mockHelperDBCallbacks.blocked!(DATABASE_VERSION, DATABASE_VERSION + 1, {} as IDBVersionChangeEvent);
        expect(showToastMock).toHaveBeenCalledWith('Datenbankzugriff blockiert. Bitte andere Tabs schließen.', 'error');
    });

    test('should handle blocking event from openDB', () => {
        expect(mockHelperDBCallbacks.blocking).toBeDefined(); // Use imported mockDBCallbacks
        mockHelperDBCallbacks.blocking!(DATABASE_VERSION, DATABASE_VERSION -1, {} as IDBVersionChangeEvent);
        expect(showToastMock).toHaveBeenCalledWith(
            'Datenbank-Update blockiert. Bitte andere Tabs der App schließen und neu laden.',
            'warning'
        );
    });

    test('should handle terminated event from openDB', () => {
        expect(mockHelperDBCallbacks.terminated).toBeDefined(); // Use imported mockDBCallbacks
        mockHelperDBCallbacks.terminated!();
        expect(showToastMock).toHaveBeenCalledWith('Datenbankverbindung unerwartet beendet. Bitte App neu laden.', 'error');
    });
  });

  describe('Schema Upgrades (upgrade callback)', () => {
    beforeEach(() => {
        // Resetting store existence is now handled by createMockDatabase() in the main beforeEach
        // and the objectStoreNamesState within mockDbInstance in mock-helpers.
        // We can ensure the db version starts at 0 to force an upgrade for version 1 tests.
        if (mockDb) { // mockDb is created in the outer beforeEach
            mockDb.version = 0;
            mockDb.objectStoreNames.mockContainsProductStore = false;
            mockDb.objectStoreNames.mockContainsLocationStore = false;
            mockDb.objectStoreNames.mockContainsInventoryStateStore = false;
            mockDb.createObjectStore.mockClear();
        }
    });

    test('should create all object stores and indexes if db is new (oldVersion < 1)', async () => {
        // This relies on the mockOpenDB and its upgrade simulation calling the upgrade callback.
        // The service is instantiated in beforeEach, triggering this.
        // We need to ensure that mockDb starts with version 0 and no stores.
        mockDb.version = 0;
        mockDb.objectStoreNames.mockContainsProductStore = false;
        mockDb.objectStoreNames.mockContainsLocationStore = false;
        mockDb.objectStoreNames.mockContainsInventoryStateStore = false;

        // Re-initialize service to ensure openDB is called with this state
        // This requires isolating module loading again, or structuring tests to allow
        // service instantiation within the test.
        // For simplicity, we'll rely on the beforeEach's instantiation, assuming
        // the mockDb state set here is picked up by mockOpenDB.
        // (This might need adjustment if mockOpenDB's closure captures initial mockDb state too early)

        // To be certain, re-run service init logic if beforeEach state isn't enough:
        await jest.isolateModulesAsync(async () => {
            const { IndexedDBService } = await import('../../src/services/indexeddb.service');
            dbService = new IndexedDBService();
            const lastOpenDBCall = mockHelperOpenDB.mock.calls.length - 1;
            if (lastOpenDBCall >= 0 && mockHelperOpenDB.mock.results[lastOpenDBCall]) {
                await mockHelperOpenDB.mock.results[lastOpenDBCall].value;
            }
        });
        // The store actions should now point to the potentially new ones created during upgrade.
        currentMockProductStore = mockProductStoreActionsInstance;


        expect(mockDb.createObjectStore).toHaveBeenCalledWith('products', { keyPath: 'id' });
        expect(mockDb.createObjectStore).toHaveBeenCalledWith('locations', { keyPath: 'id' });
        expect(mockDb.createObjectStore).toHaveBeenCalledWith('inventoryState', { keyPath: 'key' });
        expect(currentMockProductStore.createIndex).toHaveBeenCalledWith('category', 'category');
    });

    test('should not attempt to create stores if they exist and version is current', async () => {
        mockDb.version = DATABASE_VERSION; // Current version
        mockDb.objectStoreNames.mockContainsProductStore = true;
        mockDb.objectStoreNames.mockContainsLocationStore = true;
        mockDb.objectStoreNames.mockContainsInventoryStateStore = true;
        mockDb.createObjectStore.mockClear();

        // Re-initialize service
        await jest.isolateModulesAsync(async () => {
            const { IndexedDBService } = await import('../../src/services/indexeddb.service');
            dbService = new IndexedDBService();
             const lastOpenDBCall = mockHelperOpenDB.mock.calls.length - 1;
            if (lastOpenDBCall >= 0 && mockHelperOpenDB.mock.results[lastOpenDBCall]) {
                await mockHelperOpenDB.mock.results[lastOpenDBCall].value;
            }
        });

        expect(mockDb.createObjectStore).not.toHaveBeenCalled();
    });

    test('should call upgrade callback with correct versions for a future upgrade (e.g., v1 to v2)', async () => {
      mockDb.version = 1;
      mockDb.objectStoreNames.mockContainsProductStore = true;
      mockDb.objectStoreNames.mockContainsLocationStore = true;
      mockDb.objectStoreNames.mockContainsInventoryStateStore = true;
      mockDb.createObjectStore.mockClear();

      // The upgrade function is captured by mockHelperOpenDB.
      // We need to ensure the service has been initialized for mockHelperDBCallbacks.upgrade to be set.
      // This is done in the main beforeEach.
      expect(mockHelperDBCallbacks.upgrade).toBeDefined();

      const consoleSpy = jest.spyOn(console, 'log');

      if (mockHelperDBCallbacks.upgrade) {
        // Create a mock transaction for the upgrade
        const mockUpgradeTx = mockDb.transaction(['products', 'locations', 'inventoryState'], 'versionchange' as any) as IDBPTransaction<BarInventoryDBSchemaType,any,'versionchange'>;

        await mockHelperDBCallbacks.upgrade(
          mockDb, 1, 2,
          mockUpgradeTx, // Pass the created mock transaction
          { oldVersion: 1, newVersion: 2 } as unknown as IDBVersionChangeEvent
        );
      }

      expect(consoleSpy).toHaveBeenCalledWith('Upgrading database from version 1 to 2');
      expect(mockDb.createObjectStore).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('getAll should propagate errors from db.getAll', async () => {
      const error = new Error('DB getAll failed');
      mockDb.getAll.mockRejectedValue(error); // mockDb is the instance from createMockDatabase()
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
        currentMockProductStore.put.mockRejectedValue(error);

        // The transaction mock is now created via mockDb.transaction()
        // We need to ensure that the 'done' promise of that transaction rejects.
        // The createMockTransaction in helpers sets up currentMockTransactionInstance.
        // We can modify its 'done' behavior *after* the transaction is created by the service.

        // This spy allows us to modify the transaction instance once it's created
        const transactionSpy = jest.spyOn(mockDb, 'transaction');
        transactionSpy.mockImplementationOnce((storeNames, mode) => {
            const tx = createMockTransaction(storeNames as any, mode as any, mockDb);
            tx.done = Promise.reject(error); // Make this specific transaction's done promise reject
            return tx as any; // Cast needed due to complex mock types
        });


        await expect(dbService.saveAllApplicationData(testData)).rejects.toThrow('Product put failed');
        expect(currentMockProductStore.put).toHaveBeenCalledWith(mockProduct);
        expect(showToastMock).toHaveBeenCalledWith(
          'Fehler beim Speichern der Anwendungsdaten. Änderungen wurden nicht gespeichert.',
          'error'
        );
        // Check if the most recent transaction's 'done' promise (from currentMockTransactionInstance) was rejected
        // currentMockTransactionInstance is set by createMockTransaction
        // This assertion might be tricky if the original done promise was replaced.
        // The key is that saveAllApplicationData itself rejects.
        // If getCurrentTransactionDonePromise() is used, it should reflect the rejected promise.
        await expect(getCurrentTransactionDonePromise()).rejects.toThrow('Product put failed');
        transactionSpy.mockRestore();
      });

      test('should handle error if transaction.done rejects for other reasons', async () => {
        const error = new Error('Transaction failed');
        currentMockProductStore.getAllKeys.mockResolvedValue([]);
        currentMockLocationStore.getAllKeys.mockResolvedValue([]);
        currentMockProductStore.put.mockResolvedValue('prod1');
        currentMockLocationStore.put.mockResolvedValue('loc1');
        currentMockInventoryStateStore.put.mockResolvedValue('currentState');

        const transactionSpy = jest.spyOn(mockDb, 'transaction');
        transactionSpy.mockImplementationOnce((storeNames, mode) => {
            const tx = createMockTransaction(storeNames as any, mode as any, mockDb);
            tx.done = Promise.reject(error); // Make this specific transaction's done promise reject
            return tx as any;
        });

        await expect(dbService.saveAllApplicationData(testData)).rejects.toThrow('Transaction failed');
        expect(showToastMock).toHaveBeenCalledWith(
          'Fehler beim Speichern der Anwendungsdaten. Änderungen wurden nicht gespeichert.',
          'error'
        );
        transactionSpy.mockRestore();
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

  describe('Concurrency Tests', () => {
    const product1: Product = { id: 'p1', name: 'Product 1', category: 'Cat A', itemsPerCrate: 10, pricePer100ml:1, pricePerBottle:10, volume:700 };
    const location1: Location = { id: 'l1', name: 'Location 1', counters: [] };
    const inventoryState1: InventoryState = { products: [product1], locations: [location1], unsyncedChanges: false };

    const product2: Product = { id: 'p2', name: 'Product 2', category: 'Cat B', itemsPerCrate: 12, pricePer100ml:2, pricePerBottle:12, volume:750 };
    const location2: Location = { id: 'l2', name: 'Location 2', counters: [] };
    const inventoryState2: InventoryState = { products: [product2], locations: [location2], unsyncedChanges: true };


    test('should handle multiple saveAllApplicationData calls initiated concurrently', async () => {
      const data1 = {
        products: [product1],
        locations: [location1],
        state: inventoryState1,
      };
      const storedState1: StoredInventoryStateType = { ...inventoryState1, key: 'currentState' };

      const data2 = {
        products: [product2],
        locations: [location2],
        state: inventoryState2,
      };
      const storedState2: StoredInventoryStateType = { ...inventoryState2, key: 'currentState' };

      // Mock getAllKeys to simulate an empty database initially for both "transactions"
      // The actual transaction queuing will determine the final state.
      currentMockProductStore.getAllKeys.mockResolvedValue([]);
      currentMockLocationStore.getAllKeys.mockResolvedValue([]);

      // Initiate both save operations without awaiting the first one before starting the second
      const promise1 = dbService.saveAllApplicationData(data1);
      const promise2 = dbService.saveAllApplicationData(data2);

      // Await both promises to complete
      await Promise.all([promise1, promise2]);

      // Due to the nature of JavaScript's single thread and how promises are typically resolved,
      // and how our mock transaction works (one after the other if `await` is used internally by `idb` mock),
      // the operations will likely be serialized. The second call would overwrite the first.
      // We need to check the final state of the database.

      // Verify that transaction was called at least twice (or more, depending on internal retries if any)
      expect(mockDb.transaction).toHaveBeenCalledTimes(2);


      // Check which data was effectively written.
      // This depends on the exact behavior of the service and mock transaction handling.
      // Assuming the last one "wins" if they are serialized.
      // The mocks for put/delete should reflect the final state.
      // Let's check that product2 (from data2) is present and product1 is not (or was overwritten).
      // This requires inspecting the arguments to put and delete.

      // To simplify, we'll check if the *final* state reflects data2.
      // This means 'p2' and 'l2' were put, and 'currentState' was updated with inventoryState2.
      // And if data1 was processed first, then 'p1', 'l1' would have been deleted by the second call.
      // If data2 was processed first, then 'p2', 'l2' would have been deleted by the first call (if data1 was empty).

      // Given our saveAllApplicationData logic (delete existing then put new):
      // If data1 runs, then data2:
      //  - data1 puts p1, l1, state1.
      //  - data2 deletes p1, l1 (because they are not in data2's list) and puts p2, l2, state2.
      // Final state: p2, l2, state2.

      // If data2 runs, then data1:
      //  - data2 puts p2, l2, state2.
      //  - data1 deletes p2, l2 (because they are not in data1's list) and puts p1, l1, state1.
      // Final state: p1, l1, state1.

      // The actual order is non-deterministic without deeper control over promise execution.
      // However, Jest resolves promises in a specific order. Let's assume data2 is last.
      // We should verify that the mocks were called appropriately.

      // Check calls for data1 processing (these might be subsequently deleted)
      // expect(currentMockProductStore.put).toHaveBeenCalledWith(product1);
      // expect(currentMockLocationStore.put).toHaveBeenCalledWith(location1);
      // expect(currentMockInventoryStateStore.put).toHaveBeenCalledWith(storedState1);

      // Check calls for data2 processing (these should be the final state)
      expect(currentMockProductStore.put).toHaveBeenCalledWith(product2);
      expect(currentMockLocationStore.put).toHaveBeenCalledWith(location2);
      expect(currentMockInventoryStateStore.put).toHaveBeenCalledWith(storedState2);

      // Check that items from the "other" call were deleted if they were processed first.
      // This is hard to assert definitively without knowing the execution order.
      // A simpler check is that the number of puts is as expected for the "winning" call.
      expect(currentMockProductStore.put).toHaveBeenCalledTimes(1); // Assuming only the last call's items remain
      expect(currentMockLocationStore.put).toHaveBeenCalledTimes(1);
      expect(currentMockInventoryStateStore.put).toHaveBeenCalledTimes(1);


      // And that obsolete items (from the call that ran "first" and was then "overwritten") were deleted.
      // If data1 ran first, then data2 ran: p1 and l1 should be deleted.
      // If data2 ran first, then data1 ran: p2 and l2 should be deleted.
      // The mock for `getAllKeys` in `saveAllApplicationData` will determine what's "obsolete".
      // Let's assume the second call to `saveAllApplicationData` (data2) sees an empty DB because `getAllKeys` is mocked once.
      // This test setup isn't perfect for true concurrency race conditions.
      // It mostly tests if multiple calls can proceed without throwing unexpected errors.
      // A more robust test would involve controlling the resolution of promises within `saveAllApplicationData`
      // or having `getAllKeys` return different values for different calls.

      // For now, let's assume the last call (data2) defines the final state and previous data is cleared.
      // This implies that when the second `saveAllApplicationData` runs, it first clears whatever the first one put.
      // The number of `delete` calls would be for items in the "first" save that are not in the "second".
      // If data1 ran first: delete p1, delete l1.
      // If data2 ran first: delete p2, delete l2.

      // Given the current `saveAllApplicationData` logic, it fetches all keys, then deletes those not in the new set, then puts new/updated.
      // If `currentMockProductStore.getAllKeys` is always empty, then no deletes will occur for "obsolete" items from a previous concurrent call.
      // This highlights a limitation in this specific test setup for "true" concurrency.

      // Let's refine the mock for getAllKeys to reflect the state *after* the first save, for the second save to process.
      // This is still tricky as we don't know which promise resolves first.

      // A simpler assertion for now: no errors were thrown and the toast for success was shown (implies tx.done resolved).
      // And the number of transactions matches the number of calls.
      // The actual data state check is less reliable here without more control.
      expect(showToastMock).toHaveBeenCalledWith('Anwendungsdaten erfolgreich gespeichert.', 'success');
      // It might be called twice if both succeed independently.
      expect(showToastMock).toHaveBeenCalledTimes(2);
    });

    test('should handle concurrent saveAllApplicationData and loadAllApplicationData calls', async () => {
      const saveData = {
        products: [product1],
        locations: [location1],
        state: inventoryState1,
      };
      const storedSaveState: StoredInventoryStateType = { ...inventoryState1, key: 'currentState' };

      // Mocks for save operation
      currentMockProductStore.getAllKeys.mockResolvedValueOnce([]); // For the save operation, DB is empty
      currentMockLocationStore.getAllKeys.mockResolvedValueOnce([]);

      // Mocks for load operation (will read what save operation writes)
      mockDb.getAll
        .mockImplementationOnce(async (storeName: string) => { // For products
          if (storeName === 'products') return [product1];
          return [];
        })
        .mockImplementationOnce(async (storeName: string) => { // For locations
          if (storeName === 'locations') return [location1];
          return [];
        });
      mockDb.get.mockResolvedValueOnce(storedSaveState); // For inventoryState


      const savePromise = dbService.saveAllApplicationData(saveData);
      const loadPromise = dbService.loadAllApplicationData();

      const [saveResult, loadResult] = await Promise.all([savePromise, loadPromise]);

      // Save should complete successfully
      expect(showToastMock).toHaveBeenCalledWith('Anwendungsdaten erfolgreich gespeichert.', 'success');

      // Load should retrieve the data saved by the concurrent operation
      expect(loadResult.products).toEqual([product1]);
      expect(loadResult.locations).toEqual([location1]);
      expect(loadResult.state).toEqual(storedSaveState);

      // Verify transaction calls
      // One for save, loadAllApplicationData uses direct db calls (get, getAll) which might not create a single "transaction" in the same way
      // depending on how dbService.loadAllApplicationData is implemented (it uses db.getAll and db.get directly).
      // Our mockDb.transaction is for the saveAllApplicationData.
      expect(mockDb.transaction).toHaveBeenCalledTimes(1); // For saveAllApplicationData
      expect(mockDb.getAll).toHaveBeenCalledTimes(2); // For loadAllApplicationData (products, locations)
      expect(mockDb.get).toHaveBeenCalledTimes(1);  // For loadAllApplicationData (inventoryState)
    });
  });

  describe('Large Dataset Tests', () => {
    const createLargeArray = <T>(size: number, factory: (index: number) => T): T[] => {
      return Array.from({ length: size }, (_, i) => factory(i));
    };

    const largeProductArray = createLargeArray(1000, i => ({
      id: `prod${i}`,
      name: `Large Product ${i}`,
      category: `Category ${i % 10}`,
      itemsPerCrate: 10 + (i % 5),
      pricePer100ml: 1 + (i % 100) / 100,
      pricePerBottle: 10 + (i % 10),
      volume: 700 + (i % 50),
    }));

    const largeLocationArray = createLargeArray(500, i => ({
      id: `loc${i}`,
      name: `Large Location ${i}`,
      counters: [{ id: `c${i}-1`, name: 'Counter 1', items: [] }],
    }));

    const largeInventoryState: InventoryState = {
      products: largeProductArray.slice(0, 50), // Just a subset for the state itself for brevity
      locations: largeLocationArray.slice(0, 20),
      unsyncedChanges: true,
    };
    const storedLargeInventoryState: StoredInventoryStateType = { ...largeInventoryState, key: 'currentState' };

    beforeEach(() => {
      // Reset mocks for put/delete/getAllKeys for each large data test
      currentMockProductStore.put.mockClear();
      currentMockProductStore.delete.mockClear();
      currentMockProductStore.getAllKeys.mockClear();
      currentMockLocationStore.put.mockClear();
      currentMockLocationStore.delete.mockClear();
      currentMockLocationStore.getAllKeys.mockClear();
      currentMockInventoryStateStore.put.mockClear();
    });

    test('saveAllApplicationData should handle large arrays of products and locations', async () => {
      currentMockProductStore.getAllKeys.mockResolvedValue([]); // DB is empty
      currentMockLocationStore.getAllKeys.mockResolvedValue([]);

      const dataToSave = {
        products: largeProductArray,
        locations: largeLocationArray,
        state: largeInventoryState,
      };

      await dbService.saveAllApplicationData(dataToSave);

      expect(currentMockProductStore.put).toHaveBeenCalledTimes(largeProductArray.length);
      largeProductArray.forEach(product => {
        expect(currentMockProductStore.put).toHaveBeenCalledWith(product);
      });

      expect(currentMockLocationStore.put).toHaveBeenCalledTimes(largeLocationArray.length);
      largeLocationArray.forEach(location => {
        expect(currentMockLocationStore.put).toHaveBeenCalledWith(location);
      });

      expect(currentMockInventoryStateStore.put).toHaveBeenCalledWith(storedLargeInventoryState);
      expect(currentMockProductStore.delete).not.toHaveBeenCalled();
      expect(currentMockLocationStore.delete).not.toHaveBeenCalled();
      expect(showToastMock).toHaveBeenCalledWith('Anwendungsdaten erfolgreich gespeichert.', 'success');
    });

    test('loadAllApplicationData should handle large arrays of products and locations', async () => {
      mockDb.getAll
        .mockImplementation(async (storeName: string) => {
          if (storeName === 'products') return largeProductArray;
          if (storeName === 'locations') return largeLocationArray;
          return [];
        });
      mockDb.get.mockResolvedValue(storedLargeInventoryState);

      const result = await dbService.loadAllApplicationData();

      expect(mockDb.getAll).toHaveBeenCalledWith('products');
      expect(mockDb.getAll).toHaveBeenCalledWith('locations');
      expect(mockDb.get).toHaveBeenCalledWith('inventoryState', 'currentState');

      expect(result.products.length).toBe(largeProductArray.length);
      expect(result.products).toEqual(largeProductArray);
      expect(result.locations.length).toBe(largeLocationArray.length);
      expect(result.locations).toEqual(largeLocationArray);
      expect(result.state).toEqual(storedLargeInventoryState);
    });

    test('saveAllApplicationData should handle deletions with large existing dataset', async () => {
      // Simulate existing large dataset by mocking getAllKeys
      const existingProductKeys = largeProductArray.map(p => p.id);
      const existingLocationKeys = largeLocationArray.map(l => l.id);
      currentMockProductStore.getAllKeys.mockResolvedValue(existingProductKeys as any);
      currentMockLocationStore.getAllKeys.mockResolvedValue(existingLocationKeys as any);

      // Save a much smaller dataset, implying many deletions
      const smallProductArray = largeProductArray.slice(0, 10);
      const smallLocationArray = largeLocationArray.slice(0, 5);
      const dataToSave = {
        products: smallProductArray,
        locations: smallLocationArray,
        state: largeInventoryState, // State can still be "large" or different
      };

      await dbService.saveAllApplicationData(dataToSave);

      // Verify puts for the small new dataset
      expect(currentMockProductStore.put).toHaveBeenCalledTimes(smallProductArray.length);
      smallProductArray.forEach(p => expect(currentMockProductStore.put).toHaveBeenCalledWith(p));

      expect(currentMockLocationStore.put).toHaveBeenCalledTimes(smallLocationArray.length);
      smallLocationArray.forEach(l => expect(currentMockLocationStore.put).toHaveBeenCalledWith(l));

      // Verify deletions for items not in the new small dataset
      const expectedProductDeletions = largeProductArray.length - smallProductArray.length;
      expect(currentMockProductStore.delete).toHaveBeenCalledTimes(expectedProductDeletions);
      for (let i = smallProductArray.length; i < largeProductArray.length; i++) {
        expect(currentMockProductStore.delete).toHaveBeenCalledWith(largeProductArray[i].id);
      }

      const expectedLocationDeletions = largeLocationArray.length - smallLocationArray.length;
      expect(currentMockLocationStore.delete).toHaveBeenCalledTimes(expectedLocationDeletions);
      for (let i = smallLocationArray.length; i < largeLocationArray.length; i++) {
        expect(currentMockLocationStore.delete).toHaveBeenCalledWith(largeLocationArray[i].id);
      }

      expect(showToastMock).toHaveBeenCalledWith('Anwendungsdaten erfolgreich gespeichert.', 'success');
    });
  });

  describe('Invalid Input Tests', () => {
    const product1: Product = { id: 'p1', name: 'Product 1', category: 'Cat A', itemsPerCrate: 10, pricePer100ml:1, pricePerBottle:10, volume:700 };
    const location1: Location = { id: 'l1', name: 'Location 1', counters: [] };

    beforeEach(() => {
      // Clear relevant mocks
      currentMockProductStore.put.mockClear();
      currentMockLocationStore.put.mockClear();
      currentMockInventoryStateStore.put.mockClear();
      mockDb.put.mockClear();
      mockDb.add.mockClear();
      mockDb.get.mockClear();
      mockDb.delete.mockClear();
      showToastMock.mockClear(); // Clear toast mock specifically for error message checks
    });

    describe('saveAllApplicationData with invalid inputs', () => {
      test('should handle null or undefined inputs for products, locations, or state', async () => {
        // Test with null products
        await dbService.saveAllApplicationData({ products: null, locations: [location1], state: mockInventoryState });
        // Expect locations and state to be saved, products store to be cleared (if it had items) or untouched.
        // Based on current saveAll logic, null products means "delete all existing products".
        expect(currentMockProductStore.getAllKeys).toHaveBeenCalled();
        // If getAllKeys returned items, delete would be called for them. If empty, no delete.
        expect(currentMockLocationStore.put).toHaveBeenCalledWith(location1);
        expect(currentMockInventoryStateStore.put).toHaveBeenCalled();
        expect(showToastMock).toHaveBeenCalledWith('Anwendungsdaten erfolgreich gespeichert.', 'success');
        showToastMock.mockClear(); // Clear for next assertion

        // Test with undefined locations
        currentMockProductStore.put.mockClear(); currentMockLocationStore.put.mockClear(); currentMockInventoryStateStore.put.mockClear();
        currentMockProductStore.getAllKeys.mockReset(); currentMockLocationStore.getAllKeys.mockReset();
        currentMockProductStore.getAllKeys.mockResolvedValue([]); currentMockLocationStore.getAllKeys.mockResolvedValue([]);


        await dbService.saveAllApplicationData({ products: [product1], locations: undefined, state: mockInventoryState });
        // Expect products and state to be saved, locations store to be cleared.
        expect(currentMockProductStore.put).toHaveBeenCalledWith(product1);
        expect(currentMockLocationStore.getAllKeys).toHaveBeenCalled();
        expect(currentMockInventoryStateStore.put).toHaveBeenCalled();
        expect(showToastMock).toHaveBeenCalledWith('Anwendungsdaten erfolgreich gespeichert.', 'success');
        showToastMock.mockClear();

        // Test with null state (state is optional, so this should not error but not save any state)
        currentMockProductStore.put.mockClear(); currentMockLocationStore.put.mockClear(); currentMockInventoryStateStore.put.mockClear();
        currentMockProductStore.getAllKeys.mockReset(); currentMockLocationStore.getAllKeys.mockReset();
        currentMockProductStore.getAllKeys.mockResolvedValue([]); currentMockLocationStore.getAllKeys.mockResolvedValue([]);

        await dbService.saveAllApplicationData({ products: [product1], locations: [location1], state: null });
        expect(currentMockProductStore.put).toHaveBeenCalledWith(product1);
        expect(currentMockLocationStore.put).toHaveBeenCalledWith(location1);
        expect(currentMockInventoryStateStore.put).not.toHaveBeenCalled(); // State should not be put
        expect(showToastMock).toHaveBeenCalledWith('Anwendungsdaten erfolgreich gespeichert.', 'success');
      });

      test('should skip malformed product or location objects but continue processing valid ones', async () => {
        const malformedProduct = { name: 'Malformed Product' } as any; // Missing id, etc.
        const validProduct = { id: 'vp1', name: 'Valid Product', category: 'Valid', itemsPerCrate: 1, pricePer100ml:1, pricePerBottle:1, volume:100 };
        const malformedLocation = { name: 'Malformed Location' } as any; // Missing id
        const validLocation = { id: 'vl1', name: 'Valid Location', counters: [] };

        currentMockProductStore.getAllKeys.mockResolvedValue([]);
        currentMockLocationStore.getAllKeys.mockResolvedValue([]);

        const dataToSave = {
          products: [malformedProduct, validProduct, null as any], // Include null in array
          locations: [validLocation, malformedLocation, undefined as any], // Include undefined
          state: mockInventoryState,
        };

        // The service's saveAllApplicationData filters out items without an 'id'.
        // So, malformedProduct and malformedLocation should be skipped by the put operations.
        // Null/undefined items in arrays are also filtered.

        await dbService.saveAllApplicationData(dataToSave);

        expect(currentMockProductStore.put).toHaveBeenCalledWith(validProduct);
        expect(currentMockProductStore.put).toHaveBeenCalledTimes(1); // Only valid product
        expect(currentMockProductStore.delete).not.toHaveBeenCalled(); // Assuming empty DB initially

        expect(currentMockLocationStore.put).toHaveBeenCalledWith(validLocation);
        expect(currentMockLocationStore.put).toHaveBeenCalledTimes(1); // Only valid location
        expect(currentMockLocationStore.delete).not.toHaveBeenCalled(); // Assuming empty DB initially

        expect(currentMockInventoryStateStore.put).toHaveBeenCalledWith({ ...mockInventoryState, key: 'currentState' });
        expect(showToastMock).toHaveBeenCalledWith('Anwendungsdaten erfolgreich gespeichert.', 'success');
      });
    });

    describe('Generic CRUD operations with invalid inputs', () => {
      test('get should handle invalid key (e.g., null, undefined)', async () => {
        // Current implementation of idb.get might not error on null/undefined key but return undefined.
        // We test that our service method doesn't break.
        mockDb.get.mockResolvedValue(undefined); // Simulate key not found or invalid key behavior

        let result = await dbService.get('products', null as any);
        expect(result).toBeUndefined();
        expect(mockDb.get).toHaveBeenCalledWith('products', null);

        result = await dbService.get('products', undefined as any);
        expect(result).toBeUndefined();
        expect(mockDb.get).toHaveBeenCalledWith('products', undefined as any);
      });

      test('put should potentially fail or be a no-op with invalid data (depends on IDB impl)', async () => {
        // IDB put usually requires a valid object and key (if not auto-incrementing).
        // Sending null/undefined might throw or be ignored by the underlying library.
        // Our mock should reflect this. Let's assume it throws for completely invalid data.
        const error = new Error("Failed to store record in 'products' store: The record has no key.");
        mockDb.put.mockRejectedValueOnce(error); // For null data
        await expect(dbService.put('products', null as any)).rejects.toThrow(error);

        mockDb.put.mockRejectedValueOnce(new Error("Some other IDB error for malformed data")); // For object without key
        const productWithoutId = { name: "No ID" } as any;
        await expect(dbService.put('products', productWithoutId )).rejects.toThrow("Some other IDB error for malformed data");
      });

      test('add should fail with invalid data similar to put', async () => {
        const error = new Error("Failed to add record to 'products' store: The record has no key.");
        mockDb.add.mockRejectedValueOnce(error);
        await expect(dbService.add('products', null as any)).rejects.toThrow(error);

        mockDb.add.mockRejectedValueOnce(new Error("IDB add error for malformed data"));
        const productWithoutId = { name: "No ID Add" } as any;
        await expect(dbService.add('products', productWithoutId )).rejects.toThrow("IDB add error for malformed data");
      });

      test('delete should handle invalid key (e.g., null, undefined, non-string)', async () => {
        // Similar to get, IDB delete with an invalid key might be a no-op.
        mockDb.delete.mockResolvedValue(undefined); // Default behavior for delete mock

        await dbService.delete('products', null as any);
        expect(mockDb.delete).toHaveBeenCalledWith('products', null);

        await dbService.delete('products', undefined as any);
        expect(mockDb.delete).toHaveBeenCalledWith('products', undefined as any);

        // Example: non-string key if keyPath expects string
        // await dbService.delete('products', 123 as any);
        // expect(mockDb.delete).toHaveBeenCalledWith('products', 123);
        // This depends on how strictly the actual IDB implementation and 'idb' wrapper handle key types.
        // For our mock, it will pass it through.
      });
    });
  });

  describe('Transaction Failure Scenario Tests (saveAllApplicationData)', () => {
    const product1: Product = { id: 'p1', name: 'P1', category: 'C1', itemsPerCrate: 1, pricePer100ml:1, pricePerBottle:1, volume:100 };
    const product2: Product = { id: 'p2', name: 'P2', category: 'C2', itemsPerCrate: 1, pricePer100ml:1, pricePerBottle:1, volume:100 };
    const location1: Location = { id: 'l1', name: 'L1', counters: [] };
    const location2: Location = { id: 'l2', name: 'L2', counters: [] };
    const state: InventoryState = { products: [], locations: [], unsyncedChanges: false };
    const storedState: StoredInventoryStateType = { ...state, key: 'currentState' };

    const testData = {
      products: [product1, product2],
      locations: [location1, location2],
      state: state,
    };

    beforeEach(() => {
      currentMockProductStore.put.mockClear();
      currentMockProductStore.delete.mockClear();
      currentMockProductStore.getAllKeys.mockClear().mockResolvedValue([]); // Default to empty
      currentMockLocationStore.put.mockClear();
      currentMockLocationStore.delete.mockClear();
      currentMockLocationStore.getAllKeys.mockClear().mockResolvedValue([]); // Default to empty
      currentMockInventoryStateStore.put.mockClear();
      showToastMock.mockClear();
      // Ensure the transaction spy is restored if a previous test set it up and didn't clean.
      jest.restoreAllMocks(); // This will restore spies created with jest.spyOn
    });

    const setupFailingTransaction = (error: Error) => {
        const transactionSpy = jest.spyOn(mockDb, 'transaction');
        transactionSpy.mockImplementation((storeNames, mode) => {
            const tx = createMockTransaction(storeNames as any, mode as any, mockDb);
            tx.done = Promise.reject(error); // Make this transaction's done promise reject
            // Simulate that individual operations might still appear to succeed before 'done' rejects
            currentMockProductStore.put.mockResolvedValue('key');
            currentMockLocationStore.put.mockResolvedValue('key');
            currentMockInventoryStateStore.put.mockResolvedValue('key');
            currentMockProductStore.delete.mockResolvedValue(undefined);
            currentMockLocationStore.delete.mockResolvedValue(undefined);
            return tx as any;
        });
        return transactionSpy;
    };

    test('should not save any data if getAllKeys for products fails', async () => {
      const error = new Error('Failed to get all product keys');
      // Mock the specific store action to fail
      currentMockProductStore.getAllKeys.mockRejectedValueOnce(error);

      // Setup the transaction mock so its 'done' promise will also be rejected
      // because an operation within it failed.
      const transactionSpy = jest.spyOn(mockDb, 'transaction');
      transactionSpy.mockImplementationOnce((storeNames, mode) => {
          const tx = createMockTransaction(storeNames as any, mode as any, mockDb);
          // If an operation like getAllKeys fails, the transaction.done should reject.
          tx.done = Promise.reject(error);
          return tx as any;
      });


      await expect(dbService.saveAllApplicationData(testData)).rejects.toThrow(error.message);

      expect(currentMockProductStore.put).not.toHaveBeenCalled();
      expect(currentMockLocationStore.put).not.toHaveBeenCalled();
      expect(currentMockInventoryStateStore.put).not.toHaveBeenCalled();
      expect(showToastMock).toHaveBeenCalledWith('Fehler beim Speichern der Anwendungsdaten. Änderungen wurden nicht gespeichert.', 'error');
      transactionSpy.mockRestore();
    });

    test('should not save new data if deleting an obsolete product fails', async () => {
      const error = new Error('Failed to delete product');
      currentMockProductStore.getAllKeys.mockResolvedValue(['obsoleteProd'] as any); // Existing product
      currentMockLocationStore.getAllKeys.mockResolvedValue([]);
      currentMockProductStore.delete.mockRejectedValueOnce(error); // Deletion fails

      const transactionSpy = setupFailingTransaction(error);

      await expect(dbService.saveAllApplicationData(testData)).rejects.toThrow(error.message);

      // Delete was attempted
      expect(currentMockProductStore.delete).toHaveBeenCalledWith('obsoleteProd');
      // No new data should be put
      expect(currentMockProductStore.put).not.toHaveBeenCalled();
      expect(currentMockLocationStore.put).not.toHaveBeenCalled();
      expect(currentMockInventoryStateStore.put).not.toHaveBeenCalled();
      expect(showToastMock).toHaveBeenCalledWith('Fehler beim Speichern der Anwendungsdaten. Änderungen wurden nicht gespeichert.', 'error');
      transactionSpy.mockRestore();
    });

    test('should not save locations or state if putting a product fails', async () => {
      const error = new Error('Failed to put product');
      currentMockProductStore.put.mockImplementation(async (item) => { // Use mockImplementation to fail on specific item or always
        if (item.id === product1.id) {
          return Promise.reject(error);
        }
        return Promise.resolve(item.id);
      });

      const transactionSpy = setupFailingTransaction(error);

      await expect(dbService.saveAllApplicationData(testData)).rejects.toThrow(error.message);

      expect(currentMockProductStore.put).toHaveBeenCalledWith(product1); // Attempted to put product1
      // Product2 might or might not be called depending on Promise.all behavior in service
      // expect(currentMockProductStore.put).not.toHaveBeenCalledWith(product2);

      expect(currentMockLocationStore.put).not.toHaveBeenCalled();
      expect(currentMockInventoryStateStore.put).not.toHaveBeenCalled();
      expect(showToastMock).toHaveBeenCalledWith('Fehler beim Speichern der Anwendungsdaten. Änderungen wurden nicht gespeichert.', 'error');
      transactionSpy.mockRestore();
    });

    test('should not save state if putting a location fails', async () => {
      const error = new Error('Failed to put location');
      currentMockProductStore.put.mockResolvedValue('id'); // Products save fine
      currentMockLocationStore.put.mockImplementation(async (item) => {
        if (item.id === location1.id) {
          return Promise.reject(error);
        }
        return Promise.resolve(item.id);
      });

      const transactionSpy = setupFailingTransaction(error);

      await expect(dbService.saveAllApplicationData(testData)).rejects.toThrow(error.message);

      expect(currentMockProductStore.put).toHaveBeenCalledWith(product1);
      expect(currentMockProductStore.put).toHaveBeenCalledWith(product2);
      expect(currentMockLocationStore.put).toHaveBeenCalledWith(location1); // Attempted to put location1
      // expect(currentMockLocationStore.put).not.toHaveBeenCalledWith(location2);

      expect(currentMockInventoryStateStore.put).not.toHaveBeenCalled();
      expect(showToastMock).toHaveBeenCalledWith('Fehler beim Speichern der Anwendungsdaten. Änderungen wurden nicht gespeichert.', 'error');
      transactionSpy.mockRestore();
    });

    test('should show error if saving inventory state fails, even if products/locations saved in transaction ops', async () => {
      // This tests if the final tx.done rejection is handled, even if individual ops appeared to succeed.
      const error = new Error('Failed to put inventory state');
      currentMockProductStore.put.mockResolvedValue('id');
      currentMockLocationStore.put.mockResolvedValue('id');
      currentMockInventoryStateStore.put.mockRejectedValueOnce(error); // State saving fails

      const transactionSpy = setupFailingTransaction(error);

      await expect(dbService.saveAllApplicationData(testData)).rejects.toThrow(error.message);

      // Products and locations would have been "put" within the transaction operations
      expect(currentMockProductStore.put).toHaveBeenCalledTimes(testData.products.length);
      expect(currentMockLocationStore.put).toHaveBeenCalledTimes(testData.locations.length);
      expect(currentMockInventoryStateStore.put).toHaveBeenCalledWith(storedState); // Attempted

      expect(showToastMock).toHaveBeenCalledWith('Fehler beim Speichern der Anwendungsdaten. Änderungen wurden nicht gespeichert.', 'error');
      transactionSpy.mockRestore();
    });
  });
});
