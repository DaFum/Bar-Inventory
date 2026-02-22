// Mock helpers for IndexedDB service tests

import { jest } from '@jest/globals';
import type { IDBPDatabase, IDBPTransaction, IDBPObjectStore, IDBPCursor, IDBPCursorWithValue, IDBPIndex, StoreNames, DBSchema, OpenDBCallbacks } from 'idb';
import type { Product, Location, InventoryState } from '../../../src/models';
import type { BarInventoryDBSchema as BarInventoryDBSchemaType, StoredInventoryState as StoredInventoryStateType } from '../../../src/services/indexeddb.service';

export const DATABASE_NAME = 'BarInventoryDB';
export const DATABASE_VERSION = 1;

// Simulates the structure of IDBPObjectStore actions
// Provide more specific types for jest.fn() to avoid 'never' issues
export const createMockStoreActions = () => ({
  add: jest.fn<Promise<IDBValidKey>, [any, IDBValidKey?]>(),
  put: jest.fn<Promise<IDBValidKey>, [any, IDBValidKey?]>(),
  get: jest.fn<Promise<any | undefined>, [IDBValidKey | IDBKeyRange]>(),
  getAll: jest.fn<Promise<any[]>, [IDBValidKey | IDBKeyRange | null | undefined, number?]>(() => Promise.resolve([])), // Default to resolve with empty array
  delete: jest.fn<Promise<void>, [IDBValidKey | IDBKeyRange]>(),
  clear: jest.fn<Promise<void>, []>(),
  getAllKeys: jest.fn<Promise<IDBValidKey[]>, [IDBValidKey | IDBKeyRange | null | undefined, number?]>(() => Promise.resolve([])), // Default to resolve with empty array
  createIndex: jest.fn<IDBPIndex<BarInventoryDBSchemaType, any, any, any, any>, [any, any, any]>(), // Simplified return/args
  openCursor: jest.fn<Promise<IDBPCursorWithValue<BarInventoryDBSchemaType, any, any, any, any> | null>, [IDBValidKey | IDBKeyRange | null | undefined, IDBCursorDirection?]>(),
  openKeyCursor: jest.fn<Promise<IDBPCursor<BarInventoryDBSchemaType, any, any, any, any> | null>, [IDBValidKey | IDBKeyRange | null | undefined, IDBCursorDirection?]>(),
  count: jest.fn<Promise<number>, [IDBValidKey | IDBKeyRange | null | undefined]>(),
  getMany: jest.fn<Promise<any[]>, [IDBValidKey[]]>(),
  getKey: jest.fn<Promise<IDBValidKey | undefined>, [IDBValidKey | IDBKeyRange]>(),
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
// Made generic for Mode. Use 'any' for mode here or make it generic where used.
export let currentMockTransactionInstance: MockTransactionInstance<any> | undefined;


export const createMockTransaction = <CurrentMode extends IDBTransactionMode>(
    storeNames: StoreNames<BarInventoryDBSchemaType>[],
    mode: CurrentMode,
    dbInstance: IDBPDatabase<BarInventoryDBSchemaType> // Pass the db instance to objectStore
): MockTransactionInstance<CurrentMode> => {
  const newTxInstance: MockTransactionInstance<CurrentMode> = {
    objectStore: jest.fn(<Name extends StoreNames<BarInventoryDBSchemaType>>(name: Name): IDBPObjectStore<BarInventoryDBSchemaType, StoreNames<BarInventoryDBSchemaType>[], Name, CurrentMode> => {
      // The cast target needs to match this more specific return type.
      if (name === 'products') return mockProductStoreActionsInstance as unknown as IDBPObjectStore<BarInventoryDBSchemaType, StoreNames<BarInventoryDBSchemaType>[], 'products', CurrentMode>;
      if (name === 'locations') return mockLocationStoreActionsInstance as unknown as IDBPObjectStore<BarInventoryDBSchemaType, StoreNames<BarInventoryDBSchemaType>[], 'locations', CurrentMode>;
      if (name === 'inventoryState') return mockInventoryStateStoreActionsInstance as unknown as IDBPObjectStore<BarInventoryDBSchemaType, StoreNames<BarInventoryDBSchemaType>[], 'inventoryState', CurrentMode>;
      throw new Error(`Mock Error: Unknown object store ${name} in transaction`);
    }),
    done: jest.fn().mockResolvedValue(undefined),
    abort: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    storeNames,
    mode,
  };
  currentMockTransactionInstance = newTxInstance;
  return newTxInstance;
};

// Define a type for our specific mock implementation of objectStoreNames
type MockObjectStoreNames = {
    contains: jest.Mock<(name: string) => boolean>;
    mockContainsProductStore: boolean;
    mockContainsLocationStore: boolean;
    mockContainsInventoryStateStore: boolean;
    readonly length: number; // Make it readonly to match DOMStringList
    item: jest.Mock<(index: number) => StoreNames<BarInventoryDBSchemaType> | null>;
    _stores: Set<string>; // Keep this internal detail available for mock setup
    [Symbol.iterator]: jest.Mock<() => IterableIterator<StoreNames<BarInventoryDBSchemaType>>>;
};

export type MockDatabaseInstance = Omit<IDBPDatabase<BarInventoryDBSchemaType>, 'objectStoreNames' | 'transaction' | 'createObjectStore' | 'deleteObjectStore' | 'close' | 'get' | 'getAll' | 'put' | 'add' | 'delete' | 'clear' | 'version'> & {
    version: number; // Make version mutable for tests, though IDBPDatabase has it readonly
    objectStoreNames: MockObjectStoreNames;
    transaction: jest.Mock<
        (storeNames: StoreNames<BarInventoryDBSchemaType> | StoreNames<BarInventoryDBSchemaType>[], mode?: IDBTransactionMode) =>
        MockTransactionInstance<IDBTransactionMode extends undefined ? 'readonly' : Exclude<IDBTransactionMode, undefined>>
    >;
    createObjectStore: jest.Mock<IDBPObjectStore<BarInventoryDBSchemaType, any, any, any>, [StoreNames<BarInventoryDBSchemaType>, IDBObjectStoreParameters?]>,
    deleteObjectStore: jest.Mock<void, [StoreNames<BarInventoryDBSchemaType>]>,
    close: jest.Mock<void, []>,
    // Direct DB operations (shortcuts, not always recommended to use over transactions)
    get: jest.fn<Promise<any | undefined>, [StoreNames<BarInventoryDBSchemaType>, IDBValidKey | IDBKeyRange]>,
    getAll: jest.fn<Promise<any[]>, [StoreNames<BarInventoryDBSchemaType>, (IDBValidKey | IDBKeyRange | null | undefined)?, number?]>,
    put: jest.fn<Promise<IDBValidKey>, [StoreNames<BarInventoryDBSchemaType>, any, IDBValidKey?]>,
    add: jest.fn<Promise<IDBValidKey>, [StoreNames<BarInventoryDBSchemaType>, any, IDBValidKey?]>,
    delete: jest.fn<Promise<void>, [StoreNames<BarInventoryDBSchemaType>, IDBValidKey | IDBKeyRange]>,
    clear: jest.fn<Promise<void>, [StoreNames<BarInventoryDBSchemaType>]>,
};


// Holds the current DB instance created by createMockDatabase
// This allows tests to access and assert properties of the database.
export let mockDbInstance: MockDatabaseInstance | undefined; // Allow undefined for explicit reset

export const mockDBCallbacks: OpenDBCallbacks<BarInventoryDBSchemaType> = {
    upgrade: undefined,
    blocked: undefined,
    blocking: undefined,
    terminated: undefined,
};

export const createMockDatabase = (initialVersion: number = 0): MockDatabaseInstance => {
  // Reset store action instances when a new DB is effectively created/opened
  resetMockStoreActionInstances();

  const objectStoreNamesStateInternal = {
    _stores: new Set<string>(),
    contains: jest.fn((name: string) => objectStoreNamesStateInternal._stores.has(name)),
    get mockContainsProductStore() { return objectStoreNamesStateInternal._stores.has('products'); },
    set mockContainsProductStore(value: boolean) { value ? objectStoreNamesStateInternal._stores.add('products') : objectStoreNamesStateInternal._stores.delete('products'); },
    get mockContainsLocationStore() { return objectStoreNamesStateInternal._stores.has('locations'); },
    set mockContainsLocationStore(value: boolean) { value ? objectStoreNamesStateInternal._stores.add('locations') : objectStoreNamesStateInternal._stores.delete('locations'); },
    get mockContainsInventoryStateStore() { return objectStoreNamesStateInternal._stores.has('inventoryState'); },
    set mockContainsInventoryStateStore(value: boolean) { value ? objectStoreNamesStateInternal._stores.add('inventoryState') : objectStoreNamesStateInternal._stores.delete('inventoryState'); },
    get length() { return objectStoreNamesStateInternal._stores.size; },
    item: jest.fn((index: number) => {
        const arrayStores = Array.from(objectStoreNamesStateInternal._stores) as StoreNames<BarInventoryDBSchemaType>[];
        return arrayStores[index] || null;
    }),
    [Symbol.iterator]: jest.fn(function* () {
        for (const storeName of objectStoreNamesStateInternal._stores) {
            yield storeName as StoreNames<BarInventoryDBSchemaType>;
        }
    })
  };
  // Cast to MockObjectStoreNames after definition to satisfy the type for _stores and Symbol.iterator
  const objectStoreNamesState = objectStoreNamesStateInternal as MockObjectStoreNames;


  const newDbInstance = {
    name: DATABASE_NAME,
    version: initialVersion, // Use parameter, mutable for test setup
    objectStoreNames: objectStoreNamesState,
    transaction: jest.fn().mockImplementation((storeNames, mode) => {
        // Use createMockTransaction to ensure currentMockTransactionInstance is set
        // Pass newDbInstance itself to createMockTransaction if it needs a DB instance
        return createMockTransaction(storeNames, mode, newDbInstance as unknown as IDBPDatabase<BarInventoryDBSchemaType>);
    }),
    get: jest.fn<Promise<any | undefined>, [StoreNames<BarInventoryDBSchemaType>, IDBValidKey | IDBKeyRange]>(),
    getAll: jest.fn<Promise<any[]>, [StoreNames<BarInventoryDBSchemaType>, (IDBValidKey | IDBKeyRange | null | undefined)?, number?]>(),
    put: jest.fn<Promise<IDBValidKey>, [StoreNames<BarInventoryDBSchemaType>, any, IDBValidKey?]>(),
    add: jest.fn<Promise<IDBValidKey>, [StoreNames<BarInventoryDBSchemaType>, any, IDBValidKey?]>(),
    delete: jest.fn<Promise<void>, [StoreNames<BarInventoryDBSchemaType>, IDBValidKey | IDBKeyRange]>(),
    clear: jest.fn<Promise<void>, [StoreNames<BarInventoryDBSchemaType>]>(),
    close: jest.fn<void, []>(),
    createObjectStore: jest.fn<IDBPObjectStore<BarInventoryDBSchemaType, any, any, any>, [StoreNames<BarInventoryDBSchemaType>, IDBObjectStoreParameters?]>().mockImplementation((storeName, options) => {
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
  };
  mockDbInstance = newDbInstance as unknown as MockDatabaseInstance; // Main cast for the instance
  return mockDbInstance;
};

export const mockOpenDB = jest.fn().mockImplementation(
  async (
    name: string,
    version?: number,
    callbacks?: OpenDBCallbacks<BarInventoryDBSchemaType>
  ) => {
    // Ensure db is of type MockDatabaseInstance, not potentially IDBPDatabase if mockDbInstance was undefined then createMockDatabase was hit
    const db: MockDatabaseInstance = (mockDbInstance || createMockDatabase()) as MockDatabaseInstance;

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
      // The upgradeTx is MockTransactionInstance<'versionchange'>
      // The target is IDBPTransaction<..., 'versionchange'>
      // This cast remains as MockTransactionInstance is not a full IDBPTransaction.
      await Promise.resolve(mockDBCallbacks.upgrade(
          db, // This is MockDatabaseInstance, but upgrade expects IDBPDatabase.
              // This is generally fine if MockDatabaseInstance is a superset for used properties.
          db.version, // oldVersion
          effectiveVersion, // newVersion
          upgradeTx as unknown as IDBPTransaction<BarInventoryDBSchemaType, StoreNames<BarInventoryDBSchemaType>[], "versionchange">,
          { oldVersion: db.version, newVersion: effectiveVersion, type: 'versionchange' } as unknown as IDBVersionChangeEvent // Added type to better match Event
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

    // Explicitly reset global instances to a known state.
    // While createMockDatabase() in beforeEach re-initializes mockDbInstance,
    // being explicit here makes resetAllMocks more robust if called elsewhere.
    mockDbInstance = undefined; // Explicitly set to undefined
    // @ts-ignore Allow setting to undefined, type is MockTransactionInstance | undefined
    currentMockTransactionInstance = undefined; // Explicitly set to undefined

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
