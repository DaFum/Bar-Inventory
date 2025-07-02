import { Location, Counter, Area } from '../models';
import { dbService } from '../services/indexeddb.service';
import { generateId } from '../utils/helpers';

type LocationSubscriber = (locations: Location[]) => void;

/**
 * Manages the state of locations, including their nested counters and areas.
 * Handles CRUD operations and notifies subscribers of changes.
 */
class LocationStore {
    private locations: Location[] = [];
    private subscribers: LocationSubscriber[] = [];

    constructor() {
        // Initial data loading can be triggered here or explicitly by the application.
    }

    private notifySubscribers(): void {
        // Locations are not currently sorted by default in the store before notifying.
        // Sorting can be handled by components if needed, or implemented here.
        this.subscribers.forEach(callback => callback([...this.locations])); // Return a copy
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
        this.subscribers = this.subscribers.filter(sub => sub !== callback);
    }

    /**
     * Gets a copy of the current locations.
     * @returns An array of locations.
     */
    getLocations(): Location[] {
        return [...this.locations]; // Return a copy
    }

    /**
     * Gets a specific location by its ID from the local cache.
     * @param locationId - The ID of the location to retrieve.
     * @returns The location if found, otherwise undefined.
     */
    getLocationById(locationId: string): Location | undefined {
        return this.locations.find(loc => loc.id === locationId);
    }

    /**
     * Loads all locations from the database and notifies subscribers.
     */
    async loadLocations(): Promise<void> {
        try {
            this.locations = await dbService.loadLocations();
            this.notifySubscribers();
        } catch (error) {
            console.error("LocationStore: Error loading locations from DB", error);
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
        // Validierung
        if (!locationData.name?.trim()) {
            throw new Error('Standortname darf nicht leer sein');
        }

        const newLocation: Location = {
            id: generateId('loc'),
            name: locationData.name.trim(),
            address: locationData.address,
            counters: []
        };
        await dbService.saveLocation(newLocation);
        this.locations.push(newLocation); // Add to local cache
        this.notifySubscribers();
        return newLocation;
    } catch (error) {
        console.error("LocationStore: Error adding location", error);
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
            // Ensure all nested IDs are present (though they should be if generated correctly)
            location.counters.forEach(counter => {
                counter.id = counter.id || generateId('ctr');
                counter.areas.forEach(area => {
                    area.id = area.id || generateId('area');
                });
            });

            await dbService.saveLocation(location);
            const index = this.locations.findIndex(l => l.id === location.id);
            if (index !== -1) {
                this.locations[index] = location;
            } else {
                throw new Error(`Location with id ${location.id} not found for update`);
            }
            this.notifySubscribers();
            return location;
        } catch (error) {
            console.error("LocationStore: Error updating location", error);
            throw error;
        }
    }

    /**
     * Deletes a location from the database and store, then notifies subscribers.
     * @param locationId - The ID of the location to delete.
     */
    async deleteLocation(locationId: string): Promise<void> {
        try {
            await dbService.delete('locations', locationId);
            this.locations = this.locations.filter(l => l.id !== locationId);
            this.notifySubscribers();
        } catch (error) {
            console.error("LocationStore: Error deleting location", error);
            throw error;
        }
    }

    // Methods for Counters
    /**
     * Adds a new counter to a specified location.
     * @param locationId - The ID of the parent location.
     * @param counterData - Object containing the name and optional description for the new counter.
     * @returns The newly created counter.
     * @throws Error if the parent location is not found.
     */
    async addCounter(locationId: string, counterData: Pick<Counter, 'name' | 'description'>): Promise<Counter> {
        const location = this.locations.find(l => l.id === locationId); // Find in local cache
        if (!location) throw new Error(`Location with id ${locationId} not found to add counter.`);

        const newCounter: Counter = {
            id: generateId('ctr'),
            name: counterData.name,
            description: counterData.description,
            areas: []
        };
        location.counters.push(newCounter);
        // The whole location object is saved, so this implicitly saves the new counter.
        await this.updateLocation(location); // This will also notify subscribers.
        return newCounter;
    }

