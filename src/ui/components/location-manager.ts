import { dbService } from '../../services/indexeddb.service';
import { Location, Counter, Area } from '../../models';
import { generateId } from '../../utils/helpers';
import { exportService } from '../../services/export.service';
import { showToast } from './toast-notifications';

// Store loaded locations in memory to avoid constant DB reads for UI rendering
class LocationManagerState {
    loadedLocations: Location[] = [];
    currentEditingLocation: Location | null = null;
    currentEditingCounter: Counter | null = null;
    currentEditingArea: Area | null = null;
    locationManagerContainer: HTMLElement | null = null;
}

const state = new LocationManagerState();

/**
 * Initialisiert die Standortverwaltung und rendert die Benutzeroberfläche im angegebenen Container.
 *
 * Lädt vorhandene Standorte, zeigt sie als Liste an und richtet Event-Handler für das Hinzufügen neuer Standorte sowie den Export aller Standorte als JSON ein.
 *
 * @param container - Das HTML-Element, in dem die Standortverwaltung angezeigt werden soll.
 */
export async function initLocationManager(container: HTMLElement): Promise<void> {
    locationManagerContainer = container;
    locationManagerContainer.innerHTML = `
        <section class="panel" aria-labelledby="location-manager-title">
            <h2 id="location-manager-title" class="panel-title">Standortverwaltung</h2>
            <div id="location-list-container" aria-live="polite"></div>
            <button id="add-new-location-btn" class="btn btn-primary" aria-label="Neuen Standort hinzufügen">Neuen Standort hinzufügen</button>
        </section>
        <section id="location-details-container" class="panel mt-4" style="display: none;" aria-labelledby="location-details-title" aria-live="polite">
            <!-- Details for selected location, counters, and areas will be rendered here -->
        </div>
    `;
    await loadAndRenderLocations();

    document.getElementById('add-new-location-btn')?.addEventListener('click', () => {
        renderLocationForm();
    });

    // Add general export button for all locations structure (JSON)
    // This could be placed more globally, but for now, it's here.
    const panelFooter = `<div class="panel-footer mt-4 panel p-2">
                            <button id="export-all-locations-json-btn" class="btn btn-info">Alle Standorte (Struktur) als JSON exportieren</button>
                         </div>`;
    locationManagerContainer.insertAdjacentHTML('beforeend', panelFooter);
    document.getElementById('export-all-locations-json-btn')?.addEventListener('click', handleExportAllLocationsJson);
}

/**
 * Exportiert alle geladenen Standorte als JSON-Datei.
 *
 * Zeigt eine Information, falls keine Standorte vorhanden sind. Bei Erfolg wird eine JSON-Datei mit allen Standorten und dem Exportdatum zum Download angeboten. Im Fehlerfall wird eine Fehlermeldung angezeigt.
 */
async function handleExportAllLocationsJson() {
    if (loadedLocations.length === 0) {
        showToast("Keine Standorte zum Exportieren vorhanden.", "info");
        return;
    }
    try {
        const dataToExport = {
            exportDate: new Date().toISOString(),
            locations: loadedLocations
        };
        const jsonContent = JSON.stringify(dataToExport, null, 2);
        triggerDownload(jsonContent, 'alle_standorte_export.json', 'application/json;charset=utf-8;');
        showToast(`${loadedLocations.length} Standort(e) erfolgreich als JSON exportiert.`, "success");
    } catch (error) {
        console.error("Fehler beim Exportieren aller Standorte:", error);
        showToast("Fehler beim JSON-Export aller Standorte.", "error");
    }
}


/**
 * Lädt alle Standorte aus der Datenbank und aktualisiert die Anzeige der Standortliste im UI.
 */
async function loadAndRenderLocations(): Promise<void> {
    state.loadedLocations = await dbService.loadLocations();
    renderLocationList();
}

