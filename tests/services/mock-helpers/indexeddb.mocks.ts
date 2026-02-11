// Mock helpers for IndexedDB service tests

import { jest } from '@jest/globals';
import type { IDBPDatabase, IDBPTransaction, IDBPObjectStore, IDBPCursor, IDBPCursorWithValue, IDBPIndex, StoreNames, DBSchema, OpenDBCallbacks } from 'idb';
import type { Product, Location, InventoryState } from '../../../src/models';
import type { BarInventoryDBSchema as BarInventoryDBSchemaType, StoredInventoryState as StoredInventoryStateType } from '../../../src/services/indexeddb.service';

export const DATABASE_NAME = 'BarInventoryDB';
export const DATABASE_VERSION = 1;

// Simulates the structure of IDBPObjectStore actions
export const createMockStoreActions = () => ({
  add: jest.fn<(value: any, key?: IDBValidKey) => Promise<IDBValidKey>>(),
  put: jest.fn<(value: any, key?: IDBValidKey) => Promise<IDBValidKey>>(),
  get: jest.fn<(key: IDBValidKey | IDBKeyRange) => Promise<any | undefined>>(),
  getAll: jest.fn<(query?: IDBValidKey | IDBKeyRange | null, count?: number) => Promise<any[]>>().mockResolvedValue([]),
  delete: jest.fn<(key: IDBValidKey | IDBKeyRange) => Promise<void>>(),
  clear: jest.fn<() => Promise<void>>(),
  getAllKeys: jest.fn<(query?: IDBValidKey | IDBKeyRange | null, count?: number) => Promise<IDBValidKey[]>>().mockResolvedValue([]),
  createIndex: jest.fn<(name: string, keyPath: string | string[], options?: IDBIndexParameters) => IDBPIndex<BarInventoryDBSchemaType, any, any, any, any>>(),
  openCursor: jest.fn<(query?: IDBValidKey | IDBKeyRange | null, direction?: IDBCursorDirection) => Promise<IDBPCursorWithValue<BarInventoryDBSchemaType, any, any, any, any> | null>>(),
  openKeyCursor: jest.fn<(query?: IDBValidKey | IDBKeyRange | null, direction?: IDBCursorDirection) => Promise<IDBPCursor<BarInventoryDBSchemaType, any, any, any, any> | null>>(),
  count: jest.fn<(key?: IDBValidKey | IDBKeyRange | null) => Promise<number>>(),
  getMany: jest.fn<(keys: IDBValidKey[]) => Promise<any[]>>(),
  getKey: jest.fn<(key: IDBValidKey | IDBKeyRange) => Promise<IDBValidKey | undefined>>(),
});

export type MockStoreActions = ReturnType<typeof createMockStoreActions>;

export let mockProductStoreActionsInstance = createMockStoreActions();
export let mockLocationStoreActionsInstance = createMockStoreActions();
export let mockInventoryStateStoreActionsInstance = createMockStoreActions();

export const resetMockStoreActionInstances = () => {
    mockProductStoreActionsInstance = createMockStoreActions();
    mockLocationStoreActionsInstance = createMockStoreActions();
    mockInventoryStateStoreActionsInstance = createMockStoreActions();
};

export type MockTransactionInstance<Mode extends IDBTransactionMode = IDBTransactionMode> = {
  objectStore: jest.Mock<IDBPObjectStore<BarInventoryDBSchemaType, any, any, Mode>>;
  done: Promise<void> | jest.Mock<Promise<void>>;
  abort: jest.Mock<() => Promise<void>>;
  storeNames: StoreNames<BarInventoryDBSchemaType>[];
  mode: Mode;
  commit: jest.Mock<() => Promise<void>>;
};

export let currentMockTransactionInstance: MockTransactionInstance<any> | undefined;

