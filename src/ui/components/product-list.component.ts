import { BaseComponent } from '../core/base-component';
import { Product } from '../../models';
import { ProductListItemComponent, ProductListItemCallbacks } from './product-list-item.component';

/**
 * Component responsible for rendering the list of products in a table.
 * Manages ProductListItemComponent instances for each product.
 */
export class ProductListComponent extends BaseComponent<HTMLDivElement> {
    private products: Product[] = [];
    private itemCallbacks: ProductListItemCallbacks;
    private tbodyElement: HTMLTableSectionElement | undefined; // Changed to allow undefined
    private tableElement: HTMLTableElement | undefined;       // Changed to allow undefined
    private listItemComponents: Map<string, ProductListItemComponent> = new Map();

    /**
     * Creates an instance of ProductListComponent.
     * @param initialProducts - An initial array of products to display.
     * @param itemCallbacks - Callbacks for actions on individual product items (edit, delete).
     */
    constructor(initialProducts: Product[], itemCallbacks: ProductListItemCallbacks) {
        super('div'); // The root element for this component will be a div
        this.itemCallbacks = itemCallbacks;
        this.setProducts(initialProducts); // Initial render is handled by setProducts
    }

    /** Sorts products by category, then by name. */
    private sortProducts(a: Product, b: Product): number {
        const catA = a.category.toLowerCase();
        const catB = b.category.toLowerCase();
        if (catA < catB) return -1;
        if (catA > catB) return 1;
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
    }

    private ensureTableStructure(): void {
        if (!this.tableElement || !this.tbodyElement || !this.tableElement.isConnected) {
            this.element.innerHTML = ''; // Clear "no products" message or old table
            this.tableElement = document.createElement('table');
            this.tableElement.className = 'table-fixed w-full';
            this.tableElement.setAttribute('aria-label', 'Produktkatalog');
            this.tableElement.innerHTML = `
                <thead>
                    <tr>
                        <th scope="col" class="w-1/5 px-4 py-2">Name</th>
                        <th scope="col" class="w-1/5 px-4 py-2">Kategorie</th>
                        <th scope="col" class="w-1/6 px-4 py-2">Volumen (ml)</th>
                        <th scope="col" class="w-1/6 px-4 py-2">Preis/Flasche (€)</th>
                        <th scope="col" class="w-1/5 px-4 py-2">Zuletzt geändert</th>
                        <th scope="col" class="w-1/4 px-4 py-2">Aktionen</th>
                    </tr>
                </thead>
            `;
            this.tbodyElement = document.createElement('tbody');
            this.tableElement.appendChild(this.tbodyElement);
            this.appendChild(this.tableElement);
        }
    }

    private renderFullList(): void {
        if (this.products.length === 0) {
            this.element.innerHTML = '<p>Noch keine Produkte im Katalog erfasst. Fügen Sie ein neues Produkt hinzu.</p>';
            this.tableElement = undefined;
            this.tbodyElement = undefined;
            this.listItemComponents.clear();
            return;
        }

        this.ensureTableStructure();

        if(this.tbodyElement) {
            this.tbodyElement.innerHTML = ''; // Clear existing rows before re-adding
        }
        this.listItemComponents.clear();

        this.products.forEach(product => {
            const itemComponent = new ProductListItemComponent(product, this.itemCallbacks);
            this.listItemComponents.set(product.id, itemComponent);
            if(this.tbodyElement) {
                itemComponent.appendTo(this.tbodyElement);
            }
        });
    }

    /**
     * Sets the products to be displayed and triggers a full re-render of the list.
     * @param products - An array of products to display.
     */
    setProducts(products: Product[]): void {
        this.products = [...products].sort(this.sortProducts); // Store a sorted copy
        this.renderFullList();
    }