/**
         * Rendert die Liste aller geladenen Standorte im UI.
         *
         * Zeigt eine Hinweismeldung an, wenn keine Standorte vorhanden sind. Für jeden Standort werden Name sowie Bearbeiten- und Löschen-Schaltflächen angezeigt.
         */
        function renderLocationList(): void {
    const listContainer = document.getElementById('location-list-container');
    if (!listContainer) return;

    if (loadedLocations.length === 0) {
        listContainer.innerHTML = '<p>Noch keine Standorte erfasst. Fügen Sie einen neuen Standort hinzu.</p>';
        return;
    }

    listContainer.innerHTML = `
        <ul class="list-group" aria-label="Liste der Standorte">
// Add this helper at the top of the file (or in a shared utils module)
function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

listContainer.innerHTML = `
    <ul class="list-group" aria-label="Liste der Standorte">
        ${loadedLocations.map(loc => `
            <li class="list-group-item">
                <span id="loc-name-${loc.id}">${escapeHtml(loc.name)}</span>
                <div>
                    <button
                        class="btn btn-sm btn-secondary edit-location-btn"
                        data-id="${loc.id}"
                        aria-label="Standort ${escapeHtml(loc.name)} bearbeiten">
                        Bearbeiten
                    </button>
                    <button
                        class="btn btn-sm btn-danger delete-location-btn"
                        data-id="${loc.id}"
                        aria-label="Standort ${escapeHtml(loc.name)} löschen">
                        Löschen
                    </button>
                </div>
            </li>
        `).join('')}
    </ul>
`;
    `;

    document.querySelectorAll('.edit-location-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetButton = e.target as HTMLElement;
            const locationId = targetButton.dataset.id;
            if (locationId) {
                currentEditingLocation = loadedLocations.find(loc => loc.id === locationId) || null;
                if (currentEditingLocation) {
                    renderLocationDetails(currentEditingLocation);
                    // Focus on the first interactive element in the details form/view
                    setTimeout(() => document.getElementById('edit-this-location-btn')?.focus(), 0);
                }
            }
        });
    });

    document.querySelectorAll('.delete-location-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const targetButton = e.target as HTMLElement;
            const locationId = targetButton.dataset.id;
            const locationName = loadedLocations.find(loc => loc.id === locationId)?.name || 'Unbekannter Standort';
            if (locationId && confirm(`Standort "${locationName}" wirklich löschen? Alle zugehörigen Tresen und Bereiche werden ebenfalls entfernt.`)) {
                await dbService.delete('locations', locationId);
                await loadAndRenderLocations(); // Refresh list
                document.getElementById('location-details-container')!.style.display = 'none'; // Hide details
                showToast(`Standort "${locationName}" gelöscht.`, 'success');
                 setTimeout(() => document.getElementById('add-new-location-btn')?.focus(), 0); // Focus back
            }
        });
    });
}

/**
 * Zeigt ein Formular zum Erstellen oder Bearbeiten eines Standorts an.
 *
 * Wenn ein bestehender Standort übergeben wird, werden die Felder vorausgefüllt und die Verwaltung der zugehörigen Zähler ermöglicht. Nach dem Speichern oder Erstellen wird die Standortliste aktualisiert und ggf. die Detailansicht für die weitere Bearbeitung angezeigt.
 *
 * @param location - Optional. Der zu bearbeitende Standort. Wenn nicht angegeben, wird ein neuer Standort angelegt.
 */
function renderLocationForm(location?: Location): void {
    const detailsContainer = document.getElementById('location-details-container');
    if (!detailsContainer) return;

    currentEditingLocation = location || null;
    const formTitleId = "location-form-title";
    detailsContainer.innerHTML = `
        <h3 id="${formTitleId}" class="panel-subtitle">${location ? 'Standort bearbeiten' : 'Neuen Standort erstellen'}</h3>
        <form id="location-form" aria-labelledby="${formTitleId}">
            <div class="form-group">
                <label for="location-name">Name des Standorts:</label>
                <input type="text" id="location-name" value="${location?.name || ''}" required class="form-control" aria-required="true">
            </div>
            <div class="form-group">
                <label for="location-address">Adresse (optional):</label>
                <input type="text" id="location-address" value="${location?.address || ''}" class="form-control">
            </div>
            <button type="submit" class="btn btn-success">${location ? 'Änderungen speichern' : 'Standort erstellen'}</button>
            <button type="button" id="cancel-location-edit" class="btn btn-secondary">Abbrechen</button>
        </form>
        <div id="counters-management-container" class="mt-4" style="display: ${location ? 'block' : 'none'};">
            <!-- Counters will be managed here -->
        </div>
    `;
    detailsContainer.style.display = 'block';

    document.getElementById('location-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = (document.getElementById('location-name') as HTMLInputElement).value;
        const address = (document.getElementById('location-address') as HTMLInputElement).value;

        if (currentEditingLocation) { // Editing existing location
            currentEditingLocation.name = name;
            currentEditingLocation.address = address;
            await dbService.saveLocation(currentEditingLocation);
        } else { // Creating new location
            const newLocation: Location = {
                id: generateId('loc'),
                name,
                address,
                counters: []
            };
            await dbService.saveLocation(newLocation);
            currentEditingLocation = newLocation; // Set for counter management
        }
        await loadAndRenderLocations(); // Refresh list
        if (currentEditingLocation) { // If we just created or saved, re-render details for counter management
            renderLocationDetails(currentEditingLocation);
        } else {
             detailsContainer.style.display = 'none';
        }
    });

    document.getElementById('cancel-location-edit')?.addEventListener('click', () => {
        detailsContainer.style.display = 'none';
        currentEditingLocation = null;
    });

    if (location) {
        renderCountersManagement(location);
    }
}


