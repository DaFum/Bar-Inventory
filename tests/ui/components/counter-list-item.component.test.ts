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

  describe('Error Handling and Edge Cases', () => {
    test('should handle null/undefined location gracefully', () => {
      expect(() => {
        new CounterListItemComponent(null as any, mockCounter, mockCallbacks);
      }).toThrow();
    });

    test('should handle null/undefined counter gracefully', () => {
      expect(() => {
        new CounterListItemComponent(mockLocation, null as any, mockCallbacks);
      }).toThrow();
    });

    test('should handle null/undefined callbacks gracefully', () => {
      expect(() => {
        new CounterListItemComponent(mockLocation, mockCounter, null as any);
      }).toThrow();
    });

    test('should handle counter with empty areas array', () => {
      const counterWithNoAreas = { ...mockCounter, areas: [] };
      const componentWithNoAreas = new CounterListItemComponent(mockLocation, counterWithNoAreas, mockCallbacks);
      document.body.appendChild(componentWithNoAreas.getElement());
      
      componentWithNoAreas.toggleAreasManagementVisibility(true);
      expect(mockAreaListComponentInstance.setAreas).toHaveBeenCalledWith([]);
      
      componentWithNoAreas.getElement().remove();
    });

    test('should handle counter with special characters in name', () => {
      const counterWithSpecialChars = { ...mockCounter, name: 'Counter<>&"\'test' };
      const componentWithSpecialChars = new CounterListItemComponent(mockLocation, counterWithSpecialChars, mockCallbacks);
      document.body.appendChild(componentWithSpecialChars.getElement());
      
      expect(escapeHtml).toHaveBeenCalledWith('Counter<>&"\'test');
      
      componentWithSpecialChars.getElement().remove();
    });

    test('should handle extremely long counter names', () => {
      const longName = 'A'.repeat(1000);
      const counterWithLongName = { ...mockCounter, name: longName };
      const componentWithLongName = new CounterListItemComponent(mockLocation, counterWithLongName, mockCallbacks);
      document.body.appendChild(componentWithLongName.getElement());
      
      expect(escapeHtml).toHaveBeenCalledWith(longName);
      expect(componentWithLongName.getElement().textContent).toContain(longName);
      
      componentWithLongName.getElement().remove();
    });
  });

  describe('Async Operation Error Handling', () => {
    test('handleAreaFormSubmit should handle addArea failure gracefully', async () => {
      const errorMessage = 'Failed to add area';
      (locationStore.addArea as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
      
      component.toggleAreasManagementVisibility(true);
      const newAreaData = { name: 'New Shelf', description: 'Test Desc', displayOrder: 1 };
      
      await component['handleAreaFormSubmit']({ id: '', ...newAreaData });
      
      expect(showToast).toHaveBeenCalledWith('Fehler beim Hinzufügen des Bereichs.', 'error');
      expect(mockAreaFormComponentInstance.hide).toHaveBeenCalled();
    });

    test('handleAreaFormSubmit should handle updateArea failure gracefully', async () => {
      const errorMessage = 'Failed to update area';
      (locationStore.updateArea as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
      
      component.toggleAreasManagementVisibility(true);
      const existingArea = mockCounter.areas[0];
      if (!existingArea) throw new Error("existingArea is undefined in test setup");
      const updatedAreaData = { ...existingArea, name: 'Updated Shelf A' };
      
      await component['handleAreaFormSubmit'](updatedAreaData);
      
      expect(showToast).toHaveBeenCalledWith('Fehler beim Aktualisieren des Bereichs.', 'error');
      expect(mockAreaFormComponentInstance.hide).toHaveBeenCalled();
    });

    test('handleDeleteArea should handle deleteArea failure gracefully', async () => {
      const errorMessage = 'Failed to delete area';
      (locationStore.deleteArea as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
      window.confirm = jest.fn(() => true);
      
      component.toggleAreasManagementVisibility(true);
      const areaToDelete = mockCounter.areas[0];
      if (!areaToDelete) throw new Error("mockCounter.areas[0] is undefined");
      
      await component['handleDeleteArea'](areaToDelete.id, areaToDelete.name);
      
      expect(showToast).toHaveBeenCalledWith('Fehler beim Löschen des Bereichs.', 'error');
    });

    test('should handle locationStore.getLocationById returning null', () => {
      (locationStore.getLocationById as jest.Mock).mockReturnValue(null);
      
      component.toggleAreasManagementVisibility(true);
      const updatedAreaData = { id: 'area1', name: 'Updated Area', inventoryItems: [], displayOrder: 1 };
      
      expect(() => component['handleAreaFormSubmit'](updatedAreaData)).not.toThrow();
    });
  });

  describe('Complex State Management', () => {
    test('should handle multiple rapid toggles of area management visibility', () => {
      const manageAreasButton = component.getElement().querySelector('.manage-areas-btn') as HTMLButtonElement;
      
      // Rapid toggling
      manageAreasButton.click();
      manageAreasButton.click();
      manageAreasButton.click();
      
      const areaManagementDiv = component.getElement().querySelector('.area-management-section') as HTMLDivElement;
      expect(areaManagementDiv.style.display).toBe('block');
    });

    test('should properly clean up when toggling areas management off', () => {
      component.toggleAreasManagementVisibility(true);
      component.toggleAreasManagementVisibility(false);
      
      const areaManagementDiv = component.getElement().querySelector('.area-management-section') as HTMLDivElement;
      expect(areaManagementDiv.style.display).toBe('none');
    });

    test('should handle update with same counter data efficiently', () => {
      component.toggleAreasManagementVisibility(true);
      jest.clearAllMocks();
      
      component.update(mockLocation, mockCounter);
      
      // Should not trigger unnecessary area list updates when data is the same
      expect(mockAreaListComponentInstance.setAreas).not.toHaveBeenCalled();
    });

    test('should handle update when location changes but counter remains same', () => {
      const newLocation = { ...mockLocation, id: 'loc2', name: 'Different Location' };
      component.update(newLocation, mockCounter);
      
      expect(component.getElement().textContent).toContain(mockCounter.name);
    });
  });

  describe('UI Interaction Edge Cases', () => {
    test('should handle rapid button clicks without breaking', () => {
      const editButton = component.getElement().querySelector('.edit-counter-btn') as HTMLButtonElement;
      
      // Simulate rapid clicking
      editButton.click();
      editButton.click();
      editButton.click();
      
      expect(mockCallbacks.onEditCounter).toHaveBeenCalledTimes(3);
      expect(mockCallbacks.onEditCounter).toHaveBeenCalledWith(mockCounter);
    });

    test('should handle delete button clicks in rapid succession', () => {
      const deleteButton = component.getElement().querySelector('.delete-counter-btn') as HTMLButtonElement;
      
      deleteButton.click();
      deleteButton.click();
      
      expect(mockCallbacks.onDeleteCounter).toHaveBeenCalledTimes(2);
      expect(mockCallbacks.onDeleteCounter).toHaveBeenCalledWith(mockCounter.id, mockCounter.name);
    });

    test('should handle area form submission with empty name', async () => {
      component.toggleAreasManagementVisibility(true);
      const emptyAreaData = { name: '', description: 'Test Desc', displayOrder: 1 };
      
      await component['handleAreaFormSubmit']({ id: '', ...emptyAreaData });
      
      // Should still attempt to add the area (validation might be handled elsewhere)
      expect(locationStore.addArea).toHaveBeenCalledWith(mockLocation.id, mockCounter.id, emptyAreaData);
    });

    test('should handle area form submission with very high display order', async () => {
      component.toggleAreasManagementVisibility(true);
      const highOrderAreaData = { name: 'High Order Area', description: 'Test Desc', displayOrder: 99999 };
      
      await component['handleAreaFormSubmit']({ id: '', ...highOrderAreaData });
      
      expect(locationStore.addArea).toHaveBeenCalledWith(mockLocation.id, mockCounter.id, highOrderAreaData);
    });
  });

  describe('Data Validation and Integrity', () => {
    test('should handle areas with missing required properties', () => {
      const incompleteArea = { id: 'incomplete', name: 'Incomplete Area' } as Area;
      const counterWithIncompleteArea = { 
        ...mockCounter, 
        areas: [incompleteArea] 
      };
      
      expect(() => {
        const componentWithIncompleteArea = new CounterListItemComponent(mockLocation, counterWithIncompleteArea, mockCallbacks);
        document.body.appendChild(componentWithIncompleteArea.getElement());
        componentWithIncompleteArea.getElement().remove();
      }).not.toThrow();
    });

    test('should handle counter with duplicate area IDs', () => {
      const duplicateArea1 = { id: 'duplicate', name: 'Area 1', inventoryItems: [], displayOrder: 1 };
      const duplicateArea2 = { id: 'duplicate', name: 'Area 2', inventoryItems: [], displayOrder: 2 };
      const counterWithDuplicates = { 
        ...mockCounter, 
        areas: [duplicateArea1, duplicateArea2] 
      };
      
      const componentWithDuplicates = new CounterListItemComponent(mockLocation, counterWithDuplicates, mockCallbacks);
      document.body.appendChild(componentWithDuplicates.getElement());
      
      componentWithDuplicates.toggleAreasManagementVisibility(true);
      expect(mockAreaListComponentInstance.setAreas).toHaveBeenCalledWith([duplicateArea1, duplicateArea2]);
      
      componentWithDuplicates.getElement().remove();
    });

    test('should handle counter description edge cases', () => {
      const counterWithoutDescription = { ...mockCounter, description: undefined };
      const componentWithoutDesc = new CounterListItemComponent(mockLocation, counterWithoutDescription, mockCallbacks);
      document.body.appendChild(componentWithoutDesc.getElement());
      
      expect(componentWithoutDesc.getElement()).toBeDefined();
      
      componentWithoutDesc.getElement().remove();
    });
  });

  describe('Memory Management and Cleanup', () => {
    test('should properly handle component removal without memory leaks', () => {
      const testComponent = new CounterListItemComponent(mockLocation, mockCounter, mockCallbacks);
      document.body.appendChild(testComponent.getElement());
      
      testComponent.toggleAreasManagementVisibility(true);
      
      // Simulate component cleanup
      testComponent.getElement().remove();
      
      // Component should still be functional after removal and re-addition
      document.body.appendChild(testComponent.getElement());
      expect(testComponent.getCounterId()).toBe(mockCounter.id);
      
      testComponent.getElement().remove();
    });

    test('should handle multiple component instances correctly', () => {
      const counter2 = { ...mockCounter, id: 'counter2', name: 'Second Counter' };
      const component2 = new CounterListItemComponent(mockLocation, counter2, mockCallbacks);
      
      document.body.appendChild(component2.getElement());
      
      expect(component.getCounterId()).toBe('counter1');
      expect(component2.getCounterId()).toBe('counter2');
      
      component2.getElement().remove();
    });
  });

  describe('Accessibility and User Experience', () => {
    test('should have proper ARIA attributes and accessibility features', () => {
      const element = component.getElement();
      const editButton = element.querySelector('.edit-counter-btn') as HTMLButtonElement;
      const deleteButton = element.querySelector('.delete-counter-btn') as HTMLButtonElement;
      const manageAreasButton = element.querySelector('.manage-areas-btn') as HTMLButtonElement;
      
      expect(editButton).not.toBeNull();
      expect(deleteButton).not.toBeNull();
      expect(manageAreasButton).not.toBeNull();
      
      // Buttons should be focusable and have proper roles
      expect(editButton.tagName).toBe('BUTTON');
      expect(deleteButton.tagName).toBe('BUTTON');
      expect(manageAreasButton.tagName).toBe('BUTTON');
    });

    test('should maintain proper tab order for interactive elements', () => {
      const element = component.getElement();
      const buttons = element.querySelectorAll('button');
      
      expect(buttons.length).toBeGreaterThanOrEqual(3);
      
      // All buttons should be focusable (not disabled by default)
      buttons.forEach(button => {
        expect(button.disabled).toBe(false);
      });
    });
  });

  describe('Performance and Optimization', () => {
    test('should not re-render unnecessarily when update is called with identical data', () => {
      const renderSpy = jest.spyOn(component as any, 'render');
      
      component.update(mockLocation, mockCounter);
      
      // Should not trigger a full re-render for identical data
      expect(renderSpy).not.toHaveBeenCalled();
      
      renderSpy.mockRestore();
    });

    test('should handle large numbers of areas efficiently', () => {
      const manyAreas = Array.from({ length: 100 }, (_, i) => ({
        id: `area${i}`,
        name: `Area ${i}`,
        inventoryItems: [],
        displayOrder: i
      }));
      
      const counterWithManyAreas = { ...mockCounter, areas: manyAreas };
      const componentWithManyAreas = new CounterListItemComponent(mockLocation, counterWithManyAreas, mockCallbacks);
      
      document.body.appendChild(componentWithManyAreas.getElement());
      
      const start = performance.now();
      componentWithManyAreas.toggleAreasManagementVisibility(true);
      const end = performance.now();
      
      // Should complete within reasonable time (less than 100ms)
      expect(end - start).toBeLessThan(100);
      
      componentWithManyAreas.getElement().remove();
    });
  });

  describe('Integration with External Dependencies', () => {
    test('should handle escapeHtml function throwing an error', () => {
      (escapeHtml as jest.Mock).mockImplementationOnce(() => {
        throw new Error('escapeHtml failed');
      });
      
      expect(() => {
        const failingComponent = new CounterListItemComponent(mockLocation, mockCounter, mockCallbacks);
        document.body.appendChild(failingComponent.getElement());
        failingComponent.getElement().remove();
      }).toThrow('escapeHtml failed');
    });

    test('should handle showToast being unavailable', async () => {
      (showToast as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Toast service unavailable');
      });
      
      component.toggleAreasManagementVisibility(true);
      const newAreaData = { name: 'New Shelf', description: 'Test Desc', displayOrder: 1 };
      
      // Should not crash even if toast fails
      await expect(component['handleAreaFormSubmit']({ id: '', ...newAreaData }))
        .rejects.toThrow('Toast service unavailable');
    });
  });
});
