import { DBSchema, openDB, IDBPDatabase } from 'idb';
import { Product, Location, InventoryState } from '../models'; // Removed Counter, Area, InventoryEntry
import { showToast } from '../ui/components/toast-notifications';

const DATABASE_NAME = 'BarInventoryDB';
const DATABASE_VERSION = 1;

// Erweiterte Version von InventoryState für IndexedDB-Speicherung
// Export for use in test files
export interface StoredInventoryState extends InventoryState {
  key: string;
}

// Define the database schema using the DBSchema interface from 'idb'
// Export for use in test files
export interface BarInventoryDBSchema extends DBSchema {
  products: {
    key: string; // Product.id
    value: Product;
    indexes: { category: string }; // Example index
  };
  locations: {
    key: string; // Location.id
    value: Location;
  };
  inventoryState: {
    key: string; // e.g., 'currentState'
    value: StoredInventoryState; // Use the globally defined StoredInventoryState
  };
  // It might be more granular to store counters and areas if they are frequently accessed/modified independently
  // However, devplan.md implies locations, tresen (counters), and bereiche (areas) are often managed together.
  // For now, keeping them nested within Locations as per current models.
  // If performance or complexity demands, these could be broken out into their own stores.
}

export class IndexedDBService {
  private dbPromise: Promise<IDBPDatabase<BarInventoryDBSchema>>;

