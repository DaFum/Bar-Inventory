import { LocationListItemComponent, LocationListItemCallbacks } from './location-list-item.component';
import { Location } from '../../models';
import { escapeHtml } from '../../utils/security';

// Mock escapeHtml
jest.mock('../../utils/security', () => ({
  escapeHtml: jest.fn((str) => str),
}));

// Mock BaseComponent
jest.mock('../core/base-component', () => {
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

describe('LocationListItemComponent', () => {
  let location: Location;
  let mockCallbacks: LocationListItemCallbacks;
  let component: LocationListItemComponent;

  beforeEach(() => {
    location = { id: 'loc1', name: 'Test Location', address: '123 Test St', counters: [] };
    mockCallbacks = {
      onEdit: jest.fn(),
      onDelete: jest.fn(),
    };
    // Component instance created in describe/test blocks for better control over mock calls
  });

  afterEach(() => {
    component?.getElement().remove(); // Ensure component exists
    (escapeHtml as jest.Mock).mockClear();
  });

  describe('Constructor and Initial Render', () => {
    beforeEach(() => {
        component = new LocationListItemComponent(location, mockCallbacks);
        document.body.appendChild(component.getElement());
    });

    test('constructor should create LI element with correct class, dataset, and render content', () => {
        const element = component.getElement();
        expect(element.tagName).toBe('LI');
        expect(element.classList.contains('list-group-item')).toBe(true);
        expect(element.dataset.locationId).toBe(location.id);
        expect(element.textContent).toContain(location.name);
        expect(escapeHtml).toHaveBeenCalledWith(location.name);
    });

    test('render (called by constructor) should display location name and create buttons', () => {
        const element = component.getElement();
        const nameSpan = element.querySelector(`#loc-name-${location.id}`);
        expect(nameSpan).not.toBeNull();
        expect(nameSpan!.textContent).toBe(location.name);

        const editButton = element.querySelector('.edit-location-btn') as HTMLButtonElement;
        const deleteButton = element.querySelector('.delete-location-btn') as HTMLButtonElement;

        expect(editButton).not.toBeNull();
        expect(editButton.textContent).toBe('Bearbeiten');
        expect(editButton.getAttribute('aria-label')).toBe(`Standort ${location.name} bearbeiten`);

        expect(deleteButton).not.toBeNull();
        expect(deleteButton.textContent).toBe('Löschen');
        expect(deleteButton.getAttribute('aria-label')).toBe(`Standort ${location.name} löschen`);

        // escapeHtml calls: name span, edit aria, delete aria
        const calls = (escapeHtml as jest.Mock).mock.calls;
        let nameCallsForSpan = 0;
        let nameCallsForEditAria = 0;
        let nameCallsForDeleteAria = 0;
        calls.forEach(call => {
            if (call[0] === location.name) {
                // This is a bit crude, assumes order or unique contexts if checking specific call args
                // For simplicity, just count them.
                nameCallsForSpan++; // This will be overcounted if other tests run before mockClear
            }
        });
        // Based on template: name in span, name in edit aria, name in delete aria
        expect(escapeHtml).toHaveBeenCalledWith(location.name);
        expect((escapeHtml as jest.Mock).mock.calls.filter(c => c[0] === location.name).length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Button Callbacks and Update', () => {
    beforeEach(() => {
        component = new LocationListItemComponent(location, mockCallbacks);
        document.body.appendChild(component.getElement());
        (escapeHtml as jest.Mock).mockClear(); // Clear calls from constructor
    });

    test('Edit button click should call onEdit callback with location data', () => {
        const editButton = component.getElement().querySelector('.edit-location-btn') as HTMLButtonElement;
        editButton.click();
        expect(mockCallbacks.onEdit).toHaveBeenCalledTimes(1);
        expect(mockCallbacks.onEdit).toHaveBeenCalledWith(location);
    });

    test('Delete button click should call onDelete callback with locationId and locationName', () => {
        const deleteButton = component.getElement().querySelector('.delete-location-btn') as HTMLButtonElement;
        deleteButton.click();
        expect(mockCallbacks.onDelete).toHaveBeenCalledTimes(1);
        expect(mockCallbacks.onDelete).toHaveBeenCalledWith(location.id, location.name);
    });

    test('update method should re-render the component with new location data', () => {
        const newLocation: Location = { ...location, name: 'Updated Location Name', address: '456 New St' };

        component.update(newLocation); // Calls render

        const element = component.getElement();
        expect(element.textContent).toContain('Updated Location Name');

        // Check escapeHtml calls for the re-render by update()
        expect(escapeHtml).toHaveBeenCalledWith('Updated Location Name'); // For name span
        expect(escapeHtml).toHaveBeenCalledWith('Updated Location Name'); // For edit aria
        expect(escapeHtml).toHaveBeenCalledWith('Updated Location Name'); // For delete aria
        // Total 3 calls with the new name
        expect((escapeHtml as jest.Mock).mock.calls.filter(c => c[0] === 'Updated Location Name').length).toBeGreaterThanOrEqual(3);

        const editButton = element.querySelector('.edit-location-btn') as HTMLButtonElement;
        editButton.click();
        expect(mockCallbacks.onEdit).toHaveBeenCalledWith(newLocation);
    });

    test('getLocationId should return the correct location ID', () => {
        expect(component.getLocationId()).toBe(location.id);
        const newLocation: Location = { ...location, id: 'loc2' };
        component.update(newLocation);
        expect(component.getLocationId()).toBe('loc2');
    });
  });
});
