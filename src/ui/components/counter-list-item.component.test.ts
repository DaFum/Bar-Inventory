import { CounterListItemComponent, CounterListItemCallbacks } from './counter-list-item.component';
import { Location as LocationModel, Counter, Area } from '../../models';
import { escapeHtml } from '../../utils/security';
import { showToast } from './toast-notifications';
import { locationStore } from '../../state/location.store';
import { AreaListComponent } from './area-list.component';
import { AreaFormComponent } from './area-form.component';

// Mock dependencies
jest.mock('../../utils/security', () => ({
  escapeHtml: jest.fn((str) => str), // Simple pass-through
}));

jest.mock('./toast-notifications', () => ({
  showToast: jest.fn(),
}));

jest.mock('../../state/location.store', () => ({
  locationStore: {
    getLocationById: jest.fn(),
    addArea: jest.fn(),
    updateArea: jest.fn(),
    deleteArea: jest.fn(),
  },
}));

// Mock AreaListComponent and AreaFormComponent
let mockAreaListComponentInstance: {
    appendTo: jest.Mock;
    setAreas: jest.Mock;
};
let mockAreaFormComponentInstance: {
    appendTo: jest.Mock;
    show: jest.Mock;
    hide: jest.Mock;
};

jest.mock('./area-list.component', () => {
    mockAreaListComponentInstance = {
        appendTo: jest.fn(),
        setAreas: jest.fn(),
    };
    return {
      AreaListComponent: jest.fn(() => mockAreaListComponentInstance),
    };
  });

jest.mock('./area-form.component', () => {
    mockAreaFormComponentInstance = {
        appendTo: jest.fn(),
        show: jest.fn(),
        hide: jest.fn(),
    };
    return {
      AreaFormComponent: jest.fn(() => mockAreaFormComponentInstance),
    };
  });


