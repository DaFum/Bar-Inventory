import { dbService } from '../../services/indexeddb.service';
import { Location, Product, InventoryEntry, Area, Counter } from '../../models';
import { generateId, debounce } from '../../utils/helpers';
import { showToast } from './toast-notifications';

class InventoryViewState {
    container: HTMLElement | null = null;
    loadedLocations: Location[] = [];
    loadedProducts: Product[] = [];
    selectedLocation: Location | null = null;
    selectedCounter: Counter | null = null;
    selectedArea: Area | null = null;
    currentPhase: InventoryPhase = 'start';
}

const state = new InventoryViewState();
import { calculateAreaConsumption, CalculatedConsumption } from '../../services/calculation.service';
import { exportService } from '../../services/export.service';

// Phase of inventory: 'start', 'end', or 'consumption'
type InventoryPhase = 'start' | 'end' | 'consumption';
let currentInventoryPhase: InventoryPhase = 'start'; /**
 * Initialisiert die Inventuransicht im angegebenen Container-Element.
 *
 * Lädt Standorte und Produkte aus der Datenbank, setzt die Grundstruktur der Benutzeroberfläche und rendert die Auswahlleiste für Standort, Tresen und Bereich. Zeigt eine Aufforderung an, bis alle erforderlichen Auswahlen getroffen wurden.
 *
 * @param container - Das HTML-Element, in dem die Inventuransicht angezeigt werden soll
 */

