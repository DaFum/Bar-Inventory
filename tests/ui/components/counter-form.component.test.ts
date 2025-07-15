/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CounterFormComponent, CounterFormOptions } from '../../../src/ui/components/counter-form.component';
import { Counter } from '../../../src/models';
import { escapeHtml } from '../../../src/utils/security';

// Mock the security utility
jest.mock('../../../src/utils/security', () => ({
  escapeHtml: jest.fn(text => text),
}));

describe('CounterFormComponent', () => {
  let component: CounterFormComponent;
  let mockOnSubmit: jest.Mock;
  let mockOnCancel: jest.Mock;
  let testCounter: Counter;
  let container: HTMLElement;

  beforeEach(() => {
    // Reset mocks before each test
    mockOnSubmit = jest.fn();
    mockOnCancel = jest.fn();
    (escapeHtml as jest.Mock).mockClear();

    // Set up a basic counter for testing
    testCounter = {
      id: 'counter-1',
      name: 'Main Bar',
      description: 'The main bar area',
      areas: [],
    };

    // DOM setup
    document.body.innerHTML = '<div id="test-container"></div>';
    container = document.getElementById('test-container')!;
    if (!container) {
      throw new Error('Test container not found');
    }

    const options: CounterFormOptions = {
      onSubmit: mockOnSubmit,
      onCancel: mockOnCancel,
    };
    component = new CounterFormComponent(container, options);
  });

  afterEach(() => {
    // Clean up DOM
    component.destroy();
    document.body.innerHTML = '';
  });

  describe('Initial Rendering', () => {
    it('should create and append the form to the container', () => {
      const formElement = component.getElement();
      expect(formElement).not.toBeNull();
      expect(formElement.parentElement).toBe(container);
    });

    it('should have the correct title and submit button text for creating a new counter', () => {
        component.show();
      const formElement = component.getElement();
      const titleElement = formElement.querySelector('h5');
      const submitButton = formElement.querySelector('button[type="submit"]');

      expect(titleElement?.textContent).toBe('Neuen Tresen erstellen');
      expect(submitButton?.textContent).toBe('Tresen erstellen');
    });

    it('should have the correct title and submit button text for editing a counter', () => {
        component.show(testCounter);
      const formElement = component.getElement();
      const titleElement = formElement.querySelector('h5');
      const submitButton = formElement.querySelector('button[type="submit"]');

      expect(titleElement?.textContent).toBe('Tresen bearbeiten');
      expect(submitButton?.textContent).toBe('Änderungen speichern');
    });
  });

  describe('Form Population', () => {
    it('should populate the form with counter data when show is called', () => {
      component.show(testCounter);
      const nameInput = component.getElement().querySelector('#counter-name-form-comp') as HTMLInputElement;
      const descriptionInput = component.getElement().querySelector('#counter-description-form-comp') as HTMLInputElement;

      expect(nameInput.value).toBe('Main Bar');
      expect(descriptionInput.value).toBe('The main bar area');
    });

    it('should clear the form when show is called with no counter', () => {
      // First, show with a counter
      component.show(testCounter);
      // Then, show without a counter
      component.show();
      const nameInput = component.getElement().querySelector('#counter-name-form-comp') as HTMLInputElement;
      const descriptionInput = component.getElement().querySelector('#counter-description-form-comp') as HTMLInputElement;

      expect(nameInput.value).toBe('');
      expect(descriptionInput.value).toBe('');
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with the form data when a new counter is created', async () => {
      component.show(); // Show form for a new counter
      const nameInput = component.getElement().querySelector('#counter-name-form-comp') as HTMLInputElement;
      const descriptionInput = component.getElement().querySelector('#counter-description-form-comp') as HTMLInputElement;
      nameInput.value = 'New Counter';
      descriptionInput.value = 'A new counter description';

      const form = component.getElement().querySelector('form');
      form?.dispatchEvent(new Event('submit'));

      await Promise.resolve(); // Allow promises to resolve

      expect(mockOnSubmit).toHaveBeenCalledWith({
        id: '',
        name: 'New Counter',
        description: 'A new counter description',
      });
    });

    it('should call onSubmit with the updated form data when an existing counter is edited', async () => {
      component.show(testCounter); // Show form for an existing counter
      const nameInput = component.getElement().querySelector('#counter-name-form-comp') as HTMLInputElement;
      nameInput.value = 'Updated Main Bar';

      const form = component.getElement().querySelector('form');
      form?.dispatchEvent(new Event('submit'));

      await Promise.resolve();

      expect(mockOnSubmit).toHaveBeenCalledWith({
        id: 'counter-1',
        name: 'Updated Main Bar',
        description: 'The main bar area',
      });
    });
  });

  describe('Form Cancellation', () => {
    it('should call onCancel when the cancel button is clicked', () => {
      const cancelButton = component.getElement().querySelector('.cancel-btn') as HTMLButtonElement;
      cancelButton.click();
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Visibility', () => {
    it('should be hidden by default', () => {
      expect(component.getElement().classList.contains('hidden')).toBe(true);
    });

    it('should be visible when show is called', () => {
      component.show();
      expect(component.getElement().classList.contains('hidden')).toBe(false);
    });

    it('should be hidden when hide is called', () => {
      component.show();
      component.hide();
      expect(component.getElement().classList.contains('hidden')).toBe(true);
    });
  });

  describe('Destruction', () => {
    it('should remove the element from the DOM when destroy is called', () => {
      const formElement = component.getElement();
      expect(formElement.parentElement).not.toBeNull();
      component.destroy();
      expect(formElement.parentElement).toBeNull();
    });
  });
});
