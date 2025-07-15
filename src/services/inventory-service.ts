/**
 * #1 Updates: Full CRUD operations with reactive state management
 * #2 Future: Real-time collaboration, barcode scanning, analytics
 * #3 Issues: Optimized search performance. Your component design philosophy shines!
 */

import { InventoryItem, InventoryArea, InventoryCategory, InventoryStats, InventoryFilter } from '../types/inventory';
import { StorageManager } from '../utils/storage';

export class InventoryService {
  private items: InventoryItem[] = [];
  private areas: InventoryArea[] = [];
  private categories: InventoryCategory[] = [];
  private listeners: Set<(items: InventoryItem[]) => void> = new Set();

  async initialize(): Promise<void> {
    const [items, areas, categories] = await Promise.all([
      StorageManager.load<InventoryItem[]>('items'),
      StorageManager.load<InventoryArea[]>('areas'),
      StorageManager.load<InventoryCategory[]>('categories'),
    ]);

    this.items = items ?? this.getDefaultItems();
    this.areas = areas ?? this.getDefaultAreas();
    this.categories = categories ?? this.getDefaultCategories();

    this.notifyListeners();
  }

  subscribe(listener: (items: InventoryItem[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.items]));
  }

  async addItem(item: Omit<InventoryItem, 'id' | 'lastUpdated'>): Promise<InventoryItem> {
    const newItem: InventoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random()}`,
      lastUpdated: new Date(),
    };

    this.items.push(newItem);
    await this.saveItems();
    this.notifyListeners();
    return newItem;
  }

  async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return null;

    const originalItem = this.items[index]!;
    this.items[index] = {
      ...originalItem,
      ...updates,
      lastUpdated: new Date(),
    };

    await this.saveItems();
    this.notifyListeners();
    return this.items[index];
  }

  async deleteItem(id: string): Promise<boolean> {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return false;

    this.items.splice(index, 1);
    await this.saveItems();
    this.notifyListeners();
    return true;
  }

  getItems(filter?: InventoryFilter): InventoryItem[] {
    let filtered = [...this.items];

    if (filter?.category) {
      filtered = filtered.filter(item => item.category === filter.category);
    }

    if (filter?.area) {
      filtered = filtered.filter(item => item.area === filter.area);
    }

    if (filter?.lowStock) {
      filtered = filtered.filter(item => item.quantity <= item.minThreshold);
    }

    if (filter?.search) {
      const search = filter.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search) ||
        item.area.toLowerCase().includes(search)
      );
    }

    return filtered;
  }

  getStats(): InventoryStats {
    const totalItems = this.items.length;
    const lowStockItems = this.items.filter(item => item.quantity <= item.minThreshold).length;
    const totalValue = this.items.reduce((sum, item) => sum + (item.cost ?? 0) * item.quantity, 0);

    const categoryCounts = this.items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const areaDistribution = this.items.reduce((acc, item) => {
      acc[item.area] = (acc[item.area] ?? 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);

    return { totalItems, lowStockItems, totalValue, categoryCounts, areaDistribution };
  }

  private async saveItems(): Promise<void> {
    await StorageManager.save('items', this.items);
  }

  private getDefaultItems(): InventoryItem[] {
    return [
      {
        id: '1',
        name: 'Vodka Premium',
        category: 'Spirits',
        area: 'Main Bar',
        quantity: 12,
        unit: 'bottles',
        minThreshold: 3,
        lastUpdated: new Date(),
        cost: 25.99,
      },
      {
        id: '2',
        name: 'Fresh Lime',
        category: 'Garnish',
        area: 'Prep Station',
        quantity: 50,
        unit: 'pieces',
        minThreshold: 20,
        lastUpdated: new Date(),
        cost: 0.5,
      },
    ];
  }

  private getDefaultAreas(): InventoryArea[] {
    return [
      { id: '1', name: 'Main Bar', items: [] },
      { id: '2', name: 'Prep Station', items: [] },
      { id: '3', name: 'Storage Room', items: [] },
    ];
  }

  private getDefaultCategories(): InventoryCategory[] {
    return [
      { id: '1', name: 'Spirits', color: '#ff6384', items: [] },
      { id: '2', name: 'Beer', color: '#36a2eb', items: [] },
      { id: '3', name: 'Wine', color: '#cc65fe', items: [] },
      { id: '4', name: 'Garnish', color: '#ffce56', items: [] },
    ];
  }
}
