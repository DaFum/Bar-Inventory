import { BaseComponent } from '../core/base-component';
import { Counter, Location as LocationModel, Area } from '../../models';
import { escapeHtml } from '../../utils/security';
import { AreaListComponent } from './area-list.component';
import { AreaListItemCallbacks } from './area-list-item.component';
import { AreaFormComponent, AreaFormComponentOptions } from './area-form.component';
import { showToast } from './toast-notifications';

export interface CounterListItemCallbacks {
    onEditCounter: (counter: Counter) => void;
    onDeleteCounter: (counterId: string, counterName: string) => void;
    onAddArea: (locationId: string, counterId: string, areaData: Omit<Area, 'id' | 'inventoryRecords'>) => Promise<Area>;
    onUpdateArea: (locationId: string, counterId: string, areaData: Area) => Promise<void>;
    onDeleteArea: (locationId: string, counterId: string, areaId: string) => Promise<void>;
    onToggleAreaManagement: (counterId: string) => void;
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

    constructor(host: HTMLElement, location: LocationModel, counter: Counter, callbacks: CounterListItemCallbacks) {
        super('div', host);
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
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => {
            this.callbacks.onEditCounter(this.counter);
        });

        const manageAreasButton = document.createElement('button');
        manageAreasButton.className = 'btn btn-xs btn-info manage-areas-btn ml-2';
        manageAreasButton.textContent = 'Manage Areas';
        manageAreasButton.addEventListener('click', () => {
            this.callbacks.onToggleAreaManagement(this.counter.id);
        });

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-xs btn-danger delete-counter-btn ml-2';
        deleteButton.textContent = 'Delete';
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
            <h6>Areas for Counter: ${escapeHtml(this.counter.name)}</h6>
            <div class="area-list-host"></div>
            <button class="btn btn-info btn-xs mt-2 add-new-area-btn">Add New Area</button>
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
                await this.callbacks.onUpdateArea(this.location.id, this.counter.id, areaData as Area);
                showToast(`Area "${areaData.name}" updated.`, 'success');
            } else {
                const { id, ...rest } = areaData;
                const newArea = await this.callbacks.onAddArea(this.location.id, this.counter.id, rest);
                showToast(`Area "${newArea.name}" added.`, 'success');
            }
            this.areaFormComponent.hide();
        } catch (error) {
            console.error("Error saving area:", error);
            showToast("Error saving area.", "error");
        }
    }

    private handleEditArea(area: Area): void {
        this.areaFormComponent.show(area);
    }

    private async handleDeleteArea(areaId: string, areaName: string): Promise<void> {
        if (confirm(`Are you sure you want to delete area "${areaName}"?`)) {
            try {
                await this.callbacks.onDeleteArea(this.location.id, this.counter.id, areaId);
                showToast(`Area "${areaName}" deleted.`, "success");
            } catch (error) {
                console.error("Error deleting area:", error);
                showToast("Error deleting area.", "error");
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

        const currentVisibility = this.isAreaManagementVisible;
        this.render();
        if (currentVisibility) {
            this.toggleAreasManagementVisibility(true);
        }

        if (this.isAreaManagementVisible && this.areaListComponent && counterAreasPotentiallyChanged) {
            this.areaListComponent.setAreas(this.counter.areas || []);
        }
    }

    getCounterId(): string {
        return this.counter.id;
    }
}
