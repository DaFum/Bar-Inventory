import { CounterListItemComponent, CounterListItemCallbacks } from '../../../src/ui/components/counter-list-item.component';
import { Location as LocationModel, Counter, Area } from '../../../src/models';
import { escapeHtml } from '../../../src/utils/security';
import { showToast } from '../../../src/ui/components/toast-notifications';
import { locationStore } from '../../../src/state/location.store';
import { AreaListComponent } from '../../../src/ui/components/area-list.component';
import { AreaFormComponent } from '../../../src/ui/components/area-form.component';

// Mock dependencies
jest.mock('../../../src/utils/security', () => ({
  escapeHtml: jest.fn((str) => str),
}));

jest.mock('../../../src/ui/components/toast-notifications', () => ({
  showToast: jest.fn(),
}));

jest.mock('../../../src/state/location.store', () => ({
  locationStore: {
    getLocationById: jest.fn(),
    addArea: jest.fn(),
    updateArea: jest.fn(),
    deleteArea: jest.fn(),
  },
}));

const mockAreaListComponentInstance = {
    getElement: jest.fn(() => document.createElement('div')),
    appendTo: jest.fn(),
    setAreas: jest.fn(),
};
const mockAreaFormComponentInstance = {
    getElement: jest.fn(() => document.createElement('div')),
    appendTo: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
};

jest.mock('../../../src/ui/components/area-list.component', () => ({
    AreaListComponent: jest.fn().mockImplementation(() => mockAreaListComponentInstance),
}));

jest.mock('../../../src/ui/components/area-form.component', () => ({
    AreaFormComponent: jest.fn().mockImplementation(() => mockAreaFormComponentInstance),
}));

describe('CounterListItemComponent', () => {
  let component: CounterListItemComponent;
  let mockLocation: LocationModel;
  let mockCounter: Counter;
  let mockCallbacks: CounterListItemCallbacks;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLocation = { id: 'loc1', name: 'Test Location', counters: [], address: '123 Test St' };
    mockCounter = {
      id: 'counter1',
      name: 'Main Counter',
      description: 'Primary service counter',
      areas: [{ id: 'area1', name: 'Shelf A', inventoryItems: [], displayOrder: 1 }]
    };
    mockLocation.counters.push(mockCounter);

    mockCallbacks = {
      onEditCounter: jest.fn(),
      onDeleteCounter: jest.fn(),
    };

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
    test('clicking "Manage Areas" button should toggle visibility and render internal structure', () => {
      const manageAreasButton = component.getElement().querySelector('.manage-areas-btn') as HTMLButtonElement;
      manageAreasButton.click();

      const areaManagementDiv = component.getElement().querySelector('.area-management-section') as HTMLDivElement;
      expect(areaManagementDiv.style.display).toBe('block');

      expect(AreaListComponent).toHaveBeenCalledTimes(1);
      expect(AreaFormComponent).toHaveBeenCalledTimes(1);
      expect(areaManagementDiv.querySelector('.area-list-host')).not.toBeNull();
      expect(areaManagementDiv.querySelector('.add-new-area-btn')).not.toBeNull();
      expect(areaManagementDiv.querySelector('.area-form-host')).not.toBeNull();

      manageAreasButton.click();
      expect(areaManagementDiv.style.display).toBe('none');
    });

    test('"Add New Area" button should show AreaFormComponent', () => {
        const manageAreasButton = component.getElement().querySelector('.manage-areas-btn') as HTMLButtonElement;
        manageAreasButton.click();
        const addNewAreaBtn = component.getElement().querySelector('.add-new-area-btn') as HTMLButtonElement;
        addNewAreaBtn.click();
        expect(mockAreaFormComponentInstance.show).toHaveBeenCalledWith();
      });

    test('handleAreaFormSubmit for new area should call locationStore.addArea and update list', async () => {
        component.toggleAreasManagementVisibility(true);
        const newAreaData = { name: 'New Shelf', description: 'Test Desc', displayOrder: 1 };
        await component['handleAreaFormSubmit']({ id: '', ...newAreaData });

        expect(locationStore.addArea).toHaveBeenCalledWith(mockLocation.id, mockCounter.id, newAreaData);
        expect(showToast).toHaveBeenCalledWith('Bereich "New Shelf" hinzugefügt.', 'success');
        expect(mockAreaFormComponentInstance.hide).toHaveBeenCalled();
        expect(mockAreaListComponentInstance.setAreas).toHaveBeenCalled();
    });

    test('handleAreaFormSubmit for existing area should call locationStore.updateArea', async () => {
        component.toggleAreasManagementVisibility(true);
        const existingArea = mockCounter.areas[0];
         if (!existingArea) throw new Error("existingArea is undefined in test setup");
         const updatedAreaData = { ...existingArea, id: existingArea.id, name: 'Updated Shelf A' };

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
        component.toggleAreasManagementVisibility(true);
        const areaToEdit = mockCounter.areas[0];
        if (areaToEdit) {
            component['handleEditArea'](areaToEdit);
            expect(mockAreaFormComponentInstance.show).toHaveBeenCalledWith(areaToEdit);
        } else {
            throw new Error("mockCounter.areas[0] is undefined, cannot run test");
        }
    });

    test('handleDeleteArea should call locationStore.deleteArea after confirmation', async () => {
        component.toggleAreasManagementVisibility(true);
        window.confirm = jest.fn(() => true);
        const areaToDelete = mockCounter.areas[0];
        if (areaToDelete) {
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
        component.toggleAreasManagementVisibility(true);
        window.confirm = jest.fn(() => false);
        const areaToDelete = mockCounter.areas[0];
        if (areaToDelete) {
            await component['handleDeleteArea'](areaToDelete.id, areaToDelete.name);
            expect(locationStore.deleteArea).not.toHaveBeenCalled();
        } else {
            throw new Error("mockCounter.areas[0] is undefined, cannot run test");
        }
      });
  });

  test('update method should update counter name and refresh area list if visible and areas changed', () => {
    component.toggleAreasManagementVisibility(true);

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
    const sameAreasRefDifferentContent: Area[] = [{...firstArea, name: "Changed Area Name", inventoryItems: [] }];
    const updatedCounterData: Counter = {
        ...mockCounter,
        areas: sameAreasRefDifferentContent,
      };
    const originalStringify = JSON.stringify;
    JSON.stringify = jest.fn().mockReturnValueOnce('old_areas').mockReturnValueOnce('new_areas_different_content');

    component.update(mockLocation, updatedCounterData);
    expect(mockAreaListComponentInstance.setAreas).toHaveBeenCalledWith(updatedCounterData.areas);
    JSON.stringify = originalStringify;
  });


  test('getCounterId should return the correct counter ID', () => {
    expect(component.getCounterId()).toBe(mockCounter.id);
  });
});
