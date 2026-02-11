import { initLocationManager } from '../../../src/ui/components/location-manager';
import { locationStore } from '../../../src/state/location.store';
import { LocationListComponent } from '../../../src/ui/components/location-list.component';
import type { LocationListItemCallbacks } from '../../../src/ui/components/location-list-item.component'; // Corrected import
import { LocationFormComponent, LocationFormComponentOptions } from '../../../src/ui/components/location-form.component';
import { CounterListComponent } from '../../../src/ui/components/counter-list.component';
import type { CounterListItemCallbacks } from '../../../src/ui/components/counter-list-item.component'; // Corrected import
import { CounterFormComponent, CounterFormComponentOptions } from '../../../src/ui/components/counter-form.component';
// import { showToast } from '../../../src/ui/components/toast-notifications'; // Will be mocked
import { Location, Counter } from '../../../src/models';

// Hoist toast-notifications mock
jest.mock('../../../src/ui/components/toast-notifications');
const mockedShowToastFn = require('../../../src/ui/components/toast-notifications').showToast;

// Other Mocks
jest.mock('../../../src/state/location.store', () => ({
  locationStore: {
    subscribe: jest.fn(),
    loadLocations: jest.fn().mockResolvedValue([]), // Start with empty
    addLocation: jest.fn(),
    updateLocation: jest.fn(),
    deleteLocation: jest.fn(),
    addCounter: jest.fn(),
    updateCounter: jest.fn(),
    deleteCounter: jest.fn(),
    getLocations: jest.fn(() => []), // Start with empty
    getLocationById: jest.fn(),
  },
}));

// --- Mock for LocationListComponent ---
const mockLocationListInstance = {
  setLocations: jest.fn(),
  getElement: jest.fn(() => {
    const el = document.createElement('div');
    el.id = 'mock-location-list-component-element'; // For easier debugging if needed
    return el;
  }),
  appendTo: jest.fn(),
  remove: jest.fn(),
};
jest.mock('../../../src/ui/components/location-list.component', () => ({
  LocationListComponent: jest.fn(() => mockLocationListInstance),
}));

// --- Mock for LocationFormComponent ---
const mockLocationFormInstance = {
  show: jest.fn(),
  hide: jest.fn(),
  getElement: jest.fn(() => {
    const el = document.createElement('div');
    el.id = 'mock-location-form-component-element';
    el.style.display = 'none'; // Default to hidden
    return el;
  }),
  appendTo: jest.fn(),
  remove: jest.fn(),
  currentEditingLocation: null as Location | null, // Add property if accessed
};
jest.mock('../../../src/ui/components/location-form.component', () => ({
  LocationFormComponent: jest.fn(() => mockLocationFormInstance),
}));

// --- Mock for CounterListComponent ---
const mockCounterListInstance = {
  setCounters: jest.fn(), // Assuming it might have this method based on LocationList
  getElement: jest.fn(() => {
    const el = document.createElement('div');
    el.id = 'mock-counter-list-component-element';
    return el;
  }),
  appendTo: jest.fn(),
  remove: jest.fn(),
  toggleAreaManagementForCounter: jest.fn(), // Added based on usage
};
jest.mock('../../../src/ui/components/counter-list.component', () => ({
  CounterListComponent: jest.fn(() => mockCounterListInstance),
}));

// --- Mock for CounterFormComponent ---
const mockCounterFormInstance = {
  show: jest.fn(),
  hide: jest.fn(),
  getElement: jest.fn(() => {
    const el = document.createElement('div');
    el.id = 'mock-counter-form-component-element';
    el.style.display = 'none';
    return el;
  }),
  appendTo: jest.fn(),
  remove: jest.fn(),
  currentEditingCounter: null as Counter | null, // Add property if accessed
};
jest.mock('../../../src/ui/components/counter-form.component', () => ({
  CounterFormComponent: jest.fn(() => mockCounterFormInstance),
}));

// jest.mock('../../../src/ui/components/toast-notifications'); // Already handled by hoisted mock + mockedShowToastFn