export async function initInventoryView(container: HTMLElement): Promise<void> {
    state.container = container;
    state.container.innerHTML = `
    inventoryViewContainer.innerHTML = `
        <section class="panel" aria-labelledby="inventory-main-title">
            <h2 id="inventory-main-title" class="panel-title">Inventuraufnahme</h2>
            <div id="inventory-selection-bar" class="flex space-x-4 mb-4 p-2 bg-gray-100 rounded items-center" role="toolbar" aria-label="Inventur Auswahl Steuerung"></div>
            <div id="inventory-table-container" aria-live="polite">
                <!-- Inventory table or consumption view will be rendered here -->
            </div>
            <div id="inventory-actions-bar" class="mt-4" role="toolbar" aria-label="Inventur Aktionen"></div>
        </section>
    `;

    // Load necessary data
    [state.loadedLocations, state.loadedProducts] = await Promise.all([
        dbService.loadLocations(),
        dbService.loadProducts()
    ]);

    renderSelectionBar();
    // Initially, no table is rendered until selections are made
    document.getElementById('inventory-table-container')!.innerHTML = "<p>Bitte Standort, Tresen und Bereich auswählen, um die Inventurliste anzuzeigen.</p>";
}

/**
 * Rendert die Auswahlleiste für Standort, Tresen, Bereich und Inventurphase.
 *
 * Aktualisiert die Dropdown-Menüs und Phasenumschalter entsprechend der aktuellen Auswahl und lädt das Inventar für den gewählten Bereich. Zeigt eine Hinweismeldung an, wenn noch keine vollständige Auswahl getroffen wurde.
 */
function renderSelectionBar(): void {
    const selectionBar = document.getElementById('inventory-selection-bar');
    if (!selectionBar) return;

    // Location Selector
    let locationOptions = '<option value="">Standort wählen...</option>';
    loadedLocations.forEach(loc => {
        locationOptions += `<option value="${loc.id}" ${selectedLocation?.id === loc.id ? 'selected' : ''}>${loc.name}</option>`;
    });

    // Counter Selector (depends on location)
    let counterOptions = '<option value="">Tresen wählen...</option>';
    if (selectedLocation) {
        selectedLocation.counters.forEach(counter => {
            counterOptions += `<option value="${counter.id}" ${selectedCounter?.id === counter.id ? 'selected' : ''}>${counter.name}</option>`;
        });
    }

    // Area Selector (depends on counter)
    let areaOptions = '<option value="">Bereich wählen...</option>';
    if (selectedCounter) {
        selectedCounter.areas.forEach(area => {
            areaOptions += `<option value="${area.id}" ${selectedArea?.id === area.id ? 'selected' : ''}>${area.name}</option>`;
        });
    }

    // Phase Toggle
    const phaseToggleHTML = `
        <div class="flex items-center" role="group" aria-label="Inventurphase auswählen">
            <span id="phase-label" class="mr-2 font-semibold">Ansicht:</span>
            <button id="phase-start-btn" class="btn btn-sm ${currentInventoryPhase === 'start' ? 'btn-primary' : 'btn-secondary'}" aria-pressed="${currentInventoryPhase === 'start'}" aria-labelledby="phase-label">Anfang</button>
            <button id="phase-end-btn" class="btn btn-sm ${currentInventoryPhase === 'end' ? 'btn-primary' : 'btn-secondary'} ml-2" aria-pressed="${currentInventoryPhase === 'end'}" aria-labelledby="phase-label">Ende</button>
            <button id="phase-consumption-btn" class="btn btn-sm ${currentInventoryPhase === 'consumption' ? 'btn-primary' : 'btn-secondary'} ml-2" aria-pressed="${currentInventoryPhase === 'consumption'}" aria-labelledby="phase-label">Verbrauch</button>
        </div>
    `;

    selectionBar.innerHTML = `
        <div>
            <label for="location-select-inv">Standort:</label>
            <select id="location-select-inv" class="form-control form-control-sm">${locationOptions}</select>
        </div>
        <div>
            <label for="counter-select-inv">Tresen:</label>
            <select id="counter-select-inv" class="form-control form-control-sm" ${!selectedLocation ? 'disabled aria-disabled="true"' : 'aria-disabled="false"'}>${counterOptions}</select>
        </div>
        <div>
            <label for="area-select-inv">Bereich:</label>
            <select id="area-select-inv" class="form-control form-control-sm" ${!selectedCounter ? 'disabled aria-disabled="true"' : 'aria-disabled="false"'}>${areaOptions}</select>
        </div>
        ${phaseToggleHTML}
    `;

    document.getElementById('location-select-inv')?.addEventListener('change', handleLocationChange);
    document.getElementById('counter-select-inv')?.addEventListener('change', handleCounterChange);
    document.getElementById('area-select-inv')?.addEventListener('change', handleAreaChange);

    document.getElementById('phase-start-btn')?.addEventListener('click', () => switchInventoryPhase('start'));
    document.getElementById('phase-end-btn')?.addEventListener('click', () => switchInventoryPhase('end'));
    document.getElementById('phase-consumption-btn')?.addEventListener('click', () => switchInventoryPhase('consumption'));

    // If an area is already selected, render its inventory table
    if (selectedArea) {
        renderInventoryTable();
    } else {
        document.getElementById('inventory-table-container')!.innerHTML = "<p>Bitte Standort, Tresen und Bereich auswählen.</p>";
        document.getElementById('inventory-actions-bar')!.innerHTML = "";
    }
}

/**
 * Wechselt die aktuelle Inventurphase und aktualisiert die Anzeige entsprechend.
 *
 * Aktualisiert die globale Phase, rendert die Auswahlleiste neu und zeigt die passende Inventurtabelle für den ausgewählten Bereich an.
 *
 * @param phase - Die zu aktivierende Inventurphase ('start', 'end' oder 'consumption')
 */
function switchInventoryPhase(phase: InventoryPhase): void {
    currentInventoryPhase = phase;
    renderSelectionBar(); // Re-render to update button styles
    if (selectedArea) {
        renderInventoryTable(); // Re-render table for the new phase
    }
}


/**
 * Behandelt die Änderung der Standortauswahl und setzt Tresen und Bereich zurück.
 *
 * Aktualisiert die ausgewählte Location basierend auf dem Event, setzt Tresen und Bereich zurück, rendert die Auswahlleiste neu und leert die Inventartabelle sowie die Aktionsleiste.
 */
async function handleLocationChange(event: Event): Promise<void> {
    const locationId = (event.target as HTMLSelectElement).value;
    selectedLocation = loadedLocations.find(loc => loc.id === locationId) || null;
    selectedCounter = null; // Reset counter and area
    selectedArea = null;
    renderSelectionBar(); // Re-render dependent dropdowns
    document.getElementById('inventory-table-container')!.innerHTML = "<p>Bitte Tresen und Bereich auswählen.</p>";
    document.getElementById('inventory-actions-bar')!.innerHTML = "";
}

/**
 * Behandelt Änderungen an der Thekenauswahl und aktualisiert die abhängigen UI-Elemente.
 *
 * Setzt den ausgewählten Bereich zurück, rendert die Auswahlleiste neu und leert die Inventartabelle sowie die Aktionsleiste.
 */
async function handleCounterChange(event: Event): Promise<void> {
    const counterId = (event.target as HTMLSelectElement).value;
    if (selectedLocation) {
        selectedCounter = selectedLocation.counters.find(c => c.id === counterId) || null;
    }
    selectedArea = null; // Reset area
    renderSelectionBar();
    document.getElementById('inventory-table-container')!.innerHTML = "<p>Bitte Bereich auswählen.</p>";
     document.getElementById('inventory-actions-bar')!.innerHTML = "";
}

/**
 * Behandelt die Änderung der Bereichsauswahl und aktualisiert die UI entsprechend.
 *
 * Wird ein Bereich ausgewählt, werden die Inventartabelle und die zugehörigen Aktionsschaltflächen angezeigt. Ist kein Bereich ausgewählt, werden die entsprechenden UI-Elemente geleert.
 */
async function handleAreaChange(event: Event): Promise<void> {
    const areaId = (event.target as HTMLSelectElement).value;
    if (selectedCounter) {
        selectedArea = selectedCounter.areas.find(a => a.id === areaId) || null;
    }
    renderSelectionBar(); // Update selection bar (though no direct visual change from area selection itself)
    if (selectedArea) {
        renderInventoryTable();
        renderInventoryActions();
    } else {
        document.getElementById('inventory-table-container')!.innerHTML = "<p>Kein Bereich ausgewählt.</p>";
        document.getElementById('inventory-actions-bar')!.innerHTML = "";
    }
}

/**
 * Rendert die Inventartabelle für den aktuell ausgewählten Bereich und die aktuelle Inventarphase.
 *
 * Zeigt entweder eine bearbeitbare Tabelle für die Phasen "Start" und "Ende" oder eine Verbrauchsübersicht für die Phase "Verbrauch" an. Falls kein Bereich ausgewählt ist, wird eine entsprechende Meldung angezeigt.
 */
function renderInventoryTable(): void {
    const tableContainer = document.getElementById('inventory-table-container');
    if (!tableContainer || !selectedArea) {
        if (tableContainer) tableContainer.innerHTML = "<p>Kein Bereich ausgewählt oder Bereich hat keine Produkte.</p>";
        return;
    }

    // Ensure all products in the catalog are represented in the current area's inventory list
    prepareInventoryItemsForArea();

    if (currentInventoryPhase === 'consumption') {
        renderConsumptionView(tableContainer, selectedArea);
    } else {
        renderEditableInventoryTable(tableContainer, selectedArea);
    }
}

/**
 * Ergänzt die Inventarpositionen des ausgewählten Bereichs um alle fehlenden Produkte und sortiert sie nach Kategorie und Name.
 *
 * Stellt sicher, dass für jedes geladene Produkt ein entsprechender Eintrag im Inventar des Bereichs existiert, und initialisiert fehlende Produkte mit Nullwerten.
 */
function prepareInventoryItemsForArea(): void {
    if (!selectedArea || !loadedProducts) return;

    loadedProducts.forEach(product => {
        if (!selectedArea!.inventoryItems.find(item => item.productId === product.id)) {
            selectedArea!.inventoryItems.push({
                productId: product.id,
                startCrates: 0, startBottles: 0, startOpenVolumeMl: 0,
                endCrates: 0, endBottles: 0, endOpenVolumeMl: 0,
            });
        }
    });
    selectedArea.inventoryItems.sort((a, b) => {
        const productA = loadedProducts.find(p => p.id === a.productId);
        const productB = loadedProducts.find(p => p.id === b.productId);
        if (!productA || !productB) return 0;
        if (productA.category.toLowerCase() < productB.category.toLowerCase()) return -1;
        if (productA.category.toLowerCase() > productB.category.toLowerCase()) return 1;
        return productA.name.toLowerCase() < productB.name.toLowerCase() ? -1 : 1;
    });
}

/**
     * Rendert eine bearbeitbare Inventurtabelle für den ausgewählten Bereich und die aktuelle Phase ('Schichtanfang' oder 'Schichtende').
     *
     * Die Tabelle enthält für jedes Produkt Eingabefelder für Kästen, Flaschen und offene Menge (ml). Felder sind deaktiviert, wenn keine Kasteninformation für das Produkt vorhanden ist. Nach dem Rendern werden Event-Listener für die Eingabefelder hinzugefügt.
     *
     * @param tableContainer - Das HTML-Element, in dem die Tabelle angezeigt wird
     * @param area - Der aktuell ausgewählte Bereich, dessen Inventurdaten bearbeitet werden sollen
     */
    function renderEditableInventoryTable(tableContainer: HTMLElement, area: Area): void {
    const phaseName = currentInventoryPhase === 'start' ? 'Schichtanfang' : 'Schichtende';
    const tableId = `inventory-table-${area.id.replace(/[^a-zA-Z0-9]/g, '')}`; // Create a unique ID for the table
    let tableHTML = `
        <h3 id="inventory-table-title" class="panel-subtitle">Inventur für: ${area.name} (${phaseName})</h3>
        <table id="${tableId}" class="table-fixed w-full inventory-table" aria-labelledby="inventory-table-title">
            <thead>
                <tr>
                    <th scope="col" class="w-2/5">Produkt</th>
                    <th scope="col" class="w-1/5 text-center">Kästen</th>
                    <th scope="col" class="w-1/5 text-center">Flaschen (einzeln)</th>
                    <th scope="col" class="w-1/5 text-center">Offen (ml)</th>
                </tr>
            </thead>
            <tbody>
    `;

    area.inventoryItems.forEach((item, index) => {
        const product = loadedProducts.find(p => p.id === item.productId);
        if (!product) return;

        const cratesKey = currentInventoryPhase === 'start' ? 'startCrates' : 'endCrates';
        const bottlesKey = currentInventoryPhase === 'start' ? 'startBottles' : 'endBottles';
        const openMlKey = currentInventoryPhase === 'start' ? 'startOpenVolumeMl' : 'endOpenVolumeMl';

        // Unique IDs for inputs for better label association if needed, though implicit association is often okay for tables
        const crateInputId = `${cratesKey}-${product.id}-${index}`;
        const bottleInputId = `${bottlesKey}-${product.id}-${index}`;
import { escapeHtml } from '../../utils/security';

const openMlInputId = `${openMlKey}-${product.id}-${index}`;

tableHTML += `
    <tr class="border-b inventory-item-row" data-product-id="${product.id}">
        <td class="px-4 py-2" role="rowheader">
            <span class="font-semibold">${escapeHtml(product.name)}</span><br>
            <small class="text-gray-600">${escapeHtml(product.category)} - ${product.volume}ml</small>
        </td>
`;
                <td class="px-4 py-2">
                    <label for="${crateInputId}" class="sr-only">Kästen für ${product.name}</label>
                    <input type="number" id="${crateInputId}" class="form-control form-control-sm text-center inventory-input" data-field="${cratesKey}" value="${item[cratesKey] || 0}" min="0" ${!product.itemsPerCrate ? 'disabled title="Keine Kasteninfo für Produkt"' : ''} aria-label="Kästen für ${product.name}">
                </td>
                <td class="px-4 py-2">
                    <label for="${bottleInputId}" class="sr-only">Flaschen für ${product.name}</label>
                    <input type="number" id="${bottleInputId}" class="form-control form-control-sm text-center inventory-input" data-field="${bottlesKey}" value="${item[bottlesKey] || 0}" min="0" aria-label="Flaschen für ${product.name}">
                </td>
                <td class="px-4 py-2">
                    <label for="${openMlInputId}" class="sr-only">Offen (ml) für ${product.name}</label>
                    <input type="number" id="${openMlInputId}" class="form-control form-control-sm text-center inventory-input" data-field="${openMlKey}" value="${item[openMlKey] || 0}" min="0" step="10" aria-label="Offen (ml) für ${product.name}">
                </td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    tableContainer.innerHTML = tableHTML;
    addInputEventListeners();
}

function renderConsumptionView(tableContainer: HTMLElement, area: Area): void {
    const consumptionData = calculateAreaConsumption(area.inventoryItems, loadedProducts);
    let totalCost = 0;

    let tableHTML = `
        <h3 class="panel-subtitle">Verbrauch für: ${area.name}</h3>
        <table class="table-fixed w-full consumption-table">
            <thead>
                <tr>
                    <th class="w-2/5">Produkt</th>
                    <th class="w-1/5 text-center">Verbrauch (Einheiten)</th>
                    <th class="w-1/5 text-center">Verbrauch (ml)</th>
                    <th class="w-1/5 text-center">Kosten (€)</th>
                </tr>
            </thead>
            <tbody>
    `;

    consumptionData.forEach(consump => {
        const product = loadedProducts.find(p => p.id === consump.productId);
        if (!product) return;
        totalCost += consump.costOfConsumption;

        tableHTML += `
            <tr class="border-b ${consump.consumedVolumeMl !== undefined && consump.consumedVolumeMl < 0 ? 'bg-red-100' : ''}">
                <td class="px-4 py-2">
                    <span class="font-semibold">${product.name}</span><br>
                    <small class="text-gray-600">${product.category} - ${product.volume}ml</small>
                    ${consump.notes && consump.notes.length > 0 ? `<br><small class="text-red-500">${consump.notes.join(', ')}</small>` : ''}
                </td>
                <td class="px-4 py-2 text-center">${consump.consumedUnits.toFixed(2)}</td>
                <td class="px-4 py-2 text-center">${consump.consumedVolumeMl !== undefined ? consump.consumedVolumeMl.toFixed(0) : 'N/A'}</td>
                <td class="px-4 py-2 text-center">${consump.costOfConsumption.toFixed(2)}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
            <tfoot>
                <tr class="border-t-2 font-bold">
                    <td colspan="3" class="px-4 py-2 text-right">Gesamtkosten:</td>
                    <td class="px-4 py-2 text-center">${totalCost.toFixed(2)} €</td>
                </tr>
            </tfoot>
        </table>
    `;
    tableContainer.innerHTML = tableHTML;
}


function addInputEventListeners(): void {
    document.querySelectorAll('.inventory-input').forEach(inputEl => {
        const debouncedHandler = debounce(handleInventoryInputChange, 300);
        inputEl.addEventListener('input', debouncedHandler);
        inputEl.addEventListener('focus', (e) => (e.target as HTMLInputElement).select());
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const allInputs = Array.from(document.querySelectorAll('.inventory-table .inventory-input:not([disabled])')) as HTMLInputElement[];
                const currentIndex = allInputs.indexOf(e.target as HTMLInputElement);
                if (currentIndex !== -1 && currentIndex < allInputs.length - 1) {
                    allInputs[currentIndex + 1].focus();
                } else if (currentIndex === allInputs.length - 1) {
                    document.getElementById('save-inventory-btn')?.focus();
                }
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const allRows = Array.from(document.querySelectorAll('.inventory-table .inventory-item-row')) as HTMLElement[];
                const currentRow = (e.target as HTMLInputElement).closest('.inventory-item-row') as HTMLElement;
                const currentInputIndexInRow = Array.from(currentRow.querySelectorAll('.inventory-input:not([disabled])')).indexOf(e.target as HTMLInputElement);
                let targetRowIndex = allRows.indexOf(currentRow);
                if (e.key === 'ArrowDown') targetRowIndex++;
                else if (e.key === 'ArrowUp') targetRowIndex--;
                if (targetRowIndex >= 0 && targetRowIndex < allRows.length) {
                    const targetInputs = Array.from(allRows[targetRowIndex].querySelectorAll('.inventory-input:not([disabled])')) as HTMLInputElement[];
                    if (targetInputs[currentInputIndexInRow]) {
                        targetInputs[currentInputIndexInRow].focus();
                    }
                }
            }
        });
    });
}


function renderInventoryActions(): void {
    const actionsContainer = document.getElementById('inventory-actions-bar');
    if (!actionsContainer) return;

    // Show save/fill buttons only if not in consumption view
    if (currentInventoryPhase === 'start' || currentInventoryPhase === 'end') {
        actionsContainer.innerHTML = `
            <button id="save-inventory-btn" class="btn btn-success">Inventur Speichern</button>
            <button id="fill-defaults-btn" class="btn btn-info ml-2">Alles voll (Standardwerte)</button>
        `;
        document.getElementById('save-inventory-btn')?.addEventListener('click', saveCurrentInventory);
        document.getElementById('fill-defaults-btn')?.addEventListener('click', fillDefaultValues);
    } else {
        // Consumption view might have different actions, like export
        actionsContainer.innerHTML = `<button id="export-consumption-btn" class="btn btn-secondary">Verbrauchsdaten Exportieren (CSV)</button>`;
        document.getElementById('export-consumption-btn')?.addEventListener('click', handleExportConsumptionCsv);
    }
}

function handleExportConsumptionCsv(): void {
    if (!selectedArea || !selectedLocation || !selectedCounter) {
        showToast("Kein Bereich ausgewählt für den Export.", "warning");
        return;
    }
    if (selectedArea.inventoryItems.length === 0) {
        showToast("Keine Inventurdaten in diesem Bereich zum Exportieren.", "info");
        return;
    }
    try {
        exportService.exportAreaInventoryToCsv(
            selectedArea,
            selectedLocation.name,
            selectedCounter.name,
            loadedProducts,
            true // includeConsumption is true by default, but explicit here
        );
        showToast("Verbrauchsdaten erfolgreich als CSV exportiert.", "success");
    } catch (error) {
        console.error("Fehler beim Exportieren der Verbrauchsdaten:", error);
        showToast("Fehler beim CSV-Export der Verbrauchsdaten.", "error");
    }
}


function fillDefaultValues(): void {
    if (!selectedArea || !loadedProducts) {
        showToast("Bitte zuerst einen Bereich auswählen.", "warning");
        return;
    }

    if (!confirm("Sollen alle Produkte in diesem Bereich auf 'voll' gesetzt werden? Bestehende Werte werden überschrieben.")) {
        return;
    }

    selectedArea.inventoryItems.forEach(item => {
        const product = loadedProducts.find(p => p.id === item.productId);
        if (!product) return;

        const cratesKey = currentInventoryPhase === 'start' ? 'startCrates' : 'endCrates';
        const bottlesKey = currentInventoryPhase === 'start' ? 'startBottles' : 'endBottles';
        const openMlKey = currentInventoryPhase === 'start' ? 'startOpenVolumeMl' : 'endOpenVolumeMl';

        // Logic for "full":
        // If itemsPerCrate is defined, one full crate, zero loose bottles, zero open.
        // Otherwise (or if itemsPerCrate is 0/undefined), assume one full bottle as default "full".
        if (product.itemsPerCrate && product.itemsPerCrate > 0) {
            item[cratesKey] = 1; // One full crate
            item[bottlesKey] = 0;
            item[openMlKey] = 0;
        } else {
            item[cratesKey] = 0;
            item[bottlesKey] = 1; // One full bottle
            item[openMlKey] = 0;
        }
    });

    renderInventoryTable(); // Re-render the table to show new values
    showToast("'Alles voll' für aktuellen Bereich und Phase angewendet.", "info");
    // Note: This only updates the UI and in-memory model. User still needs to click "Save Inventory".
}


/**
 * Aktualisiert das entsprechende Feld eines Inventaritems im ausgewählten Bereich basierend auf einer Benutzereingabe.
 *
 * Die Funktion übernimmt Werte aus einem Eingabefeld und weist sie dem passenden Produktfeld im Inventar des aktuellen Bereichs zu. Änderungen werden nur im Arbeitsspeicher vorgenommen und erst beim expliziten Speichern persistiert.
 */
function handleInventoryInputChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const rowElement = inputElement.closest('.inventory-item-row') as HTMLElement;
    const productId = rowElement.dataset.productId;
    const field = inputElement.dataset.field as keyof InventoryEntry; // e.g., 'startCrates'
    const value = parseFloat(inputElement.value) || 0;

    if (!selectedArea || !productId || !field) return;

    const inventoryItem = selectedArea.inventoryItems.find(item => item.productId === productId);
    if (inventoryItem) {
        if (inventoryItem) {
            // Ensure field is a numeric field before assignment
            if (field in inventoryItem && typeof inventoryItem[field] === 'number') {
                (inventoryItem as any)[field] = value;
            }
        }
        console.log(`Updated ${productId} - ${field} to ${value}`);
        // No immediate save to DB here; save happens on "Save Inventory" button click
        // This is to allow multiple changes before a transaction.
        // Mark location as having unsaved changes (for dbService.saveLocation)
        if(selectedLocation) {
            // A flag on selectedLocation or a global state could indicate unsaved changes.
            // For now, this is implicit.
        }
    }
}

/**
 * Speichert die aktuelle Inventur des ausgewählten Bereichs in der Datenbank.
 *
 * Zeigt eine Erfolgsmeldung bei erfolgreichem Speichern oder eine Fehlermeldung bei einem Fehler an.
 */
async function saveCurrentInventory(): Promise<void> {
    if (!selectedLocation || !selectedCounter || !selectedArea) {
        alert("Kein Bereich ausgewählt, um die Inventur zu speichern.");
        return;
    }
    // The `selectedArea.inventoryItems` are already updated in memory by `handleInventoryInputChange`.
    // We just need to save the `selectedLocation` object which contains the modified area.
    try {
        await dbService.saveLocation(selectedLocation);
        showToast(`Inventur für ${selectedArea.name} (${currentInventoryPhase === 'start' ? 'Anfang' : 'Ende'}) gespeichert!`, 'success');
    } catch (error) {
        console.error("Fehler beim Speichern der Inventur:", error);
        showToast("Fehler beim Speichern der Inventur.", 'error');
    }
}

// The focusNextInput logic was integrated into the keydown event listener directly.
// Removing the separate function as it's no longer called.
// function focusNextInput(currentInput: HTMLInputElement): void {
//     const allInputs = Array.from(document.querySelectorAll('.inventory-table .inventory-input:not([disabled])')) as HTMLInputElement[];
//     const currentIndex = allInputs.indexOf(currentInput);
//     if (currentIndex !== -1 && currentIndex < allInputs.length - 1) {
//         allInputs[currentIndex + 1].focus();
//         allInputs[currentIndex + 1].select(); // Select content for easy overwrite
//     } else if (currentIndex === allInputs.length -1) {
//         // Optionally, focus on a "Save" button or similar if it's the last input
//         document.getElementById('save-inventory-btn')?.focus();
//     }
// }

console.log("Inventory View UI component loaded.");
