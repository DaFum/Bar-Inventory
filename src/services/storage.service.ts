import { dbService } from './indexeddb.service';
import { Product, Location } from '../models';
import { AppState } from '../state/app-state';

class StorageService {
  async loadState(appState: AppState): Promise<void> {
    try {
      const data = await dbService.loadAllApplicationData();
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data structure received from database');
      }
      appState.products = data.products || [];
      appState.locations = data.locations || [];
    } catch (error) {
      console.error('Failed to load application state:', error);
      throw error;
    }
  }

  async saveState(appState: AppState): Promise<void> {
    try {
      await dbService.saveAllApplicationData({
        products: appState.products || [],
        locations: appState.locations || [],
      });
    } catch (error) {
      console.error('Failed to save application state:', error);
      throw error;
    }
  }

  async saveProduct(product: Product): Promise<void> {
    await dbService.saveProduct(product);
  }

  async deleteProduct(productId: string): Promise<void> {
    await dbService.delete('products', productId);
  }

  async saveLocation(location: Location): Promise<void> {
    await dbService.saveLocation(location);
  }

  async deleteLocation(locationId: string): Promise<void> {
    await dbService.delete('locations', locationId);
  }
}

export const storageService = new StorageService();
