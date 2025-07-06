// Mock helpers for IndexedDB service tests

import { jest } from '@jest/globals';
import type { IDBPDatabase, IDBPTransaction, IDBPObjectStore, IDBPCursor, IDBPCursorWithValue, IDBPIndex, StoreNames, DBSchema, OpenDBCallbacks } from 'idb';
import type { Product, Location, InventoryState } from '../../../src/models';
import type { BarInventoryDBSchema as BarInventoryDBSchemaType, StoredInventoryState as StoredInventoryStateType } from '../../../src/services/indexeddb.service';

export const DATABASE_NAME = 'BarInventoryDB';
export const DATABASE_VERSION = 1;

// Simulates the structure of IDBPObjectStore actions
export const createMockStoreActions = () => ({
  add: jest.fn(),
  put: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  createIndex: jest.fn(),
  openCursor: jest.fn(),
  openKeyCursor: jest.fn(),
  count: jest.fn(),
  getMany: jest.fn(), // Added based on idb types
  getKey: jest.fn(),  // Added based on idb types
  // Add other IDBPObjectStore methods if needed by the service
});

export type MockStoreActions = ReturnType<typeof createMockStoreActions>;

// Global variables to hold current mock store actions.
// These can be updated by createMockDatabase if stores are (re)created.
export let mockProductStoreActionsInstance = createMockStoreActions();
export let mockLocationStoreActionsInstance = createMockStoreActions();
export let mockInventoryStateStoreActionsInstance = createMockStoreActions();

// Resets the instances for test isolation
export const resetMockStoreActionInstances = () => {
    mockProductStoreActionsInstance = createMockStoreActions();
    mockLocationStoreActionsInstance = createMockStoreActions();
    mockInventoryStateStoreActionsInstance = createMockStoreActions();
};

export type MockTransactionInstance = {
  objectStore: jest.Mock<IDBPObjectStore<BarInventoryDBSchemaType, any, any, 'readwrite' | 'readonly'>>;
  done: Promise<void> | jest.Mock<Promise<void>>;
  abort: jest.Mock<() => Promise<void>>;
  storeNames: StoreNames<BarInventoryDBSchemaType>[];
  mode: 'readwrite' | 'readonly';
  commit: jest.Mock<() => Promise<void>>;
  // onabort: (() => void) | null; // Simplified, event handling might be complex to deeply mock
  // onerror: ((event: Event) => void) | null;
  // oncomplete: (() => void) | null;
};

// Holds the current transaction instance created by createMockTransaction
// This allows tests to access and assert properties of the most recent transaction.
export let currentMockTransactionInstance: MockTransactionInstance;

export const createMockTransaction = (
    storeNames: StoreNames<BarInventoryDBSchemaType>[],
    mode: 'readwrite' | 'readonly',
    dbInstance: IDBPDatabase<BarInventoryDBSchemaType> // Pass the db instance to objectStore
): MockTransactionInstance => {
  currentMockTransactionInstance = {
    objectStore: jest.fn((name: StoreNames<BarInventoryDBSchemaType>) => {
      if (name === 'products') return mockProductStoreActionsInstance as unknown as IDBPObjectStore<BarInventoryDBSchemaType, any, any, 'readwrite' | 'readonly'>;
      if (name === 'locations') return mockLocationStoreActionsInstance as unknown as IDBPObjectStore<BarInventoryDBSchemaType, any, any, 'readwrite' | 'readonly'>;
      if (name === 'inventoryState') return mockInventoryStateStoreActionsInstance as unknown as IDBPObjectStore<BarInventoryDBSchemaType, any, any, 'readwrite' | 'readonly'>;
      throw new Error(`Mock Error: Unknown object store ${name} in transaction`);
    }) as jest.Mock<IDBPObjectStore<BarInventoryDBSchemaType, any, any, 'readwrite' | 'readonly'>>,
    done: jest.fn().mockResolvedValue(undefined), // Default to resolve
    abort: jest.fn().mockResolvedValue(undefined), // Default to resolve
    commit: jest.fn().mockResolvedValue(undefined), // Default to resolve
    storeNames,
    mode,
  };
  return currentMockTransactionInstance;
};


export type MockDatabaseInstance = IDBPDatabase<BarInventoryDBSchemaType> & {
    objectStoreNames: {
        contains: jest.Mock<(name: string) => boolean>;
        mockContainsProductStore: boolean;
        mockContainsLocationStore: boolean;
        mockContainsInventoryStateStore: boolean;
        length: number;
        item: jest.Mock<(index: number) => string | null>; // Based on DOMStringList
    };
    // createObjectStore: jest.Mock<IDBPObjectStore<BarInventoryDBSchemaType, any, any, any>>;
    close: jest.Mock<() => void>;
};

