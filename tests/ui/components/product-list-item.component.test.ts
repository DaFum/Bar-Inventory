import { ProductListItemComponent, ProductListItemCallbacks } from '../../../src/ui/components/product-list-item.component';
import { Product } from '../../../src/models';
import { escapeHtml } from '../../../src/utils/security';

// Mock escapeHtml
jest.mock('../../../src/utils/security', () => ({
  escapeHtml: jest.fn((str) => str),
}));

// Mock BaseComponent
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

describe('ProductListItemComponent', () => {
  let product: Product;
  let mockCallbacks: ProductListItemCallbacks;
  let component: ProductListItemComponent; // To be assigned in describe/test blocks

  beforeEach(() => {
    // Define mock data here, component instance will be created in specific describe/test blocks
    product = {
      id: 'prod1',
      name: 'Test Product',
      category: 'Test Category',
      volume: 750,
      pricePerBottle: 19.99
    };
    mockCallbacks = {
      onEdit: jest.fn(),
      onDelete: jest.fn(),
    };
  });

  afterEach(() => {
    component?.getElement().remove(); // Ensure component exists before trying to remove its element
    (escapeHtml as jest.Mock).mockClear(); // Clear mock calls after each test
  });

  describe('Constructor and Initial Render', () => {
    beforeEach(() => {
      // Create component here to test constructor effects on mocks
      component = new ProductListItemComponent(product, mockCallbacks);
      document.body.appendChild(component.getElement());
    });

    test('constructor should create TR element with correct class, dataset, and render content', () => {
      const element = component.getElement();
      expect(element.tagName).toBe('TR');
      expect(element.classList.contains('border-b')).toBe(true);
      expect(element.dataset.productId).toBe(product.id);
      expect(element.querySelector('td')?.textContent).toBe(product.name);
      expect(escapeHtml).toHaveBeenCalledWith(product.name);
    });

    test('render (called by constructor) should display product details and create buttons', () => {
      const element = component.getElement();
      const cells = element.querySelectorAll('td');
      expect(cells.length).toBe(5);

      expect(cells[0]!.textContent).toBe(product.name);
      expect(cells[1]!.textContent).toBe(product.category);
      expect(cells[2]!.textContent).toBe(product.volume.toString());
      expect(cells[3]!.textContent).toBe(product.pricePerBottle.toFixed(2));

      const editButton = element.querySelector('.edit-product-btn') as HTMLButtonElement;
      const deleteButton = element.querySelector('.delete-product-btn') as HTMLButtonElement;

      expect(editButton).not.toBeNull();
      expect(editButton.textContent).toBe('Bearbeiten');
      expect(editButton.getAttribute('aria-label')).toBe(`Produkt ${product.name} bearbeiten`);

      expect(deleteButton).not.toBeNull();
      expect(deleteButton.textContent).toBe('Löschen');
      expect(deleteButton.getAttribute('aria-label')).toBe(`Produkt ${product.name} löschen`);

      // escapeHtml calls during initial render: name, category, aria-edit-name, aria-delete-name
      expect(escapeHtml).toHaveBeenCalledWith(product.name); // Called for name cell
      expect(escapeHtml).toHaveBeenCalledWith(product.category); // For category cell
      expect(escapeHtml).toHaveBeenCalledWith(product.name); // For edit aria-label
      expect(escapeHtml).toHaveBeenCalledWith(product.name); // For delete aria-label
      // Check total calls if order/multiplicity matters. Here, name is used 3 times, category 1 time.
      // This specific check might be too brittle if the template changes slightly.
      // It's often better to check that it *was* called with specific important values.
      const calls = (escapeHtml as jest.Mock).mock.calls;
      let nameCalls = 0;
      let categoryCalls = 0;
      calls.forEach(call => {
        if (call[0] === product.name) nameCalls++;
        if (call[0] === product.category) categoryCalls++;
      });
      expect(nameCalls).toBeGreaterThanOrEqual(3); // Name in cell + 2 aria-labels
      expect(categoryCalls).toBeGreaterThanOrEqual(1); // Category in cell
    });
  });

  describe('Button Callbacks and Update', () => {
    beforeEach(() => {
        component = new ProductListItemComponent(product, mockCallbacks);
        document.body.appendChild(component.getElement());
        (escapeHtml as jest.Mock).mockClear(); // Clear calls from constructor for these specific tests
    });

    test('Edit button click should call onEdit callback with product data', () => {
        const editButton = component.getElement().querySelector('.edit-product-btn') as HTMLButtonElement;
        editButton.click();
        expect(mockCallbacks.onEdit).toHaveBeenCalledTimes(1);
        expect(mockCallbacks.onEdit).toHaveBeenCalledWith(product);
    });

    test('Delete button click should call onDelete callback with productId and productName', () => {
        const deleteButton = component.getElement().querySelector('.delete-product-btn') as HTMLButtonElement;
        deleteButton.click();
        expect(mockCallbacks.onDelete).toHaveBeenCalledTimes(1);
        expect(mockCallbacks.onDelete).toHaveBeenCalledWith(product.id, product.name);
    });

    test('update method should re-render the component with new product data', () => {
        const newProduct: Product = { ...product, name: 'Updated Product Name', pricePerBottle: 25.00 };

        component.update(newProduct); // This will call render again

        const element = component.getElement();
        const cells = element.querySelectorAll('td');
        expect(cells[0]!.textContent).toBe('Updated Product Name');
        expect(cells[3]!.textContent).toBe('25.00');

        expect(escapeHtml).toHaveBeenCalledWith('Updated Product Name');
        expect(escapeHtml).toHaveBeenCalledWith(newProduct.category);
        expect(escapeHtml).toHaveBeenCalledTimes(4); // name, cat, aria-edit, aria-delete for newProduct.name

        const editButton = element.querySelector('.edit-product-btn') as HTMLButtonElement;
        editButton.click();
        expect(mockCallbacks.onEdit).toHaveBeenCalledWith(newProduct);
    });

    test('getProductId should return the correct product ID', () => {
        expect(component.getProductId()).toBe(product.id);
        const newProduct: Product = { ...product, id: 'prod2' };
        component.update(newProduct);
        expect(component.getProductId()).toBe('prod2');
    });
  });
});
