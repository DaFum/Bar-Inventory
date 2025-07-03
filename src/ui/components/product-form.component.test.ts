import { ProductFormComponent, ProductFormComponentOptions } from './product-form.component';
import { Product } from '../../models';
import { escapeHtml } from '../../utils/security';
import { showToast } from './toast-notifications';
import { generateId, PREDEFINED_CATEGORIES } from '../../utils/helpers';

// Mocks
jest.mock('../../utils/security', () => ({
  escapeHtml: jest.fn((value: string) => value || ''),
}));
jest.mock('./toast-notifications');
jest.mock('../../utils/helpers', () => ({
  ...jest.requireActual('../../utils/helpers'), // Keep actual PREDEFINED_CATEGORIES
  generateId: jest.fn(() => 'mock-prod-id'),
}));
jest.mock('../core/base-component', () => {
  return {
    BaseComponent: class MockBaseComponent {
      element: HTMLElement;
      constructor(tagName: string, id?: string, classes?: string[]) {
        this.element = document.createElement(tagName);
        if (id) this.element.id = id;
        if (classes) this.element.classList.add(...classes);
      }
      appendChild(child: HTMLElement) { this.element.appendChild(child); }
      remove() { this.element.remove(); }
      getElement() { return this.element; }
      hide() { this.element.style.display = 'none'; }
      // Add show if needed by ProductFormComponent's direct usage, though it implements its own
    },
  };
});