export const createMockTransaction = <CurrentMode extends IDBTransactionMode>(
    storeNames: StoreNames<BarInventoryDBSchemaType>[],
    mode: CurrentMode,
    dbInstance: IDBPDatabase<BarInventoryDBSchemaType>
): MockTransactionInstance<CurrentMode> => {
  const newTxInstance: MockTransactionInstance<CurrentMode> = {
    objectStore: jest.fn(<Name extends StoreNames<BarInventoryDBSchemaType>>(name: Name): IDBPObjectStore<BarInventoryDBSchemaType, StoreNames<BarInventoryDBSchemaType>[], Name, CurrentMode> => {
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

type MockObjectStoreNames = {
    contains: jest.Mock<(name: string) => boolean>;
    mockContainsProductStore: boolean;
    mockContainsLocationStore: boolean;
    mockContainsInventoryStateStore: boolean;
    readonly length: number;
    item: jest.Mock<(index: number) => StoreNames<BarInventoryDBSchemaType> | null>;
    _stores: Set<string>;
    [Symbol.iterator]: jest.Mock<() => IterableIterator<StoreNames<BarInventoryDBSchemaType>>>;
};

export type MockDatabaseInstance = Omit<IDBPDatabase<BarInventoryDBSchemaType>, 'objectStoreNames' | 'transaction' | 'createObjectStore' | 'deleteObjectStore' | 'close' | 'get' | 'getAll' | 'put' | 'add' | 'delete' | 'clear' | 'version'> & {
    version: number;
    objectStoreNames: MockObjectStoreNames;
    transaction: jest.Mock<
        (storeNames: StoreNames<BarInventoryDBSchemaType> | StoreNames<BarInventoryDBSchemaType>[], mode?: IDBTransactionMode) =>
        MockTransactionInstance<IDBTransactionMode extends undefined ? 'readonly' : Exclude<IDBTransactionMode, undefined>>
    >;
    createObjectStore: jest.Mock<(name: StoreNames<BarInventoryDBSchemaType>, options?: IDBObjectStoreParameters) => IDBPObjectStore<BarInventoryDBSchemaType, any, any, any>>;
    deleteObjectStore: jest.Mock<(name: StoreNames<BarInventoryDBSchemaType>) => void>;
    close: jest.Mock<() => void>;
    get: jest.fn<(storeName: StoreNames<BarInventoryDBSchemaType>, key: IDBValidKey | IDBKeyRange) => Promise<any | undefined>>,
    getAll: jest.fn<(storeName: StoreNames<BarInventoryDBSchemaType>, query?: IDBValidKey | IDBKeyRange | null, count?: number) => Promise<any[]>>,
    put: jest.fn<(storeName: StoreNames<BarInventoryDBSchemaType>, value: any, key?: IDBValidKey) => Promise<IDBValidKey>>,
    add: jest.fn<(storeName: StoreNames<BarInventoryDBSchemaType>, value: any, key?: IDBValidKey) => Promise<IDBValidKey>>,
    delete: jest.fn<(storeName: StoreNames<BarInventoryDBSchemaType>, key: IDBValidKey | IDBKeyRange) => Promise<void>>,
    clear: jest.fn<(storeName: StoreNames<BarInventoryDBSchemaType>) => Promise<void>>,
};

export let mockDbInstance: MockDatabaseInstance | undefined;

export const mockDBCallbacks: OpenDBCallbacks<BarInventoryDBSchemaType> = {};

export const createMockDatabase = (initialVersion: number = 0): MockDatabaseInstance => {
  resetMockStoreActionInstances();

  const objectStoreNamesStateInternal: any = {
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
  const objectStoreNamesState = objectStoreNamesStateInternal as MockObjectStoreNames;

  const newDbInstance = {
    name: DATABASE_NAME,
    version: initialVersion,
    objectStoreNames: objectStoreNamesState,
    transaction: jest.fn().mockImplementation((storeNames, mode) => {
        return createMockTransaction(storeNames, mode, newDbInstance as unknown as IDBPDatabase<BarInventoryDBSchemaType>);
    }),
    get: jest.fn<(storeName: StoreNames<BarInventoryDBSchemaType>, key: IDBValidKey | IDBKeyRange) => Promise<any | undefined>>(),
    getAll: jest.fn<(storeName: StoreNames<BarInventoryDBSchemaType>, query?: IDBValidKey | IDBKeyRange | null, count?: number) => Promise<any[]>>(),
    put: jest.fn<(storeName: StoreNames<BarInventoryDBSchemaType>, value: any, key?: IDBValidKey) => Promise<IDBValidKey>>(),
    add: jest.fn<(storeName: StoreNames<BarInventoryDBSchemaType>, value: any, key?: IDBValidKey) => Promise<IDBValidKey>>(),
    delete: jest.fn<(storeName: StoreNames<BarInventoryDBSchemaType>, key: IDBValidKey | IDBKeyRange) => Promise<void>>(),
    clear: jest.fn<(storeName: StoreNames<BarInventoryDBSchemaType>) => Promise<void>>(),
    close: jest.fn<() => void>(),
    createObjectStore: jest.fn<(name: StoreNames<BarInventoryDBSchemaType>, options?: IDBObjectStoreParameters) => IDBPObjectStore<BarInventoryDBSchemaType, any, any, any>>().mockImplementation((storeName, options) => {
      objectStoreNamesState._stores.add(storeName as string);
      let newMockStoreActions;
      if (storeName === 'products') {
        mockProductStoreActionsInstance = createMockStoreActions();
        newMockStoreActions = mockProductStoreActionsInstance;
      } else if (storeName === 'locations') {
        mockLocationStoreActionsInstance = createMockStoreActions();
        newMockStoreActions = mockLocationStoreActionsInstance;
      } else if (storeName === 'inventoryState') {
        mockInventoryStateStoreActionsInstance = createMockStoreActions();
        newMockStoreActions = mockInventoryStateStoreActionsInstance;
      } else {
        newMockStoreActions = createMockStoreActions();
      }
      return newMockStoreActions as unknown as IDBPObjectStore<BarInventoryDBSchemaType, any, any, any>;
    }),
    deleteObjectStore: jest.fn().mockImplementation((storeName: string) => {
        objectStoreNamesState._stores.delete(storeName);
    }),
  };
  mockDbInstance = newDbInstance as unknown as MockDatabaseInstance;
  return mockDbInstance;
};

export const mockOpenDB = jest.fn().mockImplementation(
  async (
    name: string,
    version?: number,
    callbacks?: OpenDBCallbacks<BarInventoryDBSchemaType>
  ) => {
    const db: MockDatabaseInstance = (mockDbInstance || createMockDatabase()) as MockDatabaseInstance;

    if (callbacks?.upgrade) mockDBCallbacks.upgrade = callbacks.upgrade;
    if (callbacks?.blocked) mockDBCallbacks.blocked = callbacks.blocked;
    if (callbacks?.blocking) mockDBCallbacks.blocking = callbacks.blocking;
    if (callbacks?.terminated) mockDBCallbacks.terminated = callbacks.terminated;

    const effectiveVersion = version || DATABASE_VERSION;
    if (mockDBCallbacks.upgrade &&
        (effectiveVersion > db.version ||
         !db.objectStoreNames.contains('products') ||
         !db.objectStoreNames.contains('locations') ||
         !db.objectStoreNames.contains('inventoryState'))) {

      const upgradeTx = createMockTransaction(
        [...db.objectStoreNames],
        'versionchange' as any,
        db
      );

      await Promise.resolve(mockDBCallbacks.upgrade(
          db,
          db.version,
          effectiveVersion,
          upgradeTx as unknown as IDBPTransaction<BarInventoryDBSchemaType, StoreNames<BarInventoryDBSchemaType>[], "versionchange">,
          { oldVersion: db.version, newVersion: effectiveVersion, type: 'versionchange' } as unknown as IDBVersionChangeEvent
      ));
      db.version = effectiveVersion;
    }
    return Promise.resolve(db);
  }
);

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

export const mockProductInstance: Product = { id: 'prod1', name: 'Test Product', category: 'Test Category', itemsPerCrate: 10, pricePer100ml: 1, pricePerBottle: 10, volume: 750, lastUpdated: new Date() };
export const mockLocationInstance: Location = { id: 'loc1', name: 'Test Location', counters: [] };
export const mockInventoryStateInstance: InventoryState = {
    locations: [],
    products: [],
    unsyncedChanges: false
};
export const mockStoredInventoryStateInstance: StoredInventoryStateType = { ...mockInventoryStateInstance, key: 'currentState' };

export const resetAllMocks = () => {
    mockOpenDB.mockClear();
    mockDbInstance = undefined;
    currentMockTransactionInstance = undefined;
    resetMockStoreActionInstances();

    delete mockDBCallbacks.upgrade;
    delete mockDBCallbacks.blocked;
    delete mockDBCallbacks.blocking;
    delete mockDBCallbacks.terminated;

    mockIDBFactory.open.mockClear();
    mockIDBFactory.deleteDatabase.mockClear();
    mockIDBFactory.cmp.mockClear();
};

export const getCurrentTransactionDonePromise = () => {
    if (!currentMockTransactionInstance || !currentMockTransactionInstance.done) {
        return Promise.reject(new Error("No transaction instance or 'done' promise found."));
    }
    if (jest.isMockFunction(currentMockTransactionInstance.done)) {
        return currentMockTransactionInstance.done();
    }
    return currentMockTransactionInstance.done;
};
