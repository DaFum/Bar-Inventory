import { dbService } from '../../services/indexeddb.service';
import { Product } from '../../models';
import { generateId } from '../../utils/helpers';
import { showToast } from './toast-notifications';
import { exportService } from '../../services/export.service';

let productManagerContainer: HTMLElement | null = null;
let loadedProducts: Product[] = [];
let currentEditingProduct: Product | null = null;

// Categories could be dynamic in the future, for now, a predefined list
const PREDEFINED_CATEGORIES = [
    "Spirituose", "Bier", "Wein", "Softdrink", "Sirup", "Sonstiges"
];

export async function initProductManager(container: HTMLElement): Promise<void> {
    productManagerContainer = container; // Keep this if productManagerContainer is used elsewhere for direct manipulation
    // The main container passed to initProductManager IS the productManagerContainer for this view.
    container.innerHTML = `
        <section id="product-manager-content-wrapper" aria-labelledby="product-manager-main-title">
            <div class="panel">
                <h2 id="product-manager-main-title" class="panel-title">Produktkatalog Verwalten</h2>
                <div id="product-list-container" aria-live="polite"></div>
                <button id="add-new-product-btn" class="btn btn-primary" aria-label="Neues Produkt zum Katalog hinzufügen">Neues Produkt hinzufügen</button>
            </div>
            <section id="product-form-container" class="panel mt-4" style="display: none;" aria-labelledby="product-form-title" aria-live="assertive">
                <!-- Form for adding/editing product will be rendered here -->
            </section>
            <!-- Panel footer will be injected here by the next block -->
        </section>
    `;

    await loadAndRenderProducts();

    // Inject panel footer for export button after main content is set up
    const wrapper = document.getElementById('product-manager-content-wrapper');
    if (wrapper) {
        wrapper.insertAdjacentHTML('beforeend', `
            <div class="panel-footer mt-4 panel p-2">
                <button id="export-products-csv-btn" class="btn btn-secondary">Produktkatalog als CSV exportieren</button>
            </div>
        `);
        document.getElementById('export-products-csv-btn')?.addEventListener('click', handleExportProductsCsv);
    }

    document.getElementById('add-new-product-btn')?.addEventListener('click', () => {
        renderProductForm();
         setTimeout(() => document.getElementById('product-name')?.focus(), 0);
    });
    // The duplicate injection and event listener for export-products-csv-btn was an error from a previous merge.
    // It's correctly handled by the wrapper injection logic that follows the loadAndRenderProducts call.
}

function handleExportProductsCsv(): void {
    if (loadedProducts.length === 0) {
        showToast("Keine Produkte zum Exportieren vorhanden.", "info");
        return;
    }
    try {
        exportService.exportProductsToCsv(loadedProducts);
        showToast("Produktkatalog erfolgreich als CSV exportiert.", "success");
    } catch (error) {
        console.error("Fehler beim Exportieren des Produktkatalogs:", error);
        showToast("Fehler beim CSV-Export des Produktkatalogs.", "error");
    }
}

async function loadAndRenderProducts(): Promise<void> {
    loadedProducts = await dbService.loadProducts();
    // Sort products by category, then by name for consistent display
    loadedProducts.sort((a, b) => {
        if (a.category.toLowerCase() < b.category.toLowerCase()) return -1;
        if (a.category.toLowerCase() > b.category.toLowerCase()) return 1;
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
    });
    renderProductList();
}

