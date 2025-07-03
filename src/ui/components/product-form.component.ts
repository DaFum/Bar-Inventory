import { BaseComponent } from '../core/base-component';
import { Product } from '../../models';
import { generateId, PREDEFINED_CATEGORIES } from '../../utils/helpers';
import { showToast } from './toast-notifications';
// import { dbService } from '../../services/indexeddb.service'; // Not needed directly, manager handles store interaction
import { escapeHtml } from '../../utils/security';

export type ProductFormSubmitCallback = (product: Product) => Promise<void>;
export type ProductFormCancelCallback = () => void;

export interface ProductFormComponentOptions {
    product?: Product; // Product to edit, undefined for new product
    onSubmit: ProductFormSubmitCallback;
    onCancel: ProductFormCancelCallback;
}

/**
 * Component for rendering and managing the product add/edit form.
 */
export class ProductFormComponent extends BaseComponent<HTMLDivElement> {
    /** The product currently being edited, or null if creating a new product. */
    public currentEditingProduct: Product | null = null;
    private onSubmitCallback: ProductFormSubmitCallback;
    private onCancelCallback: ProductFormCancelCallback;

    private nameInput!: HTMLInputElement;
    private categorySelect!: HTMLSelectElement;
    private volumeInput!: HTMLInputElement;
    private pricePerBottleInput!: HTMLInputElement;
    private itemsPerCrateInput!: HTMLInputElement;
    private pricePer100mlInput!: HTMLInputElement;
    private supplierInput!: HTMLInputElement;
    private imageUrlInput!: HTMLInputElement;
    private notesTextarea!: HTMLTextAreaElement;
    private formElement!: HTMLFormElement;
    private formTitleId = 'product-form-title-comp'; // Unique ID for ARIA

    /**
     * Creates an instance of ProductFormComponent.
     * @param options - Configuration options for the form, including product data and callbacks.
     */
    constructor(options: ProductFormComponentOptions) {
        super('div', undefined, ['panel', 'mt-4']); // Matches old #product-form-container classes
        this.currentEditingProduct = options.product || null;
        this.onSubmitCallback = options.onSubmit;
        this.onCancelCallback = options.onCancel;
        this.render();
        if (!options.product) { // Initially hidden if for new product, manager shows it.
            this.hide();
        }
    }