  constructor() {
    if (!('indexedDB' in window)) {
      showToast(
        'IndexedDB wird nicht unterstützt. Daten können nicht gespeichert werden.',
        'error'
      );
      throw new Error('IndexedDB not supported');
    }
    this.dbPromise = openDB<BarInventoryDBSchema>(DATABASE_NAME, DATABASE_VERSION, {
      /**
       * Handles database schema upgrades.
       * IMPORTANT: All schema changes and data migrations must be handled here
       * in a forward-compatible manner. Add new `if (oldVersion < X)` blocks
       * for each new version. Document migration steps carefully.
       * (AGENTS.md: "IndexedDB upgrades must be forward-compatible; document migration plans for future schema changes.")
       */
      upgrade(db, oldVersion, newVersion) {
        // Removed _transaction
        console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);

        // Object store for Products
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', {
            keyPath: 'id',
          });
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
        // AGENTS.md: "Error Handling: Making sure errors are caught and handled gracefully."
        // AGENTS.md: "Use user-facing notifications (`showToast`) for all user-triggered failures."
        // Although this is not a user-triggered failure, it severely impacts user experience.
        showToast('Datenbankzugriff blockiert. Bitte andere Tabs schließen.', 'error');
      },
      blocking() {
        console.warn('IndexedDB blocking. Database upgrade needed but other tabs are open.');
        showToast(
          'Datenbank-Update blockiert. Bitte andere Tabs der App schließen und neu laden.',
          'warning'
        );
        // Potentially db.close(); here if it helps, but IDB Promised handles this.
      },
      terminated() {
        console.error('IndexedDB connection terminated unexpectedly.');
        showToast('Datenbankverbindung unerwartet beendet. Bitte App neu laden.', 'error');
      },
    });
  }

  // Generic CRUD operations
  async getAll<StoreName extends keyof BarInventoryDBSchema>(
    storeName: StoreName
  ): Promise<BarInventoryDBSchema[StoreName]['value'][]> {
    const db = await this.dbPromise;
    return db.getAll(storeName);
  }

  async get<StoreName extends keyof BarInventoryDBSchema>(
    storeName: StoreName,
    key: BarInventoryDBSchema[StoreName]['key']
  ): Promise<BarInventoryDBSchema[StoreName]['value'] | undefined> {
    const db = await this.dbPromise;
    return db.get(storeName, key);
  }

  async put<StoreName extends keyof BarInventoryDBSchema>(
    storeName: StoreName,
    value: BarInventoryDBSchema[StoreName]['value']
  ): Promise<BarInventoryDBSchema[StoreName]['key']> {
    const db = await this.dbPromise;
    return db.put(storeName, value);
  }

  async add<StoreName extends keyof BarInventoryDBSchema>(
    storeName: StoreName,
    value: BarInventoryDBSchema[StoreName]['value']
  ): Promise<BarInventoryDBSchema[StoreName]['key']> {
    const db = await this.dbPromise;
    return db.add(storeName, value);
  }

  async delete<StoreName extends keyof BarInventoryDBSchema>(
    storeName: StoreName,
    key: BarInventoryDBSchema[StoreName]['key']
  ): Promise<void> {
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
    // Uses the global StoredInventoryState
    const stateToSave: StoredInventoryState = { ...state, key: 'currentState' };
    return this.put('inventoryState', stateToSave);
  }

  // Example of a more comprehensive "saveItems" that saves all current application data
  // This is a conceptual example; actual implementation will depend on how data is managed in the app's state.
  /**
   * Saves all provided application data (products, locations, state) to the database.
   * This method updates existing data, adds new data, and removes obsolete data
   * to ensure data integrity and avoid loss during operations.
   * @param data - An object containing arrays of products and locations, and an optional inventory state.
   */
  async saveAllApplicationData(data: {
    products: Product[];
    locations: Location[];
    state?: InventoryState;
  }): Promise<void> {
    const db = await this.dbPromise;
    // Start a readwrite transaction. Note: get operations are also allowed in readwrite.
    const tx = db.transaction(['products', 'locations', 'inventoryState'], 'readwrite');

    try {
      const productStore = tx.objectStore('products');
      const locationStore = tx.objectStore('locations');
      const stateStore = tx.objectStore('inventoryState');

      // === Products ===
      const existingProductKeys = await productStore.getAllKeys();
      const incomingProductKeys = new Set(data.products.map((p) => p.id));

      // Add or update products
      for (const product of data.products) {
        await productStore.put(product);
      }
      // Delete obsolete products
      for (const oldKey of existingProductKeys) {
        if (!incomingProductKeys.has(oldKey as string)) {
          // type assertion for key
          await productStore.delete(oldKey);
        }
      }

      // === Locations ===
      const existingLocationKeys = await locationStore.getAllKeys();
      const incomingLocationKeys = new Set(data.locations.map((l) => l.id));

      // Add or update locations
      for (const location of data.locations) {
        await locationStore.put(location);
      }
      // Delete obsolete locations
      for (const oldKey of existingLocationKeys) {
        if (!incomingLocationKeys.has(oldKey as string)) {
          // type assertion for key
          await locationStore.delete(oldKey);
        }
      }

      // === Inventory State ===
      if (data.state) {
        // Uses the global StoredInventoryState
        const stateToSave: StoredInventoryState = {
          ...data.state,
          key: 'currentState',
        };
        await stateStore.put(stateToSave);
      } else {
        // When no state is provided, we preserve the existing state.
        // This follows the principle that absence of data means "no change".
        console.log(
          'No state data provided in saveAllApplicationData, preserving existing inventory state.'
        );
      }

      await tx.done;
      console.log('All application data processed and saved to IndexedDB.');
    } catch (error) {
      console.error('Error during saveAllApplicationData, transaction aborted:', error);
      showToast(
        'Fehler beim Speichern der Anwendungsdaten. Änderungen wurden nicht gespeichert.',
        'error'
      );
      // The transaction will automatically abort on error, so data remains consistent (previous state).
      // No need to manually rollback, but rethrowing allows caller to know.
      throw error;
    }
  }

  // Example of loading all necessary data for the app
  async loadAllApplicationData(): Promise<{
    products: Product[];
    locations: Location[];
    state: StoredInventoryState | undefined; // Corrected return type for state
  }> {
    const products = await this.getAll('products');
    const locations = await this.getAll('locations');
    const state = await this.get('inventoryState', 'currentState'); // This returns StoredInventoryState | undefined
    return { products, locations, state };
  }
}

// Export a singleton instance of the service
export const dbService = new IndexedDBService();

// The testDB() function and its call have been removed.
// AGENTS.md: "Move demo/test routines to a dedicated test script or dev-only module."
