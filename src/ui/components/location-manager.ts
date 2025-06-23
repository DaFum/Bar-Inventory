// Main Location Manager - Orchestrator for Location UI Components
import { Location, Counter, Area } from '../../models';
// import { generateId } from '../../utils/helpers'; // Handled by store or components
import { exportService } from '../../services/export.service'; // Assuming triggerDownload is part of this or a global helper
import { showToast } from './toast-notifications';
import { locationStore } from '../../state/location.store';

import { LocationListComponent, LocationListItemCallbacks } from './location-list.component';
import { LocationFormComponent, LocationFormComponentOptions } from './location-form.component';
import { CounterListComponent, CounterListItemCallbacks } from './counter-list.component';
import { CounterFormComponent, CounterFormComponentOptions } from './counter-form.component';
// AreaList and AreaForm components are managed by CounterListItemComponent internally for this design.

// Top-level container for this manager
let locationManagerViewContainer: HTMLElement | null = null;

// Component instances
let locationListComponent: LocationListComponent | null = null;
let locationFormComponent: LocationFormComponent | null = null; // For editing Location name/address
let counterListComponent: CounterListComponent | null = null; // For the selected location's counters
let counterFormComponent: CounterFormComponent | null = null; // For adding/editing a counter

// State for the currently selected/active entities for detailed view/editing
let activeLocation: Location | null = null; // The location whose details (counters/areas) are being shown
// activeCounter is handled by CounterListItemComponent's internal state for showing its areas.

// Host elements within the main container
let detailSectionHost: HTMLElement | null = null; // Hosts LocationForm or the counter/area management UI
let countersManagementHost: HTMLElement | null = null; // Specifically for CounterList and CounterForm

/**
 * Initialisiert die Standortverwaltung.
 */
export async function initLocationManager(container: HTMLElement): Promise<void> {
    locationManagerViewContainer = container;
    locationManagerViewContainer.innerHTML = `
        <section class="panel" aria-labelledby="location-manager-main-title">
            <h2 id="location-manager-main-title" class="panel-title">Standortverwaltung</h2>
            <div id="location-list-host" aria-live="polite"></div>
            <button id="add-new-location-btn" class="btn btn-primary" aria-label="Neuen Standort hinzufügen">Neuen Standort hinzufügen</button>
        </section>
        <section id="location-detail-section-host" class="panel mt-4" style="display: none;" aria-live="polite">
            <!-- LocationForm or Counter/Area management for selected location will go here -->
        </section>
        <div class="panel-footer mt-4 panel p-2">
            <button id="export-all-locations-json-btn" class="btn btn-info">Alle Standorte (Struktur) als JSON exportieren</button>
        </div>
    `;

    const listHost = locationManagerViewContainer.querySelector<HTMLDivElement>('#location-list-host');
    detailSectionHost = locationManagerViewContainer.querySelector<HTMLDivElement>('#location-detail-section-host');

    if (!listHost || !detailSectionHost) {
        console.error("Location manager UI host elements not found!");
        return;
    }

    // Location List Component
    const listCallbacks: LocationListItemCallbacks = {
        onEdit: showLocationDetails, // Shows Counters/Areas for the location
        onDelete: handleDeleteLocation
    };
    locationListComponent = new LocationListComponent([], listCallbacks);
    locationListComponent.appendTo(listHost);

    // Location Form Component (for Add/Edit Location basic details)
    // This will be appended to detailSectionHost when needed
    const locFormCallbacks: LocationFormComponentOptions = {
        onSubmit: handleLocationFormSubmit,
        onCancel: handleLocationFormCancel
    };
    locationFormComponent = new LocationFormComponent(locFormCallbacks);
    // locationFormComponent is not appended initially.

    // Counter Form Component (for Add/Edit Counter for the activeLocation)
    // This will be appended to a sub-container within detailSectionHost when needed
    const counterFormCallbacks: CounterFormComponentOptions = {
        onSubmit: handleCounterFormSubmit,
        onCancel: () => { if (counterFormComponent) counterFormComponent.hide(); }
    };
    counterFormComponent = new CounterFormComponent(counterFormCallbacks);
    // counterFormComponent is not appended initially.


    // Subscribe to store and load initial data
    locationStore.subscribe(locations => {
        if (locationListComponent) locationListComponent.setLocations(locations);

        if (activeLocation) { // If a location's details are being shown, refresh them
            const updatedActiveLocation = locations.find(l => l.id === activeLocation!.id);
            if (updatedActiveLocation) {
                activeLocation = updatedActiveLocation; // Keep activeLocation in sync
                // If the locationForm is not the one currently showing for this location, refresh counter view
                if (locationFormComponent?.getElement().style.display === 'none' ||
                    locationFormComponent?.currentEditingLocation?.id !== activeLocation.id) {
                    renderCountersForLocation(activeLocation);
                }
                // If the locationForm *is* showing for this activeLocation, its own `show` method handles updates.
            } else { // Active location was deleted from store
                activeLocation = null;
                if(detailSectionHost) detailSectionHost.style.display = 'none';
            }
        }
    });

    try {
        await locationStore.loadLocations();
    } catch (error) {
        showToast("Fehler beim Laden der Standorte.", "error");
    }

    // Event Listeners for top-level buttons
    locationManagerViewContainer.querySelector<HTMLButtonElement>('#add-new-location-btn')?.addEventListener('click', () => {
        activeLocation = null; // Clear any active location context
        if (detailSectionHost && locationFormComponent) {
            detailSectionHost.innerHTML = ''; // Clear previous content (e.g. counter/area view)
            locationFormComponent.show(); // Show empty form for new location
            locationFormComponent.appendTo(detailSectionHost);
            detailSectionHost.style.display = 'block';
        }
    });

    locationManagerViewContainer.querySelector<HTMLButtonElement>('#export-all-locations-json-btn')?.addEventListener('click', handleExportAllLocationsJson);
}

