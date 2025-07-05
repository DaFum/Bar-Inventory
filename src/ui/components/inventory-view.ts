import { dbService } from '../../services/indexeddb.service';
import { Location, Product, InventoryEntry, Area, Counter } from '../../models';
import { generateId, debounce } from '../../utils/helpers';
import { showToast } from './toast-notifications';
import { calculateAreaConsumption, CalculatedConsumption } from '../../services/calculation.service';
import { exportService } from '../../services/export.service';
import { escapeHtml } from '../../utils/security';

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

// Phase of inventory: 'start', 'end', or 'consumption'
type InventoryPhase = 'start' | 'end' | 'consumption';

/**
 * Initialisiert die Inventuransicht im angegebenen Container-Element.
 *
 * Lädt Standorte und Produkte aus der Datenbank, richtet die Benutzeroberfläche mit Auswahlleiste, Tabellenbereich und Aktionsleiste ein und zeigt eine Aufforderung an, bis Standort, Tresen und Bereich ausgewählt wurden.
 *
 * @param container - Das HTML-Element, in dem die Inventuransicht angezeigt werden soll
 */
export async function initInventoryView(container: HTMLElement): Promise<void> {
    state.container = container;
    state.container.innerHTML = `
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
 * Aktualisiert die Dropdown-Menüs und Umschaltknöpfe entsprechend der aktuellen Auswahl im Zustand. Zeigt eine Hinweismeldung an, wenn Standort, Tresen oder Bereich noch nicht vollständig ausgewählt wurden. Bei vollständiger Auswahl wird die Inventartabelle für den gewählten Bereich und die aktuelle Inventurphase angezeigt.
 */
function renderSelectionBar(): void {
    const selectionBar = document.getElementById('inventory-selection-bar');
    if (!selectionBar) return;

    // Location Selector
    let locationOptions = '<option value="">Standort wählen...</option>';
    state.loadedLocations.forEach(loc => {
        locationOptions += `<option value="${loc.id}" ${state.selectedLocation?.id === loc.id ? 'selected' : ''}>${escapeHtml(loc.name)}</option>`;
    });

    // Counter Selector (depends on location)
    let counterOptions = '<option value="">Tresen wählen...</option>';
    if (state.selectedLocation) {
state.selectedLocation.counters.forEach(counter => {
    counterOptions += `<option value="${escapeHtml(counter.id)}" ${state.selectedCounter?.id === counter.id ? 'selected' : ''}>${escapeHtml(counter.name)}</option>`;
});
    }

    // Area Selector (depends on counter)
    let areaOptions = '<option value="">Bereich wählen...</option>';
    if (state.selectedCounter) {
        state.selectedCounter.areas.forEach(area => {
            areaOptions += `<option value="${escapeHtml(area.id)}" ${state.selectedArea?.id === area.id ? 'selected' : ''}>${escapeHtml(area.name)}</option>`;
        });
    }

    // Phase Toggle
    const phaseToggleHTML = `
        <div class="flex items-center" role="group" aria-label="Inventurphase auswählen">
            <span id="phase-label" class="mr-2 font-semibold">Ansicht:</span>
            <button id="phase-start-btn" class="btn btn-sm ${state.currentPhase === 'start' ? 'btn-primary' : 'btn-secondary'}" aria-pressed="${state.currentPhase === 'start'}" aria-labelledby="phase-label">Anfang</button>
            <button id="phase-end-btn" class="btn btn-sm ${state.currentPhase === 'end' ? 'btn-primary' : 'btn-secondary'} ml-2" aria-pressed="${state.currentPhase === 'end'}" aria-labelledby="phase-label">Ende</button>
            <button id="phase-consumption-btn" class="btn btn-sm ${state.currentPhase === 'consumption' ? 'btn-primary' : 'btn-secondary'} ml-2" aria-pressed="${state.currentPhase === 'consumption'}" aria-labelledby="phase-label">Verbrauch</button>
        </div>
    `;

    selectionBar.innerHTML = `
        <div>
            <label for="location-select-inv">Standort:</label>
            <select id="location-select-inv" class="form-control form-control-sm">${locationOptions}</select>
        </div>
        <div>
            <label for="counter-select-inv">Tresen:</label>
            <select id="counter-select-inv" class="form-control form-control-sm" ${!state.selectedLocation ? 'disabled aria-disabled="true"' : 'aria-disabled="false"'}>${counterOptions}</select>
        </div>
        <div>
            <label for="area-select-inv">Bereich:</label>
            <select id="area-select-inv" class="form-control form-control-sm" ${!state.selectedCounter ? 'disabled aria-disabled="true"' : 'aria-disabled="false"'}>${areaOptions}</select>
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
    if (state.selectedArea) {
        renderInventoryTable();
    } else {
        document.getElementById('inventory-table-container')!.innerHTML = "<p>Bitte Standort, Tresen und Bereich auswählen.</p>";
        document.getElementById('inventory-actions-bar')!.innerHTML = "";
    }
}

