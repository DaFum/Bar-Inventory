import { AreaListComponent } from '../../../src/ui/components/area-list.component';
import { AreaListItemComponent, AreaListItemCallbacks } from '../../../src/ui/components/area-list-item.component';
import { Area } from '../../../src/models';

// Mock AreaListItemComponent
jest.mock('../../../src/ui/components/area-list-item.component', () => {
  return {
    AreaListItemComponent: jest.fn().mockImplementation((area: Area, callbacks: AreaListItemCallbacks) => {
      const element = document.createElement('div');
      element.className = 'mock-area-list-item';
      element.textContent = area.name;
      element.dataset.areaId = area.id;

      const mockInstance = {
        getElement: () => element,
        appendTo: jest.fn((parent: HTMLElement) => parent.appendChild(element)),
        update: jest.fn((updatedArea: Area) => { element.textContent = updatedArea.name; }),
        remove: jest.fn(() => element.remove()),
        getAreaId: () => area.id,
      };

      // Attach mocked instance to the constructor to retrieve later
      const mock = AreaListItemComponent as jest.Mock;
      if (!mock.mock.results[mock.mock.calls.length - 1]) {
        mock.mock.results[mock.mock.calls.length - 1] = { type: 'return', value: undefined };
      }
      mock.mock.results[mock.mock.calls.length - 1].value = mockInstance;

      return mockInstance;
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
      { id: 'area1', name: 'Area Alpha', displayOrder: 2, inventoryItems: [{ productId: 'p1', startBottles: 1}] },
      { id: 'area2', name: 'Area Beta', displayOrder: 1, inventoryItems: [{ productId: 'p2', startCrates: 2}] },
      { id: 'area3', name: 'Area Gamma', inventoryItems: [] },
    ];
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
    expect(AreaListItemComponent).toHaveBeenCalledTimes(initialAreas.length + newAreas.length);

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
    areaListComponent.addArea(newArea);

    const listHostDiv = areaListComponent.getElement().querySelector('#area-list');
    const items = listHostDiv!.children;
    expect(items.length).toBe(initialAreas.length + 1);
    if (!items[0] || !items[1]) throw new Error("Test assumption failed: not enough items in addArea test");
    expect(items[0].textContent).toBe('Area Zero');
    expect(items[1].textContent).toBe('Area Beta');
    expect(AreaListItemComponent).toHaveBeenCalledTimes(initialAreas.length + 1);
  });

  test('addArea to an empty list should render the list with the new area', () => {
    areaListComponent.setAreas([]);
    (AreaListItemComponent as jest.Mock).mockClear();

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
    const updatedArea: Area = { ...initialAreas[1], name: 'Area Beta Updated', displayOrder: 3, inventoryItems: [] };
    areaListComponent.updateArea(updatedArea);

    const mockItemInstance = (AreaListItemComponent as jest.Mock).mock.results.find(
        (result: any) => result.value.getAreaId() === updatedArea.id
      )?.value;
    expect(mockItemInstance.update).toHaveBeenCalledWith(updatedArea);

    const listHostDiv = areaListComponent.getElement().querySelector('#area-list');
    const items = listHostDiv!.children;
    expect(items.length).toBe(initialAreas.length);
    if (!items[0] || !items[1] || !items[2]) throw new Error("Test assumption failed: not enough items for updateArea order check");
    const texts = Array.from(items).map(item => item.textContent);
    expect(texts).toEqual(['Area Alpha', 'Area Gamma', 'Area Beta Updated']);
  });

  test('updateArea for a non-existent area should add it', () => {
    const newAreaToUpdate: Area = { id: 'areaNonExistent', name: 'New via Update', displayOrder: 0, inventoryItems: [] };
    areaListComponent.updateArea(newAreaToUpdate);

    const listHostDiv = areaListComponent.getElement().querySelector('#area-list');
    const items = listHostDiv!.children;
    expect(items.length).toBe(initialAreas.length + 1);
    if (!items[0]) throw new Error("Test assumption failed: item not found for updateArea non-existent test");
    expect(items[0].textContent).toBe('New via Update');
  });

  test('removeArea should remove the item from the list and DOM', () => {
    if (!initialAreas[1]) throw new Error("Test assumption failed: initialAreas[1] is undefined for removeArea test");
    const areaIdToRemove = initialAreas[1].id;
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
    const areaOmega: Area = { id: 'areaOmega', name: 'Area Omega', inventoryItems: [] };
    areaListComponent.addArea(areaOmega);
    const listHostDiv = areaListComponent.getElement().querySelector('#area-list');
    const items = listHostDiv!.children;
    if (!items[0] || !items[1] || !items[2] || !items[3]) throw new Error("Test assumption failed: not enough items for sorting logic test");
    expect(items[0].textContent).toBe('Area Beta');
    expect(items[1].textContent).toBe('Area Alpha');
    expect(items[2].textContent).toBe('Area Gamma');
    expect(items[3].textContent).toBe('Area Omega');
  });
});
