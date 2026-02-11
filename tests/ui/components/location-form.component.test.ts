import { LocationFormComponent, LocationFormComponentOptions } from '../../../src/ui/components/location-form.component';
import { Location } from '../../../src/models';
import { escapeHtml } from '../../../src/utils/security';
import { showToast } from '../../../src/ui/components/toast-notifications';

// Mock dependencies
jest.mock('../../../src/utils/security', () => ({
  escapeHtml: jest.fn((value: string) => value || ''), // Simple pass-through
}));

jest.mock('../../../src/ui/components/toast-notifications', () => ({
  showToast: jest.fn(),
}));

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

describe('LocationFormComponent', () => {
  let component: LocationFormComponent;
  let mockOnSubmit: jest.Mock;
  let mockOnCancel: jest.Mock;
  let mockLocation: Location;
  let options: LocationFormComponentOptions;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    mockOnCancel = jest.fn();
    mockLocation = {
      id: 'loc-xyz',
      name: 'Central Perk',
      address: '123 Coffee Lane',
      counters: []
      // products: [], inventoryEntries: [] // Removed
    };

    options = {
      onSubmit: mockOnSubmit,
      onCancel: mockOnCancel,
    };

    component = new LocationFormComponent(options);
    document.body.appendChild(component.getElement());
  });

  afterEach(() => {
    component.getElement().remove();
  });

  describe('Constructor and Initialization', () => {
    test('should create component for new location by default', () => {
      expect(component).toBeTruthy();
      expect(component.currentEditingLocation).toBeNull();
      expect(component.getElement().querySelector('#location-form-title-comp')?.textContent).toBe('Create New Location');
      expect(component.getElement().querySelector<HTMLButtonElement>('button[type="submit"]')?.textContent).toBe('Create Location');
    });

    test('should create component with location for editing if provided', () => {
      const editOptions = { ...options, location: mockLocation };
      const editComponent = new LocationFormComponent(editOptions);
      expect(editComponent.currentEditingLocation).toEqual(mockLocation);
      expect(editComponent.getElement().querySelector('#location-form-title-comp')?.textContent).toBe('Edit Location');
      expect(editComponent.getElement().querySelector<HTMLInputElement>('#location-name-form-comp')?.value).toBe(mockLocation.name);
      expect(editComponent.getElement().querySelector<HTMLInputElement>('#location-address-form-comp')?.value).toBe(mockLocation.address);
      expect(editComponent.getElement().querySelector<HTMLButtonElement>('button[type="submit"]')?.textContent).toBe('Save Changes');
    });

    test('should call escapeHtml for existing location values during render', () => {
        const editOptions = { ...options, location: mockLocation };
        new LocationFormComponent(editOptions); // Instantiation calls render
        expect(escapeHtml).toHaveBeenCalledWith(mockLocation.name);
        expect(escapeHtml).toHaveBeenCalledWith(mockLocation.address);
      });
  });

  describe('Form Submission', () => {
    let nameInput: HTMLInputElement;
    let addressInput: HTMLInputElement;
    let form: HTMLFormElement;

    beforeEach(() => {
        component = new LocationFormComponent(options);
        document.body.appendChild(component.getElement());
        nameInput = component.getElement().querySelector('#location-name-form-comp')!;
        addressInput = component.getElement().querySelector('#location-address-form-comp')!;
        form = component.getElement().querySelector('#location-form-actual')!;
    });

    test('should show error and not submit if name is empty or whitespace', async () => {
      nameInput.value = '   ';
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
      expect(showToast).toHaveBeenCalledWith('Name des Standorts darf nicht leer sein.', 'error');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test('should submit correct data for new location', async () => {
      nameInput.value = 'New Cafe';
      addressInput.value = '456 Bean Street';
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
      expect(mockOnSubmit).toHaveBeenCalledWith({
        id: '',
        name: 'New Cafe',
        address: '456 Bean Street',
      });
    });

    test('should submit correct data for existing location', async () => {
        const editOptions = { ...options, location: mockLocation };
        component = new LocationFormComponent(editOptions);
        document.body.innerHTML = '';
        document.body.appendChild(component.getElement());

        nameInput = component.getElement().querySelector('#location-name-form-comp')!;
        addressInput = component.getElement().querySelector('#location-address-form-comp')!;
        form = component.getElement().querySelector('#location-form-actual')!;

        nameInput.value = 'Central Perk Updated';
        addressInput.value = '123 Updated Lane';
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        await Promise.resolve();
        expect(mockOnSubmit).toHaveBeenCalledWith({
          id: mockLocation.id,
          name: 'Central Perk Updated',
          address: '123 Updated Lane',
        });
      });

    test('should trim whitespace from name and address on submit', async () => {
        nameInput.value = '  Trimmed Cafe  ';
        addressInput.value = '  789 Trim Road  ';
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        await Promise.resolve();
        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
          name: 'Trimmed Cafe',
          address: '789 Trim Road',
        }));
      });

    test('should omit address if empty after trim', async () => {
        nameInput.value = 'Test Location';
        addressInput.value = '   '; // Only whitespace
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        await Promise.resolve(); // Wait for async handleSubmit

        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.name).toBe('Test Location');
        expect(submittedData.address).toBeUndefined();
      });

    test('should log error if onSubmitCallback fails', async () => {
        const submitError = new Error('Failed to submit location');
        mockOnSubmit.mockRejectedValueOnce(submitError);
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        nameInput.value = 'Error Test Location';
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        await Promise.resolve();
        await Promise.resolve();

        expect(consoleErrorSpy).toHaveBeenCalledWith("LocationFormComponent: Error during submission callback", submitError);
        consoleErrorSpy.mockRestore();
    });
  });

  describe('Cancel Handling', () => {
    test('should call onCancelCallback when cancel button is clicked', () => {
      const cancelButton = component.getElement().querySelector('#cancel-location-edit-form-comp') as HTMLButtonElement;
      cancelButton.click();
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Show/Hide Methods', () => {
    test('show() for new location should clear fields and set correct titles/buttons', () => {
      component.show();
      expect(component.currentEditingLocation).toBeNull();
      expect(component.getElement().querySelector<HTMLInputElement>('#location-name-form-comp')?.value).toBe('');
      expect(component.getElement().querySelector<HTMLInputElement>('#location-address-form-comp')?.value).toBe('');
      expect(component.getElement().querySelector('#location-form-title-comp')?.textContent).toBe('Neuen Standort erstellen');
      expect(component.getElement().querySelector<HTMLButtonElement>('button[type="submit"]')?.textContent).toBe('Standort erstellen');
      expect(component.getElement().style.display).toBe('block');
    });

    test('show(location) for editing should populate fields and set correct titles/buttons', () => {
      component.show(mockLocation);
      expect(component.currentEditingLocation).toEqual(mockLocation);
      expect(component.getElement().querySelector<HTMLInputElement>('#location-name-form-comp')?.value).toBe(mockLocation.name);
      expect(component.getElement().querySelector<HTMLInputElement>('#location-address-form-comp')?.value).toBe(mockLocation.address);
      expect(component.getElement().querySelector('#location-form-title-comp')?.textContent).toBe('Standort bearbeiten');
      expect(component.getElement().querySelector<HTMLButtonElement>('button[type="submit"]')?.textContent).toBe('Änderungen speichern');
      expect(component.getElement().style.display).toBe('block');
    });

    test('hide() should set display to "none" and reset currentEditingLocation', () => {
      component.show(mockLocation);
      component.hide();
      expect(component.getElement().style.display).toBe('none');
      expect(component.currentEditingLocation).toBeNull();
    });
  });
});
