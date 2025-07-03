// import { dbService } from '../../services/indexeddb.service'; // No longer needed directly for CRUD after store
import { Product } from '../../models';
// import { generateId } from '../../utils/helpers'; // generateId is used by ProductFormComponent for new products
import { showToast } from './toast-notifications';
import { exportService } from '../../services/export.service';

import { ProductFormComponent } from './product-form.component';
import { ProductListComponent } from './product-list.component';
import type { ProductListItemCallbacks } from './product-list-item.component'; // Corrected import
import { productStore } from '../../state/product.store';

let productManagerContainer: HTMLElement | null = null; // The main container for the product manager view
// let loadedProducts: Product[] = []; // This is now managed by productStore

// Component instances
let productListComponent: ProductListComponent | null = null;
let productFormComponent: ProductFormComponent | null = null;

/**
 * Initialisiert die Benutzeroberfläche zur Verwaltung des Produktkatalogs im angegebenen Container.
 *
 * Erstellt die UI-Struktur für die Produktliste, das Produktformular sowie Schaltflächen zum Hinzufügen neuer Produkte und zum CSV-Export. Bindet die Komponenten an den zentralen Produkt-Store, lädt initial die Produkte und richtet Event-Handler für Benutzeraktionen ein.
 *
 * @param outerContainer - Das HTML-Element, in dem die Produktverwaltung angezeigt werden soll.
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
 * Zeigt das Produktformular mit den Daten des angegebenen Produkts zur Bearbeitung an.
 *
 * @param product - Das Produkt, dessen Daten im Formular bearbeitet werden sollen
 */
function handleEditProduct(product: Product): void {
    productFormComponent?.show(product);
}

/**
 * Fordert den Benutzer zur Bestätigung auf und löscht das angegebene Produkt aus dem Katalog.
 *
 * Öffnet einen Bestätigungsdialog für das Produkt. Bei Zustimmung wird das Produkt aus dem Store entfernt, eine Erfolgsmeldung angezeigt und das Formular ggf. ausgeblendet. Bei Fehlern erscheint eine Fehlermeldung.
 *
 * @param productId - Die ID des zu löschenden Produkts.
 * @param productName - Der Name des Produkts, der im Bestätigungsdialog angezeigt wird.
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
 * Verarbeitet das Absenden des Produktformulars zur Erstellung oder Aktualisierung eines Produkts im Produkt-Store.
 *
 * Erkennt anhand der Produkt-ID, ob ein neues Produkt angelegt oder ein bestehendes aktualisiert werden soll, und führt die entsprechende Aktion aus. Zeigt nach erfolgreicher Speicherung eine Erfolgsmeldung an und blendet das Formular aus. Bei Fehlern wird eine Fehlermeldung angezeigt und der Fehler erneut ausgelöst, um die Formular-Komponente zu informieren.
 *
 * @param productDataFromForm - Die vom Formular übergebenen Produktdaten, die gespeichert werden sollen.
 * @throws Gibt den Fehler weiter, falls das Speichern im Produkt-Store fehlschlägt.
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
 * Verbirgt das Produktformular, wenn der Benutzer die Eingabe abbricht.
 */
function handleProductFormCancel(): void {
    productFormComponent?.hide();
}

/**
 * Lädt die Produktliste initial aus dem ProductStore und abonniert den ProductListComponent für automatische Updates.
 *
 * Zeigt eine Fehlermeldung an, falls das Laden der Produkte fehlschlägt.
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
 * Exportiert den aktuellen Produktkatalog als CSV-Datei.
 *
 * Zeigt eine Informationsmeldung an, wenn keine Produkte vorhanden sind. Bei erfolgreichem Export wird eine Erfolgsmeldung angezeigt, bei Fehlern eine Fehlermeldung.
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
