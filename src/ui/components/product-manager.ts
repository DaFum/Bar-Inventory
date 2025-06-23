// import { dbService } from '../../services/indexeddb.service'; // No longer needed directly for CRUD after store
import { Product } from '../../models';
// import { generateId } from '../../utils/helpers'; // generateId is used by ProductFormComponent for new products
import { showToast } from './toast-notifications';
import { exportService } from '../../services/export.service';

import { ProductFormComponent } from './product-form.component';
import { ProductListComponent, ProductListItemCallbacks } from './product-list.component';
import { productStore } from '../../state/product.store';

let productManagerContainer: HTMLElement | null = null; // The main container for the product manager view
// let loadedProducts: Product[] = []; // This is now managed by productStore

// Component instances
let productListComponent: ProductListComponent | null = null;
let productFormComponent: ProductFormComponent | null = null;

/**
 * Initialisiert die Produktkatalog-Verwaltung im angegebenen Container.
 *
 * Baut das UI für die Produktverwaltung auf, lädt die Produktliste über den Store,
 * und richtet Event-Handler für das Hinzufügen neuer Produkte sowie den CSV-Export ein.
 *
 * @param outerContainer - Das HTML-Element, in dem die Produktverwaltung angezeigt werden soll
 */
export async function initProductManager(outerContainer: HTMLElement): Promise<void> {
    productManagerContainer = outerContainer;
    productManagerContainer.innerHTML = `
        <section id="product-manager-content-wrapper" aria-labelledby="product-manager-main-title">
            <div class="panel">
                <h2 id="product-manager-main-title" class="panel-title">Produktkatalog Verwalten</h2>
                <div id="product-list-container-host" aria-live="polite"></div>
                <button id="add-new-product-btn" class="btn btn-primary" aria-label="Neues Produkt zum Katalog hinzufügen">Neues Produkt hinzufügen</button>
            </div>
            <div id="product-form-container-host">
                <!-- Form component will be appended here -->
            </div>
            <div class="panel-footer mt-4 panel p-2">
                <button id="export-products-csv-btn" class="btn btn-secondary">Produktkatalog als CSV exportieren</button>
            </div>
        </section>
    `;

    const listContainerHost = productManagerContainer.querySelector<HTMLDivElement>('#product-list-container-host');
    const formContainerHost = productManagerContainer.querySelector<HTMLDivElement>('#product-form-container-host');

    if (!listContainerHost || !formContainerHost) {
        console.error("Product manager host containers not found!");
        return;
    }

    const listItemCallbacks: ProductListItemCallbacks = {
        onEdit: handleEditProduct,
        onDelete: handleDeleteProductRequest
    };

    productListComponent = new ProductListComponent([], listItemCallbacks); // Initial empty, will be populated by store
    productListComponent.appendTo(listContainerHost);

    productFormComponent = new ProductFormComponent({
        onSubmit: handleProductFormSubmit,
        onCancel: handleProductFormCancel
    });
    productFormComponent.appendTo(formContainerHost);
    productFormComponent.hide();

    // Initial load and subscription
    await initialLoadAndSubscribe();

    const addNewProductBtn = productManagerContainer.querySelector<HTMLButtonElement>('#add-new-product-btn');
    if (addNewProductBtn) {
        addNewProductBtn.addEventListener('click', () => {
            productFormComponent?.show(); // Show form for a new product
        });
    }

    const exportCsvBtn = productManagerContainer.querySelector<HTMLButtonElement>('#export-products-csv-btn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', handleExportProductsCsv);
    }
}

/**
 * Handles the "edit" action for a product.
 * Shows the product form pre-filled with the given product's data.
 * @param product - The product to be edited.
 */
function handleEditProduct(product: Product): void {
    productFormComponent?.show(product);
}

/**
 * Handles the "delete" action for a product.
 * Confirms with the user, then calls the product store to delete the product.
 * Shows toast notifications for success or failure.
 * @param productId - The ID of the product to delete.
 * @param productName - The name of the product, for the confirmation dialog.
 */
