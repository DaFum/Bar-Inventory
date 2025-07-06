import { AreaListItemComponent, AreaListItemCallbacks } from '../../../src/ui/components/area-list-item.component';
import { Area } from '../../../src/models';
import { escapeHtml } from '../../../src/utils/security';

// Mock escapeHtml
jest.mock('../../../src/utils/security', () => ({
  escapeHtml: jest.fn((str) => str), // Simple pass-through mock
}));

describe('AreaListItemComponent', () => {
  let area: Area;
  let mockCallbacks: AreaListItemCallbacks;
  let component: AreaListItemComponent;

  beforeEach(() => {
    area = { id: 'area1', name: 'Test Area', displayOrder: 1, inventoryItems: [] };
    mockCallbacks = {
      onEdit: jest.fn(),
      onDelete: jest.fn(),
    };
    component = new AreaListItemComponent(area, mockCallbacks);
    document.body.appendChild(component.getElement());
  });

  afterEach(() => {
    component.getElement().remove();
    (escapeHtml as jest.Mock).mockClear();
  });

  test('constructor should create element with correct class and dataset', () => {
    const element = component.getElement();
    expect(element.tagName).toBe('DIV');
    expect(element.classList.contains('list-group-item')).toBe(true);
    expect(element.classList.contains('even-more-nested')).toBe(true);
    expect(element.dataset.areaId).toBe(area.id);
  });

  test('render should display area name and displayOrder', () => {
    const element = component.getElement();
    expect(element.textContent).toContain('Test Area');
    expect(element.textContent).toContain('(Order: 1)');
    expect(escapeHtml).toHaveBeenCalledWith('Test Area');
  });

  test('render should display "N/A" if displayOrder is undefined', () => {
    const areaWithoutOrder: Area = {
      id: 'area2',
      name: 'Area No Order',
      // displayOrder is omitted, meaning it's undefined
      inventoryItems: []
    };
    component.update(areaWithoutOrder); // Re-render with new data
    const element = component.getElement();
    expect(element.textContent).toContain('(Order: N/A)');
  });

  test('render should create Edit and Delete buttons with correct classes and aria-labels', () => {
    const element = component.getElement();
    const editButton = element.querySelector('.edit-area-btn') as HTMLButtonElement;
    const deleteButton = element.querySelector('.delete-area-btn') as HTMLButtonElement;

    expect(editButton).not.toBeNull();
    expect(editButton.textContent).toBe('Bearbeiten');
    expect(editButton.getAttribute('aria-label')).toBe(`Bereich ${area.name} bearbeiten`);
    expect(escapeHtml).toHaveBeenCalledWith(area.name); // For aria-label

    expect(deleteButton).not.toBeNull();
    expect(deleteButton.textContent).toBe('Löschen');
    expect(deleteButton.getAttribute('aria-label')).toBe(`Bereich ${area.name} löschen`);
    expect(escapeHtml).toHaveBeenCalledWith(area.name); // For aria-label
  });

  test('Edit button click should call onEdit callback with area data', () => {
    const editButton = component.getElement().querySelector('.edit-area-btn') as HTMLButtonElement;
    editButton.click();
    expect(mockCallbacks.onEdit).toHaveBeenCalledTimes(1);
    expect(mockCallbacks.onEdit).toHaveBeenCalledWith(area);
  });

  test('Delete button click should call onDelete callback with areaId and areaName', () => {
    const deleteButton = component.getElement().querySelector('.delete-area-btn') as HTMLButtonElement;
    deleteButton.click();
    expect(mockCallbacks.onDelete).toHaveBeenCalledTimes(1);
    expect(mockCallbacks.onDelete).toHaveBeenCalledWith(area.id, area.name);
  });

  test('update method should re-render the component with new area data', () => {
    const newArea: Area = { id: 'area1', name: 'Updated Area Name', displayOrder: 5, inventoryItems: [] };
    component.update(newArea);

    const element = component.getElement();
    expect(element.textContent).toContain('Updated Area Name');
    expect(element.textContent).toContain('(Order: 5)');
    expect(escapeHtml).toHaveBeenCalledWith('Updated Area Name');

    // Verify callbacks still work with new data
    const editButton = element.querySelector('.edit-area-btn') as HTMLButtonElement;
    editButton.click();
    expect(mockCallbacks.onEdit).toHaveBeenCalledWith(newArea);
  });

  test('getAreaId should return the correct area ID', () => {
    expect(component.getAreaId()).toBe(area.id);
    const newArea: Area = { id: 'area2', name: 'Another Area', displayOrder: 1, inventoryItems: [] };
    component.update(newArea);
    expect(component.getAreaId()).toBe('area2');
  });
});
