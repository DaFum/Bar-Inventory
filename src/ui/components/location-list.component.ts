import { BaseComponent } from '../core/base-component';
import { Location } from '../../models';
import { LocationListItemComponent } from './location-list-item.component';
import type { LocationListItemCallbacks } from './location-list-item.component'; // Import type

/**
 * Component responsible for rendering the list of locations.
 * Manages LocationListItemComponent instances for each location.
 */
export class LocationListComponent extends BaseComponent<HTMLDivElement> {
    private locations: Location[] = [];
    private itemCallbacks: LocationListItemCallbacks;
    private ulElement!: HTMLUListElement; // Definite assignment assertion, created in ensureListStructure
    private listItemComponents: Map<string, LocationListItemComponent> = new Map();

    /**
     * Creates an instance of LocationListComponent.
     * @param initialLocations - An initial array of locations to display.
     * @param itemCallbacks - Callbacks for actions on individual location items.
     */
    constructor(initialLocations: Location[], itemCallbacks: LocationListItemCallbacks) {
        super('div');
        this.itemCallbacks = itemCallbacks;
        this.setLocations(initialLocations);
    }

    /** Sorts locations by name. */
    private sortLocations(locations: Location[]): Location[] {
        return [...locations].sort((a, b) => a.name.localeCompare(b.name));
    }

    private ensureListStructure(): void {
        // Check if ulElement is already created and part of the DOM
        if (!this.ulElement || !this.ulElement.isConnected) {
            this.element.innerHTML = ''; // Clear "no locations" message or old list
            this.ulElement = document.createElement('ul');
            this.ulElement.className = 'list-group';
            this.ulElement.setAttribute('aria-label', 'Liste der Standorte');
            this.appendChild(this.ulElement); // Append the new ul to this component's root div
        }
    }

    private renderFullList(): void {
        if (this.locations.length === 0) {
            this.element.innerHTML = '<p>Noch keine Standorte erfasst. Fügen Sie einen neuen Standort hinzu.</p>';
            if (this.ulElement && this.ulElement.isConnected) {
                this.ulElement.remove(); // Remove ul if it exists
            }
            this.ulElement = undefined as any; // Clear reference
            this.listItemComponents.clear();
            return;
        }

        this.ensureListStructure(); // Creates ulElement if it doesn't exist or isn't connected

        this.ulElement.innerHTML = ''; // Clear existing items before re-adding
        this.listItemComponents.clear();

        this.locations.forEach(location => {
            // When rendering a full list, items are already sorted, so append directly.
            this.createAndAppendLocationItem(location);
        });
    }

    private createAndAppendLocationItem(location: Location): LocationListItemComponent {
        const itemComponent = new LocationListItemComponent(location, this.itemCallbacks);
        this.listItemComponents.set(location.id, itemComponent);
        itemComponent.appendTo(this.ulElement);
        return itemComponent;
    }

    private insertLocationItemSorted(location: Location): void {
        if (!this.ulElement) { // Should not happen if list is not empty
            this.renderFullList(); // Fallback: should create ulElement
            return;
        }

        const itemComponent = new LocationListItemComponent(location, this.itemCallbacks);
        this.listItemComponents.set(location.id, itemComponent);
        const newItemElement = itemComponent.getElement();

        // Find the correct position to insert
        let inserted = false;
        const sortedIndex = this.locations.findIndex(loc => loc.id === location.id);

        if (sortedIndex === this.locations.length - 1) { // If it's the last item after sort
             this.ulElement.appendChild(newItemElement);
             inserted = true;
        } else {
            // Find the DOM element of the next product in the sorted list
            const nextLocationId = this.locations[sortedIndex + 1]?.id;
            if (nextLocationId) {
                const nextItemComponent = this.listItemComponents.get(nextLocationId);
                if (nextItemComponent && nextItemComponent.getElement().isConnected) {
                     this.ulElement.insertBefore(newItemElement, nextItemComponent.getElement());
                     inserted = true;
                }
            }
        }

        if (!inserted) { // Fallback or if it's the only item / couldn't find sibling
            this.ulElement.appendChild(newItemElement);
        }
    }

    /**
     * Sets the locations to be displayed and triggers a full re-render of the list.
     * @param locations - An array of locations to display.
     */
    setLocations(locations: Location[]): void {
        this.locations = this.sortLocations(locations);
        this.renderFullList();
    }

    /**
     * Adds a location to the list and updates the DOM granularly.
     * If the list was empty, it performs a full re-render.
     * @param location - The location to add.
     */
    addLocation(location: Location): void {
        const wasEmpty = this.locations.length === 0;
        this.locations.push(location);
        this.locations = this.sortLocations(this.locations); // Re-sort the internal array

        if (wasEmpty && this.locations.length > 0) {
            this.renderFullList(); // Re-render fully to build list structure
            return;
        }

        this.ensureListStructure(); // Make sure ulElement exists
        this.insertLocationItemSorted(location); // Granularly add the new item
    }

    /**
     * Updates a location in the list and updates the DOM granularly.
     * If the location's name changes, its DOM position is updated to maintain sort order.
     * @param location - The location with updated data.
     */
    updateLocation(location: Location): void {
        const index = this.locations.findIndex(l => l.id === location.id);
        if (index === -1) { // Location not found
            this.addLocation(location); // Add it if it's new from the store's perspective
            return;
        }

        const oldLocation = this.locations[index];
        this.locations[index] = location; // Update in the internal array

        const itemComponent = this.listItemComponents.get(location.id);
        if (!itemComponent) { // Should ideally not happen if map is in sync
            this.renderFullList(); // Fallback
            return;
        }

        itemComponent.update(location); // Update the content of the specific list item

        if (oldLocation.name.localeCompare(location.name) !== 0) { // Check if name (sort key) changed
            this.locations = this.sortLocations(this.locations); // Re-sort the internal array

            const currentElement = itemComponent.getElement();
            currentElement.remove(); // Detach from current DOM position
            // The component is still in listItemComponents map, its element is just detached.
            // Re-insert based on new sorted order.
            this.insertLocationItemSorted(location);
        }
    }

    /**
     * Removes a location from the list and updates the DOM granularly.
     * If the list becomes empty, it shows the "no locations" message.
     * @param locationId - The ID of the location to remove.
     */
    removeLocation(locationId: string): void {
        this.locations = this.locations.filter(l => l.id !== locationId); // Update internal list
        const itemComponent = this.listItemComponents.get(locationId);
        if (itemComponent) {
            itemComponent.remove(); // Remove DOM element
            this.listItemComponents.delete(locationId); // Remove from map
        }

        if (this.locations.length === 0) {
            this.renderFullList(); // Show "no locations" message and clear list structure
        }
    }
}
console.log("LocationListComponent loaded.");
