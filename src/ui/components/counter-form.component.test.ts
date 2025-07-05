import { CounterFormComponent, CounterFormComponentOptions } from './counter-form.component';
import { Counter } from '../../models';
import { escapeHtml } from '../../utils/security';
import { showToast } from './toast-notifications';

// Mock dependencies
jest.mock('../../utils/security', () => ({
  escapeHtml: jest.fn((value: string) => value || ''), // Simple pass-through
}));

jest.mock('./toast-notifications', () => ({
  showToast: jest.fn(),
}));

// Mock BaseComponent as it's extended by CounterFormComponent
// We don't need its full functionality, just the basic element creation.
jest.mock('../core/base-component', () => {
  return {
    BaseComponent: class MockBaseComponent {
      element: HTMLElement;
      constructor(tagName: string) {
        this.element = document.createElement(tagName);
      }
      // Add other methods like appendChild, remove if needed by the component's direct usage
      appendChild(child: HTMLElement) { this.element.appendChild(child); }
      remove() { this.element.remove(); }
      getElement() { return this.element; }
    },
  };
});


describe('CounterFormComponent', () => {
  let component: CounterFormComponent;
  let mockOnSubmit: jest.Mock;
  let mockOnCancel: jest.Mock;
  let mockCounter: Counter;
  let options: CounterFormComponentOptions;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    mockOnCancel = jest.fn();
    mockCounter = {
      id: 'counter-123',
      name: 'Main Bar',
      description: 'The primary bar area',
      areas: [], // Areas are not managed by this form directly
    };

    options = {
      onSubmit: mockOnSubmit,
      onCancel: mockOnCancel,
    };

    // Create component without initial counter for some tests
    component = new CounterFormComponent(options);
    document.body.appendChild(component.getElement()); // Append to body to make DOM selections work
  });

  afterEach(() => {
    component.getElement().remove();
  });

  describe('Constructor and Initialization', () => {
    test('should create component for new counter by default', () => {
      expect(component).toBeTruthy();
      expect(component.currentEditingCounter).toBeNull();
      expect(component.getElement().querySelector('#counter-form-title-comp')?.textContent).toBe('Neuen Tresen erstellen');
      expect(component.getElement().querySelector<HTMLButtonElement>('button[type="submit"]')?.textContent).toBe('Tresen erstellen');
    });

    test('should create component with counter for editing if provided', () => {
      const editOptions = { ...options, counter: mockCounter };
      const editComponent = new CounterFormComponent(editOptions);
      expect(editComponent.currentEditingCounter).toEqual(mockCounter);
      expect(editComponent.getElement().querySelector('#counter-form-title-comp')?.textContent).toBe('Tresen bearbeiten');
      expect(editComponent.getElement().querySelector<HTMLInputElement>('#counter-name-form-comp')?.value).toBe(mockCounter.name);
      expect(editComponent.getElement().querySelector<HTMLInputElement>('#counter-description-form-comp')?.value).toBe(mockCounter.description);
      expect(editComponent.getElement().querySelector<HTMLButtonElement>('button[type="submit"]')?.textContent).toBe('Änderungen speichern');
    });

    test('should call escapeHtml for existing counter values', () => {
        const editOptions = { ...options, counter: mockCounter };
        new CounterFormComponent(editOptions); // Instantiation calls render
        expect(escapeHtml).toHaveBeenCalledWith(mockCounter.name);
        expect(escapeHtml).toHaveBeenCalledWith(mockCounter.description);
      });
  });

  describe('Form Submission', () => {
    let nameInput: HTMLInputElement;
    let descriptionInput: HTMLInputElement;
    let form: HTMLFormElement;

    beforeEach(() => {
        // Re-initialize component or ensure elements are bound for each submission test
        component = new CounterFormComponent(options); // Fresh component
        document.body.appendChild(component.getElement());

        nameInput = component.getElement().querySelector('#counter-name-form-comp')!;
        descriptionInput = component.getElement().querySelector('#counter-description-form-comp')!;
        form = component.getElement().querySelector('#counter-form-actual')!;
    });

    test('should show error and not submit if name is empty', async () => {
      nameInput.value = '   '; // Empty or whitespace
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await Promise.resolve(); // Allow async operations in handleSubmit to complete

      expect(showToast).toHaveBeenCalledWith('Name des Tresens darf nicht leer sein.', 'error');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test('should submit correct data for new counter', async () => {
      nameInput.value = 'New Counter';
      descriptionInput.value = 'A fresh counter';
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await Promise.resolve();

      expect(mockOnSubmit).toHaveBeenCalledWith({
        id: '', // New counter has no ID yet
        name: 'New Counter',
        description: 'A fresh counter',
      });
    });

    test('should submit correct data for existing counter', async () => {
        const editOptions = { ...options, counter: mockCounter };
        component = new CounterFormComponent(editOptions); // Re-init with existing counter
        document.body.innerHTML = ''; // Clear body
        document.body.appendChild(component.getElement());

        nameInput = component.getElement().querySelector('#counter-name-form-comp')!;
        descriptionInput = component.getElement().querySelector('#counter-description-form-comp')!;
        form = component.getElement().querySelector('#counter-form-actual')!;

        nameInput.value = 'Updated Main Bar';
        descriptionInput.value = 'Updated description';
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        await Promise.resolve();

        expect(mockOnSubmit).toHaveBeenCalledWith({
          id: mockCounter.id,
          name: 'Updated Main Bar',
          description: 'Updated description',
        });
      });

    test('should trim whitespace from name and description on submit', async () => {
        nameInput.value = '  Spaced Name  ';
        descriptionInput.value = '  Spaced Description  ';
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        await Promise.resolve();

        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
          name: 'Spaced Name',
          description: 'Spaced Description',
        }));
      });

    test('should set description to undefined if empty after trim', async () => {
        nameInput.value = 'Test Counter';
        descriptionInput.value = '   '; // Only whitespace
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        await Promise.resolve(); // Wait for async handleSubmit

        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.name).toBe('Test Counter');
        expect(submittedData.description).toBeUndefined();
      });

    test('should log error if onSubmitCallback fails', async () => {
        const submitError = new Error('Submit failed');
        mockOnSubmit.mockRejectedValueOnce(submitError);
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        nameInput.value = 'Test';
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        await Promise.resolve(); // Wait for promise in handleSubmit
        await Promise.resolve(); // Another tick for safety with async/await

        expect(consoleErrorSpy).toHaveBeenCalledWith("CounterFormComponent: Error during submission callback", submitError);
        consoleErrorSpy.mockRestore();
    });
  });

  describe('Cancel Handling', () => {
    test('should call onCancelCallback when cancel button is clicked', () => {
      const cancelButton = component.getElement().querySelector('#cancel-counter-edit-form-comp') as HTMLButtonElement;
      cancelButton.click();
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Show/Hide Methods', () => {
    test('show() for new counter should clear fields and set correct titles/buttons', () => {
      component.show(); // Show for new
      expect(component.currentEditingCounter).toBeNull();
      expect(component.getElement().querySelector<HTMLInputElement>('#counter-name-form-comp')?.value).toBe('');
      expect(component.getElement().querySelector<HTMLInputElement>('#counter-description-form-comp')?.value).toBe('');
      expect(component.getElement().querySelector('#counter-form-title-comp')?.textContent).toBe('Neuen Tresen erstellen');
      expect(component.getElement().querySelector<HTMLButtonElement>('button[type="submit"]')?.textContent).toBe('Tresen erstellen');
      expect(component.getElement().style.display).toBe('block');
    });

    test('show(counter) for editing should populate fields and set correct titles/buttons', () => {
      component.show(mockCounter);
      expect(component.currentEditingCounter).toEqual(mockCounter);
      expect(component.getElement().querySelector<HTMLInputElement>('#counter-name-form-comp')?.value).toBe(mockCounter.name);
      expect(component.getElement().querySelector<HTMLInputElement>('#counter-description-form-comp')?.value).toBe(mockCounter.description);
      expect(component.getElement().querySelector('#counter-form-title-comp')?.textContent).toBe('Tresen bearbeiten');
      expect(component.getElement().querySelector<HTMLButtonElement>('button[type="submit"]')?.textContent).toBe('Änderungen speichern');
      expect(component.getElement().style.display).toBe('block');
    });

    test('hide() should set display to "none" and reset currentEditingCounter', () => {
      component.show(mockCounter); // Make it visible and set editing counter
      component.hide();
      expect(component.getElement().style.display).toBe('none');
      expect(component.currentEditingCounter).toBeNull();
    });
  });

  describe('Error Handling for Missing Elements (during bindElements)', () => {
    // TODO: This test is currently flawed as the component creates its own elements.
    // To test this properly, DOM manipulation would need to occur after render but before bindElements,
    // or querySelector would need to be spied on for a specific instance.
    test.skip('should throw error if main form element is missing', () => {
        component.getElement().innerHTML = ''; // This modifies an old instance's element, not the new one's
        expect(() => new CounterFormComponent(options)).toThrow("Counter form element not found during bind");
    });
    // Similar tests can be written for nameInput and descriptionInput by manipulating innerHTML
    // before component construction, but this requires careful setup.
    // The current bindElements is called in constructor after render, so we'd need to alter render's output.
  });
});
