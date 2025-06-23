import { BaseComponent } from '../core/base-component';
import { Counter, Location as LocationModel, Area } from '../../models'; // Renamed Location to avoid conflict
import { escapeHtml } from '../../utils/security';
import { AreaListComponent, AreaListItemCallbacks } from './area-list.component';
import { AreaFormComponent, AreaFormComponentOptions } from './area-form.component';
import { locationStore } from '../../state/location.store'; // To interact with areas
import { showToast } from './toast-notifications';

export interface CounterListItemCallbacks {
    onEditCounter: (counter: Counter) => void; // To open CounterForm for this counter
    onDeleteCounter: (counterId: string, counterName: string) => void;
    // Area related callbacks will be handled internally or by a dedicated AreaManagementComponent
}

/**
 * Component representing a single item in a counter list.
 * Displays counter details, action buttons, and manages the display of its areas.
 */
export class CounterListItemComponent extends BaseComponent<HTMLDivElement> {
    /** The parent location of this counter. */
    public location: LocationModel;
    /** The counter data for this item. */
    public counter: Counter; // Made public for CounterListComponent updateLocationReference
    private callbacks: CounterListItemCallbacks;

    // Area Management specific components
    private areaListComponent!: AreaListComponent;
    private areaFormComponent!: AreaFormComponent;
    private areasManagementDiv!: HTMLDivElement; // Container for area list and form
    private areaFormContainerDiv!: HTMLDivElement; // Specific container for the area form
    private addNewAreaButton!: HTMLButtonElement;
    private isAreaManagementVisible: boolean = false;

    /**
     * Creates an instance of CounterListItemComponent.
     * @param location - The parent location.
     * @param counter - The counter data to display.
     * @param callbacks - Callbacks for editing and deleting the counter.
     */
    constructor(location: LocationModel, counter: Counter, callbacks: CounterListItemCallbacks) {
        super('div');
        this.location = location;
        this.counter = counter;
        this.callbacks = callbacks;
        this.element.className = 'list-group-item nested';
        this.element.dataset.counterId = counter.id;
        this.render();
    }

    render(): void {
        this.element.innerHTML = ''; // Clear previous content

        const nameSpan = document.createElement('span');
        nameSpan.textContent = escapeHtml(this.counter.name);

        const buttonDiv = document.createElement('div');

        const editButton = document.createElement('button');
        editButton.className = 'btn btn-xs btn-secondary edit-counter-btn';
        editButton.textContent = 'Tresen bearbeiten/Bereiche';
        editButton.addEventListener('click', () => {
            this.callbacks.onEditCounter(this.counter); // Opens CounterForm via parent manager
            this.toggleAreasManagementVisibility(!this.isAreaManagementVisible);
        });

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-xs btn-danger delete-counter-btn';
        deleteButton.textContent = 'Tresen löschen';
        deleteButton.addEventListener('click', () => this.callbacks.onDeleteCounter(this.counter.id, this.counter.name));

        buttonDiv.appendChild(editButton);
        buttonDiv.appendChild(deleteButton);

        this.element.appendChild(nameSpan);
        this.element.appendChild(buttonDiv);

        // Initialize and append areas management section
        this.areasManagementDiv = document.createElement('div');
        this.areasManagementDiv.className = 'area-management-section mt-2 pl-3';
        this.areasManagementDiv.style.display = this.isAreaManagementVisible ? 'block' : 'none';
        this.element.appendChild(this.areasManagementDiv);

        // Render its content if it should be visible
        if(this.isAreaManagementVisible) {
            this.renderAreasManagementInternal();
        }
    }

    private renderAreasManagementInternal(): void {
        // Ensure this is only called when areasManagementDiv is part of the DOM and visible
        this.areasManagementDiv.innerHTML = `
            <h6>Bereiche für Tresen: ${escapeHtml(this.counter.name)}</h6>
            <div class="area-list-host"></div>
            <button class="btn btn-info btn-xs mt-2 add-new-area-btn">Neuen Bereich hinzufügen</button>
            <div class="area-form-host mt-2" style="display: none;"></div>
        `;

        const areaListHost = this.areasManagementDiv.querySelector<HTMLDivElement>('.area-list-host');
        this.areaFormContainerDiv = this.areasManagementDiv.querySelector<HTMLDivElement>('.area-form-host') as HTMLDivElement;
        this.addNewAreaButton = this.areasManagementDiv.querySelector<HTMLButtonElement>('.add-new-area-btn') as HTMLButtonElement;

        if (areaListHost) {
            const areaCallbacks: AreaListItemCallbacks = {
                onEdit: (area) => this.handleEditArea(area),
                onDelete: (areaId, areaName) => this.handleDeleteArea(areaId, areaName),
            };
            // Ensure counter.areas is always an array
            this.areaListComponent = new AreaListComponent(this.counter.areas || [], areaCallbacks);
            this.areaListComponent.appendTo(areaListHost);
        }

        const areaFormOptions: AreaFormComponentOptions = {
            onSubmit: (areaData) => this.handleAreaFormSubmit(areaData),
            onCancel: () => this.areaFormComponent.hide(),
        };
        this.areaFormComponent = new AreaFormComponent(areaFormOptions);
        this.areaFormComponent.appendTo(this.areaFormContainerDiv);
        this.areaFormComponent.hide();

        if(this.addNewAreaButton) {
            this.addNewAreaButton.addEventListener('click', () => {
                this.areaFormComponent.show();
            });
        }
    }

