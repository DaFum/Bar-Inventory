import { CounterListComponent } from './counter-list.component';
import { CounterListItemComponent, CounterListItemCallbacks } from './counter-list-item.component';
import { Counter, Location as LocationModel } from '../../models';

// Mock CounterListItemComponent
jest.mock('./counter-list-item.component', () => {
  return {
    CounterListItemComponent: jest.fn().mockImplementation((location: LocationModel, counter: Counter, callbacks: CounterListItemCallbacks) => {
      const element = document.createElement('div');
      element.className = 'mock-counter-list-item';
      element.textContent = counter.name;
      element.dataset.counterId = counter.id;
      return {
        getElement: () => element,
        appendTo: jest.fn((parent: HTMLElement) => parent.appendChild(element)),
        update: jest.fn((loc: LocationModel, updatedCounter: Counter) => { element.textContent = updatedCounter.name; }),
        remove: jest.fn(() => element.remove()),
        getCounterId: () => counter.id,
        toggleAreasManagementVisibility: jest.fn(), // Add mock for this method
      };
    }),
  };
});

describe('CounterListComponent', () => {
  let counterListComponent: CounterListComponent;
  let mockItemCallbacks: CounterListItemCallbacks;
  let mockLocation: LocationModel;
  let initialCounters: Counter[];

  beforeEach(() => {
    mockItemCallbacks = {
      onEditCounter: jest.fn(),
      onDeleteCounter: jest.fn(),
    };
    mockLocation = {
      id: 'loc1',
      name: 'Test Location',
      // description: 'A location', // Removed, Location model does not have description
      address: 'Test Address', // Address is optional, but good to have for completeness if used by component
      counters: [], // Will be populated by initialCounters for consistency in test
      // products: [], // Removed
      // inventoryEntries: [] // Removed
    };
    initialCounters = [
      { id: 'counterA', name: 'Counter Alpha', description: 'First', areas: [] },
      { id: 'counterB', name: 'Counter Bravo', description: 'Second', areas: [] },
      { id: 'counterC', name: 'Counter Charlie', description: 'Third', areas: [] },
    ];
    mockLocation.counters = initialCounters; // Link counters to location for the test instance

    (CounterListItemComponent as jest.Mock).mockClear();
    counterListComponent = new CounterListComponent(mockLocation, initialCounters, mockItemCallbacks);
    document.body.appendChild(counterListComponent.getElement());
  });

  afterEach(() => {
    counterListComponent.getElement().remove();
  });

  test('constructor should initialize with counters and sort them by name', () => {
    expect(CounterListItemComponent).toHaveBeenCalledTimes(initialCounters.length);
    const listHostDiv = counterListComponent.getElement().querySelector('#counter-list');
    expect(listHostDiv).not.toBeNull();
    const items = listHostDiv!.children;
    expect(items.length).toBe(initialCounters.length);
    // Check order (Alpha, Bravo, Charlie - already sorted by name in mock data)
    expect(items[0]!.textContent).toBe('Counter Alpha');
    expect(items[1]!.textContent).toBe('Counter Bravo');
    expect(items[2]!.textContent).toBe('Counter Charlie');
  });

  test('setCounters should re-render the list with new sorted counters', () => {
    const newCounters: Counter[] = [
      { id: 'counterZ', name: 'Counter Zulu', description: '', areas: [] },
      { id: 'counterY', name: 'Counter Yankee', description: '', areas: [] },
    ];
    counterListComponent.setCounters(newCounters);
    // Called for initial + new set. Cleared and re-rendered.
    expect(CounterListItemComponent).toHaveBeenCalledTimes(initialCounters.length + newCounters.length);

    const listHostDiv = counterListComponent.getElement().querySelector('#counter-list');
    const items = listHostDiv!.children;
    expect(items.length).toBe(newCounters.length);
    expect(items[0]!.textContent).toBe('Counter Yankee'); // Yankee before Zulu
    expect(items[1]!.textContent).toBe('Counter Zulu');
  });

  test('setCounters with empty/null array should display "no counters" message', () => {
    counterListComponent.setCounters([]);
    expect(counterListComponent.getElement().textContent).toContain('Noch keine Tresen für diesen Standort erfasst.');
    expect(counterListComponent.getElement().querySelector('#counter-list')).toBeNull();

    counterListComponent.setCounters(null as any); // Test with null
    expect(counterListComponent.getElement().textContent).toContain('Noch keine Tresen für diesen Standort erfasst.');
  });

  test('addCounter should add a counter and insert it sorted into the DOM', () => {
    const newCounter: Counter = { id: 'counterD', name: 'Counter Delta', description: '', areas: [] };
    counterListComponent.addCounter(newCounter);

    const listHostDiv = counterListComponent.getElement().querySelector('#counter-list');
    const items = listHostDiv!.children;
    expect(items.length).toBe(initialCounters.length + 1);
    // Alpha, Bravo, Charlie, Delta (Delta is last by name)
    expect(items[3]!.textContent).toBe('Counter Delta');
    expect(CounterListItemComponent).toHaveBeenCalledTimes(initialCounters.length + 1);

    const newerCounter: Counter = { id: 'counter0', name: 'AAA Counter', description: '', areas: [] };
    counterListComponent.addCounter(newerCounter);
    expect(items[0]!.textContent).toBe('AAA Counter');
  });

  test('addCounter should not add duplicate counter (by ID)', () => {
    const duplicateCounter: Counter = { ...initialCounters[0]! }; // Add non-null assertion, ensure ID is present
    counterListComponent.addCounter(duplicateCounter);
    // Number of constructor calls should not increase beyond the initial + any unique adds
    // If addCounter was called for initialCounters.length items, and then 1 more unique, it's length + 1.
    // Adding a duplicate should not trigger another constructor call for CounterListItemComponent.
    // The number of calls to constructor depends on how many unique items were added.
    // initialCounters.length calls in constructor. If addCounter for duplicate does not proceed, this count is fine.
    expect(CounterListItemComponent).toHaveBeenCalledTimes(initialCounters.length);

    const listHostDiv = counterListComponent.getElement().querySelector('#counter-list');
    const items = listHostDiv!.children;
    expect(items.length).toBe(initialCounters.length); // Length should not change
  });

  test('updateCounter should update the corresponding item and re-sort if name changes', () => {
    const initialCounter = initialCounters[0]!;
    const updatedCounter: Counter = {
        ...initialCounter,
        id: initialCounter.id,
        name: 'ZZZ Counter Updated',
        areas: initialCounter.areas
    };
    if (initialCounter.description !== undefined) {
        updatedCounter.description = initialCounter.description;
    }
    counterListComponent.updateCounter(updatedCounter);

    const mockItemInstance = (CounterListItemComponent as jest.Mock).mock.results.find(
        (result: any) => result.value.getCounterId() === updatedCounter.id
      )?.value;
    expect(mockItemInstance.update).toHaveBeenCalledWith(mockLocation, updatedCounter);

    // Check DOM order: Bravo, Charlie, ZZZ Counter Updated
    const listHostDiv = counterListComponent.getElement().querySelector('#counter-list');
    const items = listHostDiv!.children;
    expect(items.length).toBe(initialCounters.length);
    expect(items[0]!.textContent).toBe('Counter Bravo');
    expect(items[1]!.textContent).toBe('Counter Charlie');
    expect(items[2]!.textContent).toBe('ZZZ Counter Updated');
  });

  test('updateCounter for a non-existent counter should add it', () => {
    const newCounterToUpdate: Counter = { id: 'counterNonExistent', name: 'New via Update', description:'', areas: [] };
    counterListComponent.updateCounter(newCounterToUpdate);

    const listHostDiv = counterListComponent.getElement().querySelector('#counter-list');
    const items = listHostDiv!.children;
    expect(items.length).toBe(initialCounters.length + 1);
    // New via Update, Alpha, Bravo, Charlie (sorted)
    expect(items[0]!.textContent).toBe('Counter Alpha'); // Assuming 'New via Update' comes after 'Counter Alpha'
    // Need to check actual sort order. 'New via Update' comes after 'Counter Charlie'
    expect(items[3]!.textContent).toBe('New via Update');
  });

  test('removeCounter should remove the item from the list and DOM', () => {
    const counterIdToRemove = initialCounters[1]!.id; // Counter Bravo
    const mockItemInstanceToRemove = (CounterListItemComponent as jest.Mock).mock.results.find(
        (result: any) => result.value.getCounterId() === counterIdToRemove
      )?.value;

    counterListComponent.removeCounter(counterIdToRemove);

    expect(mockItemInstanceToRemove!.remove).toHaveBeenCalled();
    const listHostDiv = counterListComponent.getElement().querySelector('#counter-list');
    const items = listHostDiv!.children;
    expect(items.length).toBe(initialCounters.length - 1);
    expect(Array.from(items).find(item => item.textContent === 'Counter Bravo')).toBeUndefined();
  });

  test('removeCounter last item should display "no counters" message', () => {
    counterListComponent.removeCounter(initialCounters[0]!.id);
    counterListComponent.removeCounter(initialCounters[1]!.id);
    counterListComponent.removeCounter(initialCounters[2]!.id);

    expect(counterListComponent.getElement().textContent).toContain('Noch keine Tresen für diesen Standort erfasst.');
    expect(counterListComponent.getElement().querySelector('#counter-list')).toBeNull();
  });

  test('updateLocationReference should call update on child components', () => {
    const newLocationRef: LocationModel = { ...mockLocation, name: "Updated Location Name" };
    // Ensure counters in newLocationRef match IDs of existing list items
    newLocationRef.counters = initialCounters.map(c => ({...c}));

    counterListComponent.updateLocationReference(newLocationRef);

    const mockItemInstances = (CounterListItemComponent as jest.Mock).mock.results.map(r => r.value);
    mockItemInstances.forEach((instance, index) => {
      expect(instance.update).toHaveBeenCalledWith(newLocationRef, newLocationRef.counters[index]!);
    });
  });

  test('updateLocationReference should remove items if counter no longer in new location ref', () => {
    const newLocationRef: LocationModel = { ...mockLocation, name: "Updated Location Name", counters: [] }; // Initialize counters
    // Location now only has counterA and counterC
    newLocationRef.counters = [
        initialCounters.find(c => c.id === 'counterA')!,
        initialCounters.find(c => c.id === 'counterC')!,
    ].filter(Boolean) as Counter[]; // Filter out undefined if any and assert type

    const instanceForB = (CounterListItemComponent as jest.Mock).mock.results.find(
        (result: any) => result.value.getCounterId() === 'counterB'
      )?.value;

    counterListComponent.updateLocationReference(newLocationRef);

    expect(instanceForB!.remove).toHaveBeenCalled(); // Add non-null assertion
    const listHostDiv = counterListComponent.getElement().querySelector('#counter-list');
    expect(listHostDiv!.children.length).toBe(2);
  });


  test('toggleAreaManagementForCounter should call method on correct child and hide for others', () => {
    const counterIdToToggle = initialCounters[1]!.id; // Counter Bravo

    const mockItemInstances = (CounterListItemComponent as jest.Mock).mock.results.map(r => r.value);
    const targetInstance = mockItemInstances.find(inst => inst.getCounterId() === counterIdToToggle);
    const otherInstances = mockItemInstances.filter(inst => inst.getCounterId() !== counterIdToToggle);

    counterListComponent.toggleAreaManagementForCounter(counterIdToToggle, true);

    expect(targetInstance!.toggleAreasManagementVisibility).toHaveBeenCalledWith(true); // Add non-null assertion
    otherInstances.forEach(instance => {
      expect(instance.toggleAreasManagementVisibility).toHaveBeenCalledWith(false);
    });

    // Toggle again to hide
    counterListComponent.toggleAreaManagementForCounter(counterIdToToggle, false);
    expect(targetInstance.toggleAreasManagementVisibility).toHaveBeenCalledWith(false);
  });
});
