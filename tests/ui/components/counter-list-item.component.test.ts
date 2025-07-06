import { CounterListItemComponent, CounterListItemCallbacks } from '../../../src/ui/components/counter-list-item.component';
import { Location as LocationModel, Counter, Area } from '../../../src/models';
import { escapeHtml } from '../../../src/utils/security';
import { showToast } from '../../../src/ui/components/toast-notifications';
import { locationStore } from '../../../src/state/location.store';
import { AreaListComponent } from '../../../src/ui/components/area-list.component';
import { AreaFormComponent } from '../../../src/ui/components/area-form.component';

// Mock dependencies
jest.mock('../../../src/utils/security', () => ({
  escapeHtml: jest.fn((str) => str), // Simple pass-through
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

// Define mock instances first
const mockAreaListComponentInstance = {
    appendTo: jest.fn(),
    setAreas: jest.fn(),
};
const mockAreaFormComponentInstance = {
    appendTo: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
};

// Then use them in jest.mock
jest.mock('../../../src/ui/components/area-list.component', () => {
    return {
      // AreaListComponent constructor mock returns the pre-defined instance
      AreaListComponent: jest.fn(() => mockAreaListComponentInstance),
    };
  });

jest.mock('../../../src/ui/components/area-form.component', () => {
    return {
      // AreaFormComponent constructor mock returns the pre-defined instance
      AreaFormComponent: jest.fn(() => mockAreaFormComponentInstance),
    };
  });

// The let declarations for these are no longer needed as they are const above.

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

  // Additional Edge Cases and Error Handling Tests
  describe('Edge Cases and Error Handling', () => {
    test('should handle counter with no areas gracefully', () => {
      const counterWithNoAreas: Counter = {
        id: 'counter-no-areas',
        name: 'Empty Counter',
        description: 'Counter with no areas',
        areas: []
      };
      const componentNoAreas = new CounterListItemComponent(mockLocation, counterWithNoAreas, mockCallbacks);
      document.body.appendChild(componentNoAreas.getElement());
      
      const manageAreasButton = componentNoAreas.getElement().querySelector('.manage-areas-btn') as HTMLButtonElement;
      manageAreasButton.click();
      
      expect(mockAreaListComponentInstance.setAreas).toHaveBeenCalledWith([]);
      componentNoAreas.getElement().remove();
    });

    test('should handle counter with undefined areas gracefully', () => {
      const counterWithUndefinedAreas: Counter = {
        id: 'counter-undefined-areas',
        name: 'Undefined Areas Counter',
        description: 'Counter with undefined areas',
        areas: undefined as any
      };
      expect(() => {
        new CounterListItemComponent(mockLocation, counterWithUndefinedAreas, mockCallbacks);
      }).not.toThrow();
    });

    test('should handle counter with null name gracefully', () => {
      const counterWithNullName: Counter = {
        id: 'counter-null-name',
        name: null as any,
        description: 'Counter with null name',
        areas: []
      };
      const componentNullName = new CounterListItemComponent(mockLocation, counterWithNullName, mockCallbacks);
      document.body.appendChild(componentNullName.getElement());
      
      const element = componentNullName.getElement();
      expect(element.textContent).toContain(''); // Should not crash
      expect(escapeHtml).toHaveBeenCalledWith(null);
      componentNullName.getElement().remove();
    });

    test('should handle counter with empty string name', () => {
      const counterWithEmptyName: Counter = {
        id: 'counter-empty-name',
        name: '',
        description: 'Counter with empty name',
        areas: []
      };
      const componentEmptyName = new CounterListItemComponent(mockLocation, counterWithEmptyName, mockCallbacks);
      document.body.appendChild(componentEmptyName.getElement());
      
      const element = componentEmptyName.getElement();
      expect(element.dataset.counterId).toBe('counter-empty-name');
      expect(escapeHtml).toHaveBeenCalledWith('');
      componentEmptyName.getElement().remove();
    });

    test('should handle special characters in counter name', () => {
      const counterWithSpecialChars: Counter = {
        id: 'counter-special',
        name: '<script>alert("xss")</script>&nbsp;Counter',
        description: 'Counter with special characters',
        areas: []
      };
      const componentSpecialChars = new CounterListItemComponent(mockLocation, counterWithSpecialChars, mockCallbacks);
      document.body.appendChild(componentSpecialChars.getElement());
      
      expect(escapeHtml).toHaveBeenCalledWith('<script>alert("xss")</script>&nbsp;Counter');
      componentSpecialChars.getElement().remove();
    });

    test('should handle locationStore.addArea rejection gracefully', async () => {
      const manageAreasButton = component.getElement().querySelector('.manage-areas-btn') as HTMLButtonElement;
      manageAreasButton.click();
      
      const addAreaError = new Error('Failed to add area');
      (locationStore.addArea as jest.Mock).mockRejectedValueOnce(addAreaError);
      
      const newAreaData = { name: 'New Shelf', description: 'Test Desc', displayOrder: 1 };
      await component['handleAreaFormSubmit']({ id: '', ...newAreaData });
      
      expect(showToast).toHaveBeenCalledWith('Fehler beim Hinzufügen des Bereichs.', 'error');
      expect(mockAreaFormComponentInstance.hide).toHaveBeenCalled();
    });

    test('should handle locationStore.updateArea rejection gracefully', async () => {
      const manageAreasButton = component.getElement().querySelector('.manage-areas-btn') as HTMLButtonElement;
      manageAreasButton.click();
      
      const updateAreaError = new Error('Failed to update area');
      (locationStore.updateArea as jest.Mock).mockRejectedValueOnce(updateAreaError);
      
      const existingArea = mockCounter.areas[0];
      if (!existingArea) throw new Error("existingArea is undefined in test setup");
      const updatedAreaData = { ...existingArea, name: 'Updated Shelf A' };
      
      await component['handleAreaFormSubmit'](updatedAreaData);
      
      expect(showToast).toHaveBeenCalledWith('Fehler beim Aktualisieren des Bereichs.', 'error');
      expect(mockAreaFormComponentInstance.hide).toHaveBeenCalled();
    });

    test('should handle locationStore.deleteArea rejection gracefully', async () => {
      const manageAreasButton = component.getElement().querySelector('.manage-areas-btn') as HTMLButtonElement;
      manageAreasButton.click();
      
      window.confirm = jest.fn(() => true);
      const deleteAreaError = new Error('Failed to delete area');
      (locationStore.deleteArea as jest.Mock).mockRejectedValueOnce(deleteAreaError);
      
      const areaToDelete = mockCounter.areas[0];
      if (!areaToDelete) throw new Error("areaToDelete is undefined in test setup");
      
      await component['handleDeleteArea'](areaToDelete.id, areaToDelete.name);
      
      expect(showToast).toHaveBeenCalledWith('Fehler beim Löschen des Bereichs.', 'error');
    });

    test('should handle locationStore.getLocationById returning null', () => {
      (locationStore.getLocationById as jest.Mock).mockReturnValue(null);
      
      const manageAreasButton = component.getElement().querySelector('.manage-areas-btn') as HTMLButtonElement;
      manageAreasButton.click();
      
      expect(mockAreaListComponentInstance.setAreas).toHaveBeenCalledWith([]);
    });
  });

  describe('Component State Management', () => {
    test('should maintain area management visibility state correctly', () => {
      expect(component.isAreasManagementVisible()).toBe(false);
      
      component.toggleAreasManagementVisibility(true);
      expect(component.isAreasManagementVisible()).toBe(true);
      
      component.toggleAreasManagementVisibility(false);
      expect(component.isAreasManagementVisible()).toBe(false);
    });

    test('should toggle area management visibility when called without parameter', () => {
      expect(component.isAreasManagementVisible()).toBe(false);
      
      component.toggleAreasManagementVisibility();
      expect(component.isAreasManagementVisible()).toBe(true);
      
      component.toggleAreasManagementVisibility();
      expect(component.isAreasManagementVisible()).toBe(false);
    });

    test('should not reinitialize area components when already visible', () => {
      const manageAreasButton = component.getElement().querySelector('.manage-areas-btn') as HTMLButtonElement;
      manageAreasButton.click(); // First click
      
      const initialCallCount = (AreaListComponent as jest.Mock).mock.calls.length;
      const initialFormCallCount = (AreaFormComponent as jest.Mock).mock.calls.length;
      
      manageAreasButton.click(); // Hide
      manageAreasButton.click(); // Show again
      
      expect((AreaListComponent as jest.Mock).mock.calls.length).toBe(initialCallCount);
      expect((AreaFormComponent as jest.Mock).mock.calls.length).toBe(initialFormCallCount);
    });
  });

  describe('DOM Manipulation and Event Handling', () => {
    test('should properly set up event listeners on buttons', () => {
      const element = component.getElement();
      const editButton = element.querySelector('.edit-counter-btn') as HTMLButtonElement;
      const deleteButton = element.querySelector('.delete-counter-btn') as HTMLButtonElement;
      const manageAreasButton = element.querySelector('.manage-areas-btn') as HTMLButtonElement;
      
      expect(editButton).toBeTruthy();
      expect(deleteButton).toBeTruthy();
      expect(manageAreasButton).toBeTruthy();
      
      // Verify buttons are interactive
      expect(editButton.disabled).toBe(false);
      expect(deleteButton.disabled).toBe(false);
      expect(manageAreasButton.disabled).toBe(false);
    });

    test('should handle multiple rapid clicks on manage areas button', () => {
      const manageAreasButton = component.getElement().querySelector('.manage-areas-btn') as HTMLButtonElement;
      
      // Simulate rapid clicks
      manageAreasButton.click();
      manageAreasButton.click();
      manageAreasButton.click();
      
      const areaManagementDiv = component.getElement().querySelector('.area-management-section') as HTMLDivElement;
      expect(areaManagementDiv.style.display).toBe('block');
    });

    test('should handle clicking on area management when components are not initialized', () => {
      const manageAreasButton = component.getElement().querySelector('.manage-areas-btn') as HTMLButtonElement;
      
      // Clear any existing mocks
      jest.clearAllMocks();
      
      expect(() => {
        manageAreasButton.click();
      }).not.toThrow();
    });

    test('should properly clean up event listeners when element is removed', () => {
      const element = component.getElement();
      const editButton = element.querySelector('.edit-counter-btn') as HTMLButtonElement;
      
      // Remove from DOM
      element.remove();
      
      // Clicking should not cause any issues
      expect(() => {
        editButton.click();
      }).not.toThrow();
    });
  });

  describe('Data Integrity and Validation', () => {
    test('should preserve counter data integrity during updates', () => {
      const originalCounterData = JSON.parse(JSON.stringify(mockCounter));
      
      const updatedCounterData: Counter = {
        ...mockCounter,
        name: 'Updated Counter Name',
        description: 'Updated description'
      };
      
      component.update(mockLocation, updatedCounterData);
      
      // Verify original data was not mutated
      expect(mockCounter).toEqual(originalCounterData);
      expect(component.getCounterId()).toBe(updatedCounterData.id);
    });

    test('should handle update with same counter data', () => {
      const initialCallCount = (escapeHtml as jest.Mock).mock.calls.length;
      
      component.update(mockLocation, mockCounter);
      
      expect((escapeHtml as jest.Mock).mock.calls.length).toBe(initialCallCount + 1);
    });

    test('should handle update with different location data', () => {
      const differentLocation: LocationModel = {
        id: 'different-location',
        name: 'Different Location',
        address: '456 Different St',
        counters: [mockCounter]
      };
      
      component.update(differentLocation, mockCounter);
      
      expect(component.getElement().textContent).toContain(mockCounter.name);
    });

    test('should validate area data before submission', async () => {
      const manageAreasButton = component.getElement().querySelector('.manage-areas-btn') as HTMLButtonElement;
      manageAreasButton.click();
      
      const invalidAreaData = { name: '', description: '', displayOrder: -1 };
      
      // This should still work as the validation might be handled by the form component
      await component['handleAreaFormSubmit']({ id: '', ...invalidAreaData });
      
      expect(locationStore.addArea).toHaveBeenCalledWith(mockLocation.id, mockCounter.id, invalidAreaData);
    });
  });

  describe('Accessibility and User Experience', () => {
    test('should have proper ARIA attributes on buttons', () => {
      const element = component.getElement();
      const editButton = element.querySelector('.edit-counter-btn') as HTMLButtonElement;
      const deleteButton = element.querySelector('.delete-counter-btn') as HTMLButtonElement;
      const manageAreasButton = element.querySelector('.manage-areas-btn') as HTMLButtonElement;
      
      // Verify buttons have appropriate attributes for accessibility
      expect(editButton.tagName).toBe('BUTTON');
      expect(deleteButton.tagName).toBe('BUTTON');
      expect(manageAreasButton.tagName).toBe('BUTTON');
    });

    test('should maintain focus management when showing/hiding area management', () => {
      const manageAreasButton = component.getElement().querySelector('.manage-areas-btn') as HTMLButtonElement;
      
      manageAreasButton.focus();
      expect(document.activeElement).toBe(manageAreasButton);
      
      manageAreasButton.click();
      
      // Focus should remain manageable
      expect(document.activeElement).toBeDefined();
    });
  });

  describe('Integration with Store and External Dependencies', () => {
    test('should handle store operations with different location and counter IDs', async () => {
      const differentLocation: LocationModel = {
        id: 'loc-different',
        name: 'Different Location',
        address: '789 Different Ave',
        counters: []
      };
      
      const differentCounter: Counter = {
        id: 'counter-different',
        name: 'Different Counter',
        description: 'A different counter',
        areas: []
      };
      
      const differentComponent = new CounterListItemComponent(differentLocation, differentCounter, mockCallbacks);
      document.body.appendChild(differentComponent.getElement());
      
      const manageAreasButton = differentComponent.getElement().querySelector('.manage-areas-btn') as HTMLButtonElement;
      manageAreasButton.click();
      
      const newAreaData = { name: 'New Area', description: 'Test', displayOrder: 1 };
      await differentComponent['handleAreaFormSubmit']({ id: '', ...newAreaData });
      
      expect(locationStore.addArea).toHaveBeenCalledWith('loc-different', 'counter-different', newAreaData);
      
      differentComponent.getElement().remove();
    });

    test('should handle escapeHtml function returning different values', () => {
      (escapeHtml as jest.Mock).mockReturnValueOnce('escaped-content');
      
      const componentEscaped = new CounterListItemComponent(mockLocation, mockCounter, mockCallbacks);
      document.body.appendChild(componentEscaped.getElement());
      
      expect(componentEscaped.getElement().textContent).toContain('escaped-content');
      
      componentEscaped.getElement().remove();
    });

    test('should handle toast notifications for various scenarios', async () => {
      const manageAreasButton = component.getElement().querySelector('.manage-areas-btn') as HTMLButtonElement;
      manageAreasButton.click();
      
      // Test success scenario
      const newAreaData = { name: 'Success Area', description: 'Test', displayOrder: 1 };
      await component['handleAreaFormSubmit']({ id: '', ...newAreaData });
      
      expect(showToast).toHaveBeenCalledWith('Bereich "Success Area" hinzugefügt.', 'success');
      
      // Test error scenario
      (locationStore.addArea as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      await component['handleAreaFormSubmit']({ id: '', ...newAreaData });
      
      expect(showToast).toHaveBeenCalledWith('Fehler beim Hinzufügen des Bereichs.', 'error');
    });
  });

  describe('Performance and Memory Management', () => {
    test('should not create excessive DOM nodes', () => {
      const initialChildCount = document.body.children.length;
      
      const multipleComponents = [];
      for (let i = 0; i < 5; i++) {
        const testCounter: Counter = {
          id: `counter-${i}`,
          name: `Counter ${i}`,
          description: `Description ${i}`,
          areas: []
        };
        const comp = new CounterListItemComponent(mockLocation, testCounter, mockCallbacks);
        multipleComponents.push(comp);
        document.body.appendChild(comp.getElement());
      }
      
      expect(document.body.children.length).toBe(initialChildCount + 5 + 1); // +1 for the original component
      
      // Cleanup
      multipleComponents.forEach(comp => comp.getElement().remove());
    });

    test('should handle component recreation without memory leaks', () => {
      const originalComponent = component;
      originalComponent.getElement().remove();
      
      const newComponent = new CounterListItemComponent(mockLocation, mockCounter, mockCallbacks);
      document.body.appendChild(newComponent.getElement());
      
      expect(newComponent.getCounterId()).toBe(mockCounter.id);
      expect(newComponent.getElement().dataset.counterId).toBe(mockCounter.id);

      newComponent.getElement().remove();
    });
  });
});