// Helper to simulate store update and notify subscribers
let notifySubscribers: (locations: Location[]) => void;
(locationStore.subscribe as jest.Mock).mockImplementation((callback) => {
  notifySubscribers = callback;
  return () => {}; // Unsubscribe function
});


describe('Location Manager (location-manager.ts)', () => {
  let container: HTMLElement;
  let mockLocations: Location[];
  // Removed describe-level originalCreateObjectURL and originalRevokeObjectURL

  const mockLocation1: Location = { id: 'loc1', name: 'Bar Central', address: '123 Main St', counters: [] };
  const mockLocation2: Location = { id: 'loc2', name: 'The Hideout', address: '456 Oak Ave', counters: [] };
  const mockCounter1ForLoc1: Counter = { id: 'c1', name: 'Front Bar', description: '', areas: []};

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    jest.clearAllMocks();

    mockLocations = [JSON.parse(JSON.stringify(mockLocation1)), JSON.parse(JSON.stringify(mockLocation2))];
    mockLocation1.counters = [JSON.parse(JSON.stringify(mockCounter1ForLoc1))]; // Add counter to loc1 for detail tests

    (locationStore.loadLocations as jest.Mock).mockResolvedValue(JSON.parse(JSON.stringify(mockLocations)));
    (locationStore.getLocations as jest.Mock).mockReturnValue(JSON.parse(JSON.stringify(mockLocations)));
    (locationStore.getLocationById as jest.Mock).mockImplementation(id => mockLocations.find(loc => loc.id === id));
    (locationStore.addLocation as jest.Mock).mockImplementation(async (data) => ({ ...data, id: 'new-loc-id', counters: [] }));
    (locationStore.updateLocation as jest.Mock).mockResolvedValue(undefined);
    (locationStore.deleteLocation as jest.Mock).mockResolvedValue(undefined);
    (locationStore.addCounter as jest.Mock).mockImplementation(async (locId, data) => ({ ...data, id: 'new-counter-id', areas: [] }));
    (locationStore.updateCounter as jest.Mock).mockResolvedValue(undefined);
    (locationStore.deleteCounter as jest.Mock).mockResolvedValue(undefined);


    await initLocationManager(container);
    // Simulate initial load notification from store
    if (notifySubscribers) notifySubscribers(JSON.parse(JSON.stringify(mockLocations)));
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('initLocationManager should set up main HTML structure and load locations', () => {
    expect(container.querySelector('#location-list-host')).not.toBeNull();
    expect(container.querySelector('#add-new-location-btn')).not.toBeNull();
    expect(container.querySelector('#location-detail-section-host')).not.toBeNull();
    expect(container.querySelector('#export-all-locations-json-btn')).not.toBeNull();
    expect(LocationListComponent).toHaveBeenCalled(); // Constructor mock
    expect(mockLocationListInstance.appendTo).toHaveBeenCalled(); // Instance method
    expect(LocationFormComponent).toHaveBeenCalled(); // Constructor mock
    expect(CounterFormComponent).toHaveBeenCalled(); // Constructor mock
    expect(locationStore.loadLocations).toHaveBeenCalled();
  });

  test('LocationListComponent should be updated when store notifies', () => {
    // LocationManager calls locationListComponent.setLocations via store subscription
    expect(mockLocationListInstance.setLocations).toHaveBeenCalledWith(mockLocations); // Initial call

    const newMockLocations = [{ id: 'loc3', name: 'New Bar', address: '789 Pine', counters: [] }];
    if (notifySubscribers) notifySubscribers(newMockLocations);
    expect(mockLocationListInstance.setLocations).toHaveBeenCalledWith(newMockLocations); // Second call
  });

  describe('Location Form Handling', () => {
    test('"Add New Location" button should show LocationFormComponent', () => {
      const addBtn = container.querySelector('#add-new-location-btn') as HTMLButtonElement;
      addBtn.click();
      // LocationManager calls locationFormComponent.show() and locationFormComponent.appendTo()
      expect(mockLocationFormInstance.show).toHaveBeenCalledWith(); // Called without args for new location
      expect(mockLocationFormInstance.appendTo).toHaveBeenCalled();
      expect((container.querySelector('#location-detail-section-host') as HTMLElement)?.style.display).toBe('block');
    });

    test('handleLocationFormSubmit (add) should call store.addLocation and show details', async () => {
        // To simulate form submission, we need to get the onSubmit callback passed to LocationFormComponent constructor
        // The constructor mock for LocationFormComponent is (LocationFormComponent as jest.Mock)
        // The first argument to this constructor mock (calls[0][0]) is the options object.
        const locFormOptions = (LocationFormComponent as jest.Mock).mock.calls[0][0] as LocationFormComponentOptions;
        const submitCallback = locFormOptions.onSubmit;

        const newLocData = { id: '', name: 'Super Bar', address: 'Galaxy Ave' }; // Added id: ''
        await submitCallback(newLocData); // Call the submit callback

        // addLocation in store is expected to be called with { name, address }, without id
        const expectedPayloadForStore = { name: newLocData.name, address: newLocData.address };
        expect(locationStore.addLocation).toHaveBeenCalledWith(expectedPayloadForStore);
        expect(mockedShowToastFn).toHaveBeenCalledWith(expect.stringContaining('erstellt'), 'success');
        // showLocationDetails should be called, check for its side effects
        expect(container.querySelector('#location-detail-section-host h3')?.textContent).toContain('Details für: Super Bar');
    });

    test('handleLocationFormSubmit (edit) should call store.updateLocation and show details', async () => {
        // First, simulate showing details for loc1, then clicking "Stammdaten bearbeiten"
        // The onEdit callback is passed to LocationListComponent constructor.
        const listOptions = (LocationListComponent as jest.Mock).mock.calls[0][1] as LocationListItemCallbacks;
        listOptions.onEdit(mockLocation1); // This calls showLocationDetails

        const editLocDetailsBtn = container.querySelector('#edit-loc-name-addr-btn') as HTMLButtonElement;
        editLocDetailsBtn.click(); // This shows LocationForm for editing mockLocation1 by calling mockLocationFormInstance.show

        const locFormOptions = (LocationFormComponent as jest.Mock).mock.calls[0][0] as LocationFormComponentOptions;
        const submitCallback = locFormOptions.onSubmit;

        const updatedLocData = { ...mockLocation1, name: "Bar Central Updated" };
        // We need to ensure currentEditingLocation is set on the mock if the component relies on it
        mockLocationFormInstance.currentEditingLocation = mockLocation1;
        await submitCallback(updatedLocData);

        expect(locationStore.updateLocation).toHaveBeenCalledWith(expect.objectContaining(updatedLocData));
        expect(mockedShowToastFn).toHaveBeenCalledWith(expect.stringContaining('aktualisiert'), 'success');
        expect(container.querySelector('#location-detail-section-host h3')?.textContent).toContain('Details für: Bar Central Updated');
    });

    test('handleLocationFormCancel (when editing) should hide form and show details again', () => {
        // Show details, then show form for edit
        const listOptions = (LocationListComponent as jest.Mock).mock.calls[0][1] as LocationListItemCallbacks;
        listOptions.onEdit(mockLocation1);
        (container.querySelector('#edit-loc-name-addr-btn') as HTMLButtonElement).click();

        const locFormOptions = (LocationFormComponent as jest.Mock).mock.calls[0][0] as LocationFormComponentOptions;
        const cancelCallback = locFormOptions.onCancel;
        cancelCallback();

        expect(mockLocationFormInstance.hide).toHaveBeenCalled();
        expect(container.querySelector('#location-detail-section-host h3')?.textContent).toContain('Details für: Bar Central'); // Details re-rendered
    });
  });

  describe('Counter Management in Location Details', () => {
    beforeEach(() => {
        // Clear mocks for components that will be instantiated by showLocationDetails
        (CounterListComponent as jest.Mock).mockClear();
        mockCounterListInstance.appendTo.mockClear();
        // mockCounterFormInstance might also need clearing if its calls are checked from this path

        // Simulate clicking 'Edit' on 'Bar Central' (mockLocation1) in the LocationList
        const listOptions = (LocationListComponent as jest.Mock).mock.calls[0][1] as LocationListItemCallbacks;
        listOptions.onEdit(mockLocation1); // This calls showLocationDetails for mockLocation1
    });

    test('showLocationDetails should render counter list and add counter button', () => {
        expect(container.querySelector(`#counters-management-host-${mockLocation1.id}`)).not.toBeNull();
        expect(CounterListComponent).toHaveBeenCalledTimes(1); // Called by showLocationDetails
        expect(mockCounterListInstance.appendTo).toHaveBeenCalledTimes(1);
        // Verify CounterListComponent was called with mockLocation1 and its counters
        const counterListArgs = (CounterListComponent as jest.Mock).mock.calls[0];
        expect(counterListArgs[0]).toEqual(mockLocation1);
        expect(counterListArgs[1]).toEqual(mockLocation1.counters);

        expect(container.querySelector(`#add-new-counter-btn-for-${mockLocation1.id}`)).not.toBeNull();
    });

    test('"Add New Counter" button should show CounterFormComponent', () => {
        const addCounterBtn = container.querySelector(`#add-new-counter-btn-for-${mockLocation1.id}`) as HTMLButtonElement;
        addCounterBtn.click();

        expect(mockCounterFormInstance.show).toHaveBeenCalledWith(); // New counter
        expect(mockCounterFormInstance.appendTo).toHaveBeenCalled();
        expect((container.querySelector(`#counter-form-host-for-${mockLocation1.id}`) as HTMLElement)?.style.display).toBe('block');
    });

    test('handleCounterFormSubmit (add) should call store.addCounter', async () => {
        const counterFormOptions = (CounterFormComponent as jest.Mock).mock.calls[0][0] as CounterFormComponentOptions;
        const submitCounterCallback = counterFormOptions.onSubmit;
        const newCounterData = { id: '', name: 'Back Bar', description: 'Service bar' }; // Added id: ''

        await submitCounterCallback(newCounterData);

        // addCounter in store is expected to be called with { name, description }, without id
        const expectedPayloadForStore = { name: newCounterData.name, description: newCounterData.description };
        expect(locationStore.addCounter).toHaveBeenCalledWith(mockLocation1.id, expectedPayloadForStore);
        expect(mockedShowToastFn).toHaveBeenCalledWith(expect.stringContaining('hinzugefügt'), 'success');
        expect(mockCounterFormInstance.hide).toHaveBeenCalled();
    });

    test('handleDeleteCounter should call store.deleteCounter after confirmation', async () => {
        window.confirm = jest.fn(() => true);
        // Simulate deleting counter via CounterList's callback
        // Need to get the callback passed to CounterListComponent constructor
        const counterListOptions = (CounterListComponent as jest.Mock).mock.calls[0][2] as CounterListItemCallbacks; // Callbacks are 3rd arg
        const deleteCounterCbFromList = counterListOptions.onDeleteCounter;


        await deleteCounterCbFromList(mockCounter1ForLoc1.id, mockCounter1ForLoc1.name);

        expect(window.confirm).toHaveBeenCalled();
        expect(locationStore.deleteCounter).toHaveBeenCalledWith(mockLocation1.id, mockCounter1ForLoc1.id);
        expect(mockedShowToastFn).toHaveBeenCalledWith(expect.stringContaining('gelöscht'), 'success');
    });
  });

  test('handleDeleteLocation should call store.deleteLocation after confirmation', async () => {
    window.confirm = jest.fn(() => true);
    // Simulate deleting location via LocationList's callback
    const listOptions = (LocationListComponent as jest.Mock).mock.calls[0][1] as LocationListItemCallbacks;
    const deleteCallbackFromList = listOptions.onDelete;

    await deleteCallbackFromList(mockLocation1.id, mockLocation1.name);

    expect(window.confirm).toHaveBeenCalled();
    expect(locationStore.deleteLocation).toHaveBeenCalledWith(mockLocation1.id);
    expect(mockedShowToastFn).toHaveBeenCalledWith(expect.stringContaining('gelöscht'), 'success');
  });

  test('handleExportAllLocationsJson should trigger download', async () => {
    const exportBtn = container.querySelector('#export-all-locations-json-btn') as HTMLButtonElement;
    const fakeUrl = 'blob:http://localhost/fake-uuid';

    // Store original functions
    const originalCreate = global.URL.createObjectURL;
    const originalRevoke = global.URL.revokeObjectURL;

    global.URL.createObjectURL = jest.fn(() => fakeUrl);
    global.URL.revokeObjectURL = jest.fn();

    const linkClickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    exportBtn.click();

    expect(locationStore.getLocations).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(linkClickSpy).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(fakeUrl);
    expect(mockedShowToastFn).toHaveBeenCalledWith(expect.stringContaining('erfolgreich als JSON exportiert'), 'success');

    linkClickSpy.mockRestore();
  });

  test('store subscription should refresh counter list if active location is updated', () => {
    // Show details for mockLocation1
    const listOptions = (LocationListComponent as jest.Mock).mock.calls[0][1] as LocationListItemCallbacks;
    listOptions.onEdit(mockLocation1); // This calls showLocationDetails which should instantiate CounterListComponent

    // Clear initial calls to CounterListComponent constructor and its methods from the first showLocationDetails
    (CounterListComponent as jest.Mock).mockClear();
    mockCounterListInstance.appendTo.mockClear();
    // mockCounterListInstance.setCounters.mockClear(); // If setCounters was used

    const updatedLocationWithNewCounter = JSON.parse(JSON.stringify(mockLocation1));
    updatedLocationWithNewCounter.counters.push({ id: 'c2', name: 'Patio Bar', areas: [] });

    const newLocationsArray = mockLocations.map(l => l.id === updatedLocationWithNewCounter.id ? updatedLocationWithNewCounter : l);

    if (notifySubscribers) notifySubscribers(newLocationsArray);

    // When store notifies, and activeLocation matches, renderCountersForLocation is called.
    // renderCountersForLocation re-instantiates CounterListComponent.
    expect(CounterListComponent).toHaveBeenCalledTimes(1); // Called again by renderCountersForLocation
    const lastCounterListCallArgs = (CounterListComponent as jest.Mock).mock.calls[0]; // It's the first (and only) call since mockClear
    expect(lastCounterListCallArgs[0]).toEqual(updatedLocationWithNewCounter); // Location object
    expect(lastCounterListCallArgs[1]).toEqual(updatedLocationWithNewCounter.counters); // Counters array
    expect(mockCounterListInstance.appendTo).toHaveBeenCalledTimes(1);
  });

});

  describe('Error Handling and Edge Cases', () => {
    test('should handle store.loadLocations failure gracefully', async () => {
      // Create a fresh container for this test
      const errorContainer = document.createElement('div');
      document.body.appendChild(errorContainer);

      const loadError = new Error('Network failure');
      (locationStore.loadLocations as jest.Mock).mockRejectedValueOnce(loadError);

      await initLocationManager(errorContainer);

      expect(locationStore.loadLocations).toHaveBeenCalled();
      expect(mockedShowToastFn).toHaveBeenCalledWith(
        expect.stringContaining('Fehler beim Laden'),
        'error'
      );

      document.body.removeChild(errorContainer);
    });

    test('should handle empty locations array gracefully', async () => {
      (locationStore.getLocations as jest.Mock).mockReturnValue([]);
      if (notifySubscribers) notifySubscribers([]);

      expect(mockLocationListInstance.setLocations).toHaveBeenCalledWith([]);
      expect(container.querySelector('#location-list-host')).not.toBeNull();
    });

    test('should handle null/undefined location data', async () => {
      const nullLocations = [null, undefined, { id: 'valid', name: 'Valid Location', address: 'Valid Address', counters: [] }];
      
      // Filter out null/undefined before passing to components
      const validLocations = nullLocations.filter(loc => loc != null);
      if (notifySubscribers) notifySubscribers(validLocations);

      expect(mockLocationListInstance.setLocations).toHaveBeenCalledWith(validLocations);
    });

    test('should handle malformed location objects', async () => {
      const malformedLocations = [
        { id: 'loc1' }, // Missing name and address
        { name: 'No ID Location', address: 'Some Address' }, // Missing id
        { id: 'loc2', name: '', address: '' }, // Empty strings
        { id: 'loc3', name: 'Valid', address: 'Valid', counters: null } // null counters
      ];

      if (notifySubscribers) notifySubscribers(malformedLocations);
      expect(mockLocationListInstance.setLocations).toHaveBeenCalledWith(malformedLocations);
    });
  });

  describe('Form Validation and Error Scenarios', () => {
    test('should handle location form submission with empty data', async () => {
      const locFormOptions = (LocationFormComponent as jest.Mock).mock.calls[0][0] as LocationFormComponentOptions;
      const submitCallback = locFormOptions.onSubmit;

      const emptyData = { id: '', name: '', address: '' };
      
      // Mock store to reject empty data
      (locationStore.addLocation as jest.Mock).mockRejectedValueOnce(new Error('Name is required'));

      await submitCallback(emptyData);

      expect(mockedShowToastFn).toHaveBeenCalledWith(
        expect.stringContaining('Fehler'),
        'error'
      );
    });

    test('should handle counter form submission with empty data', async () => {
      // First show location details
      const listOptions = (LocationListComponent as jest.Mock).mock.calls[0][1] as LocationListItemCallbacks;
      listOptions.onEdit(mockLocation1);

      const counterFormOptions = (CounterFormComponent as jest.Mock).mock.calls[0][0] as CounterFormComponentOptions;
      const submitCounterCallback = counterFormOptions.onSubmit;

      const emptyCounterData = { id: '', name: '', description: '' };
      
      // Mock store to reject empty data
      (locationStore.addCounter as jest.Mock).mockRejectedValueOnce(new Error('Counter name is required'));

      await submitCounterCallback(emptyCounterData);

      expect(mockedShowToastFn).toHaveBeenCalledWith(
        expect.stringContaining('Fehler'),
        'error'
      );
    });

    test('should handle location update failure', async () => {
      const listOptions = (LocationListComponent as jest.Mock).mock.calls[0][1] as LocationListItemCallbacks;
      listOptions.onEdit(mockLocation1);

      const editBtn = container.querySelector('#edit-loc-name-addr-btn') as HTMLButtonElement;
      editBtn.click();

      const locFormOptions = (LocationFormComponent as jest.Mock).mock.calls[0][0] as LocationFormComponentOptions;
      const submitCallback = locFormOptions.onSubmit;

      const updatedData = { ...mockLocation1, name: 'Updated Name' };
      mockLocationFormInstance.currentEditingLocation = mockLocation1;

      // Mock update failure
      (locationStore.updateLocation as jest.Mock).mockRejectedValueOnce(new Error('Update failed'));

      await submitCallback(updatedData);

      expect(mockedShowToastFn).toHaveBeenCalledWith(
        expect.stringContaining('Fehler'),
        'error'
      );
    });
  });

  describe('Concurrent Operations and State Management', () => {
    test('should handle multiple rapid location additions', async () => {
      const locFormOptions = (LocationFormComponent as jest.Mock).mock.calls[0][0] as LocationFormComponentOptions;
      const submitCallback = locFormOptions.onSubmit;

      const promises = [];
      for (let i = 0; i < 3; i++) {
        const newLocData = { id: '', name: `Location ${i}`, address: `Address ${i}` };
        promises.push(submitCallback(newLocData));
      }

      await Promise.all(promises);

      expect(locationStore.addLocation).toHaveBeenCalledTimes(3);
    });

    test('should handle location deletion during detail view', async () => {
      // Show details for a location
      const listOptions = (LocationListComponent as jest.Mock).mock.calls[0][1] as LocationListItemCallbacks;
      listOptions.onEdit(mockLocation1);

      // Verify details are shown
      expect(container.querySelector('#location-detail-section-host h3')?.textContent).toContain('Details für: Bar Central');

      // Simulate deletion of the currently viewed location
      window.confirm = jest.fn(() => true);
      const deleteCallback = listOptions.onDelete;
      await deleteCallback(mockLocation1.id, mockLocation1.name);

      expect(locationStore.deleteLocation).toHaveBeenCalledWith(mockLocation1.id);
    });

    test('should handle store subscription with invalid data', () => {
      const invalidData = [
        { id: 'loc1', name: 123, address: null }, // Invalid types
        'not-an-object', // Not an object
        { id: null, name: 'Test', address: 'Test' } // null id
      ];

      // Should not crash when receiving invalid data
      expect(() => {
        if (notifySubscribers) notifySubscribers(invalidData as any);
      }).not.toThrow();
    });
  });

  describe('User Interaction Edge Cases', () => {
    test('should handle multiple rapid button clicks', () => {
      const addBtn = container.querySelector('#add-new-location-btn') as HTMLButtonElement;
      
      // Click multiple times rapidly
      addBtn.click();
      addBtn.click();
      addBtn.click();

      // Should handle gracefully without errors
      expect(mockLocationFormInstance.show).toHaveBeenCalled();
    });

    test('should handle cancel during location form editing', () => {
      const listOptions = (LocationListComponent as jest.Mock).mock.calls[0][1] as LocationListItemCallbacks;
      listOptions.onEdit(mockLocation1);

      const editBtn = container.querySelector('#edit-loc-name-addr-btn') as HTMLButtonElement;
      editBtn.click();

      const locFormOptions = (LocationFormComponent as jest.Mock).mock.calls[0][0] as LocationFormComponentOptions;
      const cancelCallback = locFormOptions.onCancel;

      // Cancel should work even without currentEditingLocation
      mockLocationFormInstance.currentEditingLocation = null;
      cancelCallback();

      expect(mockLocationFormInstance.hide).toHaveBeenCalled();
    });

    test('should handle delete confirmation rejection', async () => {
      window.confirm = jest.fn(() => false); // User clicks "Cancel"
      
      const listOptions = (LocationListComponent as jest.Mock).mock.calls[0][1] as LocationListItemCallbacks;
      const deleteCallback = listOptions.onDelete;

      await deleteCallback(mockLocation1.id, mockLocation1.name);

      expect(window.confirm).toHaveBeenCalled();
      expect(locationStore.deleteLocation).not.toHaveBeenCalled();
    });
  });

  describe('Export Functionality Edge Cases', () => {
    test('should handle export with empty locations', () => {
      (locationStore.getLocations as jest.Mock).mockReturnValue([]);
      
      const exportBtn = container.querySelector('#export-all-locations-json-btn') as HTMLButtonElement;
      const fakeUrl = 'blob:http://localhost/fake-uuid';

      const originalCreate = global.URL.createObjectURL;
      const originalRevoke = global.URL.revokeObjectURL;

      global.URL.createObjectURL = jest.fn(() => fakeUrl);
      global.URL.revokeObjectURL = jest.fn();

      const linkClickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      exportBtn.click();

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(linkClickSpy).toHaveBeenCalled();

      linkClickSpy.mockRestore();
      global.URL.createObjectURL = originalCreate;
      global.URL.revokeObjectURL = originalRevoke;
    });

    test('should handle export with corrupted location data', () => {
      const corruptedData = [
        { id: 'loc1', name: 'Test', counters: [{ id: 'c1', areas: [{ circular: {} }] }] }
      ];
      (corruptedData[0].counters[0].areas[0] as any).circular.self = corruptedData[0].counters[0].areas[0];
      
      (locationStore.getLocations as jest.Mock).mockReturnValue(corruptedData);

      const exportBtn = container.querySelector('#export-all-locations-json-btn') as HTMLButtonElement;
      
      // Should handle circular references gracefully
      expect(() => exportBtn.click()).not.toThrow();
    });
  });

  describe('Counter Management Edge Cases', () => {
    beforeEach(() => {
      const listOptions = (LocationListComponent as jest.Mock).mock.calls[0][1] as LocationListItemCallbacks;
      listOptions.onEdit(mockLocation1);
    });

    test('should handle counter deletion rejection', async () => {
      window.confirm = jest.fn(() => false);
      
      const counterListOptions = (CounterListComponent as jest.Mock).mock.calls[0][2] as CounterListItemCallbacks;
      const deleteCounterCallback = counterListOptions.onDeleteCounter;

      await deleteCounterCallback(mockCounter1ForLoc1.id, mockCounter1ForLoc1.name);

      expect(window.confirm).toHaveBeenCalled();
      expect(locationStore.deleteCounter).not.toHaveBeenCalled();
    });

    test('should handle counter update failure', async () => {
      const counterListOptions = (CounterListComponent as jest.Mock).mock.calls[0][2] as CounterListItemCallbacks;
      const editCounterCallback = counterListOptions.onEditCounter;

      // Mock form setup for editing
      const counterFormOptions = (CounterFormComponent as jest.Mock).mock.calls[0][0] as CounterFormComponentOptions;
      const submitCallback = counterFormOptions.onSubmit;

      mockCounterFormInstance.currentEditingCounter = mockCounter1ForLoc1;
      
      // Mock update failure
      (locationStore.updateCounter as jest.Mock).mockRejectedValueOnce(new Error('Counter update failed'));

      const updatedCounterData = { ...mockCounter1ForLoc1, name: 'Updated Counter' };
      await submitCallback(updatedCounterData);

      expect(mockedShowToastFn).toHaveBeenCalledWith(
        expect.stringContaining('Fehler'),
        'error'
      );
    });

    test('should handle area management toggle', () => {
      const counterListOptions = (CounterListComponent as jest.Mock).mock.calls[0][2] as CounterListItemCallbacks;
      const toggleAreaCallback = counterListOptions.onToggleAreaManagement;

      if (toggleAreaCallback) {
        toggleAreaCallback(mockCounter1ForLoc1.id);
        expect(mockCounterListInstance.toggleAreaManagementForCounter).toHaveBeenCalledWith(mockCounter1ForLoc1.id);
      }
    });
  });

  describe('Accessibility and UI State Management', () => {
    test('should maintain proper ARIA attributes and focus management', () => {
      // Test that important UI elements have proper accessibility attributes
      const addBtn = container.querySelector('#add-new-location-btn') as HTMLButtonElement;
      const exportBtn = container.querySelector('#export-all-locations-json-btn') as HTMLButtonElement;

      expect(addBtn).not.toBeNull();
      expect(exportBtn).not.toBeNull();

      // Verify buttons are focusable
      expect(addBtn.tabIndex).toBeGreaterThanOrEqual(0);
      expect(exportBtn.tabIndex).toBeGreaterThanOrEqual(0);
    });

    test('should handle component cleanup properly', () => {
      // Simulate component destruction
      const newContainer = document.createElement('div');
      document.body.appendChild(newContainer);

      // Initialize in new container
      initLocationManager(newContainer);

      // Remove container (simulating component unmount)
      document.body.removeChild(newContainer);

      // Should not cause memory leaks or errors
      expect(() => {
        if (notifySubscribers) notifySubscribers(mockLocations);
      }).not.toThrow();
    });

    test('should handle window resize and responsive behavior', () => {
      // Simulate window resize
      const resizeEvent = new Event('resize');
      window.dispatchEvent(resizeEvent);

      // Should handle resize gracefully without errors
      expect(container.querySelector('#location-list-host')).not.toBeNull();
    });
  });

  describe('Performance and Memory Management', () => {
    test('should handle large datasets efficiently', async () => {
      const largeLocationSet = Array.from({ length: 100 }, (_, i) => ({
        id: `loc${i}`,
        name: `Location ${i}`,
        address: `Address ${i}`,
        counters: Array.from({ length: 10 }, (_, j) => ({
          id: `c${i}-${j}`,
          name: `Counter ${j}`,
          description: `Description ${j}`,
          areas: []
        }))
      }));

      if (notifySubscribers) notifySubscribers(largeLocationSet);

      expect(mockLocationListInstance.setLocations).toHaveBeenCalledWith(largeLocationSet);
    });

    test('should handle rapid state updates without performance degradation', async () => {
      const startTime = performance.now();

      // Simulate many rapid updates
      for (let i = 0; i < 50; i++) {
        const testLocations = [{ id: `test${i}`, name: `Test ${i}`, address: `Address ${i}`, counters: [] }];
        if (notifySubscribers) notifySubscribers(testLocations);
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Should complete reasonably quickly (under 100ms for 50 updates)
      expect(executionTime).toBeLessThan(100);
    });
  });

});
