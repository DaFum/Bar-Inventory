import { BaseComponent } from '../core/base-component';
import { Location } from '../../models';
import { escapeHtml } from '../../utils/security'; // Assuming this utility exists and is appropriate

export interface LocationListItemCallbacks {
    onEdit: (location: Location) => void;
    onDelete: (locationId: string, locationName: string) => void;
}

/**
 * Component representing a single item in the location list.
 * Displays location name and action buttons (Edit, Delete).
 */
export class LocationListItemComponent extends BaseComponent<HTMLLIElement> {
    private location: Location;
    private callbacks: LocationListItemCallbacks;

    /**
     * Creates an instance of LocationListItemComponent.
     * @param location - The location data to display.
     * @param callbacks - Callbacks for edit and delete actions.
     */
    constructor(location: Location, callbacks: LocationListItemCallbacks) {
        super('li');
        this.location = location;
        this.callbacks = callbacks;
        this.element.className = 'list-group-item';
        this.element.dataset.locationId = location.id;
        this.render();
    }

    render(): void {
        // Clear previous content to prevent duplicate event listeners on re-render
        this.element.innerHTML = '';

        const nameSpan = document.createElement('span');
        nameSpan.id = `loc-name-${this.location.id}`;
        nameSpan.textContent = escapeHtml(this.location.name);

        const buttonDiv = document.createElement('div');

        const editButton = document.createElement('button');
        editButton.className = 'btn btn-sm btn-secondary edit-location-btn';
        editButton.dataset.id = this.location.id;
        editButton.setAttribute('aria-label', `Standort ${escapeHtml(this.location.name)} bearbeiten`);
        editButton.textContent = 'Bearbeiten';
        editButton.addEventListener('click', () => this.callbacks.onEdit(this.location));

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-sm btn-danger delete-location-btn';
        deleteButton.dataset.id = this.location.id;
        deleteButton.setAttribute('aria-label', `Standort ${escapeHtml(this.location.name)} löschen`);
        deleteButton.textContent = 'Löschen';
        deleteButton.addEventListener('click', () => this.callbacks.onDelete(this.location.id, this.location.name));

        buttonDiv.appendChild(editButton);
        buttonDiv.appendChild(deleteButton);

        this.element.appendChild(nameSpan);
        this.element.appendChild(buttonDiv);
    }

    /**
     * Updates the component with new location data and re-renders its content.
     * @param location - The new location data.
     */
    update(location: Location): void {
        this.location = location;
        this.render(); // Re-render to reflect changes
    }

    /**
     * Gets the ID of the location represented by this item.
     * @returns The location ID.
     */
    getLocationId(): string {
        return this.location.id;
    }
}
console.log("LocationListItemComponent loaded.");