/**
 * Wechselt die aktuelle Inventurphase und aktualisiert die Anzeige für den gewählten Bereich.
 *
 * Die Auswahlleiste wird neu gerendert, und falls ein Bereich ausgewählt ist, wird die Inventurtabelle für die neue Phase angezeigt.
 *
 * @param phase - Die zu setzende Inventurphase ('start', 'end' oder 'consumption')
 */
function switchInventoryPhase(phase: InventoryPhase): void {
    state.currentPhase = phase;
    renderSelectionBar(); // Re-render to update button styles
    if (state.selectedArea) {
        renderInventoryTable(); // Re-render table for the new phase
        renderInventoryActions(); // Also re-render actions for the new phase
    }
}


/**
 * Behandelt die Änderung der Standortauswahl und setzt Tresen sowie Bereich zurück.
 *
 * Aktualisiert die ausgewählte Location entsprechend der Benutzerauswahl, setzt Tresen und Bereich auf null, rendert die Auswahlleiste neu und leert die Inventartabelle sowie die Aktionsleiste.
 */
async function handleLocationChange(event: Event): Promise<void> {
    const locationId = (event.target as HTMLSelectElement).value;
    state.selectedLocation = state.loadedLocations.find(loc => loc.id === locationId) || null;
    state.selectedCounter = null; // Reset counter and area
    state.selectedArea = null;
    renderSelectionBar(); // Re-render dependent dropdowns
    document.getElementById('inventory-table-container')!.innerHTML = "<p>Bitte Tresen und Bereich auswählen.</p>";
    document.getElementById('inventory-actions-bar')!.innerHTML = "";
}

/**
 * Behandelt die Änderung der Thekenauswahl und setzt den ausgewählten Bereich zurück.
 *
 * Aktualisiert die Auswahlleiste und leert die Inventartabelle sowie die Aktionsleiste, bis ein Bereich ausgewählt wurde.
 */
async function handleCounterChange(event: Event): Promise<void> {
    const counterId = (event.target as HTMLSelectElement).value;
    if (state.selectedLocation) {
        state.selectedCounter = state.selectedLocation.counters.find(c => c.id === counterId) || null;
    }
    state.selectedArea = null; // Reset area
    renderSelectionBar();
    document.getElementById('inventory-table-container')!.innerHTML = "<p>Bitte Bereich auswählen.</p>";
     document.getElementById('inventory-actions-bar')!.innerHTML = "";
}

/**
 * Behandelt die Änderung der Bereichsauswahl und aktualisiert die Inventartabelle sowie die Aktionsleiste entsprechend.
 *
 * Nach Auswahl eines Bereichs werden die zugehörige Inventartabelle und die passenden Aktionsschaltflächen angezeigt. Ist kein Bereich ausgewählt, werden diese UI-Elemente geleert.
 */
async function handleAreaChange(event: Event): Promise<void> {
    const areaId = (event.target as HTMLSelectElement).value;
    if (state.selectedCounter) {
        state.selectedArea = state.selectedCounter.areas.find(a => a.id === areaId) || null;
    }
    renderSelectionBar(); // Update selection bar (though no direct visual change from area selection itself)
    if (state.selectedArea) {
        renderInventoryTable();
        renderInventoryActions();
    } else {
        document.getElementById('inventory-table-container')!.innerHTML = "<p>Kein Bereich ausgewählt.</p>";
        document.getElementById('inventory-actions-bar')!.innerHTML = "";
    }
}

