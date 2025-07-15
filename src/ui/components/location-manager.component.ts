import { BaseComponent } from '../core/base-component';
import { Location, Counter } from '../../models';
import { locationStore } from '../../state/location.store';
import { LocationListComponent } from './location-list.component';
import { LocationFormComponent } from './location-form.component';
import { CounterListComponent } from './counter-list.component';
import { showToast } from './toast-notifications';
import { LocationListItemCallbacks } from './location-list-item.component';
import { LocationFormComponentOptions } from './location-form.component';
import { CounterFormComponent, CounterFormComponentOptions } from './counter-form.component';

export class LocationManagerComponent extends BaseComponent<HTMLDivElement> {
    private locationListComponent: LocationListComponent;
    private locationFormComponent: LocationFormComponent;
    private counterListComponent: CounterListComponent | null = null;
    private counterFormComponent: CounterFormComponent;

    private activeLocation: Location | null = null;

    private detailSectionHost: HTMLElement;
    private countersManagementHost: HTMLElement | null = null;

    constructor() {
        super('div');
        this.element.innerHTML = `
            <section class="panel" aria-labelledby="location-manager-main-title">
                <h2 id="location-manager-main-title" class="panel-title">Standortverwaltung</h2>
                <div id="location-list-host" aria-live="polite"></div>
                <button id="add-new-location-btn" class="btn btn-primary" aria-label="Neuen Standort hinzufügen">Neuen Standort hinzufügen</button>
            </section>
            <section id="location-detail-section-host" class="panel mt-4" style="display: none;" aria-live="polite">
            </section>
            <div class="panel-footer mt-4 panel p-2">
                <button id="export-all-locations-json-btn" class="btn btn-info">Alle Standorte (Struktur) als JSON exportieren</button>
                <button id="import-locations-json-btn" class="btn btn-secondary ml-2">Standorte aus JSON importieren</button>
            </div>
        `;

        const listHost = this.element.querySelector<HTMLDivElement>('#location-list-host');
        this.detailSectionHost = this.element.querySelector<HTMLDivElement>('#location-detail-section-host');

        if (!listHost || !this.detailSectionHost) {
            throw new Error('Erforderliche DOM-Elemente konnten nicht gefunden werden');
        }

        const listCallbacks: LocationListItemCallbacks = {
            onEdit: (location) => this.showLocationDetails(location),
            onDelete: (locationId, locationName) => this.handleDeleteLocation(locationId, locationName),
        };
        this.locationListComponent = new LocationListComponent([], listCallbacks);
        this.locationListComponent.appendTo(listHost);

        const locFormCallbacks: LocationFormComponentOptions = {
            onSubmit: (locationData) => this.handleLocationFormSubmit(locationData),
            onCancel: () => this.handleLocationFormCancel(),
        };
        this.locationFormComponent = new LocationFormComponent(locFormCallbacks);

        const counterFormCallbacks: CounterFormComponentOptions = {
            onSubmit: (counterData) => this.handleCounterFormSubmit(counterData),
            onCancel: () => { if (this.counterFormComponent) this.counterFormComponent.hide(); }
        };
        this.counterFormComponent = new CounterFormComponent(counterFormCallbacks);

        this.attachEventListeners();
        this.subscribeToStore();
        locationStore.loadLocations();
    }