async function handleDeleteProductRequest(productId: string, productName: string): Promise<void> {
    if (confirm(`Produkt "${productName}" wirklich löschen?`)) {
        try {
            await productStore.deleteProduct(productId);
            showToast(`Produkt "${productName}" gelöscht.`, 'success');
            productFormComponent?.hide(); // Hide form if it was showing the deleted product

            const addNewButton = productManagerContainer?.querySelector<HTMLButtonElement>('#add-new-product-btn');
            if (addNewButton) {
                 setTimeout(() => addNewButton.focus(), 0);
            }
        } catch (error) {
            console.error(`Error deleting product ${productId} via store:`, error);
            showToast(`Fehler beim Löschen von Produkt "${productName}".`, 'error');
        }
    }
}

/**
 * Handles the submission of the product form (create or update).
 * Calls the appropriate product store method and shows toast notifications.
 * @param productDataFromForm - The product data from the form.
 * @throws Re-throws error if store operation fails, to notify the form component.
 */
async function handleProductFormSubmit(productDataFromForm: Product): Promise<void> {
    // ProductFormComponent's handleSubmit generates an ID if it's a new product.
    const isUpdating = !!productStore.getProducts().find(p => p.id === productDataFromForm.id);

    try {
        if (isUpdating) {
            await productStore.updateProduct(productDataFromForm);
            showToast(`Produkt "${productDataFromForm.name}" erfolgreich aktualisiert.`, 'success');
        } else {
            // ID should be guaranteed by ProductFormComponent for new products
            await productStore.addProduct(productDataFromForm);
            showToast(`Produkt "${productDataFromForm.name}" erfolgreich erstellt.`, 'success');
        }
        productFormComponent?.hide();
        // The productListComponent is updated automatically via its subscription to productStore
    } catch (error) {
        console.error("Error saving product via store:", error);
        showToast(`Fehler beim Speichern des Produkts "${productDataFromForm.name}".`, "error");
        throw error; // Re-throw to let the form component know submission failed
    }
}

/**
 * Handles the cancellation of the product form. Hides the form.
 */
function handleProductFormCancel(): void {
    productFormComponent?.hide();
}

/**
 * Subscribes the ProductListComponent to the ProductStore and triggers initial product loading.
 */
async function initialLoadAndSubscribe(): Promise<void> {
    if (!productListComponent) {
        console.error("ProductListComponent not initialized for store subscription.");
        return;
    }
    // Subscribe the list component to store updates.
    // The productStore.subscribe method now immediately calls back with current products if any,
    // or when products are loaded/modified.
    // The setProducts method of ProductListComponent will handle rendering.
    productStore.subscribe(productListComponent.setProducts.bind(productListComponent));

    try {
        // Trigger initial load. Store will notify subscribers (including productListComponent).
        await productStore.loadProducts();
    } catch (error) {
        console.error("Error during initial product load via store:", error);
        showToast("Fehler beim Laden der Produktliste.", "error");
        // If store load fails, productListComponent will receive an empty list or whatever state store settles in.
    }
}

/**
 * Handles the CSV export of the current product catalog.
 * Fetches products from the store and uses ExportService.
 */
function handleExportProductsCsv(): void {
    const currentProducts = productStore.getProducts(); // Get sorted products from store
    if (currentProducts.length === 0) {
        showToast("Keine Produkte zum Exportieren vorhanden.", "info");
        return;
    }
    try {
        exportService.exportProductsToCsv(currentProducts);
        showToast("Produktkatalog erfolgreich als CSV exportiert.", "success");
    } catch (error) {
        console.error("Fehler beim Exportieren des Produktkatalogs:", error);
        showToast("Fehler beim CSV-Export des Produktkatalogs.", "error");
    }
}

console.log("Product Manager UI now uses ProductStore.");