    private async handleAreaFormSubmit(areaData: Pick<Area, 'id' | 'name' | 'description' | 'displayOrder'>): Promise<void> {
        try {
            const currentCounter = locationStore.getLocationById(this.location.id)?.counters.find(c => c.id === this.counter.id);
            if (!currentCounter) throw new Error("Parent counter not found in store for area submission.");

            if (areaData.id) { // Editing existing Area
                const updatedArea: Area = {
                    ...(currentCounter.areas.find(a => a.id === areaData.id) || { inventoryItems: [] }), // Base for update
                    id: areaData.id, // Ensure ID is present
                    name: areaData.name,
                    description: areaData.description,
                    displayOrder: areaData.displayOrder,
                };
                await locationStore.updateArea(this.location.id, this.counter.id, updatedArea);
                showToast(`Bereich "${updatedArea.name}" aktualisiert.`, "success");
            } else { // Adding new Area
                const newArea = await locationStore.addArea(this.location.id, this.counter.id, areaData);
                showToast(`Bereich "${newArea.name}" hinzugefügt.`, "success");
            }
            this.areaFormComponent.hide();
            // LocationStore will notify, causing LocationManager to update, which propagates to this component.
            // For immediate local feedback, we can update the areaListComponent directly if needed,
            // but relying on store notification is cleaner.
            // For now, we assume the parent (CounterListComponent -> LocationDetails -> LocationManager) will refresh.
            // To make it more responsive locally:
            const updatedLocation = locationStore.getLocationById(this.location.id);
            const updatedCounter = updatedLocation?.counters.find(c => c.id === this.counter.id);
            if (updatedCounter) {
                 this.counter = updatedCounter; // Update local counter reference
                 this.areaListComponent.setAreas(this.counter.areas || []);
            }

        } catch (error) {
            console.error("Error saving area:", error);
            showToast("Fehler beim Speichern des Bereichs.", "error");
            throw error;
        }
    }

    private handleEditArea(area: Area): void {
        this.areaFormComponent.show(area);
    }

    private async handleDeleteArea(areaId: string, areaName: string): Promise<void> {
        if (confirm(`Bereich "${areaName}" wirklich löschen?`)) {
            try {
                await locationStore.deleteArea(this.location.id, this.counter.id, areaId);
                showToast(`Bereich "${areaName}" gelöscht.`, "success");
                const updatedLocation = locationStore.getLocationById(this.location.id);
                const updatedCounter = updatedLocation?.counters.find(c => c.id === this.counter.id);
                if (updatedCounter) {
                     this.counter = updatedCounter;
                     this.areaListComponent.setAreas(this.counter.areas || []);
                }
            } catch (error) {
                console.error("Error deleting area:", error);
                showToast("Fehler beim Löschen des Bereichs.", "error");
            }
        }
    }

    /**
     * Toggles the visibility of the areas management section for this counter.
     * @param show - True to show, false to hide.
     */
    public toggleAreasManagementVisibility(show: boolean): void {
        this.isAreaManagementVisible = show;
        if (this.areasManagementDiv) {
            this.areasManagementDiv.style.display = show ? 'block' : 'none';
            if (show && (!this.areasManagementDiv.hasChildNodes() || !this.areaListComponent) ) {
                // If showing and content needs to be rendered (or re-rendered if areaListComponent not initialized)
                this.renderAreasManagementInternal();
            } else if (show && this.areaListComponent) {
                // If showing and content exists, ensure area list is up-to-date
                 this.areaListComponent.setAreas(this.counter.areas || []);
            }
            if (!show && this.areaFormComponent) { // Ensure areaFormComponent exists before calling hide
                this.areaFormComponent.hide();
            }
        }
    }

    /**
     * Updates the component with new location and counter data.
     * This is typically called by the parent list when the store notifies of changes.
     * @param location - The parent location (its reference might be needed by area interactions).
     * @param counter - The new counter data.
     */
    update(location: LocationModel, counter: Counter): void {
        const oldCounterName = this.counter.name;
        // A simple way to check if areas might have changed. More robust would be deep comparison or versioning.
        const counterAreasPotentiallyChanged = JSON.stringify(this.counter.areas) !== JSON.stringify(counter.areas);

        this.location = location;
        this.counter = counter;

        // Update counter name display if it changed
        if (oldCounterName !== counter.name) {
            const nameSpan = this.element.childNodes[0] as HTMLSpanElement;
            if (nameSpan && nameSpan.nodeType === Node.ELEMENT_NODE && nameSpan.tagName === 'SPAN') {
                 nameSpan.textContent = escapeHtml(this.counter.name);
            }
        }

        // If areas management is visible and areas might have changed, update the area list
        if (this.isAreaManagementVisible && this.areaListComponent && counterAreasPotentiallyChanged) {
            this.areaListComponent.setAreas(this.counter.areas || []);
        } else if (this.isAreaManagementVisible && this.areaListComponent) {
            // If visible but areas didn't change string-wise, still good to refresh with the new counter.areas ref
             this.areaListComponent.setAreas(this.counter.areas || []);
        }
    }

    /**
     * Gets the ID of the counter represented by this item.
     * @returns The counter ID.
     */
    getCounterId(): string {
        return this.counter.id;
    }
}
console.log("CounterListItemComponent loaded.");
