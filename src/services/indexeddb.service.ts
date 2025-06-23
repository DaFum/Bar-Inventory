import { DBSchema, openDB, IDBPDatabase } from 'idb';
import { Product, Location, InventoryState, Counter, Area, InventoryEntry } from '../models';

const DATABASE_NAME = 'BarInventoryDB';
const DATABASE_VERSION = 1;

// Define the database schema using the DBSchema interface from 'idb'
interface BarInventoryDBSchema extends DBSchema {
  products: {
    key: string; // Product.id
    value: Product;
    indexes: { 'category': string }; // Example index
  };
  locations: {
    key: string; // Location.id
    value: Location;
  };
  // A single store for the overall inventory state, perhaps keyed by a constant
  inventoryState: {
    key: string; // e.g., 'currentState'
    value: InventoryState;
  };
  // It might be more granular to store counters and areas if they are frequently accessed/modified independently
  // However, devplan.md implies locations, tresen (counters), and bereiche (areas) are often managed together.
  // For now, keeping them nested within Locations as per current models.
  // If performance or complexity demands, these could be broken out into their own stores.
}

class IndexedDBService {
  private dbPromise: Promise<IDBPDatabase<BarInventoryDBSchema>>;

  constructor() {
    this.dbPromise = openDB<BarInventoryDBSchema>(DATABASE_NAME, DATABASE_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);

        // Object store for Products
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('category', 'category');
          // Add initial products if necessary (example)
          // Seed data can be added here or via a separate setup function
        }

        // Object store for Locations (which will contain counters and areas)
        if (!db.objectStoreNames.contains('locations')) {
          db.createObjectStore('locations', { keyPath: 'id' });
          // Add initial locations if necessary
        }

        // Object store for general inventory state (e.g., settings, last sync time)
        if (!db.objectStoreNames.contains('inventoryState')) {
          db.createObjectStore('inventoryState', { keyPath: 'key' });
          // Example: transaction.objectStore('inventoryState').add({ key: 'currentState', unsyncedChanges: false });
        }

        // Handle other version upgrades incrementally
        // if (oldVersion < 2) { /* upgrade to version 2 */ }
      },
      blocked() {
        console.error('IndexedDB blocked. Please close other tabs trying to access this database.');
        // Potentially show a message to the user
      },
      blocking() {
        console.warn('IndexedDB blocking. Database upgrade needed but other tabs are open.');
        // db.close(); // Close this connection to allow others to upgrade
      },
      terminated() {
        console.error('IndexedDB connection terminated unexpectedly.');
      }
    });
  }

  // Generic CRUD operations
  async getAll<T extends keyof BarInventoryDBSchema>(storeName: T): Promise<BarInventoryDBSchema[T]['value'][]> {
    const db = await this.dbPromise;
    return db.getAll(storeName);
  }

  async get<T extends keyof BarInventoryDBSchema>(storeName: T, key: BarInventoryDBSchema[T]['key']): Promise<BarInventoryDBSchema[T]['value'] | undefined> {
    const db = await this.dbPromise;
    return db.get(storeName, key);
  }

  async put<T extends keyof BarInventoryDBSchema>(storeName: T, value: BarInventoryDBSchema[T]['value']): Promise<BarInventoryDBSchema[T]['key']> {
    const db = await this.dbPromise;
    return db.put(storeName, value);
  }

  async add<T extends keyof BarInventoryDBSchema>(storeName: T, value: BarInventoryDBSchema[T]['value']): Promise<BarInventoryDBSchema[T]['key']> {
    const db = await this.dbPromise;
    return db.add(storeName, value);
  }

  async delete<T extends keyof BarInventoryDBSchema>(storeName: T, key: BarInventoryDBSchema[T]['key']): Promise<void> {
    const db = await this.dbPromise;
    return db.delete(storeName, key);
  }

  async clearStore(storeName: keyof BarInventoryDBSchema): Promise<void> {
    const db = await this.dbPromise;
    return db.clear(storeName);
  }

  // Specific methods for `loadItems` and `saveItems` (as per dev/improve.md)
  // These might relate to loading/saving the entire inventory state or specific parts.

  /**
   * Loads all products from the database.
   * Corresponds to a part of what `loadItems` might do.
   */
  async loadProducts(): Promise<Product[]> {
    return this.getAll('products');
  }

  /**
   * Saves a single product to the database.
   * Can be used by a more comprehensive `saveItems` function.
   */
  async saveProduct(product: Product): Promise<string> {
    return this.put('products', product);
  }

  /**
   * Loads all locations (including their counters and areas with inventory items).
   */
  async loadLocations(): Promise<Location[]> {
    return this.getAll('locations');
  }

  /**
   * Saves a single location.
   */
  async saveLocation(location: Location): Promise<string> {
    return this.put('locations', location);
  }

  /**
   * Gets the overall inventory state.
   */
  async getInventoryState(): Promise<InventoryState | undefined> {
    // Assuming a single document for state, keyed 'currentState'
    return this.get('inventoryState', 'currentState');
  }

  /**
   * Saves the overall inventory state.
   */
  async saveInventoryState(state: InventoryState): Promise<string> {
    // Ensure the key is set for the state object if it's a fixed key store
interface StoredInventoryState extends InventoryState {
    key: string;
}

async saveInventoryState(state: InventoryState): Promise<string> {
    const stateToSave: StoredInventoryState = { ...state, key: 'currentState' };
    return this.put('inventoryState', stateToSave);
}
  }


  // Example of a more comprehensive "saveItems" that saves all current application data
  // This is a conceptual example; actual implementation will depend on how data is managed in the app's state.
  async saveAllApplicationData(data: { products: Product[], locations: Location[], state?: InventoryState }): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(['products', 'locations', 'inventoryState'], 'readwrite');

    const productStore = tx.objectStore('products');
    await productStore.clear(); // Clear existing products before adding new ones
    for (const product of data.products) {
      await productStore.put(product);
    }

    const locationStore = tx.objectStore('locations');
    await locationStore.clear();
    for (const location of data.locations) {
      await locationStore.put(location);
    }

    if (data.state) {
        const stateStore = tx.objectStore('inventoryState');
        // Assuming 'currentState' is the key for the single state object
        await stateStore.put({ ...data.state, key: 'currentState' } as any);
    }

    await tx.done;
    console.log("All application data saved to IndexedDB.");
  }

  // Example of loading all necessary data for the app
  async loadAllApplicationData(): Promise<{ products: Product[], locations: Location[], state?: InventoryState }> {
    const products = await this.getAll('products');
    const locations = await this.getAll('locations');
    const state = await this.get('inventoryState', 'currentState');
    return { products, locations, state };
  }
}

