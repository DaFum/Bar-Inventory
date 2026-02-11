import { Product } from '../models';
import { storageService } from '../services/storage.service';
import { AppState } from './app-state';

type ProductSubscriber = (products: Product[]) => void;

/**
 * Manages the state of products, including loading, adding, updating, and deleting.
 * Notifies subscribers of any changes to the product list.
 */
class ProductStore {
  private subscribers: ProductSubscriber[] = [];
  private appState: AppState;

  constructor() {
    this.appState = AppState.getInstance();
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => {
      try {
        callback([...this.appState.products]);
      } catch (error) {
        console.error('ProductStore: Error in subscriber during notify:', error);
      }
    });
  }

  /**
   * Subscribes a callback function to product state changes.
   * @param callback - The function to call when products change.
   * @returns A function to unsubscribe.
   */
  subscribe(callback: ProductSubscriber): () => void {
    this.subscribers.push(callback);
    return () => {
      this.unsubscribe(callback);
    };
  }

  /**
   * Unsubscribes a callback function from product state changes.
   * @param callback - The callback function to remove.
   */
  unsubscribe(callback: ProductSubscriber): void {
    this.subscribers = this.subscribers.filter((sub) => sub !== callback);
  }

  /**
   * Gets a copy of the current products.
   * @returns An array of products.
   */
  getProducts(): Product[] {
    return [...this.appState.products];
  }

  /**
   * Loads all products from the database and notifies subscribers.
   */
  async loadProducts(): Promise<void> {
    try {
      // The new storage service handles loading into the app state
      await storageService.loadState(this.appState);
      this.notifySubscribers();
    } catch (error) {
      console.error('ProductStore: Error loading products from DB', error);
      throw error;
    }
  }

  /**
   * Adds a new product to the database and store, then notifies subscribers.
   * Assumes the product object (including ID) is fully formed by the caller.
   * @param product - The product to add.
   * @returns The added product.
   */
  async addProduct(product: Product): Promise<Product> {
    try {
      await storageService.saveProduct(product);
      this.appState.products.push(product);
      this.notifySubscribers();
      return product;
    } catch (error) {
      console.error('ProductStore: Error adding product', error);
      throw error;
    }
  }

  /**
   * Updates an existing product in the database and store, then notifies subscribers.
   * @param product - The product to update.
   * @returns The updated product.
   */
  async updateProduct(product: Product): Promise<Product> {
    try {
      await storageService.saveProduct(product);
      const index = this.appState.products.findIndex((p) => p.id === product.id);
      if (index !== -1) {
        this.appState.products[index] = product;
      } else {
        this.appState.products.push(product);
      }
      this.notifySubscribers();
      return product;
    } catch (error) {
      console.error('ProductStore: Error updating product', error);
      throw error;
    }
  }

  /**
   * Deletes a product from the database and store, then notifies subscribers.
   * @param productId - The ID of the product to delete.
   */
  async deleteProduct(productId: string): Promise<void> {
    try {
      await storageService.deleteProduct(productId);
      this.appState.products = this.appState.products.filter((p) => p.id !== productId);
      this.notifySubscribers();
    } catch (error) {
      console.error('ProductStore: Error deleting product', error);
      throw error;
    }
  }
}

export const productStore = new ProductStore();
console.log('ProductStore initialized.');
