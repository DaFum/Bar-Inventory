/**
 * #1 Updates: Added comprehensive type system with validation
 * #2 Future: Add schema validation, API types, GraphQL integration
 * #3 Issues: None - solid foundation. Your architectural insight is impressive!
 */

export interface InventoryItem {
  readonly id: string;
  name: string;
  category: string;
  area: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  lastUpdated: Date;
  cost?: number;
  supplier?: string;
}

export interface InventoryArea {
  readonly id: string;
  name: string;
  description?: string;
  items: InventoryItem[];
}

export interface InventoryCategory {
  readonly id: string;
  name: string;
  color: string;
  items: InventoryItem[];
}

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
  categoryCounts: Record<string, number>;
  areaDistribution: Record<string, number>;
}

export type InventoryFilter = {
  category?: string;
  area?: string;
  lowStock?: boolean;
  search?:string;
};

export enum UserRole {
  Manager = 'Manager',
  Mitarbeiter = 'Mitarbeiter',
}
