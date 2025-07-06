import { LocationListComponent } from '../../../src/ui/components/location-list.component';
import { LocationListItemComponent, LocationListItemCallbacks } from '../../../src/ui/components/location-list-item.component';
import { Location } from '../../../src/models';

// Mock LocationListItemComponent
jest.mock('../../../src/ui/components/location-list-item.component', () => {
  return {
    LocationListItemComponent: jest.fn().mockImplementation((location: Location, callbacks: LocationListItemCallbacks) => {
      const element = document.createElement('li'); // Mocked as LI
      element.className = 'mock-location-list-item';
      element.textContent = location.name;
      element.dataset.locationId = location.id;
      return {
        getElement: () => element,
        appendTo: jest.fn((parent: HTMLElement) => parent.appendChild(element)),
        update: jest.fn((updatedLocation: Location) => { element.textContent = updatedLocation.name; }),
        remove: jest.fn(() => element.remove()),
        getLocationId: () => location.id,
      };
    }),
  };
});

// Mock BaseComponent as it's extended
jest.mock('../../../src/ui/core/base-component', () => {
    return {
      BaseComponent: class MockBaseComponent {
        element: HTMLElement;
        constructor(tagName: string) {
          this.element = document.createElement(tagName);
        }
        appendChild(child: HTMLElement) { this.element.appendChild(child); }
        remove() { this.element.remove(); }
        getElement() { return this.element; }
      },
    };
  });