/**
 * Zeigt die Detailansicht eines Standorts an, einschließlich Adresse und zugehöriger Zähler.
 *
 * Die Ansicht ermöglicht das Bearbeiten der Stammdaten sowie das Verwalten der Zähler des Standorts.
 */
function renderLocationDetails(location: Location): void {
    currentEditingLocation = location;
    const detailsContainer = document.getElementById('location-details-container');
    if (!detailsContainer) return;

    detailsContainer.innerHTML = `
        <div class="flex justify-between items-center">
            <h3 class="panel-subtitle">Details für: ${location.name}</h3>
            <button id="edit-this-location-btn" class="btn btn-sm btn-info">Stammdaten bearbeiten</button>
        </div>
        <p>Adresse: ${location.address || 'N/A'}</p>
        <hr class="my-2">
        <div id="counters-management-container">
            <!-- Counters will be managed here -->
        </div>
         <button type="button" id="close-location-details" class="btn btn-light-grey mt-4">Schließen</button>
    `;
    detailsContainer.style.display = 'block';

    document.getElementById('edit-this-location-btn')?.addEventListener('click', () => {
        renderLocationForm(location);
    });

    document.getElementById('close-location-details')?.addEventListener('click', () => {
        detailsContainer.style.display = 'none';
        currentEditingLocation = null;
    });

    renderCountersManagement(location);
}

/**
 * Rendert die Verwaltung der Tresen (Counter) für einen bestimmten Standort im UI.
 *
 * Zeigt eine Liste aller Tresen des Standorts mit Optionen zum Bearbeiten, Löschen und Hinzufügen neuer Tresen. Ermöglicht das Öffnen von Formularen zur Tresenbearbeitung sowie die Verwaltung der zugehörigen Bereiche. Änderungen werden direkt im persistenten Speicher aktualisiert.
 *
 * @param location - Der Standort, dessen Tresen verwaltet werden sollen
 */
function renderCountersManagement(location: Location): void {
    const countersContainer = document.getElementById('counters-management-container');
    if (!countersContainer) return;

    countersContainer.innerHTML = `
        <h4>Tresen für ${location.name}</h4>
        <div id="counter-list">
            ${location.counters.map(counter => `
                <div class="list-group-item nested">
                    <span>${counter.name}</span>
                    <div>
                        <button class="btn btn-xs btn-secondary edit-counter-btn" data-id="${counter.id}">Tresen bearbeiten/Bereiche</button>
                        <button class="btn btn-xs btn-danger delete-counter-btn" data-id="${counter.id}">Tresen löschen</button>
                    </div>
                </div>
            `).join('') || '<p>Noch keine Tresen für diesen Standort erfasst.</p>'}
        </div>
        <button id="add-new-counter-btn" class="btn btn-primary btn-sm mt-2">Neuen Tresen hinzufügen</button>
        <div id="counter-form-container" class="mt-2" style="display: none;"></div>
        <div id="area-management-container" class="mt-3" style="display: none;"></div>
    `;

    document.getElementById('add-new-counter-btn')?.addEventListener('click', () => {
        renderCounterForm(location);
    });

    document.querySelectorAll('.edit-counter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const counterId = (e.target as HTMLElement).dataset.id;
            currentEditingCounter = location.counters.find(c => c.id === counterId) || null;
            if (currentEditingCounter) {
                renderCounterForm(location, currentEditingCounter); // Show form for editing
                renderAreasManagement(location, currentEditingCounter); // Show areas for this counter
                 document.getElementById('area-management-container')!.style.display = 'block';
            }
        });
    });

    document.querySelectorAll('.delete-counter-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const counterId = (e.target as HTMLElement).dataset.id;
            if (counterId && confirm('Diesen Tresen wirklich löschen? Alle zugehörigen Bereiche werden ebenfalls entfernt.')) {
                location.counters = location.counters.filter(c => c.id !== counterId);
                await dbService.saveLocation(location);
                renderCountersManagement(location); // Re-render counters
                document.getElementById('counter-form-container')!.style.display = 'none';
                document.getElementById('area-management-container')!.style.display = 'none';
            }
        });
    });
}