function renderProductList(): void {
    const listContainer = document.getElementById('product-list-container');
    if (!listContainer) return;

    if (loadedProducts.length === 0) {
        listContainer.innerHTML = '<p>Noch keine Produkte im Katalog erfasst. Fügen Sie ein neues Produkt hinzu.</p>';
        return;
    }

    listContainer.innerHTML = `
        <table class="table-fixed w-full" aria-label="Produktkatalog">
            <thead>
                <tr>
                    <th scope="col" class="w-1/4 px-4 py-2">Name</th>
                    <th scope="col" class="w-1/4 px-4 py-2">Kategorie</th>
                    <th scope="col" class="w-1/6 px-4 py-2">Volumen (ml)</th>
                    <th scope="col" class="w-1/6 px-4 py-2">Preis/Flasche (€)</th>
                    <th scope="col" class="w-1/4 px-4 py-2">Aktionen</th>
                </tr>
            </thead>
            <tbody>
                ${loadedProducts.map(prod => `
                    <tr class="border-b">
                        <td class="px-4 py-2">${prod.name}</td>
                        <td class="px-4 py-2">${prod.category}</td>
                        <td class="px-4 py-2 text-right">${prod.volume}</td>
                        <td class="px-4 py-2 text-right">${prod.pricePerBottle.toFixed(2)}</td>
                        <td class="px-4 py-2">
                            <button class="btn btn-sm btn-secondary edit-product-btn" data-id="${prod.id}" aria-label="Produkt ${prod.name} bearbeiten">Bearbeiten</button>
                            <button class="btn btn-sm btn-danger delete-product-btn" data-id="${prod.id}" aria-label="Produkt ${prod.name} löschen">Löschen</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    document.querySelectorAll('.edit-product-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetButton = e.target as HTMLElement;
            const productId = targetButton.dataset.id;
            if (productId) {
                currentEditingProduct = loadedProducts.find(p => p.id === productId) || null;
                if (currentEditingProduct) {
                    renderProductForm(currentEditingProduct);
                     setTimeout(() => document.getElementById('product-name')?.focus(), 0);
                }
            }
        });
    });

    document.querySelectorAll('.delete-product-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const targetButton = e.target as HTMLElement;
            const productId = targetButton.dataset.id;
            const productName = loadedProducts.find(p => p.id === productId)?.name || "Unbekanntes Produkt";
            if (productId && confirm(`Produkt "${productName}" wirklich löschen?`)) {
                await dbService.delete('products', productId);
                await loadAndRenderProducts(); // Refresh list
                document.getElementById('product-form-container')!.style.display = 'none';
                showToast(`Produkt "${productName}" gelöscht.`, 'success');
                setTimeout(() => document.getElementById('add-new-product-btn')?.focus(),0);
            }
        });
    });
}

