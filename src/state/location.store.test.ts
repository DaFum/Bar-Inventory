import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocationStore } from './location.store';

describe('LocationStore', () => {
  let locationStore: LocationStore;

  beforeEach(() => {
    locationStore = new LocationStore();
    // Reset any global state or mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any side effects
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(locationStore).toBeDefined();
      expect(locationStore.currentLocation).toBeNull();
      expect(locationStore.isLoading).toBe(false);
      expect(locationStore.error).toBeNull();
    });

    it('should initialize with provided initial state', () => {
      const initialState = {
        currentLocation: {
          lat: 37.7749,
          lng: -122.4194,
          name: 'San Francisco',
        },
        isLoading: false,
        error: null,
      };
      const store = new LocationStore(initialState);

      expect(store.currentLocation).toEqual(initialState.currentLocation);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  describe('setLocation', () => {
    it('should set a valid location', () => {
      const location = { lat: 40.7128, lng: -74.006, name: 'New York' };

      locationStore.setLocation(location);

      expect(locationStore.currentLocation).toEqual(location);
      expect(locationStore.error).toBeNull();
    });

    it('should handle location with minimal required fields', () => {
      const location = { lat: 0, lng: 0 };

      locationStore.setLocation(location);

      expect(locationStore.currentLocation).toEqual(location);
    });

    it('should validate latitude bounds', () => {
      const invalidLocation = { lat: 91, lng: 0 };

      expect(() => locationStore.setLocation(invalidLocation)).toThrow(
        'Invalid latitude: must be between -90 and 90'
      );
    });

    it('should validate longitude bounds', () => {
      const invalidLocation = { lat: 0, lng: 181 };

      expect(() => locationStore.setLocation(invalidLocation)).toThrow(
        'Invalid longitude: must be between -180 and 180'
      );
    });

    it('should handle edge case coordinates', () => {
      const edgeLocations = [
        { lat: 90, lng: 180 },
        { lat: -90, lng: -180 },
        { lat: 0, lng: 0 },
      ];

      edgeLocations.forEach((location) => {
        expect(() => locationStore.setLocation(location)).not.toThrow();
        expect(locationStore.currentLocation).toEqual(location);
      });
    });

    it('should handle null or undefined location', () => {
      locationStore.setLocation(null);
      expect(locationStore.currentLocation).toBeNull();

      locationStore.setLocation(undefined);
      expect(locationStore.currentLocation).toBeNull();
    });

    it('should handle location with additional properties', () => {
      const location = {
        lat: 40.7128,
        lng: -74.006,
        name: 'New York',
        address: '123 Main St',
        timestamp: Date.now(),
      };

      locationStore.setLocation(location);

      expect(locationStore.currentLocation).toEqual(location);
    });
  });

  describe('clearLocation', () => {
    it('should clear current location', () => {
      locationStore.setLocation({ lat: 40.7128, lng: -74.006 });

      locationStore.clearLocation();

      expect(locationStore.currentLocation).toBeNull();
      expect(locationStore.error).toBeNull();
    });

    it('should clear location when already null', () => {
      expect(locationStore.currentLocation).toBeNull();

      locationStore.clearLocation();

      expect(locationStore.currentLocation).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should set loading state to true', () => {
      locationStore.setLoading(true);

      expect(locationStore.isLoading).toBe(true);
    });

    it('should set loading state to false', () => {
      locationStore.setLoading(false);

      expect(locationStore.isLoading).toBe(false);
    });

    it('should clear error when setting loading to true', () => {
      locationStore.setError('Some error');

      locationStore.setLoading(true);

      expect(locationStore.isLoading).toBe(true);
      expect(locationStore.error).toBeNull();
    });

    it('should not affect current location when setting loading state', () => {
      const location = { lat: 40.7128, lng: -74.006 };
      locationStore.setLocation(location);

      locationStore.setLoading(true);

      expect(locationStore.currentLocation).toEqual(location);
      expect(locationStore.isLoading).toBe(true);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const errorMessage = 'Location access denied';

      locationStore.setError(errorMessage);

      expect(locationStore.error).toBe(errorMessage);
      expect(locationStore.isLoading).toBe(false);
    });

    it('should handle error objects', () => {
      const error = new Error('Network error');

      locationStore.setError(error.message);

      expect(locationStore.error).toBe('Network error');
    });

    it('should clear loading state when setting error', () => {
      locationStore.setLoading(true);

      locationStore.setError('Some error');

      expect(locationStore.isLoading).toBe(false);
      expect(locationStore.error).toBe('Some error');
    });

    it('should handle null or empty error', () => {
      locationStore.setError(null);
      expect(locationStore.error).toBeNull();

      locationStore.setError('');
      expect(locationStore.error).toBe('');
    });

    it('should handle undefined error', () => {
      locationStore.setError(undefined);
      expect(locationStore.error).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear existing error', () => {
      locationStore.setError('Some error');

      locationStore.clearError();

      expect(locationStore.error).toBeNull();
    });

    it('should handle clearing when no error exists', () => {
      expect(locationStore.error).toBeNull();

      locationStore.clearError();

      expect(locationStore.error).toBeNull();
    });

    it('should not affect loading state when clearing error', () => {
      locationStore.setLoading(true);
      locationStore.setError('Some error');

      locationStore.clearError();

      expect(locationStore.error).toBeNull();
      expect(locationStore.isLoading).toBe(false);
    });
  });

  describe('getCurrentPosition', () => {
    beforeEach(() => {
      // Mock geolocation API
      Object.defineProperty(global.navigator, 'geolocation', {
        value: {
          getCurrentPosition: vi.fn(),
        },
        configurable: true,
      });
    });

    it('should successfully get current position', async () => {
      const mockPosition = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10,
        },
      };

      vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation((success) =>
        success(mockPosition)
      );

      await locationStore.getCurrentPosition();

      expect(locationStore.currentLocation).toEqual({
        lat: 37.7749,
        lng: -122.4194,
      });
      expect(locationStore.isLoading).toBe(false);
      expect(locationStore.error).toBeNull();
    });

    it('should handle geolocation permission denied error', async () => {
      const mockError = { code: 1, message: 'Permission denied' };

      vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation((success, error) =>
        error(mockError)
      );

      await locationStore.getCurrentPosition();

      expect(locationStore.currentLocation).toBeNull();
      expect(locationStore.isLoading).toBe(false);
      expect(locationStore.error).toContain('Permission denied');
    });

    it('should handle geolocation position unavailable error', async () => {
      const mockError = { code: 2, message: 'Position unavailable' };

      vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation((success, error) =>
        error(mockError)
      );

      await locationStore.getCurrentPosition();

      expect(locationStore.error).toContain('Position unavailable');
    });

    it('should handle geolocation timeout error', async () => {
      const mockError = { code: 3, message: 'Timeout' };

      vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation((success, error) =>
        error(mockError)
      );

      await locationStore.getCurrentPosition();

      expect(locationStore.error).toContain('Timeout');
    });

    it('should handle geolocation not available', async () => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        configurable: true,
      });

      await locationStore.getCurrentPosition();

      expect(locationStore.error).toContain('Geolocation is not supported');
    });

    it('should set loading state during position request', () => {
      vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation((success) => {
        expect(locationStore.isLoading).toBe(true);
        success({
          coords: { latitude: 0, longitude: 0, accuracy: 10 },
        });
      });

      locationStore.getCurrentPosition();
    });

    it('should handle position with additional coordinate properties', async () => {
      const mockPosition = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10,
          altitude: 100,
          altitudeAccuracy: 5,
          heading: 45,
          speed: 0,
        },
        timestamp: Date.now(),
      };

      vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation((success) =>
        success(mockPosition)
      );

      await locationStore.getCurrentPosition();

      expect(locationStore.currentLocation).toEqual({
        lat: 37.7749,
        lng: -122.4194,
      });
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const point1 = { lat: 40.7128, lng: -74.006 }; // New York
      const point2 = { lat: 34.0522, lng: -118.2437 }; // Los Angeles

      const distance = locationStore.calculateDistance(point1, point2);

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeCloseTo(3944, 0); // Approximate distance in km
    });

    it('should return 0 for same coordinates', () => {
      const point = { lat: 40.7128, lng: -74.006 };

      const distance = locationStore.calculateDistance(point, point);

      expect(distance).toBe(0);
    });

    it('should handle edge case coordinates', () => {
      const point1 = { lat: 90, lng: 180 };
      const point2 = { lat: -90, lng: -180 };

      const distance = locationStore.calculateDistance(point1, point2);

      expect(distance).toBeGreaterThan(0);
      expect(typeof distance).toBe('number');
    });

    it('should calculate distance between antipodal points', () => {
      const point1 = { lat: 0, lng: 0 };
      const point2 = { lat: 0, lng: 180 };

      const distance = locationStore.calculateDistance(point1, point2);

      expect(distance).toBeCloseTo(20015, 0); // Half of Earth's circumference
    });

    it('should handle small distance calculations', () => {
      const point1 = { lat: 40.7128, lng: -74.006 };
      const point2 = { lat: 40.7129, lng: -74.0061 };

      const distance = locationStore.calculateDistance(point1, point2);

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1); // Less than 1 km
    });

    it('should throw error for invalid coordinates', () => {
      const validPoint = { lat: 40.7128, lng: -74.006 };
      const invalidPoint = { lat: 91, lng: 0 };

      expect(() => locationStore.calculateDistance(validPoint, invalidPoint)).toThrow(
        'Invalid coordinates'
      );
    });

    it('should throw error for null or undefined coordinates', () => {
      const validPoint = { lat: 40.7128, lng: -74.006 };

      expect(() => locationStore.calculateDistance(validPoint, null)).toThrow(
        'Invalid coordinates'
      );

      expect(() => locationStore.calculateDistance(null, validPoint)).toThrow(
        'Invalid coordinates'
      );
    });
  });

  describe('isLocationValid', () => {
    it('should return true for valid coordinates', () => {
      const validLocations = [
        { lat: 0, lng: 0 },
        { lat: 40.7128, lng: -74.006 },
        { lat: -33.8688, lng: 151.2093 },
        { lat: 90, lng: 180 },
        { lat: -90, lng: -180 },
        { lat: 89.9999, lng: 179.9999 },
        { lat: -89.9999, lng: -179.9999 },
      ];

      validLocations.forEach((location) => {
        expect(locationStore.isLocationValid(location)).toBe(true);
      });
    });

    it('should return false for invalid coordinates', () => {
      const invalidLocations = [
        { lat: 91, lng: 0 },
        { lat: -91, lng: 0 },
        { lat: 0, lng: 181 },
        { lat: 0, lng: -181 },
        { lat: NaN, lng: 0 },
        { lat: 0, lng: NaN },
        { lat: Infinity, lng: 0 },
        { lat: 0, lng: -Infinity },
        null,
        undefined,
        {},
        { lat: 0 }, // missing lng
        { lng: 0 }, // missing lat
        { lat: '40.7128', lng: -74.006 }, // string coordinates
        { lat: 40.7128, lng: '-74.0060' },
      ];

      invalidLocations.forEach((location) => {
        expect(locationStore.isLocationValid(location)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(locationStore.isLocationValid({ lat: 0, lng: 0 })).toBe(true);
      expect(locationStore.isLocationValid({ lat: -0, lng: -0 })).toBe(true);
    });
  });

  describe('getLocationHistory', () => {
    it('should return empty history initially', () => {
      expect(locationStore.getLocationHistory()).toEqual([]);
    });

    it('should track location history', () => {
      const locations = [
        { lat: 40.7128, lng: -74.006, name: 'New York' },
        { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
        { lat: 37.7749, lng: -122.4194, name: 'San Francisco' },
      ];

      locations.forEach((location) => {
        locationStore.setLocation(location);
      });

      const history = locationStore.getLocationHistory();
      expect(history).toHaveLength(3);
      expect(history).toEqual(locations);
    });

    it('should limit history size', () => {
      // Add more locations than the limit
      for (let i = 0; i < 15; i++) {
        locationStore.setLocation({ lat: i, lng: i });
      }

      const history = locationStore.getLocationHistory();
      expect(history.length).toBe(10); // Assuming max history is 10
      expect(history[0]).toEqual({ lat: 5, lng: 5 }); // Oldest kept
      expect(history[9]).toEqual({ lat: 14, lng: 14 }); // Newest
    });
  });

  describe('clearLocationHistory', () => {
    it('should clear location history', () => {
      locationStore.setLocation({ lat: 40.7128, lng: -74.006 });
      locationStore.setLocation({ lat: 34.0522, lng: -118.2437 });

      locationStore.clearLocationHistory();

      expect(locationStore.getLocationHistory()).toEqual([]);
    });
  });

  describe('state management integration', () => {
    it('should maintain state consistency during operations', () => {
      // Test state transitions
      expect(locationStore.isLoading).toBe(false);
      expect(locationStore.currentLocation).toBeNull();
      expect(locationStore.error).toBeNull();

      locationStore.setLoading(true);
      expect(locationStore.isLoading).toBe(true);
      expect(locationStore.error).toBeNull();

      locationStore.setLocation({ lat: 40.7128, lng: -74.006 });
      expect(locationStore.currentLocation).toBeDefined();
      expect(locationStore.isLoading).toBe(false);

      locationStore.setError('Test error');
      expect(locationStore.error).toBe('Test error');
      expect(locationStore.isLoading).toBe(false);
    });

    it('should handle rapid state changes', () => {
      for (let i = 0; i < 100; i++) {
        locationStore.setLoading(i % 2 === 0);
        locationStore.setLocation({ lat: i % 90, lng: i % 180 });
        if (i % 10 === 0) {
          locationStore.setError(`Error ${i}`);
          locationStore.clearError();
        }
      }

      expect(locationStore.currentLocation).toEqual({
        lat: 99 % 90,
        lng: 99 % 180,
      });
      expect(locationStore.isLoading).toBe(false);
      expect(locationStore.error).toBeNull();
    });

    it('should handle concurrent operations', async () => {
      // Mock geolocation
      Object.defineProperty(global.navigator, 'geolocation', {
        value: {
          getCurrentPosition: vi.fn().mockImplementation((success) => {
            setTimeout(
              () =>
                success({
                  coords: { latitude: 37.7749, longitude: -122.4194 },
                }),
              100
            );
          }),
        },
        configurable: true,
      });

      // Start multiple operations
      const promises = [
        locationStore.getCurrentPosition(),
        locationStore.getCurrentPosition(),
        locationStore.getCurrentPosition(),
      ];

      await Promise.all(promises);

      expect(locationStore.currentLocation).toEqual({
        lat: 37.7749,
        lng: -122.4194,
      });
      expect(locationStore.isLoading).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete location workflow', async () => {
      // Mock successful geolocation
      const mockPosition = {
        coords: { latitude: 37.7749, longitude: -122.4194 },
      };

      vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation((success) =>
        success(mockPosition)
      );

      // Start location request
      await locationStore.getCurrentPosition();

      // Verify location was set
      expect(locationStore.currentLocation).toEqual({
        lat: 37.7749,
        lng: -122.4194,
      });

      // Calculate distance to another point
      const distance = locationStore.calculateDistance(locationStore.currentLocation, {
        lat: 40.7128,
        lng: -74.006,
      });

      expect(distance).toBeGreaterThan(0);

      // Verify location is in history
      expect(locationStore.getLocationHistory()).toContain(
        expect.objectContaining({
          lat: 37.7749,
          lng: -122.4194,
        })
      );

      // Clear location
      locationStore.clearLocation();
      expect(locationStore.currentLocation).toBeNull();
    });

    it('should handle error recovery workflow', async () => {
      // Set an error
      locationStore.setError('Initial error');
      expect(locationStore.error).toBe('Initial error');

      // Start loading (should clear error)
      locationStore.setLoading(true);
      expect(locationStore.error).toBeNull();
      expect(locationStore.isLoading).toBe(true);

      // Set location (should stop loading)
      locationStore.setLocation({ lat: 40.7128, lng: -74.006 });
      expect(locationStore.isLoading).toBe(false);
      expect(locationStore.currentLocation).toBeDefined();

      // Verify error is still cleared
      expect(locationStore.error).toBeNull();
    });

    it('should handle location permission workflow', async () => {
      // Mock permission denied
      vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation((success, error) =>
        error({ code: 1, message: 'Permission denied' })
      );

      await locationStore.getCurrentPosition();

      expect(locationStore.error).toContain('Permission denied');
      expect(locationStore.currentLocation).toBeNull();

      // Clear error and try manual location
      locationStore.clearError();
      locationStore.setLocation({ lat: 40.7128, lng: -74.006 });

      expect(locationStore.error).toBeNull();
      expect(locationStore.currentLocation).toBeDefined();
    });
  });

  describe('edge cases and stress tests', () => {
    it('should handle extremely large coordinate numbers', () => {
      // Test with valid but large numbers
      const locations = [
        { lat: 89.999999, lng: 179.999999 },
        { lat: -89.999999, lng: -179.999999 },
      ];

      locations.forEach((location) => {
        expect(() => locationStore.setLocation(location)).not.toThrow();
        expect(locationStore.isLocationValid(location)).toBe(true);
      });
    });

    it('should handle precision edge cases', () => {
      const location = { lat: 40.71280000000001, lng: -74.00600000000001 };

      locationStore.setLocation(location);
      expect(locationStore.currentLocation).toEqual(location);

      const distance = locationStore.calculateDistance(location, location);
      expect(distance).toBe(0);
    });

    it('should handle memory cleanup', () => {
      // Create many locations to test memory management
      for (let i = 0; i < 1000; i++) {
        locationStore.setLocation({
          lat: Math.random() * 180 - 90,
          lng: Math.random() * 360 - 180,
        });
      }

      locationStore.clearLocation();
      locationStore.clearLocationHistory();

      expect(locationStore.currentLocation).toBeNull();
      expect(locationStore.getLocationHistory()).toEqual([]);
    });
  });
});
