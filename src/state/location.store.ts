import { Location, Counter, Area } from '../models';
import { storageService } from '../services/storage.service';
import { generateId } from '../utils/helpers';
import { AppState } from './app-state';

type LocationSubscriber = (locations: Location[]) => void;

/**
 * Manages the state of locations, including their nested counters and areas.
 * Handles CRUD operations and notifies subscribers of changes.
 */
class LocationStore {
  private subscribers: LocationSubscriber[] = [];
  private appState: AppState;

  constructor() {
    this.appState = AppState.getInstance();
  }

  // Private helper to find a location or throw an error
  private _getLocationOrFail(locationId: string): Location {
    const location = this.appState.locations.find((loc) => loc.id === locationId);
    if (!location) {
      throw new Error(`Location with id ${locationId} not found.`);
    }
    return location;
  }

  // Private helper to find a counter in a location or throw an error
  private _getCounterOrFail(location: Location, counterId: string): Counter {
    const counter = location.counters.find((c) => c.id === counterId);
    if (!counter) {
      throw new Error(`Counter with id ${counterId} not found in location ${location.name} (${location.id}).`);
    }
    return counter;
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => {
      try {
        callback([...this.appState.locations]); // Return a copy
      } catch (error) {
        console.error('LocationStore: Error in subscriber during notify:', error);
      }
    });
  }

  /**
   * Subscribes a callback function to location state changes.
   * @param callback - The function to call when locations change.
   * @returns A function to unsubscribe.
   */
  subscribe(callback: LocationSubscriber): () => void {
    this.subscribers.push(callback);
    return () => {
      this.unsubscribe(callback);
    };
  }

  /**
   * Unsubscribes a callback function from location state changes.
   * @param callback - The callback function to remove.
   */
  unsubscribe(callback: LocationSubscriber): void {
    this.subscribers = this.subscribers.filter((sub) => sub !== callback);
  }

  /**
   * Gets a copy of the current locations.
   * @returns An array of locations.
   */
  getLocations(): Location[] {
    return [...this.appState.locations]; // Return a copy
  }

  /**
   * Gets a specific location by its ID from the local cache.
   * @param locationId - The ID of the location to retrieve.
   * @returns A deep copy of the location if found, otherwise undefined.
   */
  getLocationById(locationId: string): Location | undefined {
    const location = this.appState.locations.find((loc) => loc.id === locationId);
    return location ? JSON.parse(JSON.stringify(location)) : undefined;
  }

  /**
   * Loads all locations from the database and notifies subscribers.
   */
  async loadLocations(): Promise<void> {
    try {
      await storageService.loadState(this.appState);
      this.notifySubscribers();
    } catch (error) {
      console.error('LocationStore: Error loading locations from DB', error);
      throw error;
    }
  }

  /**
   * Adds a new location to the database and store, then notifies subscribers.
   * @param locationData - Object containing the name and optional address for the new location.
   * @returns The newly created location.
   */
  async addLocation(locationData: Pick<Location, 'name' | 'address'>): Promise<Location> {
    try {
      if (!locationData.name?.trim()) {
        throw new Error('Standortname darf nicht leer sein');
      }

      const newLocation: Location = {
        id: generateId('loc'),
        name: locationData.name.trim(),
        counters: [],
      };
      if (locationData.address !== undefined) {
        newLocation.address = locationData.address;
      }
      await storageService.saveLocation(newLocation);
      this.appState.locations.push(newLocation); // Add to local cache
      this.notifySubscribers();
      return newLocation;
    } catch (error) {
      console.error('LocationStore: Error adding location', error);
      throw error;
    }
  }

  /**
   * Updates an existing location in the database and store, then notifies subscribers.
   * This also saves any changes to nested counters and areas within the location object.
   * @param location - The location object with updated data.
   * @returns The updated location.
   */
  async updateLocation(location: Location): Promise<Location> {
    try {
      location.counters.forEach((counter) => {
        counter.id = counter.id || generateId('ctr');
        counter.areas.forEach((area) => {
          area.id = area.id || generateId('area');
        });
      });

      await storageService.saveLocation(location);
      const index = this.appState.locations.findIndex((l) => l.id === location.id);
      if (index !== -1) {
        this.appState.locations[index] = location;
      } else {
        throw new Error(`Location with id ${location.id} not found for update`);
      }
      this.notifySubscribers();
      return location;
    } catch (error) {
      console.error('LocationStore: Error updating location', error);
      throw error;
    }
  }

  /**
   * Deletes a location from the database and store, then notifies subscribers.
   * @param locationId - The ID of the location to delete.
   */
  async deleteLocation(locationId: string): Promise<void> {
    try {
      this._getLocationOrFail(locationId);

      await storageService.deleteLocation(locationId);
      this.appState.locations = this.appState.locations.filter((l) => l.id !== locationId);
      this.notifySubscribers();
    } catch (error) {
      console.error('LocationStore: Error deleting location', error);
      throw error;
    }
  }

  // Methods for Counters
  async addCounter(
    locationId: string,
    counterData: Pick<Counter, 'name' | 'description'>
  ): Promise<Counter> {
    if (!counterData.name?.trim()) {
      throw new Error('Tresenname darf nicht leer sein');
    }
    const location = this._getLocationOrFail(locationId);

    const newCounter: Counter = {
      id: generateId('ctr'),
      name: counterData.name.trim(),
      areas: [],
    };
    if (counterData.description) {
      newCounter.description = counterData.description;
    }
    location.counters.push(newCounter);
    await this.updateLocation(location);
    return newCounter;
  }

  async updateCounter(locationId: string, updatedCounter: Counter): Promise<Counter> {
    const location = this._getLocationOrFail(locationId);
    const counterIndex = location.counters.findIndex((c) => c.id === updatedCounter.id);

    if (counterIndex === -1) {
      throw new Error(`Counter with id ${updatedCounter.id} not found in location ${locationId}.`);
    }

    location.counters[counterIndex] = updatedCounter;
    await this.updateLocation(location);
    return updatedCounter;
  }

  async deleteCounter(locationId: string, counterId: string): Promise<void> {
    const location = this._getLocationOrFail(locationId);
    const counterIndex = location.counters.findIndex(c => c.id === counterId);

    if (counterIndex === -1) {
      throw new Error(`Counter with id ${counterId} not found in location ${location.name} for deletion.`);
    }

    location.counters.splice(counterIndex, 1);
    await this.updateLocation(location);
  }

  // Methods for Areas
  async addArea(
    locationId: string,
    counterId: string,
    areaData: Pick<Area, 'name' | 'description' | 'displayOrder'>
  ): Promise<Area> {
    if (!areaData.name?.trim()) {
      throw new Error('Bereichsname darf nicht leer sein');
    }
    const location = this._getLocationOrFail(locationId);
    const counter = this._getCounterOrFail(location, counterId);

    const newArea: Area = {
      id: generateId('area'),
      name: areaData.name.trim(),
      inventoryRecords: [],

    };
    if (areaData.description !== undefined) {
      newArea.description = areaData.description;
    }
    if (areaData.displayOrder !== undefined) {
      newArea.displayOrder = areaData.displayOrder;
    }
    counter.areas.push(newArea);
    this.sortAreas(counter);
    await this.updateLocation(location);
    return newArea;
  }

  async updateArea(locationId: string, counterId: string, updatedArea: Area): Promise<Area> {
    const location = this._getLocationOrFail(locationId);
    const counter = this._getCounterOrFail(location, counterId);
    const areaIndex = counter.areas.findIndex((a) => a.id === updatedArea.id);

    if (areaIndex === -1) {
      throw new Error(`Area ${updatedArea.id} not found in counter ${counterId}.`);
    }

    counter.areas[areaIndex] = updatedArea;
    this.sortAreas(counter);
    await this.updateLocation(location);
    return updatedArea;
  }

  async deleteArea(locationId: string, counterId: string, areaId: string): Promise<void> {
    const location = this._getLocationOrFail(locationId);
    const counter = this._getCounterOrFail(location, counterId);
    const areaIndex = counter.areas.findIndex(a => a.id === areaId);

    if (areaIndex === -1) {
      throw new Error(`Area with id ${areaId} not found in counter ${counter.name} for deletion.`);
    }

    counter.areas.splice(areaIndex, 1);
    await this.updateLocation(location);
  }

  private sortAreas(counter: Counter): void {
    counter.areas.sort((a, b) => {
      if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
      } else if (a.displayOrder !== undefined) {
        return -1;
      } else if (b.displayOrder !== undefined) {
        return 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  public reset(): void {
    this.appState.locations = [];
    this.subscribers = [];
  }

  async importLocations(locations: Location[]): Promise<void> {
    try {
        for (const location of locations) {
            // Validate required fields
-            if (!location.name || !location.address || !Array.isArray(location.counters)) {
+            if (!location.name?.trim() || !Array.isArray(location.counters)) {
                throw new Error(`Invalid location data: missing required fields`);
            }
+            // address ist optional, sollte aber wenn vorhanden validiert werden
+            if (location.address !== undefined && typeof location.address !== 'string') {
+                throw new Error(`Invalid location data: address must be a string`);
+            }
          
            const newLocation: Location = {
                id: generateId('loc'),
                name: location.name,
                address: location.address,
                counters: location.counters.map(counter => {
                    if (!counter.name || !Array.isArray(counter.areas)) {
                        throw new Error(`Invalid counter data in location "${location.name}"`);
                    }
                    return {
                        id: generateId('ctr'),
                        name: counter.name,
                        description: counter.description,
                        areas: counter.areas.map(area => {
                            if (!area.name) {
                                throw new Error(`Invalid area data in counter "${counter.name}"`);
                            }
                            return {
                                id: generateId('area'),
                                name: area.name,
                                description: area.description,
                                displayOrder: area.displayOrder,
                                inventoryItems: area.inventoryItems || []
                            };
                        })
                    };
                })
            };
            await storageService.saveLocation(newLocation);
            this.appState.locations.push(newLocation);
        }
        this.notifySubscribers();
    } catch (error) {
        console.error('LocationStore: Error importing locations', error);
        throw error;
    }
  }
}

export const locationStore = new LocationStore();
