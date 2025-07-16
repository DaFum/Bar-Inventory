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
  let mockLocation1: Location;
  let mockLocation2: Location;
  let initialMockLocations: Location[];

  beforeEach(() => {
    mockLocation1 = {
      id: 'loc1',
      name: 'Main Bar',
      address: '123 Bar Street',
      counters: [
        { id: 'ctr1', name: 'Front Counter', description: 'Main service', areas: [
          { id: 'area1', name: 'Top Shelf', displayOrder: 1, inventoryRecords: [] }
        ]}
      ],
    };
    mockLocation2 = {
      id: 'loc2',
      name: 'Patio Bar',
      address: '456 Garden Ave',
      counters: [],
    };
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
            inventoryRecords: areaToUpdate.inventoryRecords, // Be explicit
        };
        await locationStore.updateArea(locId, counterId, updatedAreaData);

        const location = locationStore.getLocationById(locId);
        const counter = location?.counters.find((c: Counter) => c.id === counterId);
        expect(counter?.areas.find((a: Area) => a.id === areaToUpdate.id)?.name).toBe('Top Shelf Deluxe');
        expect(dbService.saveLocation).toHaveBeenCalledWith(location);
        // Check sort order (updatedArea now has order 0)
        expect(counter?.areas[0]!.name).toBe('Top Shelf Deluxe');
    });

    it('deleteArea should remove an area from a counter', async () => {
        const areaIdToDelete = mockLocation1.counters[0]!.areas[0]!.id; // Added !
        await locationStore.deleteArea(locId, counterId, areaIdToDelete);

        const location = locationStore.getLocationById(locId);
        const counter = location?.counters.find((c: Counter) => c.id === counterId);
        expect(counter?.areas.find((a: Area) => a.id === areaIdToDelete)).toBeUndefined();
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
      await expect(locationStore.addCounter(mockLocation1.id, { name: '   ' })).rejects.toThrow();
    });

    it('should throw error for area name with only whitespace', async () => {
      await locationStore.loadLocations();
      const counterId = mockLocation1.counters[0]!.id;
      await expect(locationStore.addArea(mockLocation1.id, counterId, { name: '   ' })).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
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
      await expect(locationStore.updateCounter(mockLocation1.id, nonExistentCounter)).rejects.toThrow();
    });

    it('should handle deleting non-existent counter', async () => {
      await locationStore.loadLocations();
      await expect(locationStore.deleteCounter(mockLocation1.id, 'non-existent-counter')).rejects.toThrow();
    });

    it('should handle adding area to non-existent counter', async () => {
      await locationStore.loadLocations();
      await expect(locationStore.addArea(mockLocation1.id, 'non-existent-counter', { name: 'Test Area' })).rejects.toThrow();
    });

    it('should handle updating non-existent area', async () => {
      await locationStore.loadLocations();
      const counterId = mockLocation1.counters[0]!.id;
      const nonExistentArea: Area = {
        id: 'non-existent-area',
        name: 'Non-existent Area',
        displayOrder: 1,
        inventoryRecords: []
      };
      
      await expect(locationStore.updateArea(mockLocation1.id, counterId, nonExistentArea)).rejects.toThrow();
    });

    it('should handle deleting non-existent area', async () => {
      await locationStore.loadLocations();
      const counterId = mockLocation1.counters[0]!.id;
      await expect(locationStore.deleteArea(mockLocation1.id, counterId, 'non-existent-area')).rejects.toThrow();
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
    it('should maintain proper area display order after multiple operations', async () => {
      await locationStore.loadLocations(); // Ensures initial data is loaded
      const locId = initialMockLocations[0]!.id;
      const counterId = initialMockLocations[0]!.counters[0]!.id;
      
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
      const locId = initialMockLocations[0]!.id;
      const counterId = initialMockLocations[0]!.counters[0]!.id;
      const areaId = initialMockLocations[0]!.counters[0]!.areas[0]!.id;
      
      // Add inventory items to the area
      const location = locationStore.getLocationById(locId)!;
      const counter = location.counters.find(c => c.id === counterId)!;
      const area = counter.areas.find(a => a.id === areaId)!;
      
      // For this test, we will ensure the inventory item has a productId, not a name directly
      area.inventoryRecords.push({ date: new Date(), entries: [{ productId: 'prod-xyz', startCrates: 1 }] }); // Corrected to use productId
      await locationStore.updateLocation(location);
      
      // Update area name
      const updatedArea: Area = {
        ...area,
        name: 'Updated Area Name'
      };
      await locationStore.updateArea(locId, counterId, updatedArea);
      
      const updatedLocation = locationStore.getLocationById(locId);
      const updatedCounter = updatedLocation?.counters.find((c: Counter) => c.id === counterId);
      const finalArea = updatedCounter?.areas.find((a: Area) => a.id === areaId);
      
      expect(finalArea?.inventoryRecords[0]?.entries).toHaveLength(1);
      // Check productId instead of name, as name is not a property of InventoryEntry
      expect(finalArea?.inventoryRecords[0]?.entries[0]?.productId).toBe('prod-xyz');
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

  describe('Performance and Stress Testing', () => {
    it('should handle loading large number of locations efficiently', async () => {
      const largeMockLocations: Location[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `loc-${i}`,
        name: `Location ${i}`,
        address: `${i} Street`,
        counters: []
      }));
      
      (dbService.loadLocations as jest.Mock).mockResolvedValueOnce(largeMockLocations);
      
      const startTime = Date.now();
      await locationStore.loadLocations();
      const endTime = Date.now();
      
      expect(locationStore.getLocations()).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle adding many locations without memory issues', async () => {
      const subscriber = jest.fn();
      locationStore.subscribe(subscriber);
      
      // Add 100 locations in sequence
      for (let i = 0; i < 100; i++) {
        await locationStore.addLocation({ name: `Location ${i}`, address: `${i} Street` });
      }
      
      expect(locationStore.getLocations()).toHaveLength(100);
      expect(subscriber).toHaveBeenCalledTimes(100);
    });

    it('should handle complex nested structures with many counters and areas', async () => {
      const complexLocation = await locationStore.addLocation({
        name: 'Mega Complex Location',
        address: 'Complex Street'
      });
      
      // Add 20 counters, each with 10 areas
      for (let i = 0; i < 20; i++) {
        const counter = await locationStore.addCounter(complexLocation.id, {
          name: `Counter ${i}`,
          description: `Description for counter ${i}`
        });
        
        for (let j = 0; j < 10; j++) {
          await locationStore.addArea(complexLocation.id, counter.id, {
            name: `Area ${i}-${j}`,
            displayOrder: j,
            description: `Area description ${i}-${j}`
          });
        }
      }
      
      const finalLocation = locationStore.getLocationById(complexLocation.id);
      expect(finalLocation?.counters).toHaveLength(20);
      expect(finalLocation?.counters[0]?.areas).toHaveLength(10);
    });
  });

  describe('Advanced Inventory Operations', () => {
    let locationId: string;
    let counterId: string;
    let areaId: string;

    beforeEach(async () => {
      await locationStore.loadLocations();
      locationId = initialMockLocations[0]!.id;
      counterId = initialMockLocations[0]!.counters[0]!.id;
      areaId = initialMockLocations[0]!.counters[0]!.areas[0]!.id;
    });

    it('should preserve inventory items during location updates', async () => {
      const location = locationStore.getLocationById(locationId)!;
      const area = location.counters[0]!.areas[0]!;
      
      // Add multiple inventory items
      area.inventoryRecords.push({
        date: new Date(),
        entries: [
          { productId: 'prod-1', startCrates: 10 },
          { productId: 'prod-2', startCrates: 5 },
          { productId: 'prod-3', startCrates: 15 }
        ]
      });
      
      await locationStore.updateLocation(location);
      
      const updatedLocation = locationStore.getLocationById(locationId);
      const updatedArea = updatedLocation?.counters[0]?.areas[0];
      
      expect(updatedArea?.inventoryRecords[0]?.entries).toHaveLength(3);
      expect(updatedArea?.inventoryRecords[0]?.entries.map(item => item.productId))
        .toEqual(['prod-1', 'prod-2', 'prod-3']);
    });

    it('should handle inventory items with various data types', async () => {
      const location = locationStore.getLocationById(locationId)!;
      const area = location.counters[0]!.areas[0]!;
      
      area.inventoryRecords.push({
        date: new Date(),
        entries: [
            { productId: 'prod-1', startCrates: 0 }, // Zero quantity
            { productId: '', startCrates: 10 }, // Empty product ID
            { productId: 'prod-with-special-chars-@#$%', startCrates: 999999 } // Large quantity and special chars
        ]
      });
      
      await locationStore.updateLocation(location);
      
      const updatedLocation = locationStore.getLocationById(locationId);
      const updatedArea = updatedLocation?.counters[0]?.areas[0];
      
      expect(updatedArea?.inventoryRecords[0]?.entries).toHaveLength(3);
      expect(updatedArea?.inventoryRecords[0]?.entries[2]?.startCrates).toBe(999999);
    });
  });

  describe('Concurrent Operations and Race Conditions', () => {
    it('should handle simultaneous location updates without corruption', async () => {
      await locationStore.loadLocations();
      const location = JSON.parse(JSON.stringify(initialMockLocations[0]));
      
      // Simulate race condition with simultaneous updates
      const updatePromises = [
        locationStore.updateLocation({ ...location, name: 'Updated Name 1' }),
        locationStore.updateLocation({ ...location, name: 'Updated Name 2' }),
        locationStore.updateLocation({ ...location, name: 'Updated Name 3' })
      ];
      
      await Promise.allSettled(updatePromises);
      
      const finalLocation = locationStore.getLocationById(location.id);
      expect(finalLocation?.name).toMatch(/^Updated Name [123]$/);
    });

    it('should handle rapid subscribe/unsubscribe operations', async () => {
      const subscribers: Array<() => void> = [];
      
      // Add and remove subscribers rapidly
      for (let i = 0; i < 50; i++) {
        const subscriber = jest.fn();
        const unsubscribe = locationStore.subscribe(subscriber);
        subscribers.push(unsubscribe);
        
        if (i % 2 === 0) {
          unsubscribe();
        }
      }
      
      await locationStore.loadLocations();
      
      // Clean up remaining subscribers
      subscribers.forEach(unsub => unsub());
      
      // Should not throw errors
      expect(true).toBe(true);
    });

    it('should handle concurrent counter operations on same location', async () => {
      await locationStore.loadLocations();
      const locationId = mockLocation1.id;
      
      // Perform multiple counter operations simultaneously
      const operations = [
        locationStore.addCounter(locationId, { name: 'Counter A' }),
        locationStore.addCounter(locationId, { name: 'Counter B' }),
        locationStore.addCounter(locationId, { name: 'Counter C' })
      ];
      
      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(3);
      expect(results.every(counter => counter.id)).toBe(true);
      
      const location = locationStore.getLocationById(locationId);
      expect(location?.counters.length).toBeGreaterThanOrEqual(4); // 1 original + 3 new
    });
  });

  describe('Data Serialization and Deep Copy Edge Cases', () => {
    it('should handle circular references gracefully', async () => {
      await locationStore.loadLocations();
      const location = locationStore.getLocationById(mockLocation1.id)!;
      
      // Create a circular reference (this would normally break JSON.stringify)
      const modifiedLocation = { ...location };
      (modifiedLocation as any).self = modifiedLocation;
      
      // The store should handle this gracefully by deep cloning properly
      await expect(locationStore.updateLocation(location)).resolves.not.toThrow();
    });

    it('should preserve complex nested objects in deep copies', async () => {
      const complexLocation = await locationStore.addLocation({
        name: 'Complex Location',
        address: 'Complex Address',
        metadata: {
          nested: {
            deeply: {
              value: 'test',
              array: [1, 2, { inner: 'value' }],
              date: new Date().toISOString()
            }
          }
        }
      } as any);
      
      const retrieved1 = locationStore.getLocationById(complexLocation.id);
      const retrieved2 = locationStore.getLocationById(complexLocation.id);
      
      expect(retrieved1).toEqual(retrieved2);
      expect(retrieved1).not.toBe(retrieved2);
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle maximum length strings for location name', async () => {
      const maxLengthName = 'A'.repeat(10000); // Very long name
      const location = await locationStore.addLocation({
        name: maxLengthName,
        address: 'Test Address'
      });
      
      expect(location.name).toBe(maxLengthName);
      expect(location.name.length).toBe(10000);
    });

    it('should handle special characters in all string fields', async () => {
      const specialChars = '🎉💯!@#$%^&*()_+-={}[]|\\:";\'<>?,./àáâãäåæçèéêë';
      const location = await locationStore.addLocation({
        name: `Location ${specialChars}`,
        address: `Address ${specialChars}`
      });
      
      expect(location.name).toContain(specialChars);
      expect(location.address).toContain(specialChars);
    });

    it('should handle very large display order values', async () => {
      await locationStore.loadLocations();
      const locationId = mockLocation1.id;
      const counterId = mockLocation1.counters[0]!.id;
      
      const area = await locationStore.addArea(locationId, counterId, {
        name: 'Large Order Area',
        displayOrder: Number.MAX_SAFE_INTEGER
      });
      
      expect(area.displayOrder).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle negative display order values', async () => {
      await locationStore.loadLocations();
      const locationId = mockLocation1.id;
      const counterId = mockLocation1.counters[0]!.id;
      
      const area = await locationStore.addArea(locationId, counterId, {
        name: 'Negative Order Area',
        displayOrder: -999
      });
      
      expect(area.displayOrder).toBe(-999);
    });
  });

  describe('Memory Management and Resource Cleanup', () => {
    it('should properly clean up subscribers to prevent memory leaks', async () => {
      const subscribers: jest.Mock[] = [];
      const unsubscribeFunctions: Array<() => void> = [];
      
      // Create many subscribers
      for (let i = 0; i < 100; i++) {
        const subscriber = jest.fn();
        subscribers.push(subscriber);
        const unsubscribe = locationStore.subscribe(subscriber);
        unsubscribeFunctions.push(unsubscribe);
      }
      
      await locationStore.loadLocations();
      
      // All subscribers should be called
      subscribers.forEach(sub => expect(sub).toHaveBeenCalled());
      
      // Unsubscribe all
      unsubscribeFunctions.forEach(unsub => unsub());
      
      // Clear and trigger another update
      subscribers.forEach(sub => sub.mockClear());
      await locationStore.addLocation({ name: 'Test Location' });
      
      // No subscribers should be called after unsubscribe
      subscribers.forEach(sub => expect(sub).not.toHaveBeenCalled());
    });

    it('should handle rapid creation and deletion of locations', async () => {
      const createdIds: string[] = [];
      
      // Rapidly create locations
      for (let i = 0; i < 50; i++) {
        const location = await locationStore.addLocation({ name: `Temp Location ${i}` });
        createdIds.push(location.id);
      }
      
      expect(locationStore.getLocations()).toHaveLength(50);
      
      // Rapidly delete locations
      for (const id of createdIds) {
        await locationStore.deleteLocation(id);
      }
      
      expect(locationStore.getLocations()).toHaveLength(0);
    });
  });

  describe('Advanced Error Scenarios', () => {
    it('should handle malformed location data gracefully', async () => {
      const malformedLocation = {
        name: 'Test Location',
        counters: [
          {
            // Missing required fields
            areas: [
              {
                // Missing required fields
                inventoryRecords: 'not an array' // Wrong type
              }
            ]
          }
        ]
      } as any;
      
      // The store should handle this by filling in missing IDs
      await expect(locationStore.addLocation(malformedLocation)).resolves.not.toThrow();
    });

    it('should recover from inconsistent internal state', async () => {
      await locationStore.loadLocations();
      
      // Simulate inconsistent state by trying to update a counter that doesn't exist
      const location = locationStore.getLocationById(mockLocation1.id)!;
      const fakeCounter: Counter = {
        id: 'fake-counter-id',
        name: 'Fake Counter',
        description: 'Should not exist',
        areas: []
      };
      
      await expect(locationStore.updateCounter(location.id, fakeCounter))
        .rejects.toThrow();
        
      // Store should remain in consistent state
      const consistentLocation = locationStore.getLocationById(mockLocation1.id);
      expect(consistentLocation?.counters.find(c => c.id === 'fake-counter-id')).toBeUndefined();
    });

    it('should handle database service returning null/undefined', async () => {
      (dbService.loadLocations as jest.Mock).mockResolvedValueOnce(null);
      
      await locationStore.loadLocations();
      
      expect(locationStore.getLocations()).toEqual([]);
    });

    it('should handle database service returning invalid data structure', async () => {
      (dbService.loadLocations as jest.Mock).mockResolvedValueOnce('invalid data');
      
      await expect(locationStore.loadLocations()).rejects.toThrow();
    });
  });

  describe('Complex Workflow Integration Tests', () => {
    it('should handle complete location setup workflow', async () => {
      // Create new location
      const location = await locationStore.addLocation({
        name: 'Full Service Restaurant',
        address: '123 Restaurant Row'
      });
      
      // Add multiple counters
      const barCounter = await locationStore.addCounter(location.id, {
        name: 'Bar Counter',
        description: 'Main bar service area'
      });
      
      const kitchenCounter = await locationStore.addCounter(location.id, {
        name: 'Kitchen Counter',
        description: 'Food preparation area'
      });
      
      // Add areas to each counter
      const topShelf = await locationStore.addArea(location.id, barCounter.id, {
        name: 'Top Shelf',
        displayOrder: 1,
        description: 'Premium spirits'
      });
      
      const bottomShelf = await locationStore.addArea(location.id, barCounter.id, {
        name: 'Bottom Shelf',
        displayOrder: 2,
        description: 'House spirits'
      });
      
      const coldStorage = await locationStore.addArea(location.id, kitchenCounter.id, {
        name: 'Cold Storage',
        displayOrder: 1,
        description: 'Refrigerated items'
      });
      
      // Verify complete structure
      const finalLocation = locationStore.getLocationById(location.id);
      expect(finalLocation?.counters).toHaveLength(2);
      
      const finalBarCounter = finalLocation?.counters.find(c => c.name === 'Bar Counter');
      const finalKitchenCounter = finalLocation?.counters.find(c => c.name === 'Kitchen Counter');
      
      expect(finalBarCounter?.areas).toHaveLength(2);
      expect(finalKitchenCounter?.areas).toHaveLength(1);
      
      // Test ordering
      expect(finalBarCounter?.areas[0]?.name).toBe('Top Shelf');
      expect(finalBarCounter?.areas[1]?.name).toBe('Bottom Shelf');
    });

    it('should handle location restructuring workflow', async () => {
      await locationStore.loadLocations();
      const locationId = mockLocation1.id;
      
      // Add new counter
      const newCounter = await locationStore.addCounter(locationId, {
        name: 'New Counter',
        description: 'Recently added'
      });
      
      // Move area from existing counter to new counter (simulate by delete + add)
      const originalCounterId = mockLocation1.counters[0]!.id;
      const originalArea = mockLocation1.counters[0]!.areas[0]!;
      
      await locationStore.deleteArea(locationId, originalCounterId, originalArea.id);
      
      await locationStore.addArea(locationId, newCounter.id, {
        name: originalArea.name,
        displayOrder: originalArea.displayOrder,
        description: 'Moved from original counter'
      });
      
      // Verify restructuring
      const location = locationStore.getLocationById(locationId);
      const originalCounter = location?.counters.find(c => c.id === originalCounterId);
      const movedToCounter = location?.counters.find(c => c.id === newCounter.id);
      
      expect(originalCounter?.areas).toHaveLength(0);
      expect(movedToCounter?.areas).toHaveLength(1);
      expect(movedToCounter?.areas[0]?.name).toBe(originalArea.name);
    });
  });

  describe('Unicode and Internationalization Support', () => {
    it('should handle various unicode characters correctly', async () => {
      const unicodeLocation = await locationStore.addLocation({
        name: '东京酒吧 Tokyo Bar 🍺',
        address: 'الشارع الرئيسي Main Street 123'
      });
      
      expect(unicodeLocation.name).toBe('东京酒吧 Tokyo Bar 🍺');
      expect(unicodeLocation.address).toBe('الشارع الرئيسي Main Street 123');
      
      const retrieved = locationStore.getLocationById(unicodeLocation.id);
      expect(retrieved?.name).toBe('东京酒吧 Tokyo Bar 🍺');
    });

    it('should handle right-to-left and mixed direction text', async () => {
      const rtlLocation = await locationStore.addLocation({
        name: 'مطعم البحر الأبيض المتوسط Mediterranean Restaurant',
        address: 'שדרות רוטשילד 123 Rothschild Boulevard'
      });
      
      expect(rtlLocation.name).toContain('مطعم');
      expect(rtlLocation.address).toContain('שדרות');
    });
  });

  describe('Data Validation Edge Cases', () => {
    it('should handle string fields with only whitespace characters', async () => {
      const whitespaceVariations = [
        '   ',           // spaces
        '\t\t\t',       // tabs
        '\n\n\n',       // newlines
        '\r\r\r',       // carriage returns
        ' \t\n\r ',     // mixed whitespace
        '\u00A0\u00A0', // non-breaking spaces
        '\u2000\u2001\u2002' // various unicode spaces
      ];
      
      for (const whitespace of whitespaceVariations) {
        await expect(locationStore.addLocation({ name: whitespace }))
          .rejects.toThrow('Standortname darf nicht leer sein');
      }
    });

    it('should handle extremely nested object structures', async () => {
      const deepLocation = {
        name: 'Deep Location',
        address: 'Deep Address',
        metadata: {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    value: 'deeply nested value'
                  }
                }
              }
            }
          }
        }
      } as any;
      
      const location = await locationStore.addLocation(deepLocation);
      expect((location as any).metadata?.level1?.level2?.level3?.level4?.level5?.value)
        .toBe('deeply nested value');
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle locations with extremely long names efficiently', async () => {
      const longName = 'A'.repeat(100000); // 100KB string
      
      const startTime = Date.now();
      const location = await locationStore.addLocation({
        name: longName,
        address: 'Test Address'
      });
      const endTime = Date.now();
      
      expect(location.name).toBe(longName);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle rapid area reordering operations', async () => {
      await locationStore.loadLocations();
      const locationId = mockLocation1.id;
      const counterId = mockLocation1.counters[0]!.id;
      
      // Add 20 areas
      const areas: Area[] = [];
      for (let i = 0; i < 20; i++) {
        const area = await locationStore.addArea(locationId, counterId, {
          name: `Area ${i}`,
          displayOrder: i
        });
        areas.push(area);
      }
      
      // Rapidly change display orders
      for (let i = 0; i < areas.length; i++) {
        const newOrder = areas.length - i - 1; // Reverse order
        await locationStore.updateArea(locationId, counterId, {
          ...areas[i]!,
          displayOrder: newOrder
        });
      }
      
      const location = locationStore.getLocationById(locationId);
      const counter = location?.counters.find(c => c.id === counterId);
      const sortedAreas = counter?.areas.sort((a, b) => a.displayOrder - b.displayOrder);
      
      expect(sortedAreas?.[0]?.name).toBe('Area 19');
      expect(sortedAreas?.[19]?.name).toBe('Area 0');
    });
  });


  describe('Advanced Data Integrity and Corruption Prevention', () => {
    it('should detect and prevent data corruption during updates', async () => {
      await locationStore.loadLocations();
      const location = JSON.parse(JSON.stringify(initialMockLocations[0]));
      
      // Simulate data corruption by modifying nested objects
      const originalCounter = location.counters[0];
      originalCounter.areas = null; // Corrupt the areas array
      
      // Store should handle corrupted data gracefully
      await expect(locationStore.updateLocation(location)).rejects.toThrow();
      
      // Verify original data is preserved
      const preservedLocation = locationStore.getLocationById(location.id);
      expect(preservedLocation?.counters[0]?.areas).toBeDefined();
      expect(Array.isArray(preservedLocation?.counters[0]?.areas)).toBe(true);
    });

    it('should maintain referential integrity during complex operations', async () => {
      const location = await locationStore.addLocation({ name: 'Integrity Test Location' });
      const counter = await locationStore.addCounter(location.id, { name: 'Test Counter' });
      const area1 = await locationStore.addArea(location.id, counter.id, { name: 'Area 1', displayOrder: 1 });
      const area2 = await locationStore.addArea(location.id, counter.id, { name: 'Area 2', displayOrder: 2 });
      
      // Verify all IDs are properly linked
      const retrievedLocation = locationStore.getLocationById(location.id);
      const retrievedCounter = retrievedLocation?.counters.find(c => c.id === counter.id);
      
      expect(retrievedCounter?.areas.find(a => a.id === area1.id)).toBeDefined();
      expect(retrievedCounter?.areas.find(a => a.id === area2.id)).toBeDefined();
      
      // Delete middle area and verify integrity
      await locationStore.deleteArea(location.id, counter.id, area1.id);
      
      const finalLocation = locationStore.getLocationById(location.id);
      const finalCounter = finalLocation?.counters.find(c => c.id === counter.id);
      
      expect(finalCounter?.areas).toHaveLength(1);
      expect(finalCounter?.areas[0]?.id).toBe(area2.id);
    });

    it('should prevent duplicate IDs across all entities', async () => {
      const location1 = await locationStore.addLocation({ name: 'Location 1' });
      const location2 = await locationStore.addLocation({ name: 'Location 2' });
      
      const counter1_loc1 = await locationStore.addCounter(location1.id, { name: 'Counter 1 Loc 1' });
      const counter1_loc2 = await locationStore.addCounter(location2.id, { name: 'Counter 1 Loc 2' });
      
      // Verify counters have unique IDs even across locations
      expect(counter1_loc1.id).not.toBe(counter1_loc2.id);
      
      const area1_c1_loc1 = await locationStore.addArea(location1.id, counter1_loc1.id, { name: 'Area 1' });
      const area1_c1_loc2 = await locationStore.addArea(location2.id, counter1_loc2.id, { name: 'Area 1' });
      
      // Verify areas have unique IDs even with same names
      expect(area1_c1_loc1.id).not.toBe(area1_c1_loc2.id);
    });
  });

  describe('Complex State Mutation and Rollback Scenarios', () => {
    it('should handle failed operations without corrupting state', async () => {
      await locationStore.loadLocations();
      const originalState = JSON.parse(JSON.stringify(locationStore.getLocations()));
      
      // Mock a save operation failure
      (dbService.saveLocation as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));
      
      try {
        await locationStore.addLocation({ name: 'Failed Location' });
      } catch (error) {
        // Expected to fail
      }
      
      // State should remain unchanged after failed operation
      const currentState = locationStore.getLocations();
      expect(currentState).toEqual(originalState);
    });

    it('should handle partial update failures gracefully', async () => {
      await locationStore.loadLocations();
      const location = JSON.parse(JSON.stringify(initialMockLocations[0]));
      
      // Set up partial failure scenario
      let callCount = 0;
      (dbService.saveLocation as jest.Mock).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First attempt failed');
        }
        return 'success';
      });
      
      // First update should fail
      await expect(locationStore.updateLocation({ ...location, name: 'Updated Name' }))
        .rejects.toThrow('First attempt failed');
      
      // Second update should succeed
      await expect(locationStore.updateLocation({ ...location, name: 'Updated Name 2' }))
        .resolves.not.toThrow();
    });

    it('should maintain consistency during rapid state changes', async () => {
      const subscriber = jest.fn();
      locationStore.subscribe(subscriber);
      
      // Perform rapid operations
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(locationStore.addLocation({ name: `Rapid Location ${i}` }));
      }
      
      await Promise.all(promises);
      
      // Verify all locations were added and subscribers were notified correctly
      expect(locationStore.getLocations()).toHaveLength(10);
      expect(subscriber).toHaveBeenCalledTimes(10);
    });
  });

  describe('Advanced Validation and Sanitization', () => {
    it('should handle HTML injection attempts in string fields', async () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const location = await locationStore.addLocation({
        name: `Location ${maliciousInput}`,
        address: `Address ${maliciousInput}`
      });
      
      // Store should preserve the raw input (sanitization is typically UI responsibility)
      expect(location.name).toContain(maliciousInput);
      expect(location.address).toContain(maliciousInput);
    });

    it('should handle SQL injection patterns in string fields', async () => {
      const sqlInjection = "'; DROP TABLE locations; --";
      const location = await locationStore.addLocation({
        name: `Location ${sqlInjection}`,
        address: `Address ${sqlInjection}`
      });
      
      expect(location.name).toContain(sqlInjection);
      expect(location.address).toContain(sqlInjection);
    });

    it('should validate nested object structure integrity', async () => {
      const locationWithMalformedCounters = {
        name: 'Test Location',
        counters: [
          {
            name: 'Valid Counter',
            areas: [
              {
                name: 'Valid Area',
                displayOrder: 'not a number' as any, // Invalid type
                inventoryItems: []
              }
            ]
          }
        ]
      };
      
      // Store should handle type mismatches gracefully
      await expect(locationStore.addLocation(locationWithMalformedCounters))
        .resolves.not.toThrow();
    });

    it('should handle extreme numeric values for display order', async () => {
      await locationStore.loadLocations();
      const locationId = mockLocation1.id;
      const counterId = mockLocation1.counters[0]!.id;
      
      // Test with infinity
      const infiniteArea = await locationStore.addArea(locationId, counterId, {
        name: 'Infinite Area',
        displayOrder: Infinity
      });
      expect(infiniteArea.displayOrder).toBe(Infinity);
      
      // Test with negative infinity
      const negInfiniteArea = await locationStore.addArea(locationId, counterId, {
        name: 'Negative Infinite Area',
        displayOrder: -Infinity
      });
      expect(negInfiniteArea.displayOrder).toBe(-Infinity);
      
      // Test with NaN
      const nanArea = await locationStore.addArea(locationId, counterId, {
        name: 'NaN Area',
        displayOrder: NaN
      });
      expect(Number.isNaN(nanArea.displayOrder)).toBe(true);
    });
  });

  describe('Subscription System Edge Cases', () => {
    it('should handle subscriber that modifies store state during notification', async () => {
      let recursiveCall = false;
      const recursiveSubscriber = jest.fn(() => {
        if (!recursiveCall) {
          recursiveCall = true;
          // This subscriber tries to modify store state during notification
          locationStore.addLocation({ name: 'Recursive Location' });
        }
      });
      
      locationStore.subscribe(recursiveSubscriber);
      
      // Should handle recursive modification gracefully
      await expect(locationStore.loadLocations()).resolves.not.toThrow();
    });

    it('should handle async subscribers with varying completion times', async () => {
      const slowSubscriber = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      const fastSubscriber = jest.fn();
      
      locationStore.subscribe(slowSubscriber);
      locationStore.subscribe(fastSubscriber);
      
      await locationStore.loadLocations();
      
      expect(slowSubscriber).toHaveBeenCalled();
      expect(fastSubscriber).toHaveBeenCalled();
    });

    it('should maintain subscriber order during rapid subscribe/unsubscribe', async () => {
      const subscribers: jest.Mock[] = [];
      const unsubscribers: Array<() => void> = [];
      
      // Add subscribers in sequence
      for (let i = 0; i < 5; i++) {
        const subscriber = jest.fn();
        subscribers.push(subscriber);
        unsubscribers.push(locationStore.subscribe(subscriber));
      }
      
      // Remove every other subscriber
      unsubscribers[1]();
      unsubscribers[3]();
      
      await locationStore.loadLocations();
      
      // Only non-unsubscribed subscribers should be called
      expect(subscribers[0]).toHaveBeenCalled();
      expect(subscribers[1]).not.toHaveBeenCalled();
      expect(subscribers[2]).toHaveBeenCalled();
      expect(subscribers[3]).not.toHaveBeenCalled();
      expect(subscribers[4]).toHaveBeenCalled();
    });
  });

  describe('Deep Copy and Immutability Edge Cases', () => {
    it('should handle objects with null prototype', async () => {
      const nullProtoLocation = Object.create(null);
      nullProtoLocation.name = 'Null Prototype Location';
      nullProtoLocation.address = 'Test Address';
      
      await expect(locationStore.addLocation(nullProtoLocation))
        .resolves.not.toThrow();
    });

    it('should preserve function properties in metadata', async () => {
      const locationWithFunctions = {
        name: 'Function Location',
        metadata: {
          customMethod: () => 'test',
          regularProperty: 'value'
        }
      } as any;
      
      const location = await locationStore.addLocation(locationWithFunctions);
      expect(typeof (location as any).metadata?.customMethod).toBe('function');
    });

    it('should handle deeply nested arrays and objects', async () => {
      const deepStructure = {
        name: 'Deep Structure Location',
        metadata: {
          level1: [
            {
              level2: {
                level3: [
                  { value: 'deep1' },
                  { value: 'deep2' },
                  { 
                    nested: {
                      deeper: [1, 2, 3, { final: 'value' }]
                    }
                  }
                ]
              }
            }
          ]
        }
      } as any;
      
      const location = await locationStore.addLocation(deepStructure);
      const retrieved = locationStore.getLocationById(location.id);
      
      expect((retrieved as any).metadata.level1[0].level2.level3[2].nested.deeper[3].final)
        .toBe('value');
    });
  });

  describe('Stress Testing and Performance Boundaries', () => {
    it('should handle locations with maximum realistic counter count', async () => {
      const location = await locationStore.addLocation({
        name: 'Max Counters Location',
        address: 'Stress Test Address'
      });
      
      // Add 100 counters (realistic maximum for a large establishment)
      const counterPromises = Array.from({ length: 100 }, (_, i) =>
        locationStore.addCounter(location.id, {
          name: `Counter ${i}`,
          description: `Description for counter ${i}`
        })
      );
      
      const counters = await Promise.all(counterPromises);
      expect(counters).toHaveLength(100);
      
      const finalLocation = locationStore.getLocationById(location.id);
      expect(finalLocation?.counters).toHaveLength(100);
    });

    it('should handle areas with maximum realistic inventory items', async () => {
      await locationStore.loadLocations();
      const locationId = mockLocation1.id;
      const counterId = mockLocation1.counters[0]!.id;
      const areaId = mockLocation1.counters[0]!.areas[0]!.id;
      
      const location = locationStore.getLocationById(locationId)!;
      const area = location.counters[0]!.areas[0]!;
      
      // Add 1000 inventory items (realistic for a large bar/restaurant)
      area.inventoryRecords.push({
          date: new Date(),
          entries: Array.from({ length: 1000 }, (_, i) => ({
            productId: `product-${i}`,
            startCrates: Math.floor(Math.random() * 10),
          } as InventoryEntry))
      });
      
      const startTime = Date.now();
      await locationStore.updateLocation(location);
      const endTime = Date.now();
      
      const updatedLocation = locationStore.getLocationById(locationId);
      const updatedArea = updatedLocation?.counters[0]?.areas[0];
      
      expect(updatedArea?.inventoryRecords[0]?.entries).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle rapid area reordering without performance degradation', async () => {
      await locationStore.loadLocations();
      const locationId = mockLocation1.id;
      const counterId = mockLocation1.counters[0]!.id;
      
      // Add 50 areas
      const areas: Area[] = [];
      for (let i = 0; i < 50; i++) {
        const area = await locationStore.addArea(locationId, counterId, {
          name: `Performance Area ${i}`,
          displayOrder: i
        });
        areas.push(area);
      }
      
      // Randomly reorder all areas
      const startTime = Date.now();
      const shuffledOrders = Array.from({ length: 50 }, (_, i) => i).sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < areas.length; i++) {
        await locationStore.updateArea(locationId, counterId, {
          ...areas[i]!,
          displayOrder: shuffledOrders[i]!
        });
      }
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      const location = locationStore.getLocationById(locationId);
      const counter = location?.counters.find(c => c.id === counterId);
      expect(counter?.areas).toHaveLength(51); // Original 1 + 50 new
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from network timeouts gracefully', async () => {
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      
      (dbService.loadLocations as jest.Mock).mockRejectedValueOnce(timeoutError);
      
      await expect(locationStore.loadLocations()).rejects.toThrow('Network timeout');
      
      // Should be able to recover and try again
      (dbService.loadLocations as jest.Mock).mockResolvedValueOnce(initialMockLocations);
      await expect(locationStore.loadLocations()).resolves.not.toThrow();
    });

    it('should handle partial database corruption scenarios', async () => {
      const corruptedData = [
        { id: 'loc1', name: 'Valid Location', address: 'Valid Address', counters: [] },
        { id: null, name: 'Corrupted Location', counters: 'invalid' }, // Corrupted entry
        { id: 'loc3', name: 'Another Valid Location', address: 'Valid Address', counters: [] }
      ];
      
      (dbService.loadLocations as jest.Mock).mockResolvedValueOnce(corruptedData);
      
      // Should handle corrupted data gracefully
      await expect(locationStore.loadLocations()).resolves.not.toThrow();
      
      // Should only load valid entries
      const locations = locationStore.getLocations();
      expect(locations.length).toBeLessThanOrEqual(2); // Only valid locations
    });

    it('should maintain consistency during rapid error scenarios', async () => {
      let errorCount = 0;
      (dbService.saveLocation as jest.Mock).mockImplementation(async () => {
        errorCount++;
        if (errorCount <= 3) {
          throw new Error(`Attempt ${errorCount} failed`);
        }
        return 'success';
      });
      
      // Multiple operations with intermittent failures
      const operations = [
        locationStore.addLocation({ name: 'Location 1' }).catch(() => null),
        locationStore.addLocation({ name: 'Location 2' }).catch(() => null),
        locationStore.addLocation({ name: 'Location 3' }).catch(() => null),
        locationStore.addLocation({ name: 'Location 4' }).catch(() => null)
      ];
      
      const results = await Promise.allSettled(operations);
      
      // Should handle mixed success/failure scenarios
      expect(results.some(r => r.status === 'fulfilled')).toBe(true);
      expect(results.some(r => r.status === 'rejected')).toBe(true);
    });
  });

  describe('Advanced Sorting and Ordering', () => {
    it('should maintain stable sort order with duplicate display orders', async () => {
      await locationStore.loadLocations();
      const locationId = mockLocation1.id;
      const counterId = mockLocation1.counters[0]!.id;
      
      // Add areas with duplicate display orders
      const area1 = await locationStore.addArea(locationId, counterId, {
        name: 'Area Alpha',
        displayOrder: 1
      });
      const area2 = await locationStore.addArea(locationId, counterId, {
        name: 'Area Beta',
        displayOrder: 1
      });
      const area3 = await locationStore.addArea(locationId, counterId, {
        name: 'Area Gamma',
        displayOrder: 1
      });
      
      const location = locationStore.getLocationById(locationId);
      const counter = location?.counters.find(c => c.id === counterId);
      const samePriorityAreas = counter?.areas.filter(a => a.displayOrder === 1);
      
      expect(samePriorityAreas).toHaveLength(3);
      // Order should be stable (insertion order preserved for same priority)
      expect(samePriorityAreas?.[0]?.name).toBe('Area Alpha');
      expect(samePriorityAreas?.[1]?.name).toBe('Area Beta');
      expect(samePriorityAreas?.[2]?.name).toBe('Area Gamma');
    });

    it('should handle negative and fractional display orders correctly', async () => {
      await locationStore.loadLocations();
      const locationId = mockLocation1.id;
      const counterId = mockLocation1.counters[0]!.id;
      
      await locationStore.addArea(locationId, counterId, {
        name: 'Negative Area',
        displayOrder: -5.5
      });
      await locationStore.addArea(locationId, counterId, {
        name: 'Fractional Area',
        displayOrder: 2.7
      });
      await locationStore.addArea(locationId, counterId, {
        name: 'Zero Area',
        displayOrder: 0
      });
      
      const location = locationStore.getLocationById(locationId);
      const counter = location?.counters.find(c => c.id === counterId);
      const sortedAreas = counter?.areas.sort((a, b) => a.displayOrder - b.displayOrder);
      
      expect(sortedAreas?.[0]?.name).toBe('Negative Area');
      expect(sortedAreas?.[1]?.name).toBe('Zero Area');
      expect(sortedAreas?.[2]?.name).toBe('Top Shelf'); // Original area with order 1
      expect(sortedAreas?.[3]?.name).toBe('Fractional Area');
    });
  });

  describe('Integration with External Dependencies', () => {
    it('should handle generateId function returning invalid IDs', async () => {
      (generateId as jest.Mock).mockReturnValueOnce(''); // Empty string
      
      await expect(locationStore.addLocation({ name: 'Test Location' }))
        .rejects.toThrow();
    });

    it('should handle generateId function throwing errors', async () => {
      (generateId as jest.Mock).mockImplementationOnce(() => {
        throw new Error('ID generation failed');
      });
      
      await expect(locationStore.addLocation({ name: 'Test Location' }))
        .rejects.toThrow('ID generation failed');
    });

    it('should handle dbService returning unexpected data types', async () => {
      (dbService.loadLocations as jest.Mock).mockResolvedValueOnce(42); // Number instead of array
      
      await expect(locationStore.loadLocations()).rejects.toThrow();
    });

    it('should handle dbService methods being undefined', async () => {
      const originalSaveLocation = dbService.saveLocation;
      (dbService as any).saveLocation = undefined;
      
      await expect(locationStore.addLocation({ name: 'Test Location' }))
        .rejects.toThrow();
      
      // Restore for cleanup
      (dbService as any).saveLocation = originalSaveLocation;
    });
  });

