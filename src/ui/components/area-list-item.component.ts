import { BaseComponent } from '../core/base-component';
import { Area } from '../../models';
import { escapeHtml } from '../../utils/security';

export interface AreaListItemCallbacks {
    onEdit: (area: Area) => void;
    onDelete: (areaId: string, areaName: string) => void;
}

/**
 * Component representing a single item in an area list.
 * Displays area details and action buttons.
 */
export class AreaListItemComponent extends BaseComponent<HTMLDivElement> {
    private area: Area;
    private callbacks: AreaListItemCallbacks;

    /**
     * Creates an instance of AreaListItemComponent.
     * @param area - The area data to display.
     * @param callbacks - Callbacks for edit and delete actions.
     */
    constructor(area: Area, callbacks: AreaListItemCallbacks) {
        super('div');
        this.area = area;
        this.callbacks = callbacks;
        this.element.className = 'list-group-item even-more-nested'; // From original location-manager
        this.element.dataset.areaId = area.id;
        this.render();
    }

    render(): void {
        this.element.innerHTML = ''; // Clear previous content

        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${escapeHtml(this.area.name)} (Order: ${this.area.displayOrder || 'N/A'})`;

        const buttonDiv = document.createElement('div');

        const editButton = document.createElement('button');
        editButton.className = 'btn btn-xs btn-secondary edit-area-btn';
        editButton.setAttribute('aria-label', `Bereich ${escapeHtml(this.area.name)} bearbeiten`);
        editButton.textContent = 'Bearbeiten';
        editButton.addEventListener('click', () => this.callbacks.onEdit(this.area));

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-xs btn-danger delete-area-btn';
        deleteButton.setAttribute('aria-label', `Bereich ${escapeHtml(this.area.name)} löschen`);
        deleteButton.textContent = 'Löschen';
        deleteButton.addEventListener('click', () => this.callbacks.onDelete(this.area.id, this.area.name));

        buttonDiv.appendChild(editButton);
        buttonDiv.appendChild(deleteButton);

        this.element.appendChild(nameSpan);
        this.element.appendChild(buttonDiv);
    }

    /**
     * Updates the component with new area data and re-renders.
     * @param area - The new area data.
     */
    update(area: Area): void {
        this.area = area;
        this.render();
    }

    /**
     * Gets the ID of the area represented by this item.
     * @returns The area ID.
     */
    getAreaId(): string {
        return this.area.id;
    }
}
console.log("AreaListItemComponent loaded.");
