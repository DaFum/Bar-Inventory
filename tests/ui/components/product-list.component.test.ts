import { ProductListComponent } from '../../../src/ui/components/product-list.component';
import { ProductListItemComponent, ProductListItemCallbacks } from '../../../src/ui/components/product-list-item.component';
import { Product } from '../../../src/models';

// Mock ProductListItemComponent
jest.mock('../../../src/ui/components/product-list-item.component', () => {
  return {
    ProductListItemComponent: jest.fn().mockImplementation((product: Product, callbacks: ProductListItemCallbacks) => {
      const element = document.createElement('tr'); // Mocked as TR for table
      element.className = 'mock-product-list-item';
      element.dataset.productId = product.id;
      // Simulate some content for easier debugging if needed
      const nameCell = document.createElement('td');
      nameCell.textContent = product.name;
      element.appendChild(nameCell);
      return {
        getElement: () => element,
        appendTo: jest.fn((parent: HTMLElement) => parent.appendChild(element)),
        update: jest.fn((updatedProduct: Product) => {
            element.firstChild!.textContent = updatedProduct.name;
        }),
        remove: jest.fn(() => element.remove()),
        getProductId: () => product.id,
      };
    }),
  };
});

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

describe('ProductListComponent', () => {
  let productListComponent: ProductListComponent;
  let mockCallbacks: ProductListItemCallbacks;
  let initialProducts: Product[];

  const getProductCellText = (rowElement: Element, cellIndex: number) => {
    // In the mock, the first child (td) contains the name.
    // For a more complex mock, you'd query specific cells.
    return rowElement.children[0]?.textContent;
  };

  beforeEach(() => {
    mockCallbacks = {
      onEdit: jest.fn(),
      onDelete: jest.fn(),
    };
    initialProducts = [
      { id: 'prodB', name: 'Product Bravo', category: 'Category X', volume: 750, pricePerBottle: 20, lastUpdated: new Date() },
      { id: 'prodA', name: 'Product Alpha', category: 'Category Y', volume: 500, pricePerBottle: 15, lastUpdated: new Date() },
      { id: 'prodC', name: 'Product Charlie', category: 'Category X', volume: 1000, pricePerBottle: 25, lastUpdated: new Date() },
    ];

    (ProductListItemComponent as jest.Mock).mockClear();
    productListComponent = new ProductListComponent(initialProducts, mockCallbacks);
    document.body.appendChild(productListComponent.getElement());
  });

  afterEach(() => {
    productListComponent.getElement().remove();
  });

  test('constructor should initialize with products, sort them, and render table structure', () => {
    expect(ProductListItemComponent).toHaveBeenCalledTimes(initialProducts.length);
    const tableElement = productListComponent.getElement().querySelector('table');
    expect(tableElement).not.toBeNull();
    expect(tableElement?.querySelector('thead')).not.toBeNull();
    const tbodyElement = tableElement?.querySelector('tbody');
    expect(tbodyElement).not.toBeNull();

    const items = tbodyElement!.children;
    expect(items.length).toBe(initialProducts.length);
    // Check order: Bravo (Cat X), Charlie (Cat X), Alpha (Cat Y)
    // Then within Cat X: Bravo before Charlie
    expect(getProductCellText(items[0]!,0)).toBe('Product Bravo');
    expect(getProductCellText(items[1]!,0)).toBe('Product Charlie');
    expect(getProductCellText(items[2]!,0)).toBe('Product Alpha');
  });

  test('setProducts should re-render the list with new sorted products', () => {
    const newProducts: Product[] = [
      { id: 'prodZ', name: 'Product Zulu', category: 'Category A', volume: 1, pricePerBottle: 1, lastUpdated: new Date() },
      { id: 'prodY', name: 'Product Yankee', category: 'Category B', volume: 1, pricePerBottle: 1, lastUpdated: new Date() },
    ];
    productListComponent.setProducts(newProducts);
    expect(ProductListItemComponent).toHaveBeenCalledTimes(initialProducts.length + newProducts.length);

    const tbodyElement = productListComponent.getElement().querySelector('tbody');
    const items = tbodyElement!.children;
    expect(items.length).toBe(newProducts.length);
    expect(getProductCellText(items[0]!,0)).toBe('Product Zulu'); // Cat A before Cat B
    expect(getProductCellText(items[1]!,0)).toBe('Product Yankee');
  });

  test('setProducts with empty array should display "no products" message', () => {
    productListComponent.setProducts([]);
    expect(productListComponent.getElement().textContent).toContain('Noch keine Produkte im Katalog erfasst.');
    expect(productListComponent.getElement().querySelector('table')).toBeNull();
  });

  test('addProduct should add a product and insert it sorted into the DOM', () => {
    const newProduct: Product = { id: 'prodD', name: 'Product Delta', category: 'Category Z', volume: 1, pricePerBottle: 1, lastUpdated: new Date() };
    productListComponent.addProduct(newProduct);

    const tbodyElement = productListComponent.getElement().querySelector('tbody');
    const items = tbodyElement!.children;
    expect(items.length).toBe(initialProducts.length + 1);
    // Alpha (Y), Bravo (X), Charlie (X), Delta (Z) -> Sorted by category then name
    // Expected: Bravo (X), Charlie (X), Alpha (Y), Delta (Z)
    expect(getProductCellText(items[3]!,0)).toBe('Product Delta');
    expect(ProductListItemComponent).toHaveBeenCalledTimes(initialProducts.length + 1);

    const newerProduct: Product = { id: 'prod0', name: 'AAA Product', category: 'Category A', volume:1, pricePerBottle:1, lastUpdated: new Date() };
    productListComponent.addProduct(newerProduct);
    expect(getProductCellText(items[0]!,0)).toBe('AAA Product');
  });

  test('updateProduct should update item and re-sort if category/name changes', () => {
    const originalProdA = initialProducts.find(p => p.id === 'prodA')!; // Cat Y, Name Alpha
    const updatedProdA: Product = { ...originalProdA, name: 'Product Apple', category: 'Category W' };
    // New sort order: Apple (W), Bravo (X), Charlie (X)

    productListComponent.updateProduct(updatedProdA);

    const mockItemInstance = (ProductListItemComponent as jest.Mock).mock.results.find(
        (result: any) => result.value.getProductId() === updatedProdA.id
      )?.value;
    expect(mockItemInstance.update).toHaveBeenCalledWith(updatedProdA);

    const tbodyElement = productListComponent.getElement().querySelector('tbody');
    const items = tbodyElement!.children;
    expect(items.length).toBe(initialProducts.length);
    expect(getProductCellText(items[0]!,0)).toBe('Product Apple');
    expect(getProductCellText(items[1]!,0)).toBe('Product Bravo');
    expect(getProductCellText(items[2]!,0)).toBe('Product Charlie');
  });

  test('updateProduct should not change DOM order if sort key is unaffected', () => {
    const originalProdB = initialProducts.find(p => p.id === 'prodB')!; // Cat X, Name Bravo
    const updatedProdB: Product = { ...originalProdB, volume: 999 }; // Only volume changed

    productListComponent.updateProduct(updatedProdB);
    const mockItemInstance = (ProductListItemComponent as jest.Mock).mock.results.find(
        (result: any) => result.value.getProductId() === updatedProdB.id
      )?.value;
    expect(mockItemInstance.update).toHaveBeenCalledWith(updatedProdB);

    const tbodyElement = productListComponent.getElement().querySelector('tbody');
    const items = tbodyElement!.children;
    // Order should remain Bravo (X), Charlie (X), Alpha (Y)
    expect(getProductCellText(items[0]!,0)).toBe('Product Bravo');
    expect(getProductCellText(items[1]!,0)).toBe('Product Charlie');
    expect(getProductCellText(items[2]!,0)).toBe('Product Alpha');
  });


  test('removeProduct should remove the item from the list and DOM', () => {
    const productIdToRemove = 'prodB'; // Product Bravo
    const mockItemInstanceToRemove = (ProductListItemComponent as jest.Mock).mock.results.find(
        (result: any) => result.value.getProductId() === productIdToRemove
      )?.value;

    productListComponent.removeProduct(productIdToRemove);

    expect(mockItemInstanceToRemove!.remove).toHaveBeenCalled();
    const tbodyElement = productListComponent.getElement().querySelector('tbody');
    const items = tbodyElement!.children;
    expect(items.length).toBe(initialProducts.length - 1);
    expect(Array.from(items).find(item => getProductCellText(item!,0) === 'Product Bravo')).toBeUndefined();
  });

  test('removeProduct last item should display "no products" message', () => {
    productListComponent.removeProduct('prodA');
    productListComponent.removeProduct('prodB');
    productListComponent.removeProduct('prodC');

    expect(productListComponent.getElement().textContent).toContain('Noch keine Produkte im Katalog erfasst.');
    expect(productListComponent.getElement().querySelector('table')).toBeNull();
  });
});
