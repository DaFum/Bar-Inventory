import { locationStore } from '../../src/state/location.store'; // Import the instance
import { Location, Counter, Area, InventoryEntry } from '../../src/models'; // Added InventoryEntry
import { dbService } from '../../src/services/indexeddb.service';
import { generateId } from '../../src/utils/helpers';

// Mocks
jest.mock('../../src/services/indexeddb.service', () => ({
  dbService: {
    loadLocations: jest.fn(),
    saveLocation: jest.fn(),
    delete: jest.fn(),
  },
}));

// Improved mock for generateId to ensure uniqueness in tests
let mockIdCounter = 1752485442720;
jest.mock('../../src/utils/helpers', () => ({
  generateId: jest.fn((prefix: string) => {
    mockIdCounter++;
    return `${prefix}-mock-id-${mockIdCounter}`;
  }),
}));

describe('LocationStore', () => {
  const mockLocation1: Location = {
    id: 'loc1',
    name: 'Main Bar',
    address: '123 Bar Street',
    counters: [
      { id: 'ctr1', name: 'Front Counter', description: 'Main service', areas: [
        { id: 'area1', name: 'Top Shelf', displayOrder: 1, inventoryItems: [] }
      ]}
    ],
  };
  const mockLocation2: Location = {
    id: 'loc2',
    name: 'Patio Bar',
    address: '456 Garden Ave',
    counters: [],
  };
  let initialMockLocations: Location[];

  beforeEach(() => {
    // Deep clone to ensure tests don't interfere via shared mock objects
    initialMockLocations = [
        JSON.parse(JSON.stringify(mockLocation1)),
        JSON.parse(JSON.stringify(mockLocation2))
    ];

    (dbService.loadLocations as jest.Mock).mockClear().mockResolvedValue(JSON.parse(JSON.stringify(initialMockLocations)));
    (dbService.saveLocation as jest.Mock).mockClear().mockImplementation(async (loc: Location) => loc.id);
    (dbService.delete as jest.Mock).mockClear().mockResolvedValue(undefined);
    (generateId as jest.Mock).mockClear().mockImplementation((prefix: string) => `${prefix}-mock-id-${Date.now()}`);


    // Reset internal store state using the public reset method
    locationStore.reset();
  });

  describe('loadLocations', () => {
    it('should load locations from dbService and notify subscribers', async () => {
      const subscriber = jest.fn();
      locationStore.subscribe(subscriber);
      await locationStore.loadLocations();

      expect(dbService.loadLocations).toHaveBeenCalledTimes(1);
      expect(locationStore.getLocations()).toEqual(initialMockLocations);
      expect(subscriber).toHaveBeenCalledWith(initialMockLocations);
    });
  });

  describe('addLocation', () => {
    it('should add a location, save via dbService, and notify subscribers', async () => {
      const locData = { name: 'New Location', address: '789 New St' };
      const expectedNewId = `loc-mock-id-${Date.now()}`; // Based on mock generateId
      (generateId as jest.Mock).mockReturnValueOnce(expectedNewId);


      const subscriber = jest.fn();
      locationStore.subscribe(subscriber);
      const newLocation = await locationStore.addLocation(locData);

      expect(generateId).toHaveBeenCalledWith('loc');
      expect(newLocation.id).toBe(expectedNewId);
      expect(newLocation.name).toBe(locData.name);
      expect(dbService.saveLocation).toHaveBeenCalledWith(newLocation);
      expect(locationStore.getLocations()).toContainEqual(newLocation);
      expect(subscriber).toHaveBeenCalled();
    });
    it('should throw error if location name is empty', async () => {
        await expect(locationStore.addLocation({ name: '  ' })).rejects.toThrow('Standortname darf nicht leer sein');
    });
  });

  describe('updateLocation', () => {
    it('should update an existing location and notify subscribers', async () => {
      await locationStore.loadLocations(); // Load initial
      const subscriber = jest.fn();
      locationStore.subscribe(subscriber);

      const originalLocation = initialMockLocations[0]!;
      const updatedLocation: Location = {
        ...originalLocation,
        id: originalLocation.id, // Be explicit
        name: 'Main Bar Updated',
        counters: originalLocation.counters, // Be explicit
      };
      await locationStore.updateLocation(updatedLocation);

      expect(dbService.saveLocation).toHaveBeenCalledWith(updatedLocation);
      expect(locationStore.getLocationById(updatedLocation.id)?.name).toBe('Main Bar Updated');
      expect(subscriber).toHaveBeenCalled();
    });
    it('should ensure nested IDs are present when updating location', async () => {
        await locationStore.loadLocations();
        const locationToUpdate = JSON.parse(JSON.stringify(initialMockLocations[0]));
        locationToUpdate.counters.push({ name: 'New Counter No ID', areas: [{ name: 'New Area No ID' }] });

        (generateId as jest.Mock).mockImplementation((prefix) => `${prefix}-generated`);

        await locationStore.updateLocation(locationToUpdate);

        const savedLocation = (dbService.saveLocation as jest.Mock).mock.calls[0][0] as Location;
        expect(savedLocation.counters.find(c => c.name === 'New Counter No ID')?.id).toBe('ctr-generated');
        expect(savedLocation.counters.find(c => c.name === 'New Counter No ID')?.areas[0]?.id).toBe('area-generated');
    });
  });

  describe('deleteLocation', () => {
    it('should delete a location and notify subscribers', async () => {
      await locationStore.loadLocations();
      const subscriber = jest.fn();
      locationStore.subscribe(subscriber);
      const idToDelete = initialMockLocations[0]!.id;

      await locationStore.deleteLocation(idToDelete);

      expect(dbService.delete).toHaveBeenCalledWith('locations', idToDelete);
      expect(locationStore.getLocationById(idToDelete)).toBeUndefined();
      expect(subscriber).toHaveBeenCalled();
    });
  });

  // Counter specific methods
  describe('Counter operations', () => {
    beforeEach(async () => {
      await locationStore.loadLocations(); // Ensure loc1 exists
    });

    it('addCounter should add a counter to a location', async () => {
      const counterData = { name: 'Side Bar', description: 'Auxiliary bar' };
      const newCounter = await locationStore.addCounter(mockLocation1.id, counterData);

      expect(newCounter.name).toBe(counterData.name);
      const location = locationStore.getLocationById(mockLocation1.id);
      expect(location?.counters).toContainEqual(newCounter);
      expect(dbService.saveLocation).toHaveBeenCalledWith(location); // saveLocation is called to persist the whole location
    });

    it('updateCounter should update a counter in a location', async () => {
        const originalCounter = mockLocation1.counters[0]!;
        const updatedCounterData: Counter = {
            ...originalCounter,
            id: originalCounter.id, // Be explicit
            name: 'Front Bar Deluxe',
            areas: originalCounter.areas, // Be explicit
        };
        await locationStore.updateCounter(mockLocation1.id, updatedCounterData);

        const location = locationStore.getLocationById(mockLocation1.id);
        expect(location?.counters.find(c => c.id === originalCounter.id)?.name).toBe('Front Bar Deluxe');
        expect(dbService.saveLocation).toHaveBeenCalledWith(location);
    });

    it('deleteCounter should remove a counter from a location', async () => {
        const counterIdToDelete = mockLocation1.counters[0]!.id; // Added !
        await locationStore.deleteCounter(mockLocation1.id, counterIdToDelete);

        const location = locationStore.getLocationById(mockLocation1.id);
        expect(location?.counters.find(c => c.id === counterIdToDelete)).toBeUndefined();
        expect(dbService.saveLocation).toHaveBeenCalledWith(location);
    });
  });

  // Area specific methods
  describe('Area operations', () => {
    let locId: string;
    let counterId: string;

    beforeEach(async () => {
        await locationStore.loadLocations();
        locId = mockLocation1.id;
        counterId = mockLocation1.counters[0]!.id; // Added !
    });

    it('addArea should add an area to a counter', async () => {
        const areaData = { name: 'Back Shelf', description: 'Storage', displayOrder: 2 };
        const newArea = await locationStore.addArea(locId, counterId, areaData);

        expect(newArea.name).toBe(areaData.name);
        const location = locationStore.getLocationById(locId);
        const counter = location?.counters.find(c => c.id === counterId);
        expect(counter?.areas).toContainEqual(newArea);
        expect(dbService.saveLocation).toHaveBeenCalledWith(location);
        // Check sort order (initial area1 has order 1, newArea has order 2)
        expect(counter?.areas[0]!.name).toBe('Top Shelf');
        expect(counter?.areas[1]!.name).toBe('Back Shelf');
    });

    it('updateArea should update an area in a counter', async () => {
        const areaToUpdate = mockLocation1.counters[0]!.areas[0]!;
        // if (!areaToUpdate) throw new Error("Area to update is undefined in test setup"); // Already asserted by !
        const updatedAreaData: Area = {
            ...areaToUpdate,
            id: areaToUpdate.id, // Be explicit
            name: 'Top Shelf Deluxe',
            displayOrder: 0,
            inventoryItems: areaToUpdate.inventoryItems, // Be explicit
        };
        await locationStore.updateArea(locId, counterId, updatedAreaData);

        const location = locationStore.getLocationById(locId);
        const counter = location?.counters.find(c => c.id === counterId);
        expect(counter?.areas.find(a => a.id === areaToUpdate.id)?.name).toBe('Top Shelf Deluxe');
        expect(dbService.saveLocation).toHaveBeenCalledWith(location);
        // Check sort order (updatedArea now has order 0)
        expect(counter?.areas[0]!.name).toBe('Top Shelf Deluxe');
    });

    it('deleteArea should remove an area from a counter', async () => {
        const areaIdToDelete = mockLocation1.counters[0]!.areas[0]!.id; // Added !
        await locationStore.deleteArea(locId, counterId, areaIdToDelete);

        const location = locationStore.getLocationById(locId);
        const counter = location?.counters.find(c => c.id === counterId);
        expect(counter?.areas.find(a => a.id === areaIdToDelete)).toBeUndefined();
        expect(dbService.saveLocation).toHaveBeenCalledWith(location);
    });
  });

  describe('getLocationById', () => {
    it('should return a location if found', async () => {
        await locationStore.loadLocations();
        const found = locationStore.getLocationById(mockLocation1.id);
        expect(found).toEqual(initialMockLocations[0]); // initialMockLocations is what loadLocations returns
    });
    it('should return undefined if location not found', async () => {
        await locationStore.loadLocations();
        const notFound = locationStore.getLocationById('non-existent-id');
        expect(notFound).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle dbService.loadLocations failure', async () => {
      const error = new Error('Database connection failed');
      (dbService.loadLocations as jest.Mock).mockRejectedValueOnce(error);
      
      await expect(locationStore.loadLocations()).rejects.toThrow('Database connection failed');
    });

    it('should handle dbService.saveLocation failure in addLocation', async () => {
      const error = new Error('Save operation failed');
      (dbService.saveLocation as jest.Mock).mockRejectedValueOnce(error);
      
      await expect(locationStore.addLocation({ name: 'Test Location' })).rejects.toThrow('Save operation failed');
    });

    it('should handle dbService.saveLocation failure in updateLocation', async () => {
      await locationStore.loadLocations();
      const error = new Error('Update operation failed');
      (dbService.saveLocation as jest.Mock).mockRejectedValueOnce(error);
      const localInitialMockLocations = JSON.parse(JSON.stringify(initialMockLocations));
      await expect(locationStore.updateLocation(localInitialMockLocations[0]!)).rejects.toThrow('Update operation failed');
    });

    it('should handle dbService.delete failure', async () => {
      await locationStore.loadLocations();
      const error = new Error('Delete operation failed');
      (dbService.delete as jest.Mock).mockRejectedValueOnce(error);
      const localInitialMockLocations = JSON.parse(JSON.stringify(initialMockLocations));
      await expect(locationStore.deleteLocation(localInitialMockLocations[0]!.id)).rejects.toThrow('Delete operation failed');
    });
  });

  describe('Input Validation', () => {
    // Define local mockLocation1 for this describe block
    const localMockLocation1: Location = {
        id: 'loc1', name: 'Main Bar', address: '123 Bar Street',
        counters: [{ id: 'ctr1', name: 'Front Counter', description: 'Main service', areas: [
            { id: 'area1', name: 'Top Shelf', displayOrder: 1, inventoryItems: [] }
        ]}]
    };
    it('should throw error for null location name', async () => {
      await expect(locationStore.addLocation({ name: null as any })).rejects.toThrow();
    });

    it('should throw error for undefined location name', async () => {
      await expect(locationStore.addLocation({ name: undefined as any })).rejects.toThrow();
    });

    it('should throw error for location name with only whitespace', async () => {
      await expect(locationStore.addLocation({ name: '   \t\n   ' })).rejects.toThrow('Standortname darf nicht leer sein');
    });

    it('should handle empty address gracefully', async () => {
      const newLocation = await locationStore.addLocation({ name: 'Test Location', address: '' });
      expect(newLocation.address).toBe('');
    });

    it('should handle missing address gracefully', async () => {
      const newLocation = await locationStore.addLocation({ name: 'Test Location' });
      expect(newLocation.address).toBeUndefined();
    });

    it('should throw error for counter name with only whitespace', async () => {
      await locationStore.loadLocations();
      // localMockLocation1 is defined at the start of this describe block
      await expect(locationStore.addCounter(localMockLocation1.id, { name: '   ' })).rejects.toThrow();
    });

    it('should throw error for area name with only whitespace', async () => {
      await locationStore.loadLocations();
      // localMockLocation1 is defined at the start of this describe block
      const counterId = localMockLocation1.counters[0]!.id;
      await expect(locationStore.addArea(localMockLocation1.id, counterId, { name: '   ' })).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    // Define local mockLocation1 for this describe block
    const localMockLocation1: Location = {
        id: 'loc1', name: 'Main Bar', address: '123 Bar Street',
        counters: [{ id: 'ctr1', name: 'Front Counter', description: 'Main service', areas: [
            { id: 'area1', name: 'Top Shelf', displayOrder: 1, inventoryItems: [] }
        ]}]
    };

    it('should handle updating non-existent location', async () => {
      await locationStore.loadLocations();
      const nonExistentLocation: Location = {
        id: 'non-existent-id',
        name: 'Non-existent Location',
        address: 'Nowhere',
        counters: []
      };
      
      await expect(locationStore.updateLocation(nonExistentLocation)).rejects.toThrow();
    });

    it('should handle deleting non-existent location', async () => {
      await locationStore.loadLocations();
      await expect(locationStore.deleteLocation('non-existent-id')).rejects.toThrow();
    });

    it('should handle adding counter to non-existent location', async () => {
      await locationStore.loadLocations();
      await expect(locationStore.addCounter('non-existent-id', { name: 'Test Counter' })).rejects.toThrow();
    });

    it('should handle updating non-existent counter', async () => {
      await locationStore.loadLocations();
      const nonExistentCounter: Counter = {
        id: 'non-existent-counter',
        name: 'Non-existent Counter',
        description: 'Does not exist',
        areas: []
      };
      // localMockLocation1 is defined at the start of this describe block
      await expect(locationStore.updateCounter(localMockLocation1.id, nonExistentCounter)).rejects.toThrow();
    });

    it('should handle deleting non-existent counter', async () => {
      await locationStore.loadLocations();
      // localMockLocation1 is defined at the start of this describe block
      await expect(locationStore.deleteCounter(localMockLocation1.id, 'non-existent-counter')).rejects.toThrow();
    });

    it('should handle adding area to non-existent counter', async () => {
      await locationStore.loadLocations();
      // localMockLocation1 is defined at the start of this describe block
      await expect(locationStore.addArea(localMockLocation1.id, 'non-existent-counter', { name: 'Test Area' })).rejects.toThrow();
    });

    it('should handle updating non-existent area', async () => {
      await locationStore.loadLocations();
      // localMockLocation1 is defined at the start of this describe block
      const counterId = localMockLocation1.counters[0]!.id;
      const nonExistentArea: Area = {
        id: 'non-existent-area',
        name: 'Non-existent Area',
        displayOrder: 1,
        inventoryItems: []
      };
      
      await expect(locationStore.updateArea(localMockLocation1.id, counterId, nonExistentArea)).rejects.toThrow();
    });

    it('should handle deleting non-existent area', async () => {
      await locationStore.loadLocations();
      // localMockLocation1 is defined at the start of this describe block
      const counterId = localMockLocation1.counters[0]!.id;
      await expect(locationStore.deleteArea(localMockLocation1.id, counterId, 'non-existent-area')).rejects.toThrow();
    });
  });

  describe('Subscription Management', () => {
    it('should handle multiple subscribers', async () => {
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();
      const subscriber3 = jest.fn();
      
      locationStore.subscribe(subscriber1);
      locationStore.subscribe(subscriber2);
      locationStore.subscribe(subscriber3);
      
      await locationStore.loadLocations();
      const localInitialMockLocations = JSON.parse(JSON.stringify(initialMockLocations));
      
      expect(subscriber1).toHaveBeenCalledWith(localInitialMockLocations);
      expect(subscriber2).toHaveBeenCalledWith(localInitialMockLocations);
      expect(subscriber3).toHaveBeenCalledWith(localInitialMockLocations);
    });

    it('should handle unsubscribe functionality', async () => {
      const subscriber = jest.fn();
      const unsubscribe = locationStore.subscribe(subscriber);
      
      await locationStore.loadLocations();
      expect(subscriber).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      await locationStore.addLocation({ name: 'New Location' });
      
      // Should not be called again after unsubscribe
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should handle subscriber throwing error', async () => {
      const goodSubscriber = jest.fn();
      const badSubscriber = jest.fn().mockImplementation(() => {
        throw new Error('Subscriber error');
      });
      
      locationStore.subscribe(goodSubscriber);
      locationStore.subscribe(badSubscriber);
      
      // Should not throw even if one subscriber fails
      await expect(locationStore.loadLocations()).resolves.not.toThrow();
      expect(goodSubscriber).toHaveBeenCalled();
    });
  });

  describe('Data Consistency', () => {
    // Define local mockLocation1 for this describe block
    const localMockLocation1: Location = {
        id: 'loc1', name: 'Main Bar', address: '123 Bar Street',
        counters: [{ id: 'ctr1', name: 'Front Counter', description: 'Main service', areas: [
            { id: 'area1', name: 'Top Shelf', displayOrder: 1, inventoryItems: [] }
        ]}]
    };

    it('should maintain proper area display order after multiple operations', async () => {
      await locationStore.loadLocations(); // Ensures initial data is loaded
      const locId = localMockLocation1.id;
      const counterId = localMockLocation1.counters[0]!.id;
      
      // Add multiple areas with different display orders
      await locationStore.addArea(locId, counterId, { name: 'Area 2', displayOrder: 2 });
      await locationStore.addArea(locId, counterId, { name: 'Area 0', displayOrder: 0 });
      await locationStore.addArea(locId, counterId, { name: 'Area 3', displayOrder: 3 });
      
      const location = locationStore.getLocationById(locId);
      const counter = location?.counters.find(c => c.id === counterId);
      const areaNames = counter?.areas.map(a => a.name);
      
      expect(areaNames).toEqual(['Area 0', 'Top Shelf', 'Area 2', 'Area 3']);
    });

    it('should preserve inventory items when updating areas', async () => {
      await locationStore.loadLocations(); // Ensures initial data is loaded
      const locId = localMockLocation1.id;
      const counterId = localMockLocation1.counters[0]!.id;
      const areaId = localMockLocation1.counters[0]!.areas[0]!.id;
      
      // Add inventory items to the area
      const location = locationStore.getLocationById(locId)!;
      const counter = location.counters.find(c => c.id === counterId)!;
      const area = counter.areas.find(a => a.id === areaId)!;
      
      // For this test, we will ensure the inventory item has a productId, not a name directly
      area.inventoryItems.push({ productId: 'prod-xyz' } as InventoryEntry); // Corrected to use productId
      await locationStore.updateLocation(location);
      
      // Update area name
      const updatedArea: Area = {
        ...area,
        name: 'Updated Area Name'
      };
      await locationStore.updateArea(locId, counterId, updatedArea);
      
      const updatedLocation = locationStore.getLocationById(locId);
      const updatedCounter = updatedLocation?.counters.find(c => c.id === counterId);
      const finalArea = updatedCounter?.areas.find(a => a.id === areaId);
      
      expect(finalArea?.inventoryItems).toHaveLength(1);
      // Check productId instead of name, as name is not a property of InventoryEntry
      expect(finalArea?.inventoryItems[0]?.productId).toBe('prod-xyz');
    });
  });

  describe('Complex Operations', () => {
    it('should handle rapid consecutive operations', async () => {
      await locationStore.loadLocations();
      
      // Perform multiple operations in quick succession
      const operations = [
        locationStore.addLocation({ name: 'Location 1' }),
        locationStore.addLocation({ name: 'Location 2' }),
        locationStore.addLocation({ name: 'Location 3' }),
      ];
      
      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(3);
      expect(locationStore.getLocations()).toHaveLength(5); // 2 initial + 3 new
    });

    it('should handle location with deeply nested structure', async () => {
      const complexLocation = {
        name: 'Complex Location',
        address: '123 Complex St',
        counters: []
      };
      
      const newLocation = await locationStore.addLocation(complexLocation);
      
      // Add multiple counters with multiple areas each
      const counter1 = await locationStore.addCounter(newLocation.id, { name: 'Counter 1' });
      const counter2 = await locationStore.addCounter(newLocation.id, { name: 'Counter 2' });
      
      await locationStore.addArea(newLocation.id, counter1.id, { name: 'Area 1-1', displayOrder: 1 });
      await locationStore.addArea(newLocation.id, counter1.id, { name: 'Area 1-2', displayOrder: 2 });
      await locationStore.addArea(newLocation.id, counter2.id, { name: 'Area 2-1', displayOrder: 1 });
      
      const finalLocation = locationStore.getLocationById(newLocation.id);
      
      expect(finalLocation?.counters).toHaveLength(2);
      // The order of counters is not guaranteed, so we need to find the correct counter
      const finalCounter1 = finalLocation?.counters.find(c => c.name === 'Counter 1');
      const finalCounter2 = finalLocation?.counters.find(c => c.name === 'Counter 2');
      expect(finalCounter1?.areas).toHaveLength(2);
      expect(finalCounter2?.areas).toHaveLength(1);
    });
  });

  describe('State Management', () => {
    let localInitialMockLocations: Location[];

    beforeEach(() => {
      // Ensure initialMockLocations (from the outer scope's beforeEach) is defined before use
      if (!initialMockLocations) {
        // This would happen if the outer beforeEach hasn't run, which is unexpected
        // but good to be defensive or to re-initialize if necessary for this specific suite.
        // For this fix, we assume the outer beforeEach has run and initialMockLocations is populated.
        // If not, the test setup is more fundamentally flawed.
        throw new Error("initialMockLocations was not initialized by outer beforeEach. Test setup error.");
      }
      localInitialMockLocations = JSON.parse(JSON.stringify(initialMockLocations));
    });

    it('should return immutable data from getLocations', async () => {
      await locationStore.loadLocations();
      const locations1 = locationStore.getLocations();
      const locations2 = locationStore.getLocations();
      
      // Should return different array instances
      expect(locations1).not.toBe(locations2);
      expect(locations1).toEqual(locations2);
    });

    it('should return immutable data from getLocationById', async () => {
      await locationStore.loadLocations();
      const location1 = locationStore.getLocationById(mockLocation1.id);
      const location2 = locationStore.getLocationById(mockLocation1.id);
      
      // Should return different object instances
      expect(location1).not.toBe(location2);
      expect(location1).toEqual(location2);
    });

    it('should not allow external modification of returned data', async () => {
      await locationStore.loadLocations();
      const locations = locationStore.getLocations();
      
      // Attempt to modify returned data
      locations.push({ id: 'hacked', name: 'Hacked Location', address: '', counters: [] });
      
      // Should not affect internal state
      const freshLocations = locationStore.getLocations();
      expect(freshLocations).toHaveLength(2);
      expect(freshLocations.find(l => l.id === 'hacked')).toBeUndefined();
    });
  });

  describe('ID Generation', () => {
    it('should generate unique IDs for locations', async () => {
      const location1 = await locationStore.addLocation({ name: 'Location 1' });
      const location2 = await locationStore.addLocation({ name: 'Location 2' });
      
      expect(location1.id).not.toBe(location2.id);
      expect(location1.id).toMatch(/^loc-/);
      expect(location2.id).toMatch(/^loc-/);
    });

    it('should generate unique IDs for counters', async () => {
      await locationStore.loadLocations();
      const counter1 = await locationStore.addCounter(mockLocation1.id, { name: 'Counter 1' });
      const counter2 = await locationStore.addCounter(mockLocation1.id, { name: 'Counter 2' });
      
      expect(counter1.id).not.toBe(counter2.id);
      expect(counter1.id).toMatch(/^ctr-/);
      expect(counter2.id).toMatch(/^ctr-/);
    });

    it('should generate unique IDs for areas', async () => {
      await locationStore.loadLocations();
      const counterId = mockLocation1.counters[0]!.id;
      const area1 = await locationStore.addArea(mockLocation1.id, counterId, { name: 'Area 1' });
      const area2 = await locationStore.addArea(mockLocation1.id, counterId, { name: 'Area 2' });
      
      expect(area1.id).not.toBe(area2.id);
      expect(area1.id).toMatch(/^area-/);
      expect(area2.id).toMatch(/^area-/);
    });
  });

  describe('Reset Functionality', () => {
    it('should clear all data when reset is called', async () => {
      await locationStore.loadLocations();
      expect(locationStore.getLocations()).toHaveLength(2);
      
      locationStore.reset();
      
      expect(locationStore.getLocations()).toHaveLength(0);
    });

    it('should clear subscribers when reset is called', async () => {
      const subscriber = jest.fn();
      locationStore.subscribe(subscriber);
      
      await locationStore.loadLocations();
      expect(subscriber).toHaveBeenCalledTimes(1);
      
      locationStore.reset();
      await locationStore.addLocation({ name: 'Test Location' });
      
      // Subscriber should not be called after reset
      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });
});
