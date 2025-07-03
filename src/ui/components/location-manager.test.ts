import { initLocationManager } from './location-manager';
import { locationStore } from '../../state/location.store';
import { LocationListComponent } from './location-list.component';
import type { LocationListItemCallbacks } from './location-list-item.component'; // Corrected import
import { LocationFormComponent, LocationFormComponentOptions } from './location-form.component';
import { CounterListComponent } from './counter-list.component';
import type { CounterListItemCallbacks } from './counter-list-item.component'; // Corrected import
import { CounterFormComponent, CounterFormComponentOptions } from './counter-form.component';
import { showToast } from './toast-notifications';
import { Location, Counter } from '../../models';

// Mocks
jest.mock('../../state/location.store', () => ({
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

jest.mock('./location-list.component');
jest.mock('./location-form.component');
jest.mock('./counter-list.component');
jest.mock('./counter-form.component');
jest.mock('./toast-notifications');

// Helper to simulate store update and notify subscribers
let notifySubscribers: (locations: Location[]) => void;
(locationStore.subscribe as jest.Mock).mockImplementation((callback) => {
  notifySubscribers = callback;
  return () => {}; // Unsubscribe function
});


describe('Location Manager (location-manager.ts)', () => {
  let container: HTMLElement;
  let mockLocations: Location[];

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
    expect(LocationListComponent).toHaveBeenCalled();
    expect(LocationFormComponent).toHaveBeenCalled();
    expect(CounterFormComponent).toHaveBeenCalled(); // CounterForm is also initialized upfront
    expect(locationStore.loadLocations).toHaveBeenCalled();
  });

  test('LocationListComponent should be updated when store notifies', () => {
    const mockSetLocations = (LocationListComponent as jest.Mock).mock.results[0]!.value.setLocations;
    expect(mockSetLocations).toHaveBeenCalledWith(mockLocations); // Initial call via subscribe

    const newMockLocations = [{ id: 'loc3', name: 'New Bar', address: '789 Pine', counters: [] }];
    if (notifySubscribers) notifySubscribers(newMockLocations);
    expect(mockSetLocations).toHaveBeenCalledWith(newMockLocations);
  });

  describe('Location Form Handling', () => {
    test('"Add New Location" button should show LocationFormComponent', () => {
      const addBtn = container.querySelector('#add-new-location-btn') as HTMLButtonElement;
      addBtn.click();
      const mockShowForm = (LocationFormComponent as jest.Mock).mock.results[0]!.value.show;
      const mockAppendTo = (LocationFormComponent as jest.Mock).mock.results[0]!.value.appendTo;
      expect(mockShowForm).toHaveBeenCalledWith(); // Called without args for new location
      expect(mockAppendTo).toHaveBeenCalled();
      expect((container.querySelector('#location-detail-section-host') as HTMLElement)?.style.display).toBe('block');
    });

    test('handleLocationFormSubmit (add) should call store.addLocation and show details', async () => {
        // Simulate what happens when the form is submitted via its callback
        const locFormInstance = (LocationFormComponent as jest.Mock).mock.results[0]!.value;
        const submitCallback = (LocationFormComponent as jest.Mock).mock.calls[0]![0].onSubmit;

        const newLocData = { name: 'Super Bar', address: 'Galaxy Ave' };
        await submitCallback(newLocData); // Call the submit callback

        expect(locationStore.addLocation).toHaveBeenCalledWith(newLocData);
        expect(showToast).toHaveBeenCalledWith(expect.stringContaining('erstellt'), 'success');
        // showLocationDetails should be called, check for its side effects
        expect(container.querySelector('#location-detail-section-host h3')?.textContent).toContain('Details für: Super Bar');
    });

    test('handleLocationFormSubmit (edit) should call store.updateLocation and show details', async () => {
        // First, simulate showing details for loc1, then clicking "Stammdaten bearbeiten"
        const listInstance = (LocationListComponent as jest.Mock).mock.results[0]!.value;
        const editCallbackFromList = (LocationListComponent as jest.Mock).mock.calls[0]![1].onEdit;
        editCallbackFromList(mockLocation1); // This calls showLocationDetails

        const editLocDetailsBtn = container.querySelector('#edit-loc-name-addr-btn') as HTMLButtonElement;
        editLocDetailsBtn.click(); // This shows LocationForm for editing mockLocation1

        const locFormInstance = (LocationFormComponent as jest.Mock).mock.results[0]!.value;
        const submitCallback = (LocationFormComponent as jest.Mock).mock.calls[0]![0].onSubmit;

        const updatedLocData = { ...mockLocation1, name: "Bar Central Updated" };
        await submitCallback(updatedLocData);

        expect(locationStore.updateLocation).toHaveBeenCalledWith(updatedLocData);
        expect(showToast).toHaveBeenCalledWith(expect.stringContaining('aktualisiert'), 'success');
        expect(container.querySelector('#location-detail-section-host h3')?.textContent).toContain('Details für: Bar Central Updated');
    });

    test('handleLocationFormCancel (when editing) should hide form and show details again', () => {
        // Show details, then show form for edit
        const listInstance = (LocationListComponent as jest.Mock).mock.results[0]!.value;
        const editCallbackFromList = (LocationListComponent as jest.Mock).mock.calls[0]![1].onEdit;
        editCallbackFromList(mockLocation1);
        (container.querySelector('#edit-loc-name-addr-btn') as HTMLButtonElement).click();

        const locFormInstance = (LocationFormComponent as jest.Mock).mock.results[0]!.value;
        const cancelCallback = (LocationFormComponent as jest.Mock).mock.calls[0]![0].onCancel;
        cancelCallback();

        expect(locFormInstance.hide).toHaveBeenCalled();
        expect(container.querySelector('#location-detail-section-host h3')?.textContent).toContain('Details für: Bar Central'); // Details re-rendered
    });
  });

  describe('Counter Management in Location Details', () => {
    beforeEach(() => {
        // Simulate clicking 'Edit' on 'Bar Central' (mockLocation1) in the LocationList
        const listInstance = (LocationListComponent as jest.Mock).mock.results[0]!.value;
        const editCallbackFromList = (LocationListComponent as jest.Mock).mock.calls[0]![1].onEdit; // Use ! if sure it exists
        editCallbackFromList(mockLocation1); // This calls showLocationDetails for mockLocation1
    });

    test('showLocationDetails should render counter list and add counter button', () => {
        expect(container.querySelector(`#counters-management-host-${mockLocation1.id}`)).not.toBeNull();
        expect(CounterListComponent).toHaveBeenCalledTimes(1); // Called by showLocationDetails
        // Verify CounterListComponent was called with mockLocation1 and its counters
        const counterListArgs = (CounterListComponent as jest.Mock).mock.calls[0];
        expect(counterListArgs[0]).toEqual(mockLocation1);
        expect(counterListArgs[1]).toEqual(mockLocation1.counters);

        expect(container.querySelector(`#add-new-counter-btn-for-${mockLocation1.id}`)).not.toBeNull();
    });

    test('"Add New Counter" button should show CounterFormComponent', () => {
        const addCounterBtn = container.querySelector(`#add-new-counter-btn-for-${mockLocation1.id}`) as HTMLButtonElement;
        addCounterBtn.click();

        const mockShowCounterForm = (CounterFormComponent as jest.Mock).mock.results[0]!.value.show;
        const mockAppendToCounterForm = (CounterFormComponent as jest.Mock).mock.results[0]!.value.appendTo;
        expect(mockShowCounterForm).toHaveBeenCalledWith(); // New counter
        expect(mockAppendToCounterForm).toHaveBeenCalled();
        expect((container.querySelector(`#counter-form-host-for-${mockLocation1.id}`) as HTMLElement)?.style.display).toBe('block');
    });

    test('handleCounterFormSubmit (add) should call store.addCounter', async () => {
        const counterFormInstance = (CounterFormComponent as jest.Mock).mock.results[0]!.value;
        const submitCounterCallback = (CounterFormComponent as jest.Mock).mock.calls[0]![0].onSubmit;
        const newCounterData = { name: 'Back Bar', description: 'Service bar' };

        await submitCounterCallback(newCounterData);

        expect(locationStore.addCounter).toHaveBeenCalledWith(mockLocation1.id, newCounterData);
        expect(showToast).toHaveBeenCalledWith(expect.stringContaining('hinzugefügt'), 'success');
        expect(counterFormInstance.hide).toHaveBeenCalled();
    });

    test('handleDeleteCounter should call store.deleteCounter after confirmation', async () => {
        window.confirm = jest.fn(() => true);
        // Simulate deleting counter via CounterList's callback
        const counterListInstance = (CounterListComponent as jest.Mock).mock.results[0]!.value;
        const deleteCounterCbFromList = (CounterListComponent as jest.Mock).mock.calls[0]![2].onDeleteCounter;

        await deleteCounterCbFromList(mockCounter1ForLoc1.id, mockCounter1ForLoc1.name);

        expect(window.confirm).toHaveBeenCalled();
        expect(locationStore.deleteCounter).toHaveBeenCalledWith(mockLocation1.id, mockCounter1ForLoc1.id);
        expect(showToast).toHaveBeenCalledWith(expect.stringContaining('gelöscht'), 'success');
    });
  });

  test('handleDeleteLocation should call store.deleteLocation after confirmation', async () => {
    window.confirm = jest.fn(() => true);
    // Simulate deleting location via LocationList's callback
    const listInstance = (LocationListComponent as jest.Mock).mock.results[0]!.value;
    const deleteCallbackFromList = (LocationListComponent as jest.Mock).mock.calls[0]![1].onDelete;

    await deleteCallbackFromList(mockLocation1.id, mockLocation1.name);

    expect(window.confirm).toHaveBeenCalled();
    expect(locationStore.deleteLocation).toHaveBeenCalledWith(mockLocation1.id);
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('gelöscht'), 'success');
  });

  test('handleExportAllLocationsJson should trigger download', async () => {
    const exportBtn = container.querySelector('#export-all-locations-json-btn') as HTMLButtonElement;
    const fakeUrl = 'blob:http://localhost/fake-uuid';
    const createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue(fakeUrl);
    const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const linkClickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    exportBtn.click();

    expect(locationStore.getLocations).toHaveBeenCalled();
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(linkClickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith(fakeUrl);
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('erfolgreich als JSON exportiert'), 'success');

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    linkClickSpy.mockRestore();
  });

  test('store subscription should refresh counter list if active location is updated', () => {
    // Show details for mockLocation1
    const listInstance = (LocationListComponent as jest.Mock).mock.results[0]!.value;
    const editCallbackFromList = (LocationListComponent as jest.Mock).mock.calls[0]![1].onEdit;
    editCallbackFromList(mockLocation1);

    const counterListMock = (CounterListComponent as jest.Mock).mock.results[0]!.value;
    const updatedLocationWithNewCounter = JSON.parse(JSON.stringify(mockLocation1));
    updatedLocationWithNewCounter.counters.push({ id: 'c2', name: 'Patio Bar', areas: [] });

    const newLocationsArray = mockLocations.map(l => l.id === updatedLocationWithNewCounter.id ? updatedLocationWithNewCounter : l);

    if (notifySubscribers) notifySubscribers(newLocationsArray);

    // renderCountersForLocation should be called, which creates a new CounterListComponent or updates it.
    // Check if CounterListComponent constructor was called again or if its setCounters was called
    // Depending on implementation, it might re-instantiate or call setCounters.
    // The current mock of CounterListComponent is simple. We'd check if it's called with new counters.
    // The important part is that the logic path for renderCountersForLocation is hit.
    // Let's assume renderCountersForLocation calls `new CounterListComponent` or `setCounters`
    expect(CounterListComponent).toHaveBeenCalledTimes(2); // Once initially, once for refresh
    const lastCounterListCallArgs = (CounterListComponent as jest.Mock).mock.calls.pop();
    expect(lastCounterListCallArgs[0]).toEqual(updatedLocationWithNewCounter); // Location object
    expect(lastCounterListCallArgs[1]).toEqual(updatedLocationWithNewCounter.counters); // Counters array
  });

});