function renderProductForm(product?: Product): void {
    const formContainer = document.getElementById('product-form-container');
    if (!formContainer) return;

    currentEditingProduct = product || null;
    const formTitleId = "product-form-title";
    formContainer.innerHTML = `
        <h3 id="${formTitleId}" class="panel-subtitle">${product ? 'Produkt bearbeiten' : 'Neues Produkt erstellen'}</h3>
        <form id="product-form" aria-labelledby="${formTitleId}">
            <div class="form-group">
                <label for="product-name">Name:</label>
                <input type="text" id="product-name" value="${product?.name || ''}" required class="form-control" aria-required="true">
            </div>
            <div class="form-group">
                <label for="product-category">Kategorie:</label>
                <select id="product-category" required class="form-control" aria-required="true">
                    ${PREDEFINED_CATEGORIES.map(cat =>
                        `<option value="${cat}" ${product?.category === cat ? 'selected' : ''}>${cat}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="product-volume">Volumen (ml pro Flasche/Einheit):</label>
                <input type="number" id="product-volume" value="${product?.volume || ''}" required min="0" class="form-control" aria-required="true">
            </div>
            <div class="form-group">
                <label for="product-pricePerBottle">Preis pro Flasche/Einheit (€):</label>
                <input type="number" id="product-pricePerBottle" value="${product?.pricePerBottle || ''}" required min="0" step="0.01" class="form-control" aria-required="true">
            </div>
            <div class="form-group">
                <label for="product-itemsPerCrate">Flaschen/Einheiten pro Kasten (optional):</label>
                <input type="number" id="product-itemsPerCrate" value="${product?.itemsPerCrate || ''}" min="0" class="form-control">
            </div>
            <div class="form-group">
                <label for="product-pricePer100ml">Preis pro 100ml (optional, für offene Posten):</label>
                <input type="number" id="product-pricePer100ml" value="${product?.pricePer100ml || ''}" min="0" step="0.01" class="form-control">
            </div>
             <div class="form-group">
                <label for="product-supplier">Lieferant (optional):</label>
                <input type="text" id="product-supplier" value="${product?.supplier || ''}" class="form-control">
            </div>
            <div class="form-group">
                <label for="product-imageUrl">Bild-URL (optional):</label>
                <input type="url" id="product-imageUrl" value="${product?.imageUrl || ''}" class="form-control">
            </div>
            <div class="form-group">
                <label for="product-notes">Notizen (optional):</label>
                <textarea id="product-notes" class="form-control" aria-label="Notizen zum Produkt">${product?.notes || ''}</textarea>
            </div>
            <button type="submit" class="btn btn-success">${product ? 'Änderungen speichern' : 'Produkt erstellen'}</button>
            <button type="button" id="cancel-product-edit" class="btn btn-secondary">Abbrechen</button>
        </form>
    `;
    formContainer.style.display = 'block';

    // const categorySelect = document.getElementById('product-category') as HTMLSelectElement;
    // const customCategoryInput = document.getElementById('product-custom-category') as HTMLInputElement;
    // categorySelect.addEventListener('change', () => {
    //     customCategoryInput.style.display = categorySelect.value === 'custom' ? 'block' : 'none';
    //     if(categorySelect.value === 'custom') customCategoryInput.required = true;
    //     else customCategoryInput.required = false;
    // });


    document.getElementById('product-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = (document.getElementById('product-name') as HTMLInputElement).value;
        // let category = (document.getElementById('product-category') as HTMLSelectElement).value;
        // if (category === 'custom') {
        //     category = (document.getElementById('product-custom-category') as HTMLInputElement).value;
        // }
        const category = (document.getElementById('product-category') as HTMLSelectElement).value;
        const volume = parseFloat((document.getElementById('product-volume') as HTMLInputElement).value);
        const pricePerBottle = parseFloat((document.getElementById('product-pricePerBottle') as HTMLInputElement).value);
        const itemsPerCrateVal = (document.getElementById('product-itemsPerCrate') as HTMLInputElement).value;
        const itemsPerCrate = itemsPerCrateVal ? parseInt(itemsPerCrateVal) : undefined;
        const pricePer100mlVal = (document.getElementById('product-pricePer100ml') as HTMLInputElement).value;
        const pricePer100ml = pricePer100mlVal ? parseFloat(pricePer100mlVal) : undefined;
        const supplier = (document.getElementById('product-supplier') as HTMLInputElement).value || undefined;
        const imageUrl = (document.getElementById('product-imageUrl') as HTMLInputElement).value || undefined;
        const notes = (document.getElementById('product-notes') as HTMLTextAreaElement).value || undefined;


        if (!name || !category || isNaN(volume) || isNaN(pricePerBottle)) {
            // Basic validation, can be enhanced
            showToast("Bitte füllen Sie alle Pflichtfelder (Name, Kategorie, Volumen, Preis) korrekt aus.", "warning");
            return;
        }

        const productData: Omit<Product, 'id'> = {
            name, category, volume, pricePerBottle, itemsPerCrate, pricePer100ml, supplier, imageUrl, notes
        };

        if (currentEditingProduct) { // Editing existing product
            const updatedProduct: Product = { ...currentEditingProduct, ...productData };
            await dbService.saveProduct(updatedProduct);
        } else { // Creating new product
            const newProduct: Product = {
                id: generateId('prod'),
                ...productData
            };
            await dbService.saveProduct(newProduct);
        }
        await loadAndRenderProducts(); // Refresh list
        formContainer.style.display = 'none';
        currentEditingProduct = null;
    });

    document.getElementById('cancel-product-edit')?.addEventListener('click', () => {
        formContainer.style.display = 'none';
        currentEditingProduct = null;
    });
}

console.log("Product Manager UI component loaded.");
