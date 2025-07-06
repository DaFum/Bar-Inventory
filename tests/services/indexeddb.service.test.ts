// Note: dbService import will be done dynamically after mocks are set up.
// import { dbService } from '../../src/services/indexeddb.service';
import { Product, Location, InventoryState } from '../../src/models';
import { openDB, IDBPDatabase, IDBPTransaction, IDBPObjectStore } from 'idb';
// BarInventoryDBSchema and StoredInventoryState will also be imported dynamically or type-only.
import type { BarInventoryDBSchema as BarInventoryDBSchemaType, StoredInventoryState as StoredInventoryStateType } from '../../src/services/indexeddb.service';

// Mock 'idb' library
jest.mock('idb', () => {
  const actualIdb = jest.requireActual('idb');
  return {
    ...actualIdb,
    openDB: jest.fn(),
  };
});

// Mock toast notifications
jest.mock('../../src/ui/components/toast-notifications', () => ({
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
let dbService: any;


describe('IndexedDBService', () => {
  let mockDb: jest.Mocked<IDBPDatabase<BarInventoryDBSchemaType>>;
  let mockTransaction: jest.Mocked<IDBPTransaction<BarInventoryDBSchemaType, ['products', 'locations', 'inventoryState'], 'readwrite' | 'readonly'>>;
  let mockProductStore: jest.Mocked<IDBPObjectStore<BarInventoryDBSchemaType, ['products', 'locations', 'inventoryState'], 'products', 'readwrite' | 'readonly'>>;
  let mockLocationStore: jest.Mocked<IDBPObjectStore<BarInventoryDBSchemaType, ['products', 'locations', 'inventoryState'], 'locations', 'readwrite' | 'readonly'>>;
  let mockInventoryStateStore: jest.Mocked<IDBPObjectStore<BarInventoryDBSchemaType, ['products', 'locations', 'inventoryState'], 'inventoryState', 'readwrite' | 'readonly'>>;

  beforeEach(async () => {
    jest.clearAllMocks();

    Object.defineProperty(window, 'indexedDB', {
        value: mockIDBFactory,
        writable: true,
        configurable: true,
    });

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
        name: DATABASE_NAME,
        version: DATABASE_VERSION,
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

    const idbModule = await import('idb');
    (idbModule.openDB as jest.Mock).mockImplementation(async () => {
        return mockDb;
    });

    await jest.isolateModulesAsync(async () => {
        const { IndexedDBService: ServiceClass } = await import('../../src/services/indexeddb.service');
        dbService = new ServiceClass();
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
});

const DATABASE_NAME = 'BarInventoryDB';
const DATABASE_VERSION = 1;