describe('ProductFormComponent', () => {
  let component: ProductFormComponent;
  let mockOnSubmit: jest.Mock;
  let mockOnCancel: jest.Mock;
  let mockProduct: Product;
  let options: ProductFormComponentOptions;

  const getInputValue = (selector: string) => (component.getElement().querySelector(selector) as HTMLInputElement)?.value;
  const setInputValue = (selector: string, value: string) => {
    const input = component.getElement().querySelector(selector) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    if (input) input.value = value;
  };
  const getSelectValue = (selector: string) => (component.getElement().querySelector(selector) as HTMLSelectElement)?.value;
  const getTextareaValue = (selector: string) => (component.getElement().querySelector(selector) as HTMLTextAreaElement)?.value;


  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    mockOnCancel = jest.fn();
    const defaultCategory = PREDEFINED_CATEGORIES[0] || 'Sonstiges'; // Fallback category
    mockProduct = {
      id: 'prod-abc',
      name: 'Test Vodka',
      category: PREDEFINED_CATEGORIES[1] || defaultCategory, // Ensure category is always a string
      volume: 700,
      pricePerBottle: 15.99,
      itemsPerCrate: 12,
      pricePer100ml: 2.28,
      supplier: 'Fine Spirits Co.',
      imageUrl: 'http://example.com/vodka.png',
      notes: 'Premium quality',
    };
    options = { onSubmit: mockOnSubmit, onCancel: mockOnCancel };
    component = new ProductFormComponent(options);
    document.body.appendChild(component.getElement());
  });

  afterEach(() => {
    component.getElement().remove();
  });

  describe('Initialization and Rendering', () => {
    test('should render for new product by default', () => {
      expect(component.getElement().querySelector('#product-form-title-comp')?.textContent).toBe('Neues Produkt erstellen');
      expect(getInputValue('#pfc-product-name')).toBe('');
      expect(component.getElement().style.display).toBe('none'); // Hidden by default for new
    });

    test('should render with existing product data if provided', () => {
      const editOptions = { ...options, product: mockProduct };
      const editComponent = new ProductFormComponent(editOptions); // Creates and renders
      document.body.appendChild(editComponent.getElement());

      expect(editComponent.getElement().querySelector('#product-form-title-comp')?.textContent).toBe('Produkt bearbeiten');
      expect(getInputValue('#pfc-product-name')).toBe(mockProduct.name);
      expect(getSelectValue('#pfc-product-category')).toBe(mockProduct.category);
      expect(getInputValue('#pfc-product-volume')).toBe(mockProduct.volume.toString());
      // ... and so on for other fields
      expect(editComponent.getElement().style.display).not.toBe('none'); // Shown by default when product provided
      editComponent.getElement().remove();
    });

    test('should populate category select with PREDEFINED_CATEGORIES', () => {
        const categorySelect = component.getElement().querySelector('#pfc-product-category') as HTMLSelectElement;
        expect(categorySelect!.options.length).toBe(PREDEFINED_CATEGORIES.length);
        PREDEFINED_CATEGORIES.forEach((cat, index) => {
          expect(categorySelect!.options[index]!.value).toBe(cat);
          expect(categorySelect!.options[index]!.text).toBe(cat);
        });
      });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      // Show the form for submission tests, as it's hidden by default for new
      component.show();
    });

    test('should not submit if required fields are invalid', async () => {
      setInputValue('#pfc-product-name', ''); // Empty name
      (component.getElement().querySelector('#product-form-actual') as HTMLFormElement).dispatchEvent(new Event('submit'));
      await Promise.resolve();
      expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Pflichtfelder korrekt ausfüllen'), 'error');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test('should not submit if volume is invalid (e.g., <= 0)', async () => {
        setInputValue('#pfc-product-name', 'Test Product');
        setInputValue('#pfc-product-category', PREDEFINED_CATEGORIES[0] || 'Sonstiges');
        setInputValue('#pfc-product-volume', '0'); // Invalid volume
        setInputValue('#pfc-product-pricePerBottle', '10');
        (component.getElement().querySelector('#product-form-actual') as HTMLFormElement).dispatchEvent(new Event('submit'));
        await Promise.resolve();
        expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Volumen muss größer als 0 sein'), 'error');
        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test('should correctly parse numbers and handle optional fields for new product', async () => {
      setInputValue('#pfc-product-name', 'New Gin');
      setInputValue('#pfc-product-category', 'Spirituosen');
      setInputValue('#pfc-product-volume', '750');
      setInputValue('#pfc-product-pricePerBottle', '25.50');
      setInputValue('#pfc-product-itemsPerCrate', '6'); // Optional, filled
      // pricePer100ml is left empty (optional)
      setInputValue('#pfc-product-supplier', 'Craft Distillers');
      // imageUrl and notes left empty

      (component.getElement().querySelector('#product-form-actual') as HTMLFormElement).dispatchEvent(new Event('submit'));
      await Promise.resolve();

      expect(mockOnSubmit).toHaveBeenCalledWith({
        id: 'mock-prod-id', // From generateId mock
        name: 'New Gin',
        category: 'Spirituosen',
        volume: 750,
        pricePerBottle: 25.50,
        itemsPerCrate: 6,
        pricePer100ml: undefined,
        supplier: 'Craft Distillers',
        imageUrl: undefined,
        notes: undefined,
      });
    });

    test('should submit with existing product ID if editing', async () => {
        component.show(mockProduct); // Show form with existing product
        setInputValue('#pfc-product-name', 'Updated Test Vodka'); // Change a field

        (component.getElement().querySelector('#product-form-actual') as HTMLFormElement).dispatchEvent(new Event('submit'));
        await Promise.resolve();

        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
          id: mockProduct.id, // Ensure existing ID is used
          name: 'Updated Test Vodka',
        }));
      });

    test('should show toast and focus on invalid numeric field (itemsPerCrate)', async () => {
        setInputValue('#pfc-product-name', 'Valid Name');
        setInputValue('#pfc-product-category', PREDEFINED_CATEGORIES[0] || 'Sonstiges');
        setInputValue('#pfc-product-volume', '700');
        setInputValue('#pfc-product-pricePerBottle', '10');
        setInputValue('#pfc-product-itemsPerCrate', 'abc'); // Invalid number

        const itemsPerCrateInput = component.getElement().querySelector('#pfc-product-itemsPerCrate') as HTMLInputElement;
        const focusSpy = jest.spyOn(itemsPerCrateInput, 'focus');

        (component.getElement().querySelector('#product-form-actual') as HTMLFormElement).dispatchEvent(new Event('submit'));
        await Promise.resolve();

        expect(showToast).toHaveBeenCalledWith("Flaschen pro Kasten muss eine gültige Zahl sein.", "error");
        expect(focusSpy).toHaveBeenCalled();
        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test('should log error if onSubmitCallback fails', async () => {
        const submitError = new Error('Submit failed');
        mockOnSubmit.mockRejectedValueOnce(submitError);
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        setInputValue('#pfc-product-name', 'Test');
        setInputValue('#pfc-product-category', PREDEFINED_CATEGORIES[0] || 'Sonstiges');
        setInputValue('#pfc-product-volume', '700');
        setInputValue('#pfc-product-pricePerBottle', '10');
        (component.getElement().querySelector('#product-form-actual') as HTMLFormElement).dispatchEvent(new Event('submit'));

        await Promise.resolve(); // Wait for handleSubmit's async parts
        await Promise.resolve(); // Ensure all microtasks complete

        expect(consoleErrorSpy).toHaveBeenCalledWith("ProductFormComponent: Error during submission callback", submitError);
        consoleErrorSpy.mockRestore();
    });
  });

  describe('Cancel Button', () => {
    test('should call onCancelCallback when cancel button is clicked', () => {
      const cancelButton = component.getElement().querySelector('#pfc-cancel-product-edit') as HTMLButtonElement;
      cancelButton.click();
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Show/Hide Methods', () => {
    test('show() for new product should clear fields and set correct titles', () => {
      component.show(); // Explicitly show for new
      expect(getInputValue('#pfc-product-name')).toBe('');
      expect(getSelectValue('#pfc-product-category')).toBe(PREDEFINED_CATEGORIES[0]);
      expect(component.getElement().querySelector('#product-form-title-comp')?.textContent).toBe('Neues Produkt erstellen');
      expect(component.getElement().style.display).toBe('block');
    });

    test('show(product) for editing should populate fields', () => {
      component.show(mockProduct);
      expect(getInputValue('#pfc-product-name')).toBe(mockProduct.name);
      expect(getSelectValue('#pfc-product-category')).toBe(mockProduct.category);
      expect(getInputValue('#pfc-product-volume')).toBe(mockProduct.volume.toString());
      expect(component.getElement().querySelector('#product-form-title-comp')?.textContent).toBe('Produkt bearbeiten');
    });

    test('hide() should clear fields and set display to none', () => {
      component.show(mockProduct); // Populate and show
      component.hide();
      expect(component.getElement().style.display).toBe('none');
      expect(getInputValue('#pfc-product-name')).toBe(''); // Fields should be reset
      expect(component.currentEditingProduct).toBeNull();
    });
  });
});
