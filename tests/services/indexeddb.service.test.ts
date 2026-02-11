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
import { Product, Location, InventoryState, Counter, Area, InventoryEntry } from '../../src/models';
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
  setupGlobalIndexedDBMock,
  resetAllMocks,
  createMockDatabase,
  createMockTransaction, // Added import
  getCurrentTransactionDonePromise,
  MockStoreActions,
  // MockTransactionInstance, // Type not directly used, createMockTransaction returns it
  MockDatabaseInstance,
  resetMockStoreActionInstances,
} from './mock-helpers/indexeddb.mocks';
import { IDBPDatabase, IDBPTransaction, StoreNames } from 'idb'; // Added StoreNames


// Use the DATABASE_NAME and DATABASE_VERSION from mock-helpers
// const DATABASE_NAME = 'BarInventoryDB'; // From mock-helpers
// const DATABASE_VERSION = 1; // From mock-helpers


// The actual 'idb' module is mocked via jest.mock at the top-level of mock-helpers
// We need to ensure that jest.mock('idb', ...) uses the mockOpenDB from our helpers.
jest.mock('idb', () => {
  const actualIdb = jest.requireActual('idb');
  // Import mockOpenDB from the helpers file INSIDE this factory function
  // to ensure it's the one from the mocked path.
  const { mockOpenDB } = jest.requireActual('../services/mock-helpers/indexeddb.mocks');
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
const mockProduct: Product = { id: 'prod1', name: 'Test Product', category: 'Test Category', itemsPerCrate: 10, pricePer100ml: 1, pricePerBottle: 10, volume: 750, lastUpdated: new Date() };
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
        const result = mockHelperOpenDB.mock.results[lastOpenDBCall];
        if (lastOpenDBCall >= 0 && result) {
            await result.value;
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
    beforeEach(async () => { // Made async for service re-initialization
        // This block's beforeEach will re-initialize mockDb with version 0 and clear stores.
        // It also re-initializes dbService with this fresh state.
        mockDb = createMockDatabase(0);
        mockDb.objectStoreNames._stores.clear(); // Make sure no stores "exist"
        // The mockContains flags are now driven by _stores in the mock helper
        // mockDb.objectStoreNames.mockContainsProductStore = false;
        // mockDb.objectStoreNames.mockContainsLocationStore = false;
        // mockDb.objectStoreNames.mockContainsInventoryStateStore = false;
        if (mockDb.createObjectStore) mockDb.createObjectStore.mockClear();

        await jest.isolateModulesAsync(async () => {
            const { IndexedDBService } = await import('../../src/services/indexeddb.service');
            dbService = new IndexedDBService();
            const lastOpenDBCall = mockHelperOpenDB.mock.calls.length - 1;
            const result = mockHelperOpenDB.mock.results[lastOpenDBCall];
            if (lastOpenDBCall >= 0 && result) {
                await result.value;
            }
        });
        // Re-assign store mocks after service re-initialization as they might be new instances
        currentMockProductStore = mockProductStoreActionsInstance;
        currentMockLocationStore = mockLocationStoreActionsInstance;
        currentMockInventoryStateStore = mockInventoryStateStoreActionsInstance;
    });

    test('should create all object stores and indexes if db is new (oldVersion < 1)', async () => {
        // Service is initialized in this describe's beforeEach with a version 0 DB.
        // mockOpenDB's upgrade callback should have been triggered.
        expect(mockDb.createObjectStore).toHaveBeenCalledWith('products', { keyPath: 'id' });
        expect(mockDb.createObjectStore).toHaveBeenCalledWith('locations', { keyPath: 'id' });
        expect(mockDb.createObjectStore).toHaveBeenCalledWith('inventoryState', { keyPath: 'key' });
        expect(currentMockProductStore.createIndex).toHaveBeenCalledWith('category', 'category');
    });

    test('should not attempt to create stores if they exist and version is current', async () => {
        // Setup: Create a DB that is already at the current version and has stores.
        mockDb = createMockDatabase(DATABASE_VERSION); // Set to current version
        mockDb.objectStoreNames._stores.add('products');
        mockDb.objectStoreNames._stores.add('locations');
        mockDb.objectStoreNames._stores.add('inventoryState');
        if (mockDb.createObjectStore) mockDb.createObjectStore.mockClear();

        // Re-initialize service with this specific DB state
        await jest.isolateModulesAsync(async () => {
            const { IndexedDBService } = await import('../../src/services/indexeddb.service');
            dbService = new IndexedDBService(); // This will call openDB
            const lastOpenDBCall = mockHelperOpenDB.mock.calls.length - 1;
            const result = mockHelperOpenDB.mock.results[lastOpenDBCall];
            if (lastOpenDBCall >= 0 && result) {
                await result.value; // Wait for openDB to complete
            }
        });

        // Assert: createObjectStore should not have been called as DB is up-to-date.
        expect(mockDb.createObjectStore).not.toHaveBeenCalled();
    });

    test('should call upgrade callback with correct versions for a future upgrade (e.g., v1 to v2)', async () => {
      // Setup: DB starts at version 1.
      mockDb = createMockDatabase(1);
      mockDb.objectStoreNames._stores.add('products');
      mockDb.objectStoreNames._stores.add('locations');
      mockDb.objectStoreNames._stores.add('inventoryState');
      if (mockDb.createObjectStore) mockDb.createObjectStore.mockClear();

      // Initialize service (this captures the upgrade callback via mockOpenDB)
      // We need a new service instance to ensure openDB is called with the new mockDb state
      await jest.isolateModulesAsync(async () => {
          const { IndexedDBService } = await import('../../src/services/indexeddb.service');
          const serviceForThisTest = new IndexedDBService(); // Call openDB with current mockDb state
          // Wait for openDB to resolve
          const lastOpenDBCall = mockHelperOpenDB.mock.calls.length - 1;
          const result = mockHelperOpenDB.mock.results[lastOpenDBCall];
          if (lastOpenDBCall >= 0 && result) {
              await result.value;
          }
      });
      expect(mockHelperDBCallbacks.upgrade).toBeDefined();

      const consoleSpy = jest.spyOn(console, 'log');

      if (mockHelperDBCallbacks.upgrade) {
        // Create a mock transaction for the upgrade
        const mockUpgradeTx = mockDb.transaction(['products', 'locations', 'inventoryState'], 'versionchange' as any) as unknown as IDBPTransaction<BarInventoryDBSchemaType,any,'versionchange'>;

        await mockHelperDBCallbacks.upgrade(
          mockDb as unknown as IDBPDatabase<BarInventoryDBSchemaType>, 1, 2,
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
      currentMockProductStore.put.mockResolvedValue('prod1' as IDBValidKey);
      currentMockLocationStore.put.mockResolvedValue('loc1' as IDBValidKey);
      currentMockInventoryStateStore.put.mockResolvedValue('currentState' as IDBValidKey);

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
    const product1: Product = { id: 'p1', name: 'Product 1', category: 'Cat A', itemsPerCrate: 10, pricePer100ml:1, pricePerBottle:10, volume:700, lastUpdated: new Date() };
    const product2: Product = { id: 'p2', name: 'Product 2', category: 'Cat B', itemsPerCrate: 12, pricePer100ml:2, pricePerBottle:12, volume:750, lastUpdated: new Date() };
    const product3: Product = { id: 'p3', name: 'Product 3', category: 'Cat A', itemsPerCrate: 6, pricePer100ml:3, pricePerBottle:15, volume:1000, lastUpdated: new Date() };

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
      currentMockProductStore.put.mockImplementation(async (value: Product, _key?: IDBValidKey) => value.id as IDBValidKey);
      currentMockLocationStore.put.mockImplementation(async (value: Location, _key?: IDBValidKey) => value.id as IDBValidKey);
      currentMockInventoryStateStore.put.mockImplementation(async (value: StoredInventoryStateType, _key?: IDBValidKey) => value.key as IDBValidKey);
    });

    // This describe block was for concurrency tests, but the problematic mocks are inside
    // "Transaction Failure Scenario Tests" and "Data Integrity Tests"
    // The following sections need to be located and fixed.
    // For now, this is a placeholder for the diff tool.
    // I will need to locate the specific lines 1227, 1251, 1296 etc. in subsequent calls.

    describe('saveAllApplicationData', () => { // This is just one of the describe blocks
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
    const product1: Product = { id: 'p1', name: 'Product 1', category: 'Cat A', itemsPerCrate: 10, pricePer100ml:1, pricePerBottle:10, volume:700, lastUpdated: new Date() };
    const location1: Location = { id: 'l1', name: 'Location 1', counters: [] };
    const inventoryState1: InventoryState = { products: [product1], locations: [location1], unsyncedChanges: false };

    const product2: Product = { id: 'p2', name: 'Product 2', category: 'Cat B', itemsPerCrate: 12, pricePer100ml:2, pricePerBottle:12, volume:750, lastUpdated: new Date() };
    const location2: Location = { id: 'l2', name: 'Location 2', counters: [] };
    const inventoryState2: InventoryState = { products: [product2], locations: [location2], unsyncedChanges: true };


    test('should handle multiple saveAllApplicationData calls initiated concurrently, ensuring deterministic outcomes', async () => {
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

      const originalTransactionMock = mockDb.transaction; // Save the original mock from beforeEach

      // Scenario 1: data1's transaction initiates, then data2's, data1 completes, then data2 completes.
      // data2 should be the final state.
      // --------------------------------------------------------------------------------------------
      {
        // Clear specific mock call histories relevant to this scenario
        mockDb.transaction.mockClear();
        currentMockProductStore.put.mockClear();
        currentMockProductStore.delete.mockClear();
        currentMockProductStore.getAllKeys.mockClear();
        currentMockLocationStore.put.mockClear();
        currentMockLocationStore.delete.mockClear();
        currentMockLocationStore.getAllKeys.mockClear();
        currentMockInventoryStateStore.put.mockClear();
        showToastMock.mockClear();

        let data1TxDoneResolve: () => void;
        let data2TxDoneResolve: () => void;

        // Use mockDb from the outer scope, which is correctly typed and initialized
        mockDb.transaction = jest.fn()
          .mockImplementationOnce((storeNames: StoreNames<BarInventoryDBSchemaType>[], mode: IDBTransactionMode) => { // For data1
            const tx = createMockTransaction(storeNames, mode as any, mockDb);
            tx.done = new Promise<void>(resolve => { data1TxDoneResolve = resolve; });
            return tx as any;
          })
          .mockImplementationOnce((storeNames: StoreNames<BarInventoryDBSchemaType>[], mode: IDBTransactionMode) => { // For data2
            const tx = createMockTransaction(storeNames, mode as any, mockDb);
            tx.done = new Promise<void>(resolve => { data2TxDoneResolve = resolve; });
            return tx as any;
          }) as MockDatabaseInstance['transaction']; // Ensure the assignment matches the type

        // Mock getAllKeys: data1 sees empty, data2 sees data1's items
        currentMockProductStore.getAllKeys.mockResolvedValueOnce([]).mockResolvedValueOnce([product1.id]);
        currentMockLocationStore.getAllKeys.mockResolvedValueOnce([]).mockResolvedValueOnce([location1.id]);

        const promise1 = dbService.saveAllApplicationData(data1);
        const promise2 = dbService.saveAllApplicationData(data2);

        // Resolve transactions: data1 finishes, then data2 finishes.
        // @ts-ignore
        if (data1TxDoneResolve) data1TxDoneResolve(); else throw new Error("data1TxDoneResolve not set");
        // @ts-ignore
        if (data2TxDoneResolve) data2TxDoneResolve(); else throw new Error("data2TxDoneResolve not set");

        await Promise.all([promise1, promise2]);

        expect(mockDb.transaction).toHaveBeenCalledTimes(2); // Use mockDb directly

        // Assert data2 is the final state
        // Check the calls for put operations. Due to concurrency, order of inner puts isn't guaranteed,
        // but both data1 and data2 items should have been put. The delete operations ensure data2 is final.
        expect(currentMockProductStore.put).toHaveBeenCalledWith(product1); // from data1
        expect(currentMockProductStore.put).toHaveBeenCalledWith(product2); // from data2
        expect(currentMockLocationStore.put).toHaveBeenCalledWith(location1); // from data1
        expect(currentMockLocationStore.put).toHaveBeenCalledWith(location2); // from data2
        expect(currentMockInventoryStateStore.put).toHaveBeenCalledWith(storedState1); // from data1
        expect(currentMockInventoryStateStore.put).toHaveBeenCalledWith(storedState2); // from data2

        // Crucially, the deletions determine the final state.
        // In this scenario (data1 then data2, data1 completes then data2 completes),
        // data2's operations run seeing data1's items as existing.
        expect(currentMockProductStore.delete).toHaveBeenCalledWith(product1.id); // data2 deleting data1's product
        expect(currentMockLocationStore.delete).toHaveBeenCalledWith(location1.id); // data2 deleting data1's location

        expect(currentMockProductStore.put).toHaveBeenCalledTimes(2);
        expect(currentMockLocationStore.put).toHaveBeenCalledTimes(2);
        expect(currentMockInventoryStateStore.put).toHaveBeenCalledTimes(2);

        expect(showToastMock).toHaveBeenCalledWith('Anwendungsdaten erfolgreich gespeichert.', 'success');
        expect(showToastMock).toHaveBeenCalledTimes(2);
      }

      // Scenario 2: data2's transaction initiates, then data1's, data2 completes, then data1 completes.
      // data1 should be the final state.
      // --------------------------------------------------------------------------------------------
      {
        // Clear specific mock call histories for this scenario
        mockDb.transaction.mockClear();
        currentMockProductStore.put.mockClear();
        currentMockProductStore.delete.mockClear();
        currentMockProductStore.getAllKeys.mockClear();
        currentMockLocationStore.put.mockClear();
        currentMockLocationStore.delete.mockClear();
        currentMockLocationStore.getAllKeys.mockClear();
        currentMockInventoryStateStore.put.mockClear();
        showToastMock.mockClear();

        let data2TxDoneResolveScenario2: () => void;
        let data1TxDoneResolveScenario2: () => void;

        mockDb.transaction = jest.fn()
          .mockImplementationOnce((storeNames: StoreNames<BarInventoryDBSchemaType>[], mode: IDBTransactionMode) => { // For data2
            const tx = createMockTransaction(storeNames, mode as any, mockDb);
            tx.done = new Promise<void>(resolve => { data2TxDoneResolveScenario2 = resolve; });
            return tx as any;
          })
          .mockImplementationOnce((storeNames: StoreNames<BarInventoryDBSchemaType>[], mode: IDBTransactionMode) => { // For data1
            const tx = createMockTransaction(storeNames, mode as any, mockDb);
            tx.done = new Promise<void>(resolve => { data1TxDoneResolveScenario2 = resolve; });
            return tx as any;
          }) as MockDatabaseInstance['transaction'];

        currentMockProductStore.getAllKeys.mockResolvedValueOnce([]).mockResolvedValueOnce([product2.id]);
        currentMockLocationStore.getAllKeys.mockResolvedValueOnce([]).mockResolvedValueOnce([location2.id]);

        const promiseB = dbService.saveAllApplicationData(data2);
        const promiseA = dbService.saveAllApplicationData(data1);

        // @ts-ignore
        if (data2TxDoneResolveScenario2) data2TxDoneResolveScenario2(); else throw new Error("data2TxDoneResolveScenario2 not set");
        // @ts-ignore
        if (data1TxDoneResolveScenario2) data1TxDoneResolveScenario2(); else throw new Error("data1TxDoneResolveScenario2 not set");

        await Promise.all([promiseA, promiseB]);

        expect(mockDb.transaction).toHaveBeenCalledTimes(2); // Use mockDb directly

        // Assert data1 is the final state
        expect(currentMockProductStore.put).toHaveBeenCalledWith(product1); // from data1
        expect(currentMockProductStore.put).toHaveBeenCalledWith(product2); // from data2
        expect(currentMockLocationStore.put).toHaveBeenCalledWith(location1); // from data1
        expect(currentMockLocationStore.put).toHaveBeenCalledWith(location2); // from data2
        expect(currentMockInventoryStateStore.put).toHaveBeenCalledWith(storedState1); // from data1
        expect(currentMockInventoryStateStore.put).toHaveBeenCalledWith(storedState2); // from data2

        // Crucially, the deletions determine the final state.
        // In this scenario (data2 then data1, data2 completes then data1 completes),
        // data1's operations run seeing data2's items as existing.
        expect(currentMockProductStore.delete).toHaveBeenCalledWith(product2.id); // data1 deleting data2's product
        expect(currentMockLocationStore.delete).toHaveBeenCalledWith(location2.id); // data1 deleting data2's location

        expect(currentMockProductStore.put).toHaveBeenCalledTimes(2);
        expect(currentMockLocationStore.put).toHaveBeenCalledTimes(2);
        expect(currentMockInventoryStateStore.put).toHaveBeenCalledTimes(2);

        expect(showToastMock).toHaveBeenCalledWith('Anwendungsdaten erfolgreich gespeichert.', 'success');
        expect(showToastMock).toHaveBeenCalledTimes(2);
      }

      // Restore original transaction mock behavior from beforeEach for subsequent tests
      // This is important because mockDb is shared across tests in the main describe block.
      // The beforeEach in the main describe block re-creates mockDb.transaction as a basic jest.fn().
      // So, originalTransactionMock holds that basic jest.fn().
      if (mockDb) { // Ensure mockDb is defined before trying to assign to its transaction property
        mockDb.transaction = originalTransactionMock;
      }
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
      lastUpdated: new Date(),
    }));

    const largeLocationArray = createLargeArray(500, i => ({
      id: `loc${i}`,
      name: `Large Location ${i}`,
      counters: [{ id: `c${i}-1`, name: 'Counter 1', areas: [] }], // Added areas to satisfy Counter model
    }));

    const largeInventoryState: InventoryState = {
      products: largeProductArray.slice(0, 50), // Just a subset for the state itself for brevity
      locations: largeLocationArray.slice(0, 20),
      unsyncedChanges: true,
    };
    const storedLargeInventoryState: StoredInventoryStateType = { ...largeInventoryState, key: 'currentState' };

    beforeEach(() => {
      // Reset mocks for put/delete/getAllKeys for each large data test
      currentMockProductStore.put.mockClear().mockImplementation(async (value: Product) => value.id as IDBValidKey);
      currentMockProductStore.delete.mockClear();
      currentMockProductStore.getAllKeys.mockClear();
      currentMockLocationStore.put.mockClear().mockImplementation(async (value: Location) => value.id as IDBValidKey);
      currentMockLocationStore.delete.mockClear();
      currentMockLocationStore.getAllKeys.mockClear();
      currentMockInventoryStateStore.put.mockClear().mockImplementation(async (value: StoredInventoryStateType) => value.key as IDBValidKey);
    });

    test('saveAllApplicationData should handle large arrays of products and locations (measure time)', async () => {
      currentMockProductStore.getAllKeys.mockResolvedValue([]); // DB is empty
      currentMockLocationStore.getAllKeys.mockResolvedValue([]);

      const dataToSave = {
        products: largeProductArray,
        locations: largeLocationArray,
        state: largeInventoryState,
      };

      console.time('saveAllApplicationData_large_new');
      await dbService.saveAllApplicationData(dataToSave);
      console.timeEnd('saveAllApplicationData_large_new');

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

    test('loadAllApplicationData should handle large arrays of products and locations (measure time)', async () => {
      mockDb.getAll
        .mockImplementation(async (storeName: string) => {
          if (storeName === 'products') return largeProductArray;
          if (storeName === 'locations') return largeLocationArray;
          return [];
        });
      mockDb.get.mockResolvedValue(storedLargeInventoryState);

      console.time('loadAllApplicationData_large');
      const result = await dbService.loadAllApplicationData();
      console.timeEnd('loadAllApplicationData_large');

      expect(mockDb.getAll).toHaveBeenCalledWith('products');
      expect(mockDb.getAll).toHaveBeenCalledWith('locations');
      expect(mockDb.get).toHaveBeenCalledWith('inventoryState', 'currentState');

      expect(result.products.length).toBe(largeProductArray.length);
      expect(result.products).toEqual(largeProductArray);
      expect(result.locations.length).toBe(largeLocationArray.length);
      expect(result.locations).toEqual(largeLocationArray);
      expect(result.state).toEqual(storedLargeInventoryState);
    });

    test('saveAllApplicationData should handle deletions with large existing dataset (measure time)', async () => {
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

      console.time('saveAllApplicationData_large_deletions');
      await dbService.saveAllApplicationData(dataToSave);
      console.timeEnd('saveAllApplicationData_large_deletions');

      // Verify puts for the small new dataset
      expect(currentMockProductStore.put).toHaveBeenCalledTimes(smallProductArray.length);
      smallProductArray.forEach(p => expect(currentMockProductStore.put).toHaveBeenCalledWith(p));

      expect(currentMockLocationStore.put).toHaveBeenCalledTimes(smallLocationArray.length);
      smallLocationArray.forEach(l => expect(currentMockLocationStore.put).toHaveBeenCalledWith(l));

      // Verify deletions for items not in the new small dataset
      const expectedProductDeletions = largeProductArray.length - smallProductArray.length;
      expect(currentMockProductStore.delete).toHaveBeenCalledTimes(expectedProductDeletions);
      for (let i = smallProductArray.length; i < largeProductArray.length; i++) {
        expect(currentMockProductStore.delete).toHaveBeenCalledWith(largeProductArray[i]!.id);
      }

      const expectedLocationDeletions = largeLocationArray.length - smallLocationArray.length;
      expect(currentMockLocationStore.delete).toHaveBeenCalledTimes(expectedLocationDeletions);
      for (let i = smallLocationArray.length; i < largeLocationArray.length; i++) {
        expect(currentMockLocationStore.delete).toHaveBeenCalledWith(largeLocationArray[i]!.id);
      }

      expect(showToastMock).toHaveBeenCalledWith('Anwendungsdaten erfolgreich gespeichert.', 'success');
    });
  });

  describe('Invalid Input Tests', () => {
    const product1: Product = { id: 'p1', name: 'Product 1', category: 'Cat A', itemsPerCrate: 10, pricePer100ml:1, pricePerBottle:10, volume:700, lastUpdated: new Date() };
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
        const validProduct = { id: 'vp1', name: 'Valid Product', category: 'Valid', itemsPerCrate: 1, pricePer100ml:1, pricePerBottle:1, volume:100, lastUpdated: new Date() };
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
    const product1: Product = { id: 'p1', name: 'P1', category: 'C1', itemsPerCrate: 1, pricePer100ml:1, pricePerBottle:1, volume:100, lastUpdated: new Date() };
    const product2: Product = { id: 'p2', name: 'P2', category: 'C2', itemsPerCrate: 1, pricePer100ml:1, pricePerBottle:1, volume:100, lastUpdated: new Date() };
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
      // jest.restoreAllMocks(); // This can be too broad if other mocks are set up in outer beforeEaches
      // Instead, manage spies more locally or ensure they are restored in afterEach if needed.
    });

    const setupFailingTransaction = (error: Error, specificMock?: jest.SpyInstance) => {
        const transactionSpy = specificMock || jest.spyOn(mockDb, 'transaction');
        transactionSpy.mockImplementation((storeNames, mode) => {
            const tx = createMockTransaction(storeNames as any, mode as any, mockDb as unknown as IDBPDatabase<BarInventoryDBSchemaType>);
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
      currentMockProductStore.getAllKeys.mockRejectedValueOnce(error);

      const transactionSpy = jest.spyOn(mockDb, 'transaction');
      transactionSpy.mockImplementationOnce((storeNames, mode) => {
          const txInternal = createMockTransaction(storeNames as any, mode as any, mockDb as unknown as IDBPDatabase<BarInventoryDBSchemaType>);
          txInternal.done = Promise.reject(error); // Simulate tx abort due to operation failure
          return txInternal as any;
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
      currentMockProductStore.put.mockImplementation(async (value: Product, key?: IDBValidKey) => {
        if (value.id === product1.id) {
          throw error; // Reject explicitly in async function
        }
        return value.id as IDBValidKey;
      });

      const transactionSpy = setupFailingTransaction(error); // This already makes tx.done reject

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
      currentMockProductStore.put.mockImplementation(async (value: Product, _key?: IDBValidKey) => value.id as IDBValidKey); // Products save fine
      currentMockLocationStore.put.mockImplementation(async (value: Location, key?: IDBValidKey) => {
        if (value.id === location1.id) {
          throw error; // Reject explicitly
        }
        return value.id as IDBValidKey;
      });

      const transactionSpy = setupFailingTransaction(error); // This already makes tx.done reject

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
      currentMockProductStore.put.mockImplementation(async (value: Product, _key?: IDBValidKey) => value.id as IDBValidKey);
      currentMockLocationStore.put.mockImplementation(async (value: Location, _key?: IDBValidKey) => value.id as IDBValidKey);
      currentMockInventoryStateStore.put.mockImplementation(async (value: StoredInventoryStateType, _key?: IDBValidKey) => { throw error; }); // State saving fails

      const transactionSpy = setupFailingTransaction(error);

      await expect(dbService.saveAllApplicationData(testData)).rejects.toThrow(error.message);

      // Products and locations would have been "put" within the transaction operations
      expect(currentMockProductStore.put).toHaveBeenCalledTimes(testData.products.length);
      expect(currentMockLocationStore.put).toHaveBeenCalledTimes(testData.locations.length);
      expect(currentMockInventoryStateStore.put).toHaveBeenCalledWith(storedState); // Attempted

      expect(showToastMock).toHaveBeenCalledWith('Fehler beim Speichern der Anwendungsdaten. Änderungen wurden nicht gespeichert.', 'error');
      transactionSpy.mockRestore();
    });

    test('should handle QuotaExceededError during product put and abort transaction', async () => {
      const quotaError = new DOMException('Quota Exceeded', 'QuotaExceededError');

      // Mock productStore.put to throw the error for a specific product
      currentMockProductStore.put.mockImplementation((value: Product, _key?: IDBValidKey) => {
        if (value.id === product1.id) { // Let's say product1 causes the quota error
          return Promise.reject(quotaError);
        }
        return Promise.resolve(value.id as IDBValidKey); // Other products might succeed if called
      });

      // Spy on mockDb.transaction to use setupFailingTransaction,
      // ensuring the transaction's 'done' promise rejects with the quotaError.
      const transactionSpy = jest.spyOn(mockDb, 'transaction');
      setupFailingTransaction(quotaError, transactionSpy); // Pass the spy to the helper

      await expect(dbService.saveAllApplicationData(testData)).rejects.toThrow(quotaError);

      // Verify that the put operation that throws was indeed called
      expect(currentMockProductStore.put).toHaveBeenCalledWith(product1);
      // Depending on Promise.all behavior in saveAllApplicationData, other puts might also be called
      // but the transaction should abort before committing them.
      // For instance, if product2 was also in testData.products:
      // expect(currentMockProductStore.put).not.toHaveBeenCalledWith(product2); // This might be too strong an assumption

      // Crucially, other stores should not have their data committed.
      expect(currentMockLocationStore.put).not.toHaveBeenCalled();
      expect(currentMockInventoryStateStore.put).not.toHaveBeenCalled();

      expect(showToastMock).toHaveBeenCalledWith(
        'Fehler beim Speichern der Anwendungsdaten. Änderungen wurden nicht gespeichert.',
        'error'
      );

      transactionSpy.mockRestore();
      // Restore mockProductStore.put to its default behavior for other tests if necessary,
      // though beforeEach should handle this.
      currentMockProductStore.put.mockImplementation((value: Product, key?: IDBValidKey) => Promise.resolve(value.id as IDBValidKey));
    });
  });

  describe('Data Integrity Tests', () => {
    const initialInventoryEntry: InventoryEntry = { productId: 'prod1', startBottles: 10, startOpenVolumeMl: 500 };
    const initialArea: Area = { id: 'area1', name: 'Main Shelf', inventoryItems: [initialInventoryEntry], inventoryRecords: [] };
    const initialCounter: Counter = { id: 'counter1', name: 'Main Bar', areas: [initialArea] };
    let initialLocation: Location = {
      id: 'loc1',
      name: 'Test Bar',
      counters: [initialCounter],
    };
    const initialProduct: Product = { id: 'prod1', name: 'Test Product', category: 'Test', volume: 700, pricePerBottle: 20, lastUpdated: new Date() };
    const initialState: InventoryState = {
        products: [initialProduct],
        locations: [initialLocation],
        unsyncedChanges: false
    };

    beforeEach(() => {
      // Reset mocks
      currentMockProductStore.put.mockClear();
      currentMockProductStore.getAllKeys.mockClear().mockResolvedValue([]);
      currentMockLocationStore.put.mockClear();
      currentMockLocationStore.getAllKeys.mockClear().mockResolvedValue([]);
      currentMockInventoryStateStore.put.mockClear();
      mockDb.getAll.mockClear();
      mockDb.get.mockClear();

      // Default behavior for store operations
      currentMockProductStore.put.mockImplementation(async (value: Product, _key?: IDBValidKey) => value.id as IDBValidKey);
      currentMockLocationStore.put.mockImplementation(async (value: Location, _key?: IDBValidKey) => value.id as IDBValidKey);
      currentMockInventoryStateStore.put.mockImplementation(async (value: StoredInventoryStateType, _key?: IDBValidKey) => value.key as IDBValidKey);

      // Reset initialLocation for each test to avoid mutation across tests
      initialLocation = JSON.parse(JSON.stringify({ // Deep copy
        id: 'loc1',
        name: 'Test Bar',
        counters: [{
          id: 'counter1',
          name: 'Main Bar',
          areas: [{
            id: 'area1',
            name: 'Main Shelf',
            inventoryItems: [{ productId: 'prod1', startBottles: 10, startOpenVolumeMl: 500 }],
            inventoryRecords: []
          }],
        }],
      }));
    });

    test('should save and load deeply nested object structures correctly', async () => {
      // 1. Save initial deeply nested data
      const dataToSave = {
        products: [initialProduct],
        locations: [initialLocation],
        state: initialState,
      };
      // Simulate empty DB for save
      currentMockProductStore.getAllKeys.mockResolvedValueOnce([]);
      currentMockLocationStore.getAllKeys.mockResolvedValueOnce([]);

      await dbService.saveAllApplicationData(dataToSave);

      // Verify it was "saved" (put operations called)
      expect(currentMockProductStore.put).toHaveBeenCalledWith(initialProduct);
      expect(currentMockLocationStore.put).toHaveBeenCalledWith(initialLocation);
      expect(currentMockInventoryStateStore.put).toHaveBeenCalledWith({ ...initialState, key: 'currentState' });

      // 2. Load it back
      // Mock DB calls for loadAllApplicationData
      mockDb.getAll
        .mockImplementationOnce(async (storeName: string) => storeName === 'products' ? [initialProduct] : [])
        .mockImplementationOnce(async (storeName: string) => storeName === 'locations' ? [initialLocation] : []);
      mockDb.get.mockResolvedValueOnce({ ...initialState, key: 'currentState' });

      let loadedData = await dbService.loadAllApplicationData();
      expect(loadedData.products).toEqual([initialProduct]);
      expect(loadedData.locations).toEqual([initialLocation]);
      expect(loadedData.locations[0].counters[0].areas[0].inventoryItems[0].startBottles).toBe(10);

      // 3. Modify a deeply nested property
      const modifiedLocation = JSON.parse(JSON.stringify(initialLocation)); // Deep copy
      modifiedLocation.counters[0].areas[0].inventoryItems[0].startBottles = 5;
      modifiedLocation.counters[0].areas[0].inventoryItems[0].startOpenVolumeMl = 250;


      const modifiedDataToSave = {
        products: [initialProduct], // Products unchanged
        locations: [modifiedLocation],
        state: initialState, // State unchanged for this test
      };

      // Simulate existing data for the second save
      currentMockProductStore.getAllKeys.mockResolvedValueOnce([initialProduct.id] as any);
      currentMockLocationStore.getAllKeys.mockResolvedValueOnce([initialLocation.id] as any);
      // Clear put mocks to ensure we are checking the second save
      currentMockProductStore.put.mockClear();
      currentMockLocationStore.put.mockClear();
      currentMockInventoryStateStore.put.mockClear();


      await dbService.saveAllApplicationData(modifiedDataToSave);

      // Verify the modified location was "saved"
      expect(currentMockLocationStore.put).toHaveBeenCalledWith(modifiedLocation);
      expect(currentMockProductStore.put).toHaveBeenCalledWith(initialProduct); // Or not if only changed data is put
      expect(currentMockInventoryStateStore.put).toHaveBeenCalled();


      // 4. Load it back again and verify the nested change
      mockDb.getAll
        .mockImplementationOnce(async (storeName: string) => storeName === 'products' ? [initialProduct] : [])
        .mockImplementationOnce(async (storeName: string) => storeName === 'locations' ? [modifiedLocation] : []);
      mockDb.get.mockResolvedValueOnce({ ...initialState, key: 'currentState' }); // State is the same

      loadedData = await dbService.loadAllApplicationData();
      expect(loadedData.locations).toEqual([modifiedLocation]);
      expect(loadedData.locations[0].counters[0].areas[0].inventoryItems[0].startBottles).toBe(5);
      expect(loadedData.locations[0].counters[0].areas[0].inventoryItems[0].startOpenVolumeMl).toBe(250);
    });
  });
});