// Holds the current DB instance created by createMockDatabase
// This allows tests to access and assert properties of the database.
export let mockDbInstance: MockDatabaseInstance;

export const mockDBCallbacks: OpenDBCallbacks<BarInventoryDBSchemaType> = {
    upgrade: undefined,
    blocked: undefined,
    blocking: undefined,
    terminated: undefined,
};

export const createMockDatabase = (): MockDatabaseInstance => {
  // Reset store action instances when a new DB is effectively created/opened
  resetMockStoreActionInstances();

  const objectStoreNamesState = {
    _stores: new Set<string>(),
    get contains() {
        return jest.fn((name: string) => objectStoreNamesState._stores.has(name));
    },
    get mockContainsProductStore() { return objectStoreNamesState._stores.has('products'); },
    set mockContainsProductStore(value: boolean) { value ? objectStoreNamesState._stores.add('products') : objectStoreNamesState._stores.delete('products'); },
    get mockContainsLocationStore() { return objectStoreNamesState._stores.has('locations'); },
    set mockContainsLocationStore(value: boolean) { value ? objectStoreNamesState._stores.add('locations') : objectStoreNamesState._stores.delete('locations'); },
    get mockContainsInventoryStateStore() { return objectStoreNamesState._stores.has('inventoryState'); },
    set mockContainsInventoryStateStore(value: boolean) { value ? objectStoreNamesState._stores.add('inventoryState') : objectStoreNamesState._stores.delete('inventoryState'); },

    get length() { return objectStoreNamesState._stores.size; },
    item: jest.fn((index: number) => {
        const arrayStores = Array.from(objectStoreNamesState._stores);
        return arrayStores[index] || null;
    }),
  };


  mockDbInstance = {
    name: DATABASE_NAME,
    version: 0, // Start at 0, upgrade will set it to DATABASE_VERSION
    objectStoreNames: objectStoreNamesState as any, // DOMStringList like
    transaction: jest.fn().mockImplementation((storeNames, mode) => {
        // Use createMockTransaction to ensure currentMockTransactionInstance is set
        return createMockTransaction(storeNames, mode, mockDbInstance);
    }),
    get: jest.fn(),
    getAll: jest.fn(),
    put: jest.fn(),
    add: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    close: jest.fn(),
    createObjectStore: jest.fn().mockImplementation((storeName, options) => {
      objectStoreNamesState._stores.add(storeName as string);
      let newMockStoreActions;
      if (storeName === 'products') {
        mockProductStoreActionsInstance = createMockStoreActions(); // Create new instance
        newMockStoreActions = mockProductStoreActionsInstance;
      } else if (storeName === 'locations') {
        mockLocationStoreActionsInstance = createMockStoreActions(); // Create new instance
        newMockStoreActions = mockLocationStoreActionsInstance;
      } else if (storeName === 'inventoryState') {
        mockInventoryStateStoreActionsInstance = createMockStoreActions(); // Create new instance
        newMockStoreActions = mockInventoryStateStoreActionsInstance;
      } else {
        newMockStoreActions = createMockStoreActions(); // Generic for other stores if any
      }
      // Return a structure that mimics IDBPObjectStore for chaining (e.g., .createIndex)
      return newMockStoreActions as unknown as IDBPObjectStore<BarInventoryDBSchemaType, any, any, any>;
    }),
    deleteObjectStore: jest.fn().mockImplementation((storeName: string) => {
        objectStoreNamesState._stores.delete(storeName);
    }),
    // Add other IDBPDatabase methods if used by the service
  } as MockDatabaseInstance;
  return mockDbInstance;
};