    private attachEventListeners(): void {
        this.element.querySelector<HTMLButtonElement>('#add-new-location-btn')?.addEventListener('click', () => {
            this.activeLocation = null;
            this.detailSectionHost.innerHTML = '';
            this.locationFormComponent.show();
            this.locationFormComponent.appendTo(this.detailSectionHost);
            this.detailSectionHost.style.display = 'block';
        });

        this.element.querySelector<HTMLButtonElement>('#export-all-locations-json-btn')?.addEventListener('click', () => {
            try {
                const locations = locationStore.getLocations();
                if (locations.length === 0) {
                    showToast("Keine Standorte zum Exportieren vorhanden.", "info");
                    return;
                }
                const blob = new Blob([JSON.stringify(locations, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", url);
                downloadAnchorNode.setAttribute("download", "locations.json");
                document.body.appendChild(downloadAnchorNode); // required for firefox
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
                URL.revokeObjectURL(url);
                showToast("Alle Standorte erfolgreich als JSON exportiert.", "success");
            } catch (error) {
                showToast("Fehler beim Exportieren der Standorte.", "error");
                console.error("Error exporting locations to JSON:", error);
            }
        });

        this.element.querySelector<HTMLButtonElement>('#import-locations-json-btn')?.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            fileInput.addEventListener('change', async (event) => {
                const target = event.target as HTMLInputElement;
                const file = target.files?.[0];
                if (file) {
                    try {
                        const content = await file.text();
                        const locations = JSON.parse(content);
                        if (Array.isArray(locations)) {
                            // Add confirmation dialog
                            if (confirm(`Möchten Sie ${locations.length} Standorte importieren? Bestehende Standorte mit gleichen Namen könnten dupliziert werden.`)) {
                                await locationStore.importLocations(locations);
                                showToast(`${locations.length} Standorte erfolgreich importiert.`, 'success');
                            }
                        } else {
                            showToast('Ungültiges JSON-Format. Es muss ein Array von Standorten sein.', 'error');
                        }
                    } catch (error) {
                        showToast('Fehler beim Importieren der Standorte. Details finden Sie in der Konsole.', 'error');
                        console.error('Error importing locations from JSON:', error);
                    }
                }
            });
            fileInput.click();
        });
    }

    private subscribeToStore(): void {
        locationStore.subscribe(locations => {
            this.locationListComponent.setLocations(locations);
            if (this.activeLocation) {
                const updatedActiveLocation = locations.find(l => l.id === this.activeLocation!.id);
                if (updatedActiveLocation) {
                    this.activeLocation = updatedActiveLocation;
                    if (this.counterListComponent) {
                        this.renderCountersForLocation(this.activeLocation);
                    }
                } else {
                    this.activeLocation = null;
                    this.detailSectionHost.style.display = 'none';
                }
            }
        });
    }

    private showLocationDetails(location: Location): void {
        this.activeLocation = location;
        this.detailSectionHost.innerHTML = '';
        this.detailSectionHost.style.display = 'block';

        const detailHeader = document.createElement('div');
        detailHeader.className = 'flex justify-between items-center mb-2';
        detailHeader.innerHTML = `
            <h3 class="panel-subtitle">Details für: ${location.name}</h3>
            <button id="edit-loc-name-addr-btn" class="btn btn-sm btn-info">Stammdaten bearbeiten</button>
        `;
        this.detailSectionHost.appendChild(detailHeader);

        this.detailSectionHost.querySelector<HTMLButtonElement>('#edit-loc-name-addr-btn')?.addEventListener('click', () => {
            if (this.activeLocation) {
                this.detailSectionHost.innerHTML = '';
                this.locationFormComponent.show(this.activeLocation);
                this.locationFormComponent.appendTo(this.detailSectionHost);
            }
        });

        const locAddress = document.createElement('p');
        locAddress.textContent = `Adresse: ${location.address || 'N/A'}`;
        this.detailSectionHost.appendChild(locAddress);
        this.detailSectionHost.appendChild(document.createElement('hr'));

        this.countersManagementHost = document.createElement('div');
        this.countersManagementHost.id = `counters-management-host-${location.id}`;
        this.countersManagementHost.className = 'mt-3';
        this.detailSectionHost.appendChild(this.countersManagementHost);

        this.renderCountersForLocation(location);

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Schließen';
        closeButton.className = 'btn btn-light-grey mt-4';
        closeButton.addEventListener('click', () => {
            this.detailSectionHost.style.display = 'none';
            this.activeLocation = null;
        });
        this.detailSectionHost.appendChild(closeButton);
    }

    private async handleDeleteLocation(locationId: string, locationName: string): Promise<void> {
        if (confirm(`Standort "${locationName}" wirklich löschen? Alle zugehörigen Tresen und Bereiche werden ebenfalls entfernt.`)) {
            try {
                await locationStore.deleteLocation(locationId);
                showToast(`Standort "${locationName}" gelöscht.`, 'success');
                if (this.activeLocation?.id === locationId) {
                    this.activeLocation = null;
                    this.detailSectionHost.style.display = 'none';
                }
            } catch (error) {
                showToast(`Fehler beim Löschen von Standort "${locationName}".`, 'error');
            }
        }
    }

    private async handleLocationFormSubmit(locationData: Pick<Location, 'id' | 'name' | 'address'>): Promise<void> {
        try {
            let newOrUpdatedLocation: Location;
            if (locationData.id) {
                const existingLocation = locationStore.getLocationById(locationData.id);
                if (!existingLocation) throw new Error("Zu bearbeitender Standort nicht im Store gefunden.");

                const updatedLocationData: Location = {
                    ...existingLocation,
                    name: locationData.name,
                };
                if (locationData.address !== undefined && locationData.address.trim() !== '') {
                    updatedLocationData.address = locationData.address;
                } else {
                    delete updatedLocationData.address;
                }
                await locationStore.updateLocation(updatedLocationData);
                newOrUpdatedLocation = updatedLocationData;
                showToast(`Standort "${newOrUpdatedLocation.name}" aktualisiert.`, 'success');
            } else {
                const newLocationPayload: Pick<Location, 'name' | 'address'> = {
                    name: locationData.name,
                };
                if (locationData.address !== undefined && locationData.address.trim() !== '') {
                    newLocationPayload.address = locationData.address;
                }
                newOrUpdatedLocation = await locationStore.addLocation(newLocationPayload);
                showToast(`Standort "${newOrUpdatedLocation.name}" erstellt.`, 'success');
            }
            this.activeLocation = newOrUpdatedLocation;
            this.locationFormComponent.hide();
            this.showLocationDetails(this.activeLocation);

        } catch (error) {
            showToast(`Fehler beim Speichern des Standorts.`, 'error');
            throw error;
        }
    }

    private handleLocationFormCancel(): void {
        this.locationFormComponent.hide();
        if (this.activeLocation) {
            this.showLocationDetails(this.activeLocation);
        } else {
            this.detailSectionHost.style.display = 'none';
        }
    }

    private renderCountersForLocation(location: Location): void {
        if (!this.countersManagementHost) return;

        this.countersManagementHost.innerHTML = `
            <h4>Tresen für ${location.name}</h4>
            <div id="counter-list-host-for-${location.id}"></div>
            <button id="add-new-counter-btn-for-${location.id}" class="btn btn-primary btn-sm mt-2">Neuen Tresen hinzufügen</button>
            <div id="counter-form-host-for-${location.id}" class="mt-2" style="display:none;"></div>
        `;

        const counterListHostTarget = this.countersManagementHost.querySelector<HTMLDivElement>(`#counter-list-host-for-${location.id}`);
        const counterFormHostTarget = this.countersManagementHost.querySelector<HTMLDivElement>(`#counter-form-host-for-${location.id}`);

        if (!counterListHostTarget || !counterFormHostTarget) {
            throw new Error('Counter-Management DOM-Elemente konnten nicht gefunden werden');
        }

        const counterListCallbacks = {
            onEditCounter: (counter: Counter) => {
                this.counterFormComponent.show(counter);
                this.counterFormComponent.appendTo(counterFormHostTarget);
                counterFormHostTarget.style.display = 'block';
                if(this.counterListComponent) this.counterListComponent.toggleAreaManagementForCounter(counter.id, true);
            },
            onDeleteCounter: (counterId: string, counterName: string) => this.handleDeleteCounter(location.id, counterId, counterName)
        };

        if(this.counterListComponent && this.counterListComponent.getElement().isConnected) {
            this.counterListComponent.remove();
        }
        this.counterListComponent = new CounterListComponent(location, location.counters || [], counterListCallbacks);
        this.counterListComponent.appendTo(counterListHostTarget);

        this.countersManagementHost.querySelector<HTMLButtonElement>(`#add-new-counter-btn-for-${location.id}`)?.addEventListener('click', () => {
            this.counterFormComponent.show();
            this.counterFormComponent.appendTo(counterFormHostTarget);
            counterFormHostTarget.style.display = 'block';
        });
    }

    private async handleCounterFormSubmit(counterData: Pick<Counter, 'id' | 'name' | 'description'>): Promise<void> {
        if (!this.activeLocation) {
            showToast("Kein aktiver Standort ausgewählt, um Tresen zu speichern.", "error");
            throw new Error("No active location for counter submission");
        }
        try {
            if (counterData.id) {
                const existingCounter = this.activeLocation.counters.find(c => c.id === counterData.id);
                const updatedCounterPayload: Counter = {
                    id: counterData.id,
                    name: counterData.name,
                    areas: existingCounter?.areas || []
                };
                if (counterData.description !== undefined && counterData.description.trim() !== '') {
                    updatedCounterPayload.description = counterData.description;
                }
                await locationStore.updateCounter(this.activeLocation.id, updatedCounterPayload);
                showToast(`Tresen "${counterData.name}" aktualisiert.`, 'success');
            } else {
                const newCounterPayload: Pick<Counter, 'name' | 'description'> = {
                    name: counterData.name,
                    description: counterData.description?.trim() || '',
                };
                await locationStore.addCounter(this.activeLocation.id, newCounterPayload);
                showToast(`Tresen "${counterData.name}" hinzugefügt.`, 'success');
            }
            this.counterFormComponent.hide();
        } catch (error) {
            showToast(`Fehler beim Speichern des Tresens "${counterData.name}".`, 'error');
            throw error;
        }
    }

    private async handleDeleteCounter(locationId: string, counterId: string, counterName: string): Promise<void> {
        if (confirm(`Tresen "${counterName}" wirklich löschen? Alle zugehörigen Bereiche werden ebenfalls entfernt.`)) {
            try {
                await locationStore.deleteCounter(locationId, counterId);
                showToast(`Tresen "${counterName}" gelöscht.`, 'success');
                if (this.counterFormComponent && this.counterFormComponent.currentEditingCounter?.id === counterId) {
                    this.counterFormComponent.hide();
                }
            } catch (error) {
                showToast(`Fehler beim Löschen von Tresen "${counterName}".`, 'error');
            }
        }
    }
}