/**
 * Zeigt ein Formular zum Erstellen oder Bearbeiten eines Tresens (Counter) für einen Standort an.
 *
 * Das Formular wird mit vorhandenen Daten vorausgefüllt, falls ein Tresen bearbeitet wird. Nach dem Absenden werden die Änderungen gespeichert, die Tresenliste aktualisiert und ggf. die Bereichsverwaltung angezeigt. Das Formular kann mit "Abbrechen" geschlossen werden.
 *
 * @param location - Der Standort, zu dem der Tresen gehört
 * @param counter - Optional; der zu bearbeitende Tresen. Wenn nicht angegeben, wird ein neuer Tresen erstellt.
 */
function renderCounterForm(location: Location, counter?: Counter): void {
    const counterFormContainer = document.getElementById('counter-form-container');
    if (!counterFormContainer) return;

    currentEditingCounter = counter || null;
    counterFormContainer.innerHTML = `
        <h5>${counter ? 'Tresen bearbeiten' : 'Neuen Tresen erstellen'}</h5>
        <form id="counter-form">
            <div class="form-group">
                <label for="counter-name">Name des Tresens:</label>
                <input type="text" id="counter-name" value="${counter?.name || ''}" required class="form-control form-control-sm">
            </div>
            <div class="form-group">
                <label for="counter-description">Beschreibung (optional):</label>
                <input type="text" id="counter-description" value="${counter?.description || ''}" class="form-control form-control-sm">
            </div>
            <button type="submit" class="btn btn-success btn-sm">${counter ? 'Änderungen speichern' : 'Tresen erstellen'}</button>
            <button type="button" id="cancel-counter-edit" class="btn btn-secondary btn-sm">Abbrechen</button>
        </form>
    `;
    counterFormContainer.style.display = 'block';
    document.getElementById('area-management-container')!.style.display = counter ? 'block' : 'none';


    document.getElementById('counter-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = (document.getElementById('counter-name') as HTMLInputElement).value;
        const description = (document.getElementById('counter-description') as HTMLInputElement).value;

        if (currentEditingCounter) { // Editing
            currentEditingCounter.name = name;
            currentEditingCounter.description = description;
        } else { // Creating
            const newCounter: Counter = { id: generateId('ctr'), name, description, areas: [] };
            location.counters.push(newCounter);
            currentEditingCounter = newCounter; // Set for area management
        }
        await dbService.saveLocation(location);
        renderCountersManagement(location); // Re-render counter list
        if(currentEditingCounter) renderAreasManagement(location, currentEditingCounter); // Refresh areas if context is set
        counterFormContainer.style.display = 'none'; // Hide form after submit
    });

    document.getElementById('cancel-counter-edit')?.addEventListener('click', () => {
        counterFormContainer.style.display = 'none';
        document.getElementById('area-management-container')!.style.display = 'none';
        currentEditingCounter = null;
    });
}

/**
 * Zeigt die Verwaltung der Bereiche für einen bestimmten Tresen an und ermöglicht das Hinzufügen, Bearbeiten und Löschen von Bereichen.
 *
 * Die Funktion rendert die Liste der vorhandenen Bereiche eines Tresens, stellt Schaltflächen für Bearbeitung und Löschung bereit und bietet die Möglichkeit, neue Bereiche hinzuzufügen. Änderungen werden direkt gespeichert und die Anzeige entsprechend aktualisiert.
 *
 * @param location - Die Location, zu der der Tresen gehört
 * @param counter - Der Tresen, dessen Bereiche verwaltet werden sollen
 */