export const mockOpenDB = jest.fn().mockImplementation(
  async (
    name: string,
    version?: number,
    callbacks?: OpenDBCallbacks<BarInventoryDBSchemaType>
  ) => {
    const db = mockDbInstance || createMockDatabase(); // Use existing or create new

    if (callbacks?.upgrade) mockDBCallbacks.upgrade = callbacks.upgrade;
    if (callbacks?.blocked) mockDBCallbacks.blocked = callbacks.blocked;
    if (callbacks?.blocking) mockDBCallbacks.blocking = callbacks.blocking;
    if (callbacks?.terminated) mockDBCallbacks.terminated = callbacks.terminated;

    // Simulate upgrade callback if versions differ or stores don't exist
    // This logic is simplified; real idb handles this more robustly.
    const effectiveVersion = version || DATABASE_VERSION;
    if (mockDBCallbacks.upgrade &&
        (effectiveVersion > db.version ||
         !db.objectStoreNames.contains('products') ||
         !db.objectStoreNames.contains('locations') ||
         !db.objectStoreNames.contains('inventoryState'))) {

      // Create a mock transaction for the upgrade process.
      // The real 'idb' library provides a special "versionchange" transaction.
      // Our mock transaction needs to be compatible with what the upgrade function expects.
      // For simplicity, we'll use our existing mock transaction factory.
      // The key is that db.createObjectStore is called on mockDbInstance.
      const upgradeTx = createMockTransaction(
        // According to IDB spec, upgrade transaction has access to all stores
        // For simplicity, we'll pass the known store names.
        // The actual store names available in the transaction would be those
        // existing at the start of the upgrade plus any created during it.
        // This is a simplification.
        [...db.objectStoreNames],
        'versionchange' as any, // Mode is 'versionchange' for upgrades
        db
      );

      // Simulate the db instance passed to upgrade having an `objectStoreNames` property
      // that correctly reflects the current state of stores.
      // Also, it should have `createObjectStore` and `deleteObjectStore`.
      // Our `mockDbInstance` already has these.

      await Promise.resolve(mockDBCallbacks.upgrade(
          db,
          db.version, // oldVersion
          effectiveVersion, // newVersion
          upgradeTx as unknown as IDBPTransaction<BarInventoryDBSchemaType, StoreNames<BarInventoryDBSchemaType>[], "versionchange">, // mock transaction for upgrade
          { oldVersion: db.version, newVersion: effectiveVersion } as unknown as IDBVersionChangeEvent // mock event
      ));
      db.version = effectiveVersion;
    }
    return Promise.resolve(db);
  }
);

// Mock window.indexedDB for the service constructor check
export const mockIDBFactory = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
  cmp: jest.fn(),
};

export const setupGlobalIndexedDBMock = () => {
    if (typeof window !== 'undefined') {
        Object.defineProperty(window, 'indexedDB', {
            value: mockIDBFactory,
            writable: true,
            configurable: true,
        });
    }
};

export const clearGlobalIndexedDBMock = () => {
    if (typeof window !== 'undefined') {
        Object.defineProperty(window, 'indexedDB', {
            value: undefined,
            writable: true,
            configurable: true,
        });
    }
};

export const mockProductInstance: Product = { id: 'prod1', name: 'Test Product', category: 'Test Category', itemsPerCrate: 10, pricePer100ml: 1, pricePerBottle: 10, volume: 750 };
export const mockLocationInstance: Location = { id: 'loc1', name: 'Test Location', counters: [] };
export const mockInventoryStateInstance: InventoryState = {
    locations: [],
    products: [],
    unsyncedChanges: false
};
export const mockStoredInventoryStateInstance: StoredInventoryStateType = { ...mockInventoryStateInstance, key: 'currentState' };

// Call this in beforeEach to reset mocks for test isolation
export const resetAllMocks = () => {
    mockOpenDB.mockClear();
    // mockDbInstance needs to be reset carefully, typically by calling createMockDatabase() again
    // createMockDatabase(); // This will reinitialize mockDbInstance and store action instances
    resetMockStoreActionInstances(); // Ensure store actions are fresh

    // Clear callbacks
    mockDBCallbacks.upgrade = undefined;
    mockDBCallbacks.blocked = undefined;
    mockDBCallbacks.blocking = undefined;
    mockDBCallbacks.terminated = undefined;

    // Reset mockIDBFactory calls if necessary
    mockIDBFactory.open.mockClear();
    mockIDBFactory.deleteDatabase.mockClear();
    mockIDBFactory.cmp.mockClear();

    // Reset currentMockTransactionInstance if it's directly manipulated or checked
    // currentMockTransactionInstance = undefined as any; // Or a default mock state

    // Note: showToast mock is cleared in the main test file's beforeEach
};

// Helper to get the current transaction instance's done promise for tests
export const getCurrentTransactionDonePromise = () => {
    if (!currentMockTransactionInstance || !currentMockTransactionInstance.done) {
        // This case should ideally not happen if a transaction was expected.
        // Return a rejected promise or throw to indicate a problem in test setup.
        return Promise.reject(new Error("No transaction instance or 'done' promise found."));
    }
    // If 'done' is a jest.fn(), call it to get the promise. Otherwise, it's already a promise.
    if (jest.isMockFunction(currentMockTransactionInstance.done)) {
        return currentMockTransactionInstance.done();
    }
    return currentMockTransactionInstance.done;
};