/**
 * Rendert die Inventartabelle oder Verbrauchsübersicht für den aktuell ausgewählten Bereich und die aktive Inventarphase.
 *
 * Zeigt eine bearbeitbare Tabelle für die Phasen "Start" und "Ende" oder eine Verbrauchsübersicht für die Phase "Verbrauch" an. Ist kein Bereich ausgewählt oder sind keine Produkte vorhanden, wird eine Hinweismeldung angezeigt.
 */
function renderInventoryTable(): void {
    const tableContainer = document.getElementById('inventory-table-container');
    if (!tableContainer || !state.selectedArea) {
        if (tableContainer) tableContainer.innerHTML = "<p>Kein Bereich ausgewählt oder Bereich hat keine Produkte.</p>";
        return;
    }

    // Ensure all products in the catalog are represented in the current area's inventory list
    prepareInventoryItemsForArea();

    if (state.currentPhase === 'consumption') {
        renderConsumptionView(tableContainer, state.selectedArea);
    } else {
        renderEditableInventoryTable(tableContainer, state.selectedArea);
    }
}

/**
 * Ergänzt das Inventar des ausgewählten Bereichs um alle fehlenden Produkte und sortiert die Inventarpositionen alphabetisch nach Kategorie und Produktname.
 *
 * Für jedes geladene Produkt wird ein Inventareintrag im aktuellen Bereich angelegt, falls dieser noch nicht existiert. Fehlende Einträge werden mit Nullwerten initialisiert. Anschließend werden alle Inventarpositionen nach Kategorie und Name sortiert.
 */
function prepareInventoryItemsForArea(): void {
    if (!state.selectedArea || !state.loadedProducts) return;

    state.loadedProducts.forEach(product => {
        if (!state.selectedArea!.inventoryItems.find(item => item.productId === product.id)) {
            state.selectedArea!.inventoryItems.push({
                productId: product.id,
                startCrates: 0, startBottles: 0, startOpenVolumeMl: 0,
                endCrates: 0, endBottles: 0, endOpenVolumeMl: 0,
            });
        }
    });
    state.selectedArea.inventoryItems.sort((a, b) => {
        const productA = state.loadedProducts.find(p => p.id === a.productId);
        const productB = state.loadedProducts.find(p => p.id === b.productId);
        if (!productA || !productB) return 0;
        if (productA.category.toLowerCase() < productB.category.toLowerCase()) return -1;
        if (productA.category.toLowerCase() > productB.category.toLowerCase()) return 1;
        return productA.name.toLowerCase() < productB.name.toLowerCase() ? -1 : 1;
    });
}

/**
     * Rendert eine bearbeitbare Inventurtabelle für den ausgewählten Bereich und die aktuelle Inventurphase.
     *
     * Für jedes Produkt im Bereich werden Eingabefelder für Kästen, Flaschen und offene Menge (ml) angezeigt. Die Eingabe für Kästen ist deaktiviert, wenn das Produkt keine Kasteninformation besitzt. Nach dem Rendern werden Event-Listener hinzugefügt, um Benutzereingaben zu erfassen und die Navigation per Tastatur zu ermöglichen.
     *
     * @param tableContainer - Das HTML-Element, in dem die Tabelle angezeigt wird
     * @param area - Der aktuell ausgewählte Bereich, dessen Inventurdaten bearbeitet werden
     */
    function renderEditableInventoryTable(tableContainer: HTMLElement, area: Area): void {
    const phaseName = state.currentPhase === 'start' ? 'Schichtanfang' : 'Schichtende';
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
        const product = state.loadedProducts.find(p => p.id === item.productId);
        if (!product) return;

        const cratesKey = state.currentPhase === 'start' ? 'startCrates' : 'endCrates';
        const bottlesKey = state.currentPhase === 'start' ? 'startBottles' : 'endBottles';
        const openMlKey = state.currentPhase === 'start' ? 'startOpenVolumeMl' : 'endOpenVolumeMl';

        // Unique IDs for inputs for better label association if needed, though implicit association is often okay for tables
        const crateInputId = `${cratesKey}-${product.id}-${index}`;
        const bottleInputId = `${bottlesKey}-${product.id}-${index}`;
        const openMlInputId = `${openMlKey}-${product.id}-${index}`;

        tableHTML += `
    <tr class="border-b inventory-item-row" data-product-id="${product.id}">
        <td class="px-4 py-2" role="rowheader">
            <span class="font-semibold">${escapeHtml(product.name)}</span><br>
            <small class="text-gray-600">${escapeHtml(product.category)} - ${product.volume}ml</small>
        </td>
        <td class="px-4 py-2">
            <label for="${crateInputId}" class="sr-only">Kästen für ${escapeHtml(product.name)}</label>
            <input type="number" id="${crateInputId}" class="form-control form-control-sm text-center inventory-input" data-field="${cratesKey}" value="${item[cratesKey] || 0}" min="0" ${!product.itemsPerCrate ? 'disabled title="Keine Kasteninfo für Produkt"' : ''} aria-label="Kästen für ${escapeHtml(product.name)}">
        </td>
        <td class="px-4 py-2">
            <label for="${bottleInputId}" class="sr-only">Flaschen für ${escapeHtml(product.name)}</label>
            <input type="number" id="${bottleInputId}" class="form-control form-control-sm text-center inventory-input" data-field="${bottlesKey}" value="${item[bottlesKey] || 0}" min="0" aria-label="Flaschen für ${escapeHtml(product.name)}">
        </td>
        <td class="px-4 py-2">
            <label for="${openMlInputId}" class="sr-only">Offen (ml) für ${escapeHtml(product.name)}</label>
            <input type="number" id="${openMlInputId}" class="form-control form-control-sm text-center inventory-input" data-field="${openMlKey}" value="${item[openMlKey] || 0}" min="0" step="10" aria-label="Offen (ml) für ${escapeHtml(product.name)}">
        </td>
    </tr>
        `; // End of row
    });

    tableHTML += `</tbody></table>`;
    tableContainer.innerHTML = tableHTML;
    addInputEventListeners();
}

