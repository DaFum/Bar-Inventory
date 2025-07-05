import { locationStore } from './location.store'; // Import the instance
import { Location, Counter, Area } from '../models';
import { dbService } from '../services/indexeddb.service';
import { generateId } from '../utils/helpers';

// Mocks
jest.mock('../services/indexeddb.service', () => ({
  dbService: {
    loadLocations: jest.fn(),
    saveLocation: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../utils/helpers', () => ({
  generateId: jest.fn((prefix: string) => `${prefix}-mock-id-${Math.random().toString(36).substr(2, 5)}`),
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
});