function showLocationDetails(location: Location): void {
    activeLocation = location;
    if (!detailSectionHost) return;

    detailSectionHost.innerHTML = ''; // Clear previous content (like LocationForm if it was there)
    detailSectionHost.style.display = 'block';

    const detailHeader = document.createElement('div');
    detailHeader.className = 'flex justify-between items-center mb-2';
    detailHeader.innerHTML = `
        <h3 class="panel-subtitle">Details für: ${location.name}</h3>
        <button id="edit-loc-name-addr-btn" class="btn btn-sm btn-info">Stammdaten bearbeiten</button>
    `;
    detailSectionHost.appendChild(detailHeader);

    detailSectionHost.querySelector<HTMLButtonElement>('#edit-loc-name-addr-btn')?.addEventListener('click', () => {
        if (locationFormComponent && detailSectionHost && activeLocation) {
            detailSectionHost.innerHTML = ''; // Clear counter/area view
            locationFormComponent.show(activeLocation); // Show form to edit this location's name/address
            locationFormComponent.appendTo(detailSectionHost);
        }
    });

    const locAddress = document.createElement('p');
    locAddress.textContent = `Adresse: ${location.address || 'N/A'}`;
    detailSectionHost.appendChild(locAddress);
    detailSectionHost.appendChild(document.createElement('hr'));

    // Host for Counter List and Counter Form
    countersManagementHost = document.createElement('div');
    countersManagementHost.id = `counters-management-host-${location.id}`; // Unique ID
    countersManagementHost.className = 'mt-3';
    detailSectionHost.appendChild(countersManagementHost);

    renderCountersForLocation(location); // Now render counters within this setup

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Schließen';
    closeButton.className = 'btn btn-light-grey mt-4';
    closeButton.addEventListener('click', () => {
        if(detailSectionHost) detailSectionHost.style.display = 'none';
        activeLocation = null;
    });
    detailSectionHost.appendChild(closeButton);
}

async function handleDeleteLocation(locationId: string, locationName: string): Promise<void> {
    if (confirm(`Standort "${locationName}" wirklich löschen? Alle zugehörigen Tresen und Bereiche werden ebenfalls entfernt.`)) {
        try {
            await locationStore.deleteLocation(locationId);
            showToast(`Standort "${locationName}" gelöscht.`, 'success');
            if (activeLocation?.id === locationId) { // If the deleted location was being detailed
                activeLocation = null;
                if(detailSectionHost) detailSectionHost.style.display = 'none';
            }
        } catch (error) {
            showToast(`Fehler beim Löschen von Standort "${locationName}".`, 'error');
        }
    }
}

async function handleLocationFormSubmit(locationData: Pick<Location, 'id' | 'name' | 'address'>): Promise<void> {
    try {
        let newOrUpdatedLocation: Location;
        if (locationData.id) { // Editing existing
            const existingLocation = locationStore.getLocationById(locationData.id);
            if (!existingLocation) throw new Error("Zu bearbeitender Standort nicht im Store gefunden.");
            newOrUpdatedLocation = {
                ...existingLocation,
                name: locationData.name,
                address: locationData.address
            };
            await locationStore.updateLocation(newOrUpdatedLocation);
            showToast(`Standort "${newOrUpdatedLocation.name}" aktualisiert.`, 'success');
        } else { // Adding new
            newOrUpdatedLocation = await locationStore.addLocation({name: locationData.name, address: locationData.address});
            showToast(`Standort "${newOrUpdatedLocation.name}" erstellt.`, 'success');
        }
        activeLocation = newOrUpdatedLocation; // Set context to the new/updated location
        if(locationFormComponent) locationFormComponent.hide();
        showLocationDetails(activeLocation); // Show details view (counters/areas) for this location

    } catch (error) {
        showToast(`Fehler beim Speichern des Standorts.`, 'error');
        throw error;
    }
}

function handleLocationFormCancel(): void {
    if (locationFormComponent) locationFormComponent.hide();
    if (activeLocation) { // If cancelling an edit, show details view again
        showLocationDetails(activeLocation);
    } else { // If cancelling an "add new", just hide the detail section
        if (detailSectionHost) detailSectionHost.style.display = 'none';
    }
}