    async updateCounter(locationId: string, updatedCounter: Counter): Promise<Counter> {
        const location = this.locations.find(l => l.id === locationId);
        if (!location) throw new Error(`Location with id ${locationId} not found for updating counter.`);

        const counterIndex = location.counters.findIndex(c => c.id === updatedCounter.id);
        if (counterIndex === -1) throw new Error(`Counter with id ${updatedCounter.id} not found in location ${locationId}.`);

        location.counters[counterIndex] = updatedCounter;
        await this.updateLocation(location); // Saves the whole location and notifies
        return updatedCounter;
    }

    async deleteCounter(locationId: string, counterId: string): Promise<void> {
        const location = this.locations.find(l => l.id === locationId);
        if (!location) throw new Error(`Location with id ${locationId} not found for deleting counter.`);

        location.counters = location.counters.filter(c => c.id !== counterId);
        await this.updateLocation(location); // Saves the whole location and notifies
    }

    // Methods for Areas
    async addArea(locationId: string, counterId: string, areaData: Pick<Area, 'name' | 'description' | 'displayOrder'>): Promise<Area> {
        const location = this.locations.find(l => l.id === locationId);
        if (!location) throw new Error(`Location ${locationId} not found.`);
        const counter = location.counters.find(c => c.id === counterId);
        if (!counter) throw new Error(`Counter ${counterId} not found in location ${locationId}.`);

        const newArea: Area = {
            id: generateId('area'),
            name: areaData.name,
            description: areaData.description,
            inventoryItems: [], // Initialize with empty inventoryItems
            displayOrder: areaData.displayOrder
        };
        counter.areas.push(newArea);
        this.sortAreas(counter); // Sort areas after adding
        await this.updateLocation(location); // Saves the whole location and notifies
        return newArea;
    }

    async updateArea(locationId: string, counterId: string, updatedArea: Area): Promise<Area> {
        const location = this.locations.find(l => l.id === locationId);
        if (!location) throw new Error(`Location ${locationId} not found.`);
        const counter = location.counters.find(c => c.id === counterId);
        if (!counter) throw new Error(`Counter ${counterId} not found in location ${locationId}.`);

        const areaIndex = counter.areas.findIndex(a => a.id === updatedArea.id);
        if (areaIndex === -1) throw new Error(`Area ${updatedArea.id} not found in counter ${counterId}.`);

        counter.areas[areaIndex] = updatedArea;
        this.sortAreas(counter); // Sort areas after updating
        await this.updateLocation(location); // Saves the whole location and notifies
        return updatedArea;
    }

    async deleteArea(locationId: string, counterId: string, areaId: string): Promise<void> {
        const location = this.locations.find(l => l.id === locationId);
        if (!location) throw new Error(`Location ${locationId} not found.`);
        const counter = location.counters.find(c => c.id === counterId);
        if (!counter) throw new Error(`Counter ${counterId} not found in location ${locationId}.`);

        counter.areas = counter.areas.filter(a => a.id !== areaId);
        // No need to re-sort here if only removing, but doesn't hurt if sortAreas is idempotent
        // this.sortAreas(counter);
        await this.updateLocation(location); // Saves the whole location and notifies
    }

    private sortAreas(counter: Counter): void {
        counter.areas.sort((a, b) => {
            if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
                if (a.displayOrder !== b.displayOrder) { // Primary sort by displayOrder
                    return a.displayOrder - b.displayOrder;
                }
            } else if (a.displayOrder !== undefined) { // Areas with displayOrder come first
                return -1;
            } else if (b.displayOrder !== undefined) {
                return 1;
            }
            // Fallback to name sorting if displayOrder is the same or not defined for one/both
            return a.name.localeCompare(b.name);
        });
    }
}

export const locationStore = new LocationStore();
console.log("LocationStore initialized.");