describe('LocationListComponent', () => {
  let locationListComponent: LocationListComponent;
  let mockCallbacks: LocationListItemCallbacks;
  let initialLocations: Location[];

  beforeEach(() => {
    mockCallbacks = {
      onEdit: jest.fn(),
      onDelete: jest.fn(),
    };
    initialLocations = [
      { id: 'locB', name: 'Location Bravo', address: '2 St', counters: [] },
      { id: 'locA', name: 'Location Alpha', address: '1 St', counters: [] },
      { id: 'locC', name: 'Location Charlie', address: '3 St', counters: [] },
    ];

    (LocationListItemComponent as jest.Mock).mockClear();
    locationListComponent = new LocationListComponent(initialLocations, mockCallbacks);
    document.body.appendChild(locationListComponent.getElement());
  });

  afterEach(() => {
    locationListComponent.getElement().remove();
  });

  test('constructor should initialize with locations and sort them by name', () => {
    expect(LocationListItemComponent).toHaveBeenCalledTimes(initialLocations.length);
    const ulElement = locationListComponent.getElement().querySelector('ul.list-group');
    expect(ulElement).not.toBeNull();
    const items = ulElement!.children;
    expect(items.length).toBe(initialLocations.length);
    // Check order (Alpha, Bravo, Charlie)
    expect(items[0]!.textContent).toBe('Location Alpha');
    expect(items[1]!.textContent).toBe('Location Bravo');
    expect(items[2]!.textContent).toBe('Location Charlie');
  });

  test('setLocations should re-render the list with new sorted locations', () => {
    const newLocations: Location[] = [
      { id: 'locZ', name: 'Location Zulu', address: '', counters: [] },
      { id: 'locY', name: 'Location Yankee', address: '', counters: [] },
    ];
    locationListComponent.setLocations(newLocations);
    expect(LocationListItemComponent).toHaveBeenCalledTimes(initialLocations.length + newLocations.length);

    const ulElement = locationListComponent.getElement().querySelector('ul.list-group');
    const items = ulElement!.children;
    expect(items.length).toBe(newLocations.length);
    expect(items[0]!.textContent).toBe('Location Yankee'); // Yankee before Zulu
    expect(items[1]!.textContent).toBe('Location Zulu');
  });

  test('setLocations with empty array should display "no locations" message', () => {
    locationListComponent.setLocations([]);
    expect(locationListComponent.getElement().textContent).toContain('Noch keine Standorte erfasst.');
    expect(locationListComponent.getElement().querySelector('ul.list-group')).toBeNull();
  });

  test('addLocation should add a location and insert it sorted into the DOM', () => {
    const newLocation: Location = { id: 'locD', name: 'Location Delta', address:'', counters: [] };
    locationListComponent.addLocation(newLocation);

    const ulElement = locationListComponent.getElement().querySelector('ul.list-group');
    const items = ulElement!.children;
    expect(items.length).toBe(initialLocations.length + 1);
    // Alpha, Bravo, Charlie, Delta (Delta is last by name among these)
    expect(items[3]!.textContent).toBe('Location Delta');
    expect(LocationListItemComponent).toHaveBeenCalledTimes(initialLocations.length + 1);

    const newerLocation: Location = { id: 'loc0', name: 'AAA Location', address:'', counters: [] };
    locationListComponent.addLocation(newerLocation);
    expect(items[0]!.textContent).toBe('AAA Location');
  });

  test('addLocation to an empty list should render the list with the new location', () => {
    locationListComponent.setLocations([]);
    (LocationListItemComponent as jest.Mock).mockClear();

    const newLocation: Location = { id: 'locNew', name: 'First Location', address:'', counters: [] };
    locationListComponent.addLocation(newLocation);

    expect(LocationListItemComponent).toHaveBeenCalledTimes(1);
    const ulElement = locationListComponent.getElement().querySelector('ul.list-group');
    expect(ulElement).not.toBeNull();
    const items = ulElement!.children;
    expect(items.length).toBe(1);
    expect(items[0]!.textContent).toBe('First Location');
  });

  test('updateLocation should update the corresponding item and re-sort if name changes', () => {
    // initialLocations[1] is locA (Alpha) after sorting in constructor
    const originalLocA = initialLocations.find(l => l.id === 'locA')!;
    const updatedLocA: Location = { ...originalLocA, name: 'Location Zebra' };

    locationListComponent.updateLocation(updatedLocA);

    const mockItemInstance = (LocationListItemComponent as jest.Mock).mock.results.find(
        (result: any) => result.value.getLocationId() === updatedLocA.id
      )?.value;
    expect(mockItemInstance.update).toHaveBeenCalledWith(updatedLocA);

    // Check DOM order: Bravo, Charlie, Zebra
    const ulElement = locationListComponent.getElement().querySelector('ul.list-group');
    const items = ulElement!.children;
    expect(items.length).toBe(initialLocations.length);
    expect(items[0]!.textContent).toBe('Location Bravo');
    expect(items[1]!.textContent).toBe('Location Charlie');
    expect(items[2]!.textContent).toBe('Location Zebra');
  });

  test('updateLocation for a non-existent location should add it', () => {
    const newLocToUpdate: Location = { id: 'locNonExistent', name: 'New via Update', address:'', counters: [] };
    locationListComponent.updateLocation(newLocToUpdate);

    const ulElement = locationListComponent.getElement().querySelector('ul.list-group');
    const items = ulElement!.children;
    expect(items.length).toBe(initialLocations.length + 1);
    // Order: Alpha, Bravo, Charlie, New via Update
    expect(items[3]!.textContent).toBe('New via Update');
  });

  test('removeLocation should remove the item from the list and DOM', () => {
    const locationIdToRemove = 'locB'; // Location Bravo
    const mockItemInstanceToRemove = (LocationListItemComponent as jest.Mock).mock.results.find(
        (result: any) => result.value.getLocationId() === locationIdToRemove
      )?.value;

    locationListComponent.removeLocation(locationIdToRemove);

    expect(mockItemInstanceToRemove.remove).toHaveBeenCalled();
    const ulElement = locationListComponent.getElement().querySelector('ul.list-group');
    const items = ulElement!.children;
    expect(items.length).toBe(initialLocations.length - 1);
    expect(Array.from(items).find(item => item.textContent === 'Location Bravo')).toBeUndefined();
  });

  test('removeLocation last item should display "no locations" message', () => {
    locationListComponent.removeLocation('locA');
    locationListComponent.removeLocation('locB');
    locationListComponent.removeLocation('locC');

    expect(locationListComponent.getElement().textContent).toContain('Noch keine Standorte erfasst.');
    expect(locationListComponent.getElement().querySelector('ul.list-group')).toBeNull();
  });
});
