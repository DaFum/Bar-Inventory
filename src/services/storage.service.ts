import { dbService, BarInventoryDBSchema } from './indexeddb.service';
import { Product, Location } from '../models';
import { AppState } from '../state/app-state';

class StorageService {
  async loadState(appState: AppState): Promise<void> {
    const { products, locations } = await dbService.loadAllApplicationData();
    appState.products = products;
    appState.locations = locations;
  }

  async saveState(appState: AppState): Promise<void> {
    await dbService.saveAllApplicationData({
      products: appState.products,
      locations: appState.locations,
    });
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
