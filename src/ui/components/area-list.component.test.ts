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
    expect(items[0]!.textContent).toBe('Area Beta');
    expect(items[1]!.textContent).toBe('Area Alpha');
    expect(items[2]!.textContent).toBe('Area Gamma');
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
    expect(items[0]!.textContent).toBe('Area Epsilon'); // Epsilon (0)
    expect(items[1]!.textContent).toBe('Area Delta');   // Delta (1)
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
    expect(items[0]!.textContent).toBe('Area Zero'); // Zero (0)
    expect(items[1]!.textContent).toBe('Area Beta');  // Beta (1)
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
    expect(items[0]!.textContent).toBe('First Area');
  });


  test('updateArea should update the corresponding item and re-sort if needed', () => {
    const updatedArea: Area = { ...initialAreas[1]!, name: 'Area Beta Updated', displayOrder: 3, inventoryItems: [] }; // Was Beta, order 1
    areaListComponent.updateArea(updatedArea);

    const mockItemInstance = (AreaListItemComponent as jest.Mock).mock.results.find(
        (result: any) => result.value.getAreaId() === updatedArea.id
      )?.value;
    expect(mockItemInstance.update).toHaveBeenCalledWith(updatedArea);

    // Check DOM order: Alpha(2), Gamma(N/A), Beta Updated (3)
    // Original order: Beta(1), Alpha(2), Gamma(N/A)
    const listHostDiv = areaListComponent.getElement().querySelector('#area-list');
    const items = listHostDiv!.children;
    expect(items.length).toBe(initialAreas.length);
    expect(items[0].textContent).toBe('Area Alpha');
    expect(items[1].textContent).toBe('Area Gamma');
    expect(items[2].textContent).toBe('Area Beta Updated');
  });

  test('updateArea for a non-existent area should add it', () => {
    const newAreaToUpdate: Area = { id: 'areaNonExistent', name: 'New via Update', displayOrder: 0, inventoryItems: [] };
    areaListComponent.updateArea(newAreaToUpdate);

    const listHostDiv = areaListComponent.getElement().querySelector('#area-list');
    const items = listHostDiv!.children;
    expect(items.length).toBe(initialAreas.length + 1);
    expect(items[0].textContent).toBe('New via Update'); // Should be at the top due to displayOrder 0
  });

  test('removeArea should remove the item from the list and DOM', () => {
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
    expect(items[0].textContent).toBe('Area Beta');
    expect(items[1].textContent).toBe('Area Alpha');
    expect(items[2].textContent).toBe('Area Gamma');
    expect(items[3].textContent).toBe('Area Omega');
  });
});