    render(): void {
        const product = this.currentEditingProduct;
        this.element.innerHTML = `
            <h3 id="${this.formTitleId}" class="panel-subtitle">${product ? 'Produkt bearbeiten' : 'Neues Produkt erstellen'}</h3>
            <form id="product-form-actual" aria-labelledby="${this.formTitleId}">
                <div class="form-group">
                    <label for="pfc-product-name">Name:</label>
                    <input type="text" id="pfc-product-name" value="${escapeHtml(product?.name || '')}" required class="form-control" aria-required="true">
                </div>
                <div class="form-group">
                    <label for="pfc-product-category">Kategorie:</label>
                    <select id="pfc-product-category" required class="form-control" aria-required="true">
                        ${PREDEFINED_CATEGORIES.map(cat =>
                            `<option value="${escapeHtml(cat)}" ${product?.category === cat ? 'selected' : ''}>${escapeHtml(cat)}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="pfc-product-volume">Volumen (ml pro Flasche/Einheit):</label>
                    <input type="number" id="pfc-product-volume" value="${product?.volume || ''}" required min="0" class="form-control" aria-required="true">
                </div>
                <div class="form-group">
                    <label for="pfc-product-pricePerBottle">Preis pro Flasche/Einheit (€):</label>
                    <input type="number" id="pfc-product-pricePerBottle" value="${product?.pricePerBottle || ''}" required min="0" step="0.01" class="form-control" aria-required="true">
                </div>
                <div class="form-group">
                    <label for="pfc-product-itemsPerCrate">Flaschen/Einheiten pro Kasten (optional):</label>
                    <input type="number" id="pfc-product-itemsPerCrate" value="${product?.itemsPerCrate || ''}" min="0" class="form-control">
                </div>
                <div class="form-group">
                    <label for="pfc-product-pricePer100ml">Preis pro 100ml (optional, für offene Posten):</label>
                    <input type="number" id="pfc-product-pricePer100ml" value="${product?.pricePer100ml || ''}" min="0" step="0.01" class="form-control">
                </div>
                 <div class="form-group">
                    <label for="pfc-product-supplier">Lieferant (optional):</label>
                    <input type="text" id="pfc-product-supplier" value="${escapeHtml(product?.supplier || '')}" class="form-control">
                </div>
                <div class="form-group">
                    <label for="pfc-product-imageUrl">Bild-URL (optional):</label>
                    <input type="url" id="pfc-product-imageUrl" value="${escapeHtml(product?.imageUrl || '')}" class="form-control">
                </div>
                <div class="form-group">
                    <label for="pfc-product-notes">Notizen (optional):</label>
                    <textarea id="pfc-product-notes" class="form-control" aria-label="Notizen zum Produkt">${escapeHtml(product?.notes || '')}</textarea>
                </div>
                <button type="submit" class="btn btn-success">${product ? 'Änderungen speichern' : 'Produkt erstellen'}</button>
                <button type="button" id="pfc-cancel-product-edit" class="btn btn-secondary">Abbrechen</button>
            </form>
        `;
        this.bindElements();
        this.attachEventListeners();
    }

    private bindElements(): void {
        const form = this.element.querySelector<HTMLFormElement>('#product-form-actual');
        if (!form) throw new Error("Product form element not found during bind");
        this.formElement = form;

        this.nameInput = this.element.querySelector<HTMLInputElement>('#pfc-product-name')!;
        this.categorySelect = this.element.querySelector<HTMLSelectElement>('#pfc-product-category')!;
        this.volumeInput = this.element.querySelector<HTMLInputElement>('#pfc-product-volume')!;
        this.pricePerBottleInput = this.element.querySelector<HTMLInputElement>('#pfc-product-pricePerBottle')!;
        this.itemsPerCrateInput = this.element.querySelector<HTMLInputElement>('#pfc-product-itemsPerCrate')!;
        this.pricePer100mlInput = this.element.querySelector<HTMLInputElement>('#pfc-product-pricePer100ml')!;
        this.supplierInput = this.element.querySelector<HTMLInputElement>('#pfc-product-supplier')!;
        this.imageUrlInput = this.element.querySelector<HTMLInputElement>('#pfc-product-imageUrl')!;
        this.notesTextarea = this.element.querySelector<HTMLTextAreaElement>('#pfc-product-notes')!;

        // Basic check for one element to ensure template was applied
        if (!this.nameInput) {
            console.error("Critical error: Product form input elements not found after render.");
        }
    }

    private attachEventListeners(): void {
        this.formElement.addEventListener('submit', this.handleSubmit.bind(this));

        const cancelButton = this.element.querySelector<HTMLButtonElement>('#pfc-cancel-product-edit');
        if (cancelButton) { // Null check though it should always exist
            cancelButton.addEventListener('click', this.handleCancel.bind(this));
        }
    }

    private async handleSubmit(event: Event): Promise<void> {
        event.preventDefault();

        const name = this.nameInput.value;
        const category = this.categorySelect.value;
        const volume = parseFloat(this.volumeInput.value);
        const pricePerBottle = parseFloat(this.pricePerBottleInput.value);

        const itemsPerCrateVal = this.itemsPerCrateInput.value.trim();
        let itemsPerCrate: number | undefined = undefined;
        if (itemsPerCrateVal) {
            itemsPerCrate = parseInt(itemsPerCrateVal, 10);
            if (isNaN(itemsPerCrate)) {
                showToast("Flaschen pro Kasten muss eine gültige Zahl sein.", "error");
                this.itemsPerCrateInput.focus();
                return;
            }
        }

        const pricePer100mlVal = this.pricePer100mlInput.value.trim();
        let pricePer100ml: number | undefined = undefined;
        if (pricePer100mlVal) {
            pricePer100ml = parseFloat(pricePer100mlVal);
            if (isNaN(pricePer100ml)) {
                showToast("Preis pro 100ml muss eine gültige Zahl sein.", "error");
                this.pricePer100mlInput.focus();
                return;
            }
        }

        const supplier = this.supplierInput.value.trim() || undefined;
        const imageUrl = this.imageUrlInput.value.trim() || undefined;
        const notes = this.notesTextarea.value.trim() || undefined;

        if (!name || !category || isNaN(volume) || isNaN(pricePerBottle) || volume <= 0 || pricePerBottle < 0) {
            showToast("Bitte füllen Sie alle Pflichtfelder korrekt aus. Volumen muss größer als 0 sein und Preis darf nicht negativ sein.", "error");
            this.nameInput.focus(); // Focus the first required field
            return;
        }
        // Additional specific validations for parsed numbers
        if (itemsPerCrate !== undefined && itemsPerCrate <= 0) {
            showToast("Flaschen pro Kasten muss größer als 0 sein, wenn angegeben.", "error");
            this.itemsPerCrateInput.focus();
            return;
        }
        if (pricePer100ml !== undefined && pricePer100ml < 0) {
            showToast("Preis pro 100ml darf nicht negativ sein, wenn angegeben.", "error");
            this.pricePer100mlInput.focus();
            return;
        }

        const productDataInput: Product = {
            id: this.currentEditingProduct?.id || generateId('prod'),
            name,
            category,
            volume,
            pricePerBottle,
        };

        if (itemsPerCrate !== undefined) {
            productDataInput.itemsPerCrate = itemsPerCrate;
        }
        if (pricePer100ml !== undefined) {
            productDataInput.pricePer100ml = pricePer100ml;
        }
        if (supplier !== undefined) {
            productDataInput.supplier = supplier;
        }
        if (imageUrl !== undefined) {
            productDataInput.imageUrl = imageUrl;
        }
        if (notes !== undefined) {
            productDataInput.notes = notes;
        }

        try {
            await this.onSubmitCallback(productDataInput);
            // Hiding is usually done by the manager after successful store update & notification cycle
            // For now, we can hide it here optimistically, or let manager do it.
            // Manager should hide it to ensure it's hidden after store confirmation.
        } catch (error) {
            // Error should be handled by the caller (manager, which calls the store)
            // and appropriate toast shown there. This component doesn't need to show a toast for submit errors.
            console.error("ProductFormComponent: Error during submission callback", error);
        }
    }

    private handleCancel(): void {
        this.onCancelCallback(); // Manager will hide the form
    }

    /**
     * Shows the form, optionally pre-filled with product data for editing.
     * @param product - Optional product data to edit. If undefined, form is for a new product.
     */
    public show(product?: Product): void {
        this.currentEditingProduct = product || null;
        const isEditing = !!product;

        this.nameInput.value = product?.name || '';
        this.categorySelect.value = product?.category || PREDEFINED_CATEGORIES[0] || 'Sonstiges'; // Default to first category or a fallback
        this.volumeInput.value = product?.volume?.toString() || '';
        this.pricePerBottleInput.value = product?.pricePerBottle?.toString() || '';
        this.itemsPerCrateInput.value = product?.itemsPerCrate?.toString() || '';
        this.pricePer100mlInput.value = product?.pricePer100ml?.toString() || '';
        this.supplierInput.value = product?.supplier || '';
        this.imageUrlInput.value = product?.imageUrl || '';
        this.notesTextarea.value = product?.notes || '';

        const titleElement = this.element.querySelector<HTMLHeadingElement>(`#${this.formTitleId}`);
        if (titleElement) {
            titleElement.textContent = isEditing ? 'Produkt bearbeiten' : 'Neues Produkt erstellen';
        }
        const submitButton = this.formElement?.querySelector<HTMLButtonElement>('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = isEditing ? 'Änderungen speichern' : 'Produkt erstellen';
        }

        this.element.style.display = 'block';
        setTimeout(() => this.nameInput.focus(), 0); // Ensure focus happens after display
    }

    /**
     * Hides the form and resets its fields.
     */
    public hide(): void {
        this.element.style.display = 'none';
        // Reset form fields to avoid stale data when shown next for a new product
        if (this.formElement) this.formElement.reset(); // Resets to initial values from HTML or empty
        this.currentEditingProduct = null; // Clear editing state
        // Ensure category is reset to the default if formElement.reset() doesn't handle select properly
        if(this.categorySelect) this.categorySelect.value = PREDEFINED_CATEGORIES[0] || 'Sonstiges';
        // Explicitly clear values that reset() might not handle for non-standard "empty"
        this.nameInput.value = '';
        this.volumeInput.value = '';
        this.pricePerBottleInput.value = '';
        this.itemsPerCrateInput.value = '';
        this.pricePer100mlInput.value = '';
        this.supplierInput.value = '';
        this.imageUrlInput.value = '';
        this.notesTextarea.value = '';

    }
}
console.log("ProductFormComponent loaded.");