function renderConsumptionView(tableContainer: HTMLElement, area: Area): void {
    const consumptionData = calculateAreaConsumption(area.inventoryItems, state.loadedProducts);
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
        const product = state.loadedProducts.find(p => p.id === consump.productId);
        if (!product) return;
        totalCost += consump.costOfConsumption;

        tableHTML += `
            <tr class="border-b ${consump.consumedVolumeMl !== undefined && consump.consumedVolumeMl < 0 ? 'bg-red-100' : ''}">
                <td class="px-4 py-2">
-                    <span class="font-semibold">${product.name}</span><br>
-                    <small class="text-gray-600">${product.category} - ${product.volume}ml</small>
+                    <span class="font-semibold">${escapeHtml(product.name)}</span><br>
+                    <small class="text-gray-600">${escapeHtml(product.category)} - ${product.volume}ml</small>
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
        inputEl.addEventListener('keydown', (e: Event) => { // Type e as KeyboardEvent
            const keyboardEvent = e as KeyboardEvent;
            if (keyboardEvent.key === 'Enter') {
                e.preventDefault();
                const allInputs = Array.from(document.querySelectorAll('.inventory-table .inventory-input:not([disabled])')) as HTMLInputElement[];
                const currentIndex = allInputs.indexOf(e.target as HTMLInputElement);
                if (currentIndex !== -1 && currentIndex < allInputs.length - 1) {
                    allInputs[currentIndex + 1]?.focus(); // Add null check
                } else if (currentIndex === allInputs.length - 1) {
                    document.getElementById('save-inventory-btn')?.focus();
                }
            } else if (keyboardEvent.key === 'ArrowDown' || keyboardEvent.key === 'ArrowUp') {
                e.preventDefault();
                const allRows = Array.from(document.querySelectorAll('.inventory-table .inventory-item-row')) as HTMLElement[];
                const currentRow = (e.target as HTMLInputElement).closest('.inventory-item-row') as HTMLElement;
                const currentInputIndexInRow = Array.from(currentRow.querySelectorAll('.inventory-input:not([disabled])')).indexOf(e.target as HTMLInputElement);
                let targetRowIndex = allRows.indexOf(currentRow);
                if (keyboardEvent.key === 'ArrowDown') targetRowIndex++;
                else if (keyboardEvent.key === 'ArrowUp') targetRowIndex--;

                if (targetRowIndex >= 0 && targetRowIndex < allRows.length) {
                    const targetRowElement = allRows[targetRowIndex];
                    if (targetRowElement) {
                        const targetInputs = Array.from(targetRowElement.querySelectorAll('.inventory-input:not([disabled])')) as HTMLInputElement[];
                        if (targetInputs[currentInputIndexInRow]) {
                            targetInputs[currentInputIndexInRow]?.focus(); // Add null check
                        }
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
    if (state.currentPhase === 'start' || state.currentPhase === 'end') {
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
    if (!state.selectedArea || !state.selectedLocation || !state.selectedCounter) {
        showToast("Kein Bereich ausgewählt für den Export.", "warning");
        return;
    }
    if (state.selectedArea.inventoryItems.length === 0) {
        showToast("Keine Inventurdaten in diesem Bereich zum Exportieren.", "info");
        return;
    }
    try {
        exportService.exportAreaInventoryToCsv(
            state.selectedArea,
            state.selectedLocation.name,
            state.selectedCounter.name,
            state.loadedProducts,
            true // includeConsumption is true by default, but explicit here
        );
        showToast("Verbrauchsdaten erfolgreich als CSV exportiert.", "success");
    } catch (error) {
        console.error("Fehler beim Exportieren der Verbrauchsdaten:", error);
        showToast("Fehler beim CSV-Export der Verbrauchsdaten.", "error");
    }
}


function fillDefaultValues(): void {
    if (!state.selectedArea || !state.loadedProducts) {
        showToast("Bitte zuerst einen Bereich auswählen.", "warning");
        return;
    }

    if (!confirm("Sollen alle Produkte in diesem Bereich auf 'voll' gesetzt werden? Bestehende Werte werden überschrieben.")) {
        return;
    }

    state.selectedArea.inventoryItems.forEach(item => {
        const product = state.loadedProducts.find(p => p.id === item.productId);
        if (!product) return;

        const cratesKey = state.currentPhase === 'start' ? 'startCrates' : 'endCrates';
        const bottlesKey = state.currentPhase === 'start' ? 'startBottles' : 'endBottles';
        const openMlKey = state.currentPhase === 'start' ? 'startOpenVolumeMl' : 'endOpenVolumeMl';

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
             * Verarbeitet eine Benutzereingabe und aktualisiert das entsprechende numerische Feld eines Inventaritems im aktuell ausgewählten Bereich.
             *
             * Änderungen werden nur im Arbeitsspeicher vorgenommen und erst beim expliziten Speichern dauerhaft übernommen.
             */
function handleInventoryInputChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const rowElement = inputElement.closest('.inventory-item-row') as HTMLElement;
    const productId = rowElement.dataset.productId;
    const field = inputElement.dataset.field as keyof InventoryEntry; // e.g., 'startCrates'
    const value = parseFloat(inputElement.value) || 0;

    if (!state.selectedArea || !productId || !field) return;

    const inventoryItem = state.selectedArea.inventoryItems.find(item => item.productId === productId);
    if (inventoryItem) {
        // Ensure field is a numeric field before assignment
        if (field in inventoryItem && typeof inventoryItem[field] === 'number') {
            (inventoryItem[field as keyof InventoryEntry] as number) = value;
        }
        // Note: The comments about marking unsaved changes were here,
        // but seemed misplaced due to the syntax error.
        // Proper unsaved changes tracking should be implemented if needed.
    }
}

/**
 * Speichert die aktuelle Inventur des ausgewählten Bereichs und der aktuellen Phase dauerhaft in der Datenbank.
 *
 * Zeigt eine Erfolgsmeldung bei erfolgreichem Speichern oder eine Fehlermeldung bei einem Fehler an. Änderungen an der Inventur werden erst nach dem Speichern übernommen.
 */
async function saveCurrentInventory(): Promise<void> {
    if (!state.selectedLocation || !state.selectedCounter || !state.selectedArea) {
        alert("Kein Bereich ausgewählt, um die Inventur zu speichern.");
        return;
    }
    // The `state.selectedArea.inventoryItems` are already updated in memory by `handleInventoryInputChange`.
    // We just need to save the `state.selectedLocation` object which contains the modified area.
    try {
        await dbService.saveLocation(state.selectedLocation);
        showToast(`Inventur für ${state.selectedArea.name} (${state.currentPhase === 'start' ? 'Anfang' : 'Ende'}) gespeichert!`, 'success');
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
