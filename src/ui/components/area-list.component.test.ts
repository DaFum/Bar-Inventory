import { AreaListComponent } from './area-list.component';
import { AreaListItemComponent, AreaListItemCallbacks } from './area-list-item.component';
import { Area } from '../../models';

// Mock AreaListItemComponent
jest.mock('./area-list-item.component', () => {
  return {
    AreaListItemComponent: jest.fn().mockImplementation((area: Area, callbacks: AreaListItemCallbacks) => {
      const element = document.createElement('div');
      element.className = 'mock-area-list-item';
      element.textContent = area.name;
      element.dataset.areaId = area.id;
      return {
        getElement: () => element,
        appendTo: jest.fn((parent: HTMLElement) => parent.appendChild(element)),
        update: jest.fn((updatedArea: Area) => { element.textContent = updatedArea.name; }),
        remove: jest.fn(() => element.remove()),
        getAreaId: () => area.id,
      };
    }),
  };
});

describe('AreaListComponent', () => {
  let areaListComponent: AreaListComponent;
  let mockCallbacks: AreaListItemCallbacks;
  let initialAreas: Area[];

  beforeEach(() => {
    mockCallbacks = {
      onEdit: jest.fn(),
      onDelete: jest.fn(),
    };
    initialAreas = [
      { id: 'area1', name: 'Area Alpha', displayOrder: 2, inventoryItems: [] },
      { id: 'area2', name: 'Area Beta', displayOrder: 1, inventoryItems: [] },
      { id: 'area3', name: 'Area Gamma', inventoryItems: [] }, // No displayOrder
    ];
    // Clear all instances and calls to constructor and methods of AreaListItemComponent mock
    (AreaListItemComponent as jest.Mock).mockClear();
    areaListComponent = new AreaListComponent(initialAreas, mockCallbacks);
    document.body.appendChild(areaListComponent.getElement());
  });

  afterEach(() => {
    areaListComponent.getElement().remove();
  });

  test('constructor should initialize with areas and sort them', () => {
    expect(AreaListItemComponent).toHaveBeenCalledTimes(initialAreas.length);
    const listHostDiv = areaListComponent.getElement().querySelector('#area-list');
    expect(listHostDiv).not.toBeNull();
    const items = listHostDiv!.children;
    expect(items.length).toBe(initialAreas.length);
    // Check order: Beta (1), Alpha (2), Gamma (N/A, then by name)
    if (!items[0] || !items[1] || !items[2]) throw new Error("Test assumption failed: not enough items in constructor test");
    expect(items[0].textContent).toBe('Area Beta');
    expect(items[1].textContent).toBe('Area Alpha');
    expect(items[2].textContent).toBe('Area Gamma');
  });

  test('setAreas should re-render the list with new sorted areas', () => {
    const newAreas: Area[] = [
      { id: 'area4', name: 'Area Delta', displayOrder: 1, inventoryItems: [] },
      { id: 'area5', name: 'Area Epsilon', displayOrder: 0, inventoryItems: [] },
    ];
    areaListComponent.setAreas(newAreas);
    expect(AreaListItemComponent).toHaveBeenCalledTimes(initialAreas.length + newAreas.length); // Called for initial + new set

    const listHostDiv = areaListComponent.getElement().querySelector('#area-list');
    const items = listHostDiv!.children;
    expect(items.length).toBe(newAreas.length);
    if (!items[0] || !items[1]) throw new Error("Test assumption failed: not enough items in setAreas test");
    expect(items[0].textContent).toBe('Area Epsilon');
    expect(items[1].textContent).toBe('Area Delta');
  });

  test('setAreas with empty array should display "no areas" message', () => {
    areaListComponent.setAreas([]);
    expect(areaListComponent.getElement().textContent).toContain('Noch keine Bereiche für diesen Tresen erfasst.');
    expect(areaListComponent.getElement().querySelector('#area-list')).toBeNull();
  });

  test('addArea should add an area and insert it sorted into the DOM', () => {
    const newArea: Area = { id: 'area0', name: 'Area Zero', displayOrder: 0, inventoryItems: [] };
    areaListComponent.addArea(newArea); // initialAreas has 3, this is the 4th call to constructor overall

    const listHostDiv = areaListComponent.getElement().querySelector('#area-list');
    const items = listHostDiv!.children;
    expect(items.length).toBe(initialAreas.length + 1);
    if (!items[0] || !items[1]) throw new Error("Test assumption failed: not enough items in addArea test");
    expect(items[0].textContent).toBe('Area Zero'); // Zero (0)
    expect(items[1].textContent).toBe('Area Beta');  // Beta (1)
    expect(AreaListItemComponent).toHaveBeenCalledTimes(initialAreas.length + 1);
  });

  test('addArea to an empty list should render the list with the new area', () => {
    areaListComponent.setAreas([]); // Make it empty
    (AreaListItemComponent as jest.Mock).mockClear(); // Clear previous calls

    const newArea: Area = { id: 'areaNew', name: 'First Area', displayOrder: 1, inventoryItems: [] };
    areaListComponent.addArea(newArea);

    expect(AreaListItemComponent).toHaveBeenCalledTimes(1);
    const listHostDiv = areaListComponent.getElement().querySelector('#area-list');
    expect(listHostDiv).not.toBeNull();
    const items = listHostDiv!.children;
    expect(items.length).toBe(1);
    if (!items[0]) throw new Error("Test assumption failed: item not found in addArea to empty list test");
    expect(items[0].textContent).toBe('First Area');
  });


  test('updateArea should update the corresponding item and re-sort if needed', () => {
    if (!initialAreas[1]) throw new Error("Test assumption failed: initialAreas[1] is undefined for updateArea test");
    const updatedArea: Area = { ...initialAreas[1], name: 'Area Beta Updated', displayOrder: 3, inventoryItems: [] }; // Was Beta, order 1
    areaListComponent.updateArea(updatedArea);

    const mockItemInstance = (AreaListItemComponent as jest.Mock).mock.results.find(
        (result: any) => result.value.getAreaId() === updatedArea.id
      )?.value;
    expect(mockItemInstance.update).toHaveBeenCalledWith(updatedArea);

    // Check DOM order: Alpha(2), Gamma(N/A), Beta Updated (3)
    // Original order: Beta(1), Alpha(2), Gamma(N/A)
    // Re-query items from the DOM after the update operation
    const listHostDiv = areaListComponent.getElement().querySelector('#area-list');
    const items = listHostDiv!.children;
    expect(items.length).toBe(initialAreas.length);
    if (!items[0] || !items[1] || !items[2]) throw new Error("Test assumption failed: not enough items for updateArea order check");
    const texts = Array.from(items).map(item => item.textContent);
    expect(texts).toEqual(['Area Alpha', 'Area Beta Updated', 'Area Gamma']);
  });

  test('updateArea for a non-existent area should add it', () => {
    const newAreaToUpdate: Area = { id: 'areaNonExistent', name: 'New via Update', displayOrder: 0, inventoryItems: [] };
    areaListComponent.updateArea(newAreaToUpdate);

    const listHostDiv = areaListComponent.getElement().querySelector('#area-list');
    const items = listHostDiv!.children;
    expect(items.length).toBe(initialAreas.length + 1);
    if (!items[0]) throw new Error("Test assumption failed: item not found for updateArea non-existent test");
    expect(items[0].textContent).toBe('New via Update'); // Should be at the top due to displayOrder 0
  });

  test('removeArea should remove the item from the list and DOM', () => {
    if (!initialAreas[1]) throw new Error("Test assumption failed: initialAreas[1] is undefined for removeArea test");
    const areaIdToRemove = initialAreas[1].id; // Area Beta
    const mockItemInstanceToRemove = (AreaListItemComponent as jest.Mock).mock.results.find(
        (result: any) => result.value.getAreaId() === areaIdToRemove
      )?.value;

    areaListComponent.removeArea(areaIdToRemove);

    expect(mockItemInstanceToRemove.remove).toHaveBeenCalled();
    const listHostDiv = areaListComponent.getElement().querySelector('#area-list');
    const items = listHostDiv!.children;
    expect(items.length).toBe(initialAreas.length - 1);
    expect(Array.from(items).find(item => item.textContent === 'Area Beta')).toBeUndefined();
  });

  test('removeArea last item should display "no areas" message', () => {
    if (!initialAreas[0] || !initialAreas[1] || !initialAreas[2]) throw new Error("Test assumption failed: not enough initialAreas for remove last item test");
    areaListComponent.removeArea(initialAreas[0].id);
    areaListComponent.removeArea(initialAreas[1].id);
    areaListComponent.removeArea(initialAreas[2].id);

    expect(areaListComponent.getElement().textContent).toContain('Noch keine Bereiche für diesen Tresen erfasst.');
    expect(areaListComponent.getElement().querySelector('#area-list')).toBeNull();
  });

  test('sorting logic should handle undefined displayOrder correctly', () => {
    // initialAreas already includes an area with undefined displayOrder ('Area Gamma')
    // The constructor test verifies its position based on name after those with displayOrder.
    // Add another area with undefined displayOrder to test relative sorting among them.
    const areaOmega: Area = { id: 'areaOmega', name: 'Area Omega', inventoryItems: [] }; // No displayOrder
    areaListComponent.addArea(areaOmega);
    // Expected order: Beta (1), Alpha (2), Gamma (N/A), Omega (N/A) -> Gamma before Omega by name
    const listHostDiv = areaListComponent.getElement().querySelector('#area-list');
    const items = listHostDiv!.children;
    if (!items[0] || !items[1] || !items[2] || !items[3]) throw new Error("Test assumption failed: not enough items for sorting logic test");
    expect(items[0].textContent).toBe('Area Beta');
    expect(items[1].textContent).toBe('Area Alpha');
    expect(items[2].textContent).toBe('Area Gamma');
    expect(items[3].textContent).toBe('Area Omega');
  });
});

  // Additional comprehensive tests for edge cases and error conditions

  describe('Error Handling and Edge Cases', () => {
    test('should handle null/undefined areas gracefully', () => {
      expect(() => {
        new AreaListComponent(null as any, mockCallbacks);
      }).not.toThrow();
      
      expect(() => {
        new AreaListComponent(undefined as any, mockCallbacks);
      }).not.toThrow();
    });

    test('should handle areas with null/undefined properties', () => {
      const malformedAreas: Area[] = [
        { id: null as any, name: 'Null ID Area', displayOrder: 1, inventoryItems: [] },
        { id: 'valid-id', name: null as any, displayOrder: 2, inventoryItems: [] },
        { id: 'another-id', name: 'Valid Name', displayOrder: null as any, inventoryItems: [] },
      ];
      
      expect(() => {
        new AreaListComponent(malformedAreas, mockCallbacks);
      }).not.toThrow();
    });

    test('should handle duplicate area IDs', () => {
      const duplicateAreas: Area[] = [
        { id: 'duplicate', name: 'First Area', displayOrder: 1, inventoryItems: [] },
        { id: 'duplicate', name: 'Second Area', displayOrder: 2, inventoryItems: [] },
      ];
      
      const component = new AreaListComponent(duplicateAreas, mockCallbacks);
      document.body.appendChild(component.getElement());
      
      const listHostDiv = component.getElement().querySelector('#area-list');
      expect(listHostDiv?.children.length).toBe(2);
      
      component.getElement().remove();
    });

    test('should handle empty or whitespace-only area names', () => {
      const emptyNameAreas: Area[] = [
        { id: 'empty1', name: '', displayOrder: 1, inventoryItems: [] },
        { id: 'empty2', name: '   ', displayOrder: 2, inventoryItems: [] },
        { id: 'empty3', name: '\n\t', displayOrder: 3, inventoryItems: [] },
      ];
      
      const component = new AreaListComponent(emptyNameAreas, mockCallbacks);
      document.body.appendChild(component.getElement());
      
      const listHostDiv = component.getElement().querySelector('#area-list');
      expect(listHostDiv?.children.length).toBe(3);
      
      component.getElement().remove();
    });

    test('should handle areas with very long names', () => {
      const longName = 'A'.repeat(1000);
      const longNameAreas: Area[] = [
        { id: 'long-name', name: longName, displayOrder: 1, inventoryItems: [] },
      ];
      
      const component = new AreaListComponent(longNameAreas, mockCallbacks);
      document.body.appendChild(component.getElement());
      
      const listHostDiv = component.getElement().querySelector('#area-list');
      expect(listHostDiv?.children.length).toBe(1);
      expect(listHostDiv?.children[0]?.textContent).toBe(longName);
      
      component.getElement().remove();
    });

    test('should handle areas with special characters in names', () => {
      const specialCharAreas: Area[] = [
        { id: 'special1', name: 'Area with émojis 🎉🚀', displayOrder: 1, inventoryItems: [] },
        { id: 'special2', name: 'Area with ümlaut and ñ', displayOrder: 2, inventoryItems: [] },
        { id: 'special3', name: 'Area with <script>alert("xss")</script>', displayOrder: 3, inventoryItems: [] },
        { id: 'special4', name: 'Area with\nnewlines\tand\ttabs', displayOrder: 4, inventoryItems: [] },
      ];
      
      const component = new AreaListComponent(specialCharAreas, mockCallbacks);
      document.body.appendChild(component.getElement());
      
      const listHostDiv = component.getElement().querySelector('#area-list');
      expect(listHostDiv?.children.length).toBe(4);
      
      component.getElement().remove();
    });

    test('should handle null/undefined callbacks', () => {
      expect(() => {
        new AreaListComponent(initialAreas, null as any);
      }).not.toThrow();
      
      expect(() => {
        new AreaListComponent(initialAreas, undefined as any);
      }).not.toThrow();
    });

    test('should handle callbacks with missing methods', () => {
      const incompleteCallbacks = {} as AreaListItemCallbacks;
      
      expect(() => {
        new AreaListComponent(initialAreas, incompleteCallbacks);
      }).not.toThrow();
    });
  });

  describe('Boundary Conditions and Performance', () => {
    test('should handle negative displayOrder values', () => {
      const negativeOrderAreas: Area[] = [
        { id: 'neg1', name: 'Negative Order 1', displayOrder: -5, inventoryItems: [] },
        { id: 'neg2', name: 'Negative Order 2', displayOrder: -1, inventoryItems: [] },
        { id: 'pos1', name: 'Positive Order', displayOrder: 1, inventoryItems: [] },
      ];
      
      const component = new AreaListComponent(negativeOrderAreas, mockCallbacks);
      document.body.appendChild(component.getElement());
      
      const listHostDiv = component.getElement().querySelector('#area-list');
      const items = listHostDiv?.children;
      
      // Should sort negative numbers correctly: -5, -1, 1
      expect(items?.[0]?.textContent).toBe('Negative Order 1');
      expect(items?.[1]?.textContent).toBe('Negative Order 2');
      expect(items?.[2]?.textContent).toBe('Positive Order');
      
      component.getElement().remove();
    });

    test('should handle very large displayOrder values', () => {
      const largeOrderAreas: Area[] = [
        { id: 'large1', name: 'Large Order 1', displayOrder: Number.MAX_SAFE_INTEGER, inventoryItems: [] },
        { id: 'large2', name: 'Large Order 2', displayOrder: Number.MAX_SAFE_INTEGER - 1, inventoryItems: [] },
        { id: 'normal', name: 'Normal Order', displayOrder: 1, inventoryItems: [] },
      ];
      
      const component = new AreaListComponent(largeOrderAreas, mockCallbacks);
      document.body.appendChild(component.getElement());
      
      const listHostDiv = component.getElement().querySelector('#area-list');
      const items = listHostDiv?.children;
      
      expect(items?.[0]?.textContent).toBe('Normal Order');
      expect(items?.[1]?.textContent).toBe('Large Order 2');
      expect(items?.[2]?.textContent).toBe('Large Order 1');
      
      component.getElement().remove();
    });

    test('should handle large number of areas efficiently', () => {
      const manyAreas: Area[] = [];
      for (let i = 0; i < 1000; i++) {
        manyAreas.push({
          id: `area-${i}`,
          name: `Area ${i}`,
          displayOrder: Math.floor(Math.random() * 100),
          inventoryItems: []
        });
      }
      
      const startTime = performance.now();
      const component = new AreaListComponent(manyAreas, mockCallbacks);
      document.body.appendChild(component.getElement());
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      
      const listHostDiv = component.getElement().querySelector('#area-list');
      expect(listHostDiv?.children.length).toBe(1000);
      
      component.getElement().remove();
    });

    test('should handle floating point displayOrder values', () => {
      const floatOrderAreas: Area[] = [
        { id: 'float1', name: 'Float 1', displayOrder: 1.5, inventoryItems: [] },
        { id: 'float2', name: 'Float 2', displayOrder: 1.1, inventoryItems: [] },
        { id: 'float3', name: 'Float 3', displayOrder: 1.9, inventoryItems: [] },
      ];
      
      const component = new AreaListComponent(floatOrderAreas, mockCallbacks);
      document.body.appendChild(component.getElement());
      
      const listHostDiv = component.getElement().querySelector('#area-list');
      const items = listHostDiv?.children;
      
      expect(items?.[0]?.textContent).toBe('Float 2');
      expect(items?.[1]?.textContent).toBe('Float 1');
      expect(items?.[2]?.textContent).toBe('Float 3');
      
      component.getElement().remove();
    });
  });

  describe('State Management and Consistency', () => {
    test('should handle multiple rapid add operations', () => {
      const initialCount = areaListComponent.getElement().querySelector('#area-list')?.children.length || 0;
      
      // Add multiple areas rapidly
      for (let i = 0; i < 10; i++) {
        areaListComponent.addArea({
          id: `rapid-${i}`,
          name: `Rapid Area ${i}`,
          displayOrder: i,
          inventoryItems: []
        });
      }
      
      const listHostDiv = areaListComponent.getElement().querySelector('#area-list');
      expect(listHostDiv?.children.length).toBe(initialCount + 10);
    });

    test('should handle multiple rapid remove operations', () => {
      // First add some areas
      const areasToAdd: Area[] = [];
      for (let i = 0; i < 5; i++) {
        areasToAdd.push({
          id: `temp-${i}`,
          name: `Temp Area ${i}`,
          displayOrder: i,
          inventoryItems: []
        });
      }
      
      areasToAdd.forEach(area => areaListComponent.addArea(area));
      
      // Then remove them rapidly
      areasToAdd.forEach(area => areaListComponent.removeArea(area.id));
      
      const listHostDiv = areaListComponent.getElement().querySelector('#area-list');
      expect(listHostDiv?.children.length).toBe(initialAreas.length);
    });

    test('should handle mixed operations in sequence', () => {
      const initialCount = areaListComponent.getElement().querySelector('#area-list')?.children.length || 0;
      
      // Add an area
      areaListComponent.addArea({
        id: 'mixed-1',
        name: 'Mixed 1',
        displayOrder: 1,
        inventoryItems: []
      });
      
      // Update it
      areaListComponent.updateArea({
        id: 'mixed-1',
        name: 'Mixed 1 Updated',
        displayOrder: 2,
        inventoryItems: []
      });
      
      // Add another
      areaListComponent.addArea({
        id: 'mixed-2',
        name: 'Mixed 2',
        displayOrder: 0,
        inventoryItems: []
      });
      
      // Remove the first
      areaListComponent.removeArea('mixed-1');
      
      const listHostDiv = areaListComponent.getElement().querySelector('#area-list');
      expect(listHostDiv?.children.length).toBe(initialCount + 1);
      
      // Verify only Mixed 2 remains
      const mixedArea = Array.from(listHostDiv?.children || []).find(
        item => item.textContent === 'Mixed 2'
      );
      expect(mixedArea).toBeDefined();
    });

    test('should maintain consistent state after setAreas followed by individual operations', () => {
      const newAreas: Area[] = [
        { id: 'new1', name: 'New Area 1', displayOrder: 1, inventoryItems: [] },
        { id: 'new2', name: 'New Area 2', displayOrder: 2, inventoryItems: [] },
      ];
      
      areaListComponent.setAreas(newAreas);
      
      // Add an area
      areaListComponent.addArea({
        id: 'added-after-set',
        name: 'Added After Set',
        displayOrder: 0,
        inventoryItems: []
      });
      
      // Update an existing area
      areaListComponent.updateArea({
        id: 'new1',
        name: 'New Area 1 Updated',
        displayOrder: 3,
        inventoryItems: []
      });
      
      const listHostDiv = areaListComponent.getElement().querySelector('#area-list');
      expect(listHostDiv?.children.length).toBe(3);
      
      // Verify order: Added After Set (0), New Area 2 (2), New Area 1 Updated (3)
      const items = Array.from(listHostDiv?.children || []);
      expect(items[0]?.textContent).toBe('Added After Set');
      expect(items[1]?.textContent).toBe('New Area 2');
      expect(items[2]?.textContent).toBe('New Area 1 Updated');
    });
  });

  describe('DOM Manipulation and Lifecycle', () => {
    test('should handle DOM element being removed externally', () => {
      const element = areaListComponent.getElement();
      element.remove();
      
      // Operations should still work even if DOM element was removed
      expect(() => {
        areaListComponent.addArea({
          id: 'after-remove',
          name: 'After Remove',
          displayOrder: 1,
          inventoryItems: []
        });
      }).not.toThrow();
    });

    test('should handle operations on component with empty DOM', () => {
      const component = new AreaListComponent([], mockCallbacks);
      
      // Don't append to DOM
      expect(() => {
        component.addArea({
          id: 'no-dom',
          name: 'No DOM',
          displayOrder: 1,
          inventoryItems: []
        });
      }).not.toThrow();
      
      expect(() => {
        component.setAreas([{
          id: 'set-no-dom',
          name: 'Set No DOM',
          displayOrder: 1,
          inventoryItems: []
        }]);
      }).not.toThrow();
    });

    test('should properly clean up when component is destroyed', () => {
      const testAreas: Area[] = [
        { id: 'cleanup-test', name: 'Cleanup Test', displayOrder: 1, inventoryItems: [] }
      ];
      
      const component = new AreaListComponent(testAreas, mockCallbacks);
      document.body.appendChild(component.getElement());
      
      // Verify component exists
      expect(document.querySelector('#area-list')).toBeTruthy();
      
      // Remove component
      component.getElement().remove();
      
      // Verify cleanup
      expect(document.querySelector('#area-list')).toBeFalsy();
    });
  });

  describe('Callback Integration', () => {
    test('should pass callbacks correctly to child components', () => {
      const customCallbacks: AreaListItemCallbacks = {
        onEdit: jest.fn(),
        onDelete: jest.fn(),
      };
      
      const component = new AreaListComponent(initialAreas, customCallbacks);
      document.body.appendChild(component.getElement());
      
      // Verify AreaListItemComponent was called with correct callbacks
      expect(AreaListItemComponent).toHaveBeenCalledWith(
        expect.any(Object),
        customCallbacks
      );
      
      component.getElement().remove();
    });

    test('should handle callback functions that throw errors', () => {
      const errorCallbacks: AreaListItemCallbacks = {
        onEdit: jest.fn(() => { throw new Error('Edit callback error'); }),
        onDelete: jest.fn(() => { throw new Error('Delete callback error'); }),
      };
      
      expect(() => {
        new AreaListComponent(initialAreas, errorCallbacks);
      }).not.toThrow();
    });
  });

  describe('Accessibility and Usability', () => {
    test('should maintain proper DOM structure for accessibility', () => {
      const element = areaListComponent.getElement();
      const listHostDiv = element.querySelector('#area-list');
      
      expect(listHostDiv).toBeTruthy();
      expect(listHostDiv?.tagName.toLowerCase()).toBe('div');
      expect(listHostDiv?.id).toBe('area-list');
    });

    test('should handle areas with only inventory items and no other properties', () => {
      const minimalAreas: Area[] = [
        { 
          id: 'minimal-1', 
          name: 'Minimal Area', 
          inventoryItems: [
            { id: 'item1', name: 'Item 1', quantity: 5 },
            { id: 'item2', name: 'Item 2', quantity: 3 }
          ] 
        },
      ];
      
      const component = new AreaListComponent(minimalAreas, mockCallbacks);
      document.body.appendChild(component.getElement());
      
      const listHostDiv = component.getElement().querySelector('#area-list');
      expect(listHostDiv?.children.length).toBe(1);
      
      component.getElement().remove();
    });
  });

  describe('Edge Cases for Update Operations', () => {
    test('should handle updating area with same data', () => {
      const originalArea = initialAreas[0];
      if (!originalArea) throw new Error("Test assumption failed: initialAreas[0] is undefined");
      
      const identicalArea = { ...originalArea };
      
      expect(() => {
        areaListComponent.updateArea(identicalArea);
      }).not.toThrow();
      
      const listHostDiv = areaListComponent.getElement().querySelector('#area-list');
      expect(listHostDiv?.children.length).toBe(initialAreas.length);
    });

    test('should handle updating area to have undefined displayOrder', () => {
      const areaToUpdate = initialAreas[0];
      if (!areaToUpdate) throw new Error("Test assumption failed: initialAreas[0] is undefined");
      
      const updatedArea = { ...areaToUpdate, displayOrder: undefined };
      
      expect(() => {
        areaListComponent.updateArea(updatedArea);
      }).not.toThrow();
      
      // Should move to end of list since displayOrder is now undefined
      const listHostDiv = areaListComponent.getElement().querySelector('#area-list');
      const items = Array.from(listHostDiv?.children || []);
      const lastItem = items[items.length - 1];
      expect(lastItem?.textContent).toBe(areaToUpdate.name);
    });

    test('should handle removeArea with non-existent ID', () => {
      const initialCount = areaListComponent.getElement().querySelector('#area-list')?.children.length || 0;
      
      expect(() => {
        areaListComponent.removeArea('non-existent-id');
      }).not.toThrow();
      
      const listHostDiv = areaListComponent.getElement().querySelector('#area-list');
      expect(listHostDiv?.children.length).toBe(initialCount);
    });
  });