function renderCountersForLocation(location: Location): void {
    if (!countersManagementHost) { // Should have been created by showLocationDetails
        console.error("Counters management host not found for location:", location.name);
        return;
    }
    countersManagementHost.innerHTML = ''; // Clear previous counter list/form

    countersManagementHost.innerHTML = `
        <h4>Tresen für ${location.name}</h4>
        <div id="counter-list-host-for-${location.id}"></div>
        <button id="add-new-counter-btn-for-${location.id}" class="btn btn-primary btn-sm mt-2">Neuen Tresen hinzufügen</button>
        <div id="counter-form-host-for-${location.id}" class="mt-2" style="display:none;"></div>
    `;

    const counterListHostTarget = countersManagementHost.querySelector<HTMLDivElement>(`#counter-list-host-for-${location.id}`);
    const counterFormHostTarget = countersManagementHost.querySelector<HTMLDivElement>(`#counter-form-host-for-${location.id}`);

    if (counterListHostTarget && counterFormComponent && counterFormHostTarget) { // Ensure counterFormComponent is also available
        const counterListCallbacks: CounterListItemCallbacks = {
            onEditCounter: (counter) => {
                counterFormComponent.show(counter);
                if(counterFormHostTarget) {
                    // counterFormComponent.remove(); // Ensure it's not already elsewhere
                    counterFormComponent.appendTo(counterFormHostTarget);
                    counterFormHostTarget.style.display = 'block';
                }
                if(counterListComponent) counterListComponent.toggleAreaManagementForCounter(counter.id, true);
            },
            onDeleteCounter: (counterId, counterName) => handleDeleteCounter(location.id, counterId, counterName)
        };

        if(counterListComponent && counterListComponent.getElement().isConnected) {
            counterListComponent.remove();
        }
        counterListComponent = new CounterListComponent(location, location.counters || [], counterListCallbacks);
        counterListComponent.appendTo(counterListHostTarget);

        countersManagementHost.querySelector<HTMLButtonElement>(`#add-new-counter-btn-for-${location.id}`)?.addEventListener('click', () => {
            if (counterFormComponent && counterFormHostTarget) {
                counterFormComponent.show();
                // counterFormComponent.remove();
                counterFormComponent.appendTo(counterFormHostTarget);
                counterFormHostTarget.style.display = 'block';
            }
        });
    }
}

async function handleCounterFormSubmit(counterData: Pick<Counter, 'id' | 'name' | 'description'>): Promise<void> {
    if (!activeLocation) {
        showToast("Kein aktiver Standort ausgewählt, um Tresen zu speichern.", "error");
        throw new Error("No active location for counter submission");
    }
    try {
        if (counterData.id) {
            const existingCounter = activeLocation.counters.find(c => c.id === counterData.id);
            const updatedCounterData: Counter = {
                id: counterData.id,
                name: counterData.name,
                description: counterData.description,
                areas: existingCounter?.areas || []
            };
            await locationStore.updateCounter(activeLocation.id, updatedCounterData);
            showToast(`Tresen "${counterData.name}" aktualisiert.`, 'success');
        } else {
            await locationStore.addCounter(activeLocation.id, { name: counterData.name, description: counterData.description });
            showToast(`Tresen "${counterData.name}" hinzugefügt.`, 'success');
        }
        if (counterFormComponent) counterFormComponent.hide();
        // LocationStore subscription will refresh CounterListComponent
    } catch (error) {
        showToast(`Fehler beim Speichern des Tresens "${counterData.name}".`, 'error');
        throw error;
    }
}

async function handleDeleteCounter(locationId: string, counterId: string, counterName: string): Promise<void> {
    if (confirm(`Tresen "${counterName}" wirklich löschen? Alle zugehörigen Bereiche werden ebenfalls entfernt.`)) {
        try {
            await locationStore.deleteCounter(locationId, counterId);
            showToast(`Tresen "${counterName}" gelöscht.`, 'success');
            if (counterFormComponent && counterFormComponent.currentEditingCounter?.id === counterId) {
                counterFormComponent.hide();
            }
        } catch (error) {
            showToast(`Fehler beim Löschen von Tresen "${counterName}".`, 'error');
        }
    }
}

async function handleExportAllLocationsJson() {
    const locations = locationStore.getLocations();
    if (locations.length === 0) {
        showToast("Keine Standorte zum Exportieren vorhanden.", "info");
        return;
    }
    try {
        const dataToExport = {
            exportDate: new Date().toISOString(),
            locations: locations
        };
        const jsonContent = JSON.stringify(dataToExport, null, 2);

        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'alle_standorte_export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast(`${locations.length} Standort(e) erfolgreich als JSON exportiert.`, "success");
    } catch (error) {
        console.error("Fehler beim Exportieren aller Standorte:", error);
        showToast("Fehler beim JSON-Export aller Standorte.", "error");
    }
}

console.log("Location Manager UI refactored with components and store.");
