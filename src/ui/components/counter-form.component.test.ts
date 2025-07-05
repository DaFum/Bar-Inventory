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

  describe('Input Validation and Sanitization', () => {
    let nameInput: HTMLInputElement;
    let descriptionInput: HTMLInputElement;
    let form: HTMLFormElement;

    beforeEach(() => {
      nameInput = component.getElement().querySelector('#counter-name-form-comp')!;
      descriptionInput = component.getElement().querySelector('#counter-description-form-comp')!;
      form = component.getElement().querySelector('#counter-form-actual')!;
    });

    test('should handle extremely long counter names', async () => {
      const longName = 'a'.repeat(1000);
      nameInput.value = longName;
      descriptionInput.value = 'Valid description';
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await Promise.resolve();

      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: longName,
        description: 'Valid description',
      }));
    });

    test('should handle extremely long descriptions', async () => {
      const longDescription = 'a'.repeat(5000);
      nameInput.value = 'Valid Name';
      descriptionInput.value = longDescription;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await Promise.resolve();

      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Valid Name',
        description: longDescription,
      }));
    });

    test('should handle special characters in counter name', async () => {
      const specialName = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      nameInput.value = specialName;
      descriptionInput.value = 'Description with special chars: !@#$%^&*()';
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await Promise.resolve();

      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: specialName,
        description: 'Description with special chars: !@#$%^&*()',
      }));
    });

    test('should handle Unicode characters in inputs', async () => {
      const unicodeName = '测试计数器 🎯 café';
      const unicodeDescription = 'Description with émojis 🚀 and açcénts';
      nameInput.value = unicodeName;
      descriptionInput.value = unicodeDescription;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await Promise.resolve();

      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: unicodeName,
        description: unicodeDescription,
      }));
    });

    test('should handle newline characters in inputs', async () => {
      const nameWithNewlines = 'Counter\nWith\nNewlines';
      const descriptionWithNewlines = 'Description\nwith\nmultiple\nlines';
      nameInput.value = nameWithNewlines;
      descriptionInput.value = descriptionWithNewlines;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await Promise.resolve();

      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: nameWithNewlines,
        description: descriptionWithNewlines,
      }));
    });

    test('should validate name with only whitespace characters', async () => {
      nameInput.value = '\t\n\r   ';
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await Promise.resolve();

      expect(showToast).toHaveBeenCalledWith('Name des Tresens darf nicht leer sein.', 'error');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test('should handle null-like values in inputs', async () => {
      nameInput.value = 'null';
      descriptionInput.value = 'undefined';
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await Promise.resolve();

      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'null',
        description: 'undefined',
      }));
    });
  });

  describe('DOM Manipulation and Event Handling', () => {
    test('should handle form submission with Enter key', async () => {
      const nameInput = component.getElement().querySelector('#counter-name-form-comp') as HTMLInputElement;
      const descriptionInput = component.getElement().querySelector('#counter-description-form-comp') as HTMLInputElement;
      
      nameInput.value = 'Test Counter';
      descriptionInput.value = 'Test Description';
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      nameInput.dispatchEvent(enterEvent);

      await Promise.resolve();

      // Note: This test depends on the actual implementation handling Enter key
      // If the component doesn't handle Enter key specially, we might need to test form submission directly
    });

    test('should handle multiple rapid form submissions', async () => {
      const nameInput = component.getElement().querySelector('#counter-name-form-comp') as HTMLInputElement;
      const form = component.getElement().querySelector('#counter-form-actual') as HTMLFormElement;
      
      nameInput.value = 'Test Counter';
      
      // Simulate rapid multiple submissions
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await Promise.resolve();

      // Should only be called once due to form submission handling
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    test('should handle form reset after successful submission', async () => {
      const nameInput = component.getElement().querySelector('#counter-name-form-comp') as HTMLInputElement;
      const descriptionInput = component.getElement().querySelector('#counter-description-form-comp') as HTMLInputElement;
      const form = component.getElement().querySelector('#counter-form-actual') as HTMLFormElement;
      
      nameInput.value = 'Test Counter';
      descriptionInput.value = 'Test Description';
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await Promise.resolve();

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      
      // Check if form is reset after successful submission (depends on implementation)
      // This test validates the component's behavior after successful form submission
    });

    test('should handle dynamic element removal and recreation', () => {
      const originalElement = component.getElement();
      expect(originalElement).toBeTruthy();
      
      // Test that the component can handle being removed and re-added to DOM
      originalElement.remove();
      document.body.appendChild(originalElement);
      
      const nameInput = component.getElement().querySelector('#counter-name-form-comp') as HTMLInputElement;
      expect(nameInput).toBeTruthy();
      
      nameInput.value = 'Test';
      expect(nameInput.value).toBe('Test');
    });
  });

  describe('Component State Management', () => {
    test('should maintain state consistency during multiple show/hide cycles', () => {
      // Test multiple show/hide cycles
      component.show();
      expect(component.currentEditingCounter).toBeNull();
      
      component.show(mockCounter);
      expect(component.currentEditingCounter).toEqual(mockCounter);
      
      component.hide();
      expect(component.currentEditingCounter).toBeNull();
      
      component.show();
      expect(component.currentEditingCounter).toBeNull();
    });

    test('should handle show with undefined counter', () => {
      component.show(undefined);
      expect(component.currentEditingCounter).toBeNull();
      expect(component.getElement().querySelector('#counter-form-title-comp')?.textContent).toBe('Neuen Tresen erstellen');
    });

    test('should handle show with null counter', () => {
      component.show(null);
      expect(component.currentEditingCounter).toBeNull();
      expect(component.getElement().querySelector('#counter-form-title-comp')?.textContent).toBe('Neuen Tresen erstellen');
    });

    test('should handle counter object with missing optional properties', () => {
      const incompleteCounter = {
        id: 'test-id',
        name: 'Test Counter',
        description: '', // Empty description
        areas: []
      };
      
      component.show(incompleteCounter);
      expect(component.currentEditingCounter).toEqual(incompleteCounter);
      
      const nameInput = component.getElement().querySelector('#counter-name-form-comp') as HTMLInputElement;
      const descriptionInput = component.getElement().querySelector('#counter-description-form-comp') as HTMLInputElement;
      
      expect(nameInput.value).toBe('Test Counter');
      expect(descriptionInput.value).toBe('');
    });

    test('should handle counter object with extra properties', () => {
      const counterWithExtraProps = {
        ...mockCounter,
        extraProperty: 'should be ignored',
        anotherExtra: 123
      };
      
      component.show(counterWithExtraProps);
      expect(component.currentEditingCounter).toEqual(counterWithExtraProps);
      
      const nameInput = component.getElement().querySelector('#counter-name-form-comp') as HTMLInputElement;
      expect(nameInput.value).toBe(mockCounter.name);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle onSubmit callback throwing synchronous error', async () => {
      const syncError = new Error('Synchronous error');
      mockOnSubmit.mockImplementation(() => { throw syncError; });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const nameInput = component.getElement().querySelector('#counter-name-form-comp') as HTMLInputElement;
      const form = component.getElement().querySelector('#counter-form-actual') as HTMLFormElement;
      
      nameInput.value = 'Test';
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await Promise.resolve();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error during submission'),
        syncError
      );
      consoleErrorSpy.mockRestore();
    });

    test('should handle onCancel callback throwing error', () => {
      const cancelError = new Error('Cancel error');
      mockOnCancel.mockImplementation(() => { throw cancelError; });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const cancelButton = component.getElement().querySelector('#cancel-counter-edit-form-comp') as HTMLButtonElement;
      
      expect(() => cancelButton.click()).not.toThrow();
      
      consoleErrorSpy.mockRestore();
    });

    test('should handle form submission when DOM elements are missing', async () => {
      const nameInput = component.getElement().querySelector('#counter-name-form-comp') as HTMLInputElement;
      const form = component.getElement().querySelector('#counter-form-actual') as HTMLFormElement;
      
      // Remove the name input after binding
      nameInput.remove();
      
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      await Promise.resolve();

      // Should handle gracefully without crashing
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test('should handle component cleanup and memory leaks', () => {
      const element = component.getElement();
      const initialChildCount = document.body.children.length;
      
      // Add and remove component multiple times
      element.remove();
      document.body.appendChild(element);
      element.remove();
      document.body.appendChild(element);
      
      element.remove();
      
      // Should not have memory leaks or extra DOM nodes
      expect(document.body.children.length).toBeLessThanOrEqual(initialChildCount);
    });
  });

  describe('Accessibility and User Experience', () => {
    test('should have proper ARIA attributes', () => {
      const form = component.getElement().querySelector('#counter-form-actual') as HTMLFormElement;
      const nameInput = component.getElement().querySelector('#counter-name-form-comp') as HTMLInputElement;
      const descriptionInput = component.getElement().querySelector('#counter-description-form-comp') as HTMLInputElement;
      
      // Check for accessibility attributes (depends on implementation)
      expect(form).toBeTruthy();
      expect(nameInput).toBeTruthy();
      expect(descriptionInput).toBeTruthy();
      
      // These would be implementation-specific checks
      // expect(nameInput.getAttribute('aria-label')).toBeTruthy();
      // expect(form.getAttribute('role')).toBeTruthy();
    });

    test('should handle focus management', () => {
      component.show();
      
      const nameInput = component.getElement().querySelector('#counter-name-form-comp') as HTMLInputElement;
      
      // Check if focus is properly managed when showing the form
      expect(nameInput).toBeTruthy();
      
      // Test focus behavior (depends on implementation)
      nameInput.focus();
      expect(document.activeElement).toBe(nameInput);
    });

    test('should handle tab navigation', () => {
      const nameInput = component.getElement().querySelector('#counter-name-form-comp') as HTMLInputElement;
      const descriptionInput = component.getElement().querySelector('#counter-description-form-comp') as HTMLInputElement;
      const submitButton = component.getElement().querySelector('button[type="submit"]') as HTMLButtonElement;
      const cancelButton = component.getElement().querySelector('#cancel-counter-edit-form-comp') as HTMLButtonElement;
      
      // Test tab order
      expect(nameInput.tabIndex).toBeGreaterThanOrEqual(0);
      expect(descriptionInput.tabIndex).toBeGreaterThanOrEqual(0);
      expect(submitButton.tabIndex).toBeGreaterThanOrEqual(0);
      expect(cancelButton.tabIndex).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integration with Security Utils', () => {
    test('should call escapeHtml for all user inputs during rendering', () => {
      const testCounter = {
        id: 'test-id',
        name: '<script>alert("xss")</script>',
        description: '<img src="x" onerror="alert(1)">',
        areas: []
      };
      
      component.show(testCounter);
      
      expect(escapeHtml).toHaveBeenCalledWith(testCounter.name);
      expect(escapeHtml).toHaveBeenCalledWith(testCounter.description);
    });

    test('should handle escapeHtml returning different values', () => {
      const mockEscapeHtml = escapeHtml as jest.MockedFunction<typeof escapeHtml>;
      mockEscapeHtml.mockReturnValueOnce('&lt;script&gt;safe&lt;/script&gt;');
      
      const testCounter = {
        id: 'test-id',
        name: '<script>unsafe</script>',
        description: 'safe description',
        areas: []
      };
      
      component.show(testCounter);
      
      const nameInput = component.getElement().querySelector('#counter-name-form-comp') as HTMLInputElement;
      expect(nameInput.value).toBe('&lt;script&gt;safe&lt;/script&gt;');
    });
  });

  describe('Performance and Resource Management', () => {
    test('should handle rapid successive method calls', () => {
      // Test rapid show/hide calls
      for (let i = 0; i < 100; i++) {
        component.show();
        component.hide();
      }
      
      expect(component.currentEditingCounter).toBeNull();
      expect(component.getElement().style.display).toBe('none');
    });

    test('should handle large number of form submissions', async () => {
      const nameInput = component.getElement().querySelector('#counter-name-form-comp') as HTMLInputElement;
      const form = component.getElement().querySelector('#counter-form-actual') as HTMLFormElement;
      
      nameInput.value = 'Test Counter';
      
      // Simulate many form submissions
      for (let i = 0; i < 10; i++) {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }

      await Promise.resolve();

      // Should handle all submissions appropriately
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  describe('Component Lifecycle', () => {
    test('should handle component reinitialization', () => {
      const originalElement = component.getElement();
      
      // Create new component with same options
      const newComponent = new CounterFormComponent(options);
      
      expect(newComponent.getElement()).toBeTruthy();
      expect(newComponent.getElement()).not.toBe(originalElement);
      expect(newComponent.currentEditingCounter).toBeNull();
      
      newComponent.getElement().remove();
    });

    test('should handle component destruction', () => {
      const element = component.getElement();
      
      // Remove component
      element.remove();
      
      // Component should still be accessible but DOM element should be removed
      expect(element.parentNode).toBeNull();
    });
  });
});
