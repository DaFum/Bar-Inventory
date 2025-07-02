// Central export for all data models

export interface Product {
  id: string; // Unique identifier (e.g., SKU or generated)
  name: string;
  category: string; // e.g., "Vodka", "Whiskey", "Red Wine", "IPA Beer"
  volume: number; // Standard volume of one bottle/unit in ml
  itemsPerCrate?: number; // Optional: number of bottles/units in a full crate/case
  pricePerBottle: number; // Purchase price
  pricePer100ml?: number; // Optional: Calculated or set, for open items
  imageUrl?: string; // Optional: Path or URL to a product image
  supplier?: string; // Optional: Supplier information
  notes?: string; // Optional: Any other notes
}

export interface InventoryEntry {
  productId: string; // Links to Product.id
  // Fields for start of shift inventory
  startCrates?: number; // Full crates
  startBottles?: number; // Loose full bottles
  startOpenVolumeMl?: number; // Volume in ml for opened bottles (e.g., 500ml in a 700ml bottle)
  // Fields for end of shift inventory
  endCrates?: number;
  endBottles?: number;
  endOpenVolumeMl?: number;
}

// Represents a specific section within a counter/bar area, e.g., "Top Shelf", "Speed Rail", "Fridge 1"
export interface Area {
  id: string; // Unique identifier
  name: string;
  description?: string; // Optional description
  inventoryItems: InventoryEntry[]; // List of products inventoried in this area
  displayOrder?: number; // Optional: for ordering areas in UI
}

// Represents a physical counter or bar station
export interface Counter {
  // "Tresen" in German
  id: string; // Unique identifier
  name: string;
  description?: string; // Optional description
  areas: Area[]; // List of areas associated with this counter
}

// Represents a single location or establishment (e.g., a specific bar or restaurant)
export interface Location {
  id: string; // Unique identifier
  name: string;
  address?: string; // Optional
  counters: Counter[]; // List of counters at this location
  defaultProductSet?: string[]; // Optional: List of product IDs typically stocked
}

// Overall application state for inventory
export interface InventoryState {
  currentLocationId?: string;
  locations: Location[];
  products: Product[]; // Global product catalog
  lastSync?: Date;
  unsyncedChanges: boolean;
}

// User roles as defined in devplan.md
export enum UserRole {
  MANAGER = "Manager",
  MITARBEITER = "Mitarbeiter" // Employee
}

export interface User {
  id: string;
  username: string; // For display or login
  role: UserRole;
  activeLocationId?: string; // The location the user is currently working with
}