    /**
     * Adds a product to the list and updates the DOM granularly.
     * If the list was empty, it performs a full re-render to build the table structure.
     * @param product - The product to add.
     */
    addProduct(product: Product): void {
        const wasEmpty = this.products.length === 0;
        this.products.push(product);
        this.products.sort(this.sortProducts); // Re-sort internal list

        if (wasEmpty) {
            this.renderFullList(); // Transition from "no products" message to table
            return;
        }

        this.ensureTableStructure(); // Ensure table exists

        // Create new item component
        const newItemComponent = new ProductListItemComponent(product, this.itemCallbacks);
        this.listItemComponents.set(product.id, newItemComponent);

        // Find its correct sorted position in the DOM
        const newIndex = this.products.findIndex(p => p.id === product.id);
        if (this.tbodyElement) {
            if (newIndex === this.products.length - 1 || newIndex === -1) { // If it's the last item or not found (should append)
                newItemComponent.appendTo(this.tbodyElement);
            } else { // Insert before the item that should come after it
                const siblingProduct = this.products[newIndex + 1];
                if (siblingProduct) {
                    const siblingComponent = this.listItemComponents.get(siblingProduct.id);
                    if (siblingComponent && siblingComponent.getElement().isConnected) {
                        this.tbodyElement.insertBefore(newItemComponent.getElement(), siblingComponent.getElement());
                    } else {
                         // Fallback if sibling not found or not in DOM
                        this.tbodyElement.appendChild(newItemComponent.getElement());
                    }
                } else {
                     // Fallback, if it's the last item after all.
                    this.tbodyElement.appendChild(newItemComponent.getElement());
                }
            }
        }
    }

    /**
     * Updates a product in the list and updates the DOM granularly.
     * If a sort-relevant property (name, category) changes, the item's DOM position is updated.
     * @param product - The product with updated data.
     */
    updateProduct(product: Product): void {
        const index = this.products.findIndex(p => p.id === product.id);
        if (index === -1) { // Product not in list
            this.addProduct(product); // Add it if it's new from the store's perspective
            return;
        }

        const oldProduct = this.products[index]; // Store old product before updating
        this.products[index] = product; // Update data in the internal list

        const itemComponent = this.listItemComponents.get(product.id);
        if (!itemComponent) {
            this.renderFullList();
            return;
        }

        itemComponent.update(product);

        // Check if sorting order might have changed
        if (oldProduct) { // Check if oldProduct was found (it should be if index !== -1)
            const oldCategory = oldProduct.category.toLowerCase();
            const newCategory = product.category.toLowerCase();
            const oldName = oldProduct.name.toLowerCase();
            const newName = product.name.toLowerCase();

            if (oldCategory !== newCategory || oldName !== newName) {
                this.products.sort(this.sortProducts);

                if (this.tbodyElement) {
                    const currentElement = itemComponent.getElement();
                    currentElement.remove();

                    const newSortedVisualIndex = this.products.findIndex(p => p.id === product.id);

                    if (newSortedVisualIndex === this.products.length - 1 || newSortedVisualIndex === -1) {
                        this.tbodyElement.appendChild(currentElement);
                    } else {
                        const nextProduct = this.products[newSortedVisualIndex + 1];
                        if (nextProduct) {
                            const nextProductComponent = this.listItemComponents.get(nextProduct.id);
                            if (nextProductComponent && nextProductComponent.getElement().isConnected) {
                                this.tbodyElement.insertBefore(currentElement, nextProductComponent.getElement());
                            } else {
                                this.tbodyElement.appendChild(currentElement);
                            }
                        } else {
                             this.tbodyElement.appendChild(currentElement);
                        }
                    }
                }
            }
        }
    }

    /**
     * Removes a product from the list and updates the DOM granularly.
     * If the list becomes empty, it shows the "no products" message.
     * @param productId - The ID of the product to remove.
     */
    removeProduct(productId: string): void {
        this.products = this.products.filter(p => p.id !== productId); // Update internal list
        const itemComponent = this.listItemComponents.get(productId);
        if (itemComponent) {
            itemComponent.remove(); // Remove from DOM
            this.listItemComponents.delete(productId); // Remove from map
        }

        if (this.products.length === 0) {
            this.renderFullList(); // Show "no products" message and clear table structure
        }
    }
}
console.log("ProductListComponent loaded.");
