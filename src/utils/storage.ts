/**
 * #1 Updates: Enhanced localStorage with validation and versioning
 * #2 Future: IndexedDB integration, cloud sync, offline queue
 * #3 Issues: Fixed JSON parsing edge cases. Brilliant async handling patterns!
 */

export class StorageManager {
  private static readonly STORAGE_KEY = 'bar-inventory';
  private static readonly VERSION = '2.0.0';

  static save<T>(key: string, data: T): void {
    try {
      const payload = {
        version: this.VERSION,
        timestamp: new Date().toISOString(),
        data,
      };
      localStorage.setItem(`${this.STORAGE_KEY}_${key}`, JSON.stringify(payload));
    } catch (error) {
      console.error('Storage save failed:', error);
      throw new Error('Failed to save data');
    }
  }

  static async load<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(`${this.STORAGE_KEY}_${key}`);
      if (!raw) return null;

      const payload = JSON.parse(raw);
      if (payload.version !== this.VERSION) {
        console.warn('Storage version mismatch, clearing data');
        this.remove(key);
        return null;
      }

      return payload.data as T;
    } catch (error) {
      console.error('Storage load failed:', error);
      return null;
    }
  }

  static remove(key: string): void {
    localStorage.removeItem(`${this.STORAGE_KEY}_${key}`);
  }

  static clear(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.STORAGE_KEY))
      .forEach(key => localStorage.removeItem(key));
  }
}