// Export a singleton instance of the service
export const dbService = new IndexedDBService();
console.log("IndexedDB Service initialized.");

// Example usage (can be removed or moved to a test/init file):
async function testDB() {
    try {
        console.log("Testing IndexedDB Service...");

        const initialProducts = await dbService.loadProducts();
        console.log("Initial products:", initialProducts);

        if (initialProducts.length === 0) {
            console.log("Seeding initial data...");
            const product1: Product = { id: 'prod001', name: 'Cola', category: 'Softdrink', volume: 330, pricePerBottle: 1.5 };
            const product2: Product = { id: 'prod002', name: 'Premium Vodka', category: 'Spirituose', volume: 700, pricePerBottle: 25 };
            await dbService.saveProduct(product1);
            await dbService.saveProduct(product2);

            const loc1_area1_item1: InventoryEntry = { productId: 'prod001', startBottles: 10, endBottles: 5 };
            const loc1_area1_item2: InventoryEntry = { productId: 'prod002', startBottles: 2, startOpenVolumeMl: 300, endBottles: 1, endOpenVolumeMl: 600 };
            const loc1_area1: Area = { id: 'area001', name: 'Kühlschrank Theke', inventoryItems: [loc1_area1_item1, loc1_area1_item2] };
            const loc1_counter1: Counter = { id: 'counter001', name: 'Haupttheke', areas: [loc1_area1] };
            const loc1: Location = { id: 'loc001', name: 'Meine Bar', counters: [loc1_counter1] };
            await dbService.saveLocation(loc1);

            const initialState: InventoryState = { currentLocationId: 'loc001', locations: [loc1], products: [product1, product2], unsyncedChanges: false };
            await dbService.saveInventoryState(initialState);
            console.log("Initial data seeded.");
        }

        const allData = await dbService.loadAllApplicationData();
        console.log("All loaded data:", allData);

        if (allData.products.length > 0) {
            const firstProduct = await dbService.get('products', allData.products[0].id);
            console.log("First product by ID:", firstProduct);
        }

    } catch (error) {
        console.error("Error during DB test:", error);
    }
}

// Run the test function for demonstration if not in a production environment
// Consider a more robust way to handle seeding/testing in a real app
// if (process.env.NODE_ENV !== 'production') { // This check won't work directly in browser TS
    testDB();
// }