function renderAreasManagement(location: Location, counter: Counter): void {
    const areasContainer = document.getElementById('area-management-container');
    if (!areasContainer) return;

    currentEditingCounter = counter; // Ensure context is set

    areasContainer.innerHTML = `
        <h5>Bereiche für Tresen: ${counter.name}</h5>
        <div id="area-list">
            ${counter.areas.map(area => `
                <div class="list-group-item even-more-nested">
                    <span>${area.name} (Order: ${area.displayOrder || 'N/A'})</span>
                    <div>
                        <button class="btn btn-xs btn-secondary edit-area-btn" data-id="${area.id}">Bearbeiten</button>
                        <button class="btn btn-xs btn-danger delete-area-btn" data-id="${area.id}">Löschen</button>
                    </div>
                </div>
            `).join('') || '<p>Noch keine Bereiche für diesen Tresen erfasst.</p>'}
        </div>
        <button id="add-new-area-btn" class="btn btn-info btn-xs mt-2">Neuen Bereich hinzufügen</button>
        <div id="area-form-container" class="mt-2" style="display: none;"></div>
    `;
    areasContainer.style.display = 'block';

    document.getElementById('add-new-area-btn')?.addEventListener('click', () => {
        renderAreaForm(location, counter);
    });

    document.querySelectorAll('.edit-area-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const areaId = (e.target as HTMLElement).dataset.id;
            currentEditingArea = counter.areas.find(a => a.id === areaId) || null;
            if (currentEditingArea) renderAreaForm(location, counter, currentEditingArea);
        });
    });

    document.querySelectorAll('.delete-area-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const areaId = (e.target as HTMLElement).dataset.id;
            if (areaId && confirm('Diesen Bereich wirklich löschen?')) {
                counter.areas = counter.areas.filter(a => a.id !== areaId);
                await dbService.saveLocation(location);
                renderAreasManagement(location, counter); // Re-render areas
                document.getElementById('area-form-container')!.style.display = 'none';
            }
        });
    });
}

/**
 * Zeigt ein Formular zum Erstellen oder Bearbeiten eines Bereichs innerhalb eines Zählers an.
 *
 * Wird ein bestehender Bereich übergeben, werden die Felder vorausgefüllt und Änderungen gespeichert. Andernfalls wird ein neuer Bereich erstellt und zur Liste hinzugefügt. Nach dem Speichern oder Abbrechen wird das Formular ausgeblendet und die Bereichsliste aktualisiert.
 */
function renderAreaForm(location: Location, counter: Counter, area?: Area): void {
    const areaFormContainer = document.getElementById('area-form-container');
    if (!areaFormContainer) return;

    currentEditingArea = area || null;
    areaFormContainer.innerHTML = `
        <h6>${area ? 'Bereich bearbeiten' : 'Neuen Bereich erstellen'}</h6>
        <form id="area-form">
            <div class="form-group">
                <label for="area-name">Name des Bereichs:</label>
                <input type="text" id="area-name" value="${area?.name || ''}" required class="form-control form-control-sm">
            </div>
            <div class="form-group">
                <label for="area-description">Beschreibung (optional):</label>
                <input type="text" id="area-description" value="${area?.description || ''}" class="form-control form-control-sm">
            </div>
            <div class="form-group">
                <label for="area-display-order">Anzeigereihenfolge (optional):</label>
                <input type="number" id="area-display-order" value="${area?.displayOrder || ''}" class="form-control form-control-sm">
            </div>
            <button type="submit" class="btn btn-success btn-xs">${area ? 'Änderungen speichern' : 'Bereich erstellen'}</button>
            <button type="button" id="cancel-area-edit" class="btn btn-secondary btn-xs">Abbrechen</button>
        </form>
    `;
    areaFormContainer.style.display = 'block';

    document.getElementById('area-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = (document.getElementById('area-name') as HTMLInputElement).value;
        const description = (document.getElementById('area-description') as HTMLInputElement).value;
        const displayOrder = parseInt((document.getElementById('area-display-order') as HTMLInputElement).value) || undefined;

        if (currentEditingArea) { // Editing
            currentEditingArea.name = name;
            currentEditingArea.description = description;
            currentEditingArea.displayOrder = displayOrder;
        } else { // Creating
            const newArea: Area = {
                id: generateId('area'),
                name,
                description,
                inventoryItems: [],
                displayOrder
            };
            counter.areas.push(newArea);
        }
        // Sort areas by displayOrder, then by name
        counter.areas.sort((a, b) => {
            if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
                return a.displayOrder - b.displayOrder;
            }
            if (a.displayOrder !== undefined) return -1; // Areas with displayOrder come first
            if (b.displayOrder !== undefined) return 1;
            return a.name.localeCompare(b.name); // Fallback to name sorting
        });

        await dbService.saveLocation(location);
        renderAreasManagement(location, counter); // Re-render area list
        areaFormContainer.style.display = 'none'; // Hide form
    });

    document.getElementById('cancel-area-edit')?.addEventListener('click', () => {
        areaFormContainer.style.display = 'none';
        currentEditingArea = null;
    });
}

console.log("Location Manager UI component loaded.");