describe('CounterListItemComponent', () => {
  let component: CounterListItemComponent;
  let mockLocation: LocationModel;
  let mockCounter: Counter;
  let mockCallbacks: CounterListItemCallbacks;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLocation = { id: 'loc1', name: 'Test Location', counters: [], address: '123 Test St' }; // Removed description, added address
    mockCounter = {
      id: 'counter1',
      name: 'Main Counter',
      description: 'Primary service counter',
      areas: [{ id: 'area1', name: 'Shelf A', inventoryItems: [], displayOrder: 1 }]
    };
    mockLocation.counters.push(mockCounter); // Add counter to location

    mockCallbacks = {
      onEditCounter: jest.fn(),
      onDeleteCounter: jest.fn(),
    };

    // Mock store returns
    (locationStore.getLocationById as jest.Mock).mockReturnValue(mockLocation);
    (locationStore.addArea as jest.Mock).mockImplementation(async (locId, countId, areaData) => ({ ...areaData, id: 'new-area-id', inventoryItems: [] }));
    (locationStore.updateArea as jest.Mock).mockResolvedValue(undefined);
    (locationStore.deleteArea as jest.Mock).mockResolvedValue(undefined);


    component = new CounterListItemComponent(mockLocation, mockCounter, mockCallbacks);
    document.body.appendChild(component.getElement());
  });

  afterEach(() => {
    component.getElement().remove();
  });

  test('constructor should create element with correct class, dataset, and initial render', () => {
    const element = component.getElement();
    expect(element.tagName).toBe('DIV');
    expect(element.classList.contains('list-group-item')).toBe(true);
    expect(element.classList.contains('nested')).toBe(true);
    expect(element.dataset.counterId).toBe(mockCounter.id);
    expect(element.textContent).toContain(mockCounter.name);
    expect(escapeHtml).toHaveBeenCalledWith(mockCounter.name);
  });

  test('render should create Edit, Manage Areas, and Delete buttons for the counter', () => {
    const element = component.getElement();
    expect(element.querySelector('.edit-counter-btn')).not.toBeNull();
    expect(element.querySelector('.manage-areas-btn')).not.toBeNull();
    expect(element.querySelector('.delete-counter-btn')).not.toBeNull();
  });

  test('Edit Counter button click should call onEditCounter callback', () => {
    const editButton = component.getElement().querySelector('.edit-counter-btn') as HTMLButtonElement;
    editButton.click();
    expect(mockCallbacks.onEditCounter).toHaveBeenCalledWith(mockCounter);
  });

  test('Delete Counter button click should call onDeleteCounter callback', () => {
    const deleteButton = component.getElement().querySelector('.delete-counter-btn') as HTMLButtonElement;
    deleteButton.click();
    expect(mockCallbacks.onDeleteCounter).toHaveBeenCalledWith(mockCounter.id, mockCounter.name);
  });

  describe('Area Management', () => {
    let manageAreasButton: HTMLButtonElement;

    beforeEach(() => {
        manageAreasButton = component.getElement().querySelector('.manage-areas-btn') as HTMLButtonElement;
        // Click to show area management and initialize its components
        manageAreasButton.click();
    });

    test('clicking "Manage Areas" button should toggle visibility and render internal structure', () => {
      const areaManagementDiv = component.getElement().querySelector('.area-management-section') as HTMLDivElement;
      expect(areaManagementDiv.style.display).toBe('block'); // Initially shown by click in beforeEach

      expect(AreaListComponent).toHaveBeenCalledTimes(1);
      expect(AreaFormComponent).toHaveBeenCalledTimes(1);
      expect(areaManagementDiv.querySelector('.area-list-host')).not.toBeNull();
      expect(areaManagementDiv.querySelector('.add-new-area-btn')).not.toBeNull();
      expect(areaManagementDiv.querySelector('.area-form-host')).not.toBeNull();

      manageAreasButton.click(); // Click again to hide
      expect(areaManagementDiv.style.display).toBe('none');
    });

    test('"Add New Area" button should show AreaFormComponent', () => {
        const addNewAreaBtn = component.getElement().querySelector('.add-new-area-btn') as HTMLButtonElement;
        addNewAreaBtn.click();
        expect(mockAreaFormComponentInstance.show).toHaveBeenCalledWith(); // Show without specific area for new
      });

    test('handleAreaFormSubmit for new area should call locationStore.addArea and update list', async () => {
        const newAreaData = { name: 'New Shelf', description: 'Test Desc', displayOrder: 1 };
        // Simulate form submission by directly calling the handler (as AreaFormComponent is mocked)
        // Provide an empty id for new area, as Pick<Area,...> might expect it if not truly partial
        await component['handleAreaFormSubmit']({ id: '', ...newAreaData });

        expect(locationStore.addArea).toHaveBeenCalledWith(mockLocation.id, mockCounter.id, newAreaData);
        expect(showToast).toHaveBeenCalledWith('Bereich "New Shelf" hinzugefügt.', 'success');
        expect(mockAreaFormComponentInstance.hide).toHaveBeenCalled();
        expect(mockAreaListComponentInstance.setAreas).toHaveBeenCalled(); // With updated areas from store
    });

    test('handleAreaFormSubmit for existing area should call locationStore.updateArea', async () => {
        const existingArea = mockCounter.areas[0];
         if (!existingArea) throw new Error("existingArea is undefined in test setup");
         const updatedAreaData = { ...existingArea, id: existingArea.id, name: 'Updated Shelf A' }; // Ensure id is present

        // Mock store to return the counter with the updated area details for the list refresh
        const updatedCounterWithArea = {
            ...mockCounter,
            areas: [updatedAreaData]
        };
        const updatedLocationWithCounter = {
            ...mockLocation,
            counters: [updatedCounterWithArea]
        };
        (locationStore.getLocationById as jest.Mock).mockReturnValue(updatedLocationWithCounter);

        await component['handleAreaFormSubmit'](updatedAreaData);

        expect(locationStore.updateArea).toHaveBeenCalledWith(mockLocation.id, mockCounter.id, updatedAreaData);
        expect(showToast).toHaveBeenCalledWith('Bereich "Updated Shelf A" aktualisiert.', 'success');
        expect(mockAreaFormComponentInstance.hide).toHaveBeenCalled();
        expect(mockAreaListComponentInstance.setAreas).toHaveBeenCalledWith([updatedAreaData]);
    });

    test('handleEditArea should show AreaFormComponent with area data', () => {
        const areaToEdit = mockCounter.areas[0];
        if (areaToEdit) { // Ensure area exists before test
            component['handleEditArea'](areaToEdit); // Call internal method
            expect(mockAreaFormComponentInstance.show).toHaveBeenCalledWith(areaToEdit);
        } else {
            throw new Error("mockCounter.areas[0] is undefined, cannot run test");
        }
    });

    test('handleDeleteArea should call locationStore.deleteArea after confirmation', async () => {
        window.confirm = jest.fn(() => true); // Mock confirm to return true
        const areaToDelete = mockCounter.areas[0];
        if (areaToDelete) { // Ensure area exists
            await component['handleDeleteArea'](areaToDelete.id, areaToDelete.name);

            expect(window.confirm).toHaveBeenCalledWith(`Bereich "${areaToDelete.name}" wirklich löschen?`);
            expect(locationStore.deleteArea).toHaveBeenCalledWith(mockLocation.id, mockCounter.id, areaToDelete.id);
            expect(showToast).toHaveBeenCalledWith(`Bereich "${areaToDelete.name}" gelöscht.`, 'success');
            expect(mockAreaListComponentInstance.setAreas).toHaveBeenCalled();
        } else {
            throw new Error("mockCounter.areas[0] is undefined, cannot run test");
        }
    });

    test('handleDeleteArea should not call deleteArea if confirmation is false', async () => {
        window.confirm = jest.fn(() => false); // Mock confirm to return false
        const areaToDelete = mockCounter.areas[0];
        if (areaToDelete) { // Ensure area exists
            await component['handleDeleteArea'](areaToDelete.id, areaToDelete.name);
            expect(locationStore.deleteArea).not.toHaveBeenCalled();
        } else {
            throw new Error("mockCounter.areas[0] is undefined, cannot run test");
        }
      });
  });

  test('update method should update counter name and refresh area list if visible and areas changed', () => {
    component.toggleAreasManagementVisibility(true); // Make areas visible

    const updatedCounterData: Counter = {
      ...mockCounter,
      name: 'Renamed Counter',
      areas: [...mockCounter.areas, { id: 'area2', name: 'Shelf B', inventoryItems: [], displayOrder: 2 }],
    };
    component.update(mockLocation, updatedCounterData);

    expect(component.getElement().textContent).toContain('Renamed Counter');
    expect(mockAreaListComponentInstance.setAreas).toHaveBeenCalledWith(updatedCounterData.areas);
  });

  test('update method should refresh area list if visible even if areas array ref is same but content might differ', () => {
    component.toggleAreasManagementVisibility(true);
    const firstArea = mockCounter.areas[0];
    if (!firstArea) throw new Error("mockCounter.areas[0] is undefined for test setup");
    const sameAreasRefDifferentContent: Area[] = [{...firstArea, name: "Changed Area Name", inventoryItems: [] }]; // Ensure inventoryItems
    const updatedCounterData: Counter = {
        ...mockCounter,
        areas: sameAreasRefDifferentContent, // Content changed but could be same array reference in some scenarios
      };
    // Simulate that stringify would be different
    const originalStringify = JSON.stringify;
    JSON.stringify = jest.fn().mockReturnValueOnce('old_areas').mockReturnValueOnce('new_areas_different_content');

    component.update(mockLocation, updatedCounterData);
    expect(mockAreaListComponentInstance.setAreas).toHaveBeenCalledWith(updatedCounterData.areas);
    JSON.stringify = originalStringify; // Restore
  });


  test('getCounterId should return the correct counter ID', () => {
    expect(component.getCounterId()).toBe(mockCounter.id);
  });
});
