import { BaseComponent } from '../core/base-component';
import { Product } from '../../models';
import { escapeHtml } from '../../utils/security';

export interface ProductListItemCallbacks {
    onEdit: (product: Product) => void;
    onDelete: (productId: string, productName: string) => void;
}

/**
 * Component representing a single row in the product list table.
 * Displays product details and action buttons (Edit, Delete).
 */
export class ProductListItemComponent extends BaseComponent<HTMLTableRowElement> {
    private product: Product;
    private callbacks: ProductListItemCallbacks;

    /**
     * Creates an instance of ProductListItemComponent.
     * @param product - The product data to display.
     * @param callbacks - Callbacks for edit and delete actions.
     */
    constructor(product: Product, callbacks: ProductListItemCallbacks) {
        super('tr');
        this.product = product;
        this.callbacks = callbacks;
        this.element.classList.add('border-b');
        this.element.dataset.productId = product.id;
        this.render();
    }

    render(): void {
        this.element.innerHTML = `
            <td class="px-4 py-2">${escapeHtml(this.product.name)}</td>
            <td class="px-4 py-2">${escapeHtml(this.product.category)}</td>
            <td class="px-4 py-2 text-right">${this.product.volume}</td>
            <td class="px-4 py-2 text-right">${this.product.pricePerBottle.toFixed(2)}</td>
            <td class="px-4 py-2">
                <button class="btn btn-sm btn-secondary edit-product-btn" aria-label="Produkt ${escapeHtml(this.product.name)} bearbeiten">Bearbeiten</button>
                <button class="btn btn-sm btn-danger delete-product-btn" aria-label="Produkt ${escapeHtml(this.product.name)} löschen">Löschen</button>
            </td>
        `;
        this.attachEventListeners();
    }

    private attachEventListeners(): void {
        const editButton = this.element.querySelector<HTMLButtonElement>('.edit-product-btn');
        if (editButton) { // Null check
            editButton.addEventListener('click', () => this.callbacks.onEdit(this.product));
        } else {
            console.warn("Edit button not found in ProductListItemComponent for product:", this.product.name);
        }

        const deleteButton = this.element.querySelector<HTMLButtonElement>('.delete-product-btn');
        if (deleteButton) { // Null check
            deleteButton.addEventListener('click', () => this.callbacks.onDelete(this.product.id, this.product.name));
        } else {
            console.warn("Delete button not found in ProductListItemComponent for product:", this.product.name);
        }
    }

    /**
     * Updates the component with new product data and re-renders.
     * @param product - The new product data.
     */
    update(product: Product): void {
        this.product = product;
        this.render(); // Re-render to reflect all changes
    }

    /**
     * Gets the ID of the product represented by this item.
     * @returns The product ID.
     */
    getProductId(): string {
        return this.product.id;
    }
}
console.log("ProductListItemComponent loaded.");
