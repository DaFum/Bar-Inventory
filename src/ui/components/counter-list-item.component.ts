import { BaseComponent } from '../core/base-component';
import { Counter, Location as LocationModel, Area } from '../../models';
import { escapeHtml } from '../../utils/security';
import { AreaListComponent } from './area-list.component';
import { AreaListItemCallbacks } from './area-list-item.component';
import { AreaFormComponent, AreaFormComponentOptions } from './area-form.component';
import { locationStore } from '../../state/location.store';
import { showToast } from './toast-notifications';

export interface CounterListItemCallbacks {
    onEditCounter: (counter: Counter) => void;
    onDeleteCounter: (counterId: string, counterName: string) => void;
}

export class CounterListItemComponent extends BaseComponent<HTMLDivElement> {
    public location: LocationModel;
    public counter: Counter;
    private callbacks: CounterListItemCallbacks;
    private areaListComponent!: AreaListComponent;
    private areaFormComponent!: AreaFormComponent;
    private areasManagementDiv!: HTMLDivElement;
    private areaFormContainerDiv!: HTMLDivElement;
    private addNewAreaButton!: HTMLButtonElement;
    private isAreaManagementVisible = false;

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
        this.element.innerHTML = '';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = escapeHtml(this.counter.name);

        const buttonDiv = document.createElement('div');
        buttonDiv.className = 'float-right';

        const editButton = document.createElement('button');
        editButton.className = 'btn btn-xs btn-secondary edit-counter-btn';
        editButton.textContent = 'Bearbeiten';
        editButton.addEventListener('click', () => {
            this.callbacks.onEditCounter(this.counter);
        });

        const manageAreasButton = document.createElement('button');
        manageAreasButton.className = 'btn btn-xs btn-info manage-areas-btn ml-2';
        manageAreasButton.textContent = 'Bereiche';
        manageAreasButton.addEventListener('click', () => {
            this.toggleAreasManagementVisibility();
        });

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-xs btn-danger delete-counter-btn ml-2';
        deleteButton.textContent = 'Löschen';
        deleteButton.addEventListener('click', () => this.callbacks.onDeleteCounter(this.counter.id, this.counter.name));

        buttonDiv.appendChild(editButton);
        buttonDiv.appendChild(manageAreasButton);
        buttonDiv.appendChild(deleteButton);

        this.element.appendChild(nameSpan);
        this.element.appendChild(buttonDiv);

        this.areasManagementDiv = document.createElement('div');
        this.areasManagementDiv.className = 'area-management-section mt-2 pl-3';
        this.areasManagementDiv.style.display = 'none';
        this.element.appendChild(this.areasManagementDiv);
    }

    private renderAreasManagementInternal(): void {
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
            if (areaData.id) {
                await locationStore.updateArea(this.location.id, this.counter.id, areaData as Area);
                showToast(`Bereich "${areaData.name}" aktualisiert.`, 'success');
            } else {
                const { id, ...rest } = areaData;
                const newArea = await locationStore.addArea(this.location.id, this.counter.id, rest);
                showToast(`Bereich "${newArea.name}" hinzugefügt.`, 'success');
            }
            this.areaFormComponent.hide();
            const updatedLocation = locationStore.getLocationById(this.location.id);
            const updatedCounter = updatedLocation?.counters.find(c => c.id === this.counter.id);
            if (updatedCounter) {
                 this.counter = updatedCounter;
                 this.areaListComponent.setAreas(this.counter.areas || []);
            }

        } catch (error) {
            console.error("Error saving area:", error);
            showToast("Fehler beim Speichern des Bereichs.", "error");
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

    public toggleAreasManagementVisibility(force?: boolean): void {
        this.isAreaManagementVisible = force ?? !this.isAreaManagementVisible;
        if (this.areasManagementDiv) {
            this.areasManagementDiv.style.display = this.isAreaManagementVisible ? 'block' : 'none';
            if (this.isAreaManagementVisible && !this.areaListComponent) {
                this.renderAreasManagementInternal();
            } else if (this.isAreaManagementVisible && this.areaListComponent) {
                 this.areaListComponent.setAreas(this.counter.areas || []);
            }
            if (!this.isAreaManagementVisible && this.areaFormComponent) {
                this.areaFormComponent.hide();
            }
        }
    }

    public isAreasManagementVisible(): boolean {
        return this.isAreaManagementVisible;
    }

    update(location: LocationModel, counter: Counter): void {
        const counterAreasPotentiallyChanged = JSON.stringify(this.counter.areas) !== JSON.stringify(counter.areas);

        this.location = location;
        this.counter = counter;

        this.render();

        if (this.isAreaManagementVisible && this.areaListComponent && counterAreasPotentiallyChanged) {
            this.areaListComponent.setAreas(this.counter.areas || []);
        }
    }

    getCounterId(): string {
        return this.counter.id;
    }
}
