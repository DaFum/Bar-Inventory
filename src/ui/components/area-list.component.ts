import { BaseComponent } from '../core/base-component';
import { Area } from '../../models';
import { AreaListItemComponent, AreaListItemCallbacks } from './area-list-item.component';

/**
 * Component responsible for rendering a list of areas for a counter.
 * Manages AreaListItemComponent instances.
 */
export class AreaListComponent extends BaseComponent<HTMLDivElement> {
    private areas: Area[] = [];
    private itemCallbacks: AreaListItemCallbacks;
    private listHostDiv!: HTMLDivElement;
    private listItemComponents: Map<string, AreaListItemComponent> = new Map();

    /**
     * Creates an instance of AreaListComponent.
     * @param initialAreas - An initial array of areas to display.
     * @param itemCallbacks - Callbacks for actions on individual area items.
     */
    constructor(initialAreas: Area[], itemCallbacks: AreaListItemCallbacks) {
        super('div');
        this.itemCallbacks = itemCallbacks;
        this.setAreas(initialAreas);
    }

    /** Sorts areas by displayOrder, then by name. Handles null/undefined input. */
    private sortAreas(areas: Area[] | null | undefined): Area[] {
        if (!Array.isArray(areas)) {
            return [];
        }
        return [...areas].sort((a, b) => {
            if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
                if (a.displayOrder !== b.displayOrder) {
                    return a.displayOrder - b.displayOrder;
                }
            } else if (a.displayOrder !== undefined) {
                return -1; // a comes first
            } else if (b.displayOrder !== undefined) {
                return 1;  // b comes first
            }
            // Fallback to name sorting if displayOrder is the same or not defined
            return a.name.localeCompare(b.name);
        });
    }

    private ensureListHostStructure(): void {
        if (!this.listHostDiv || !this.listHostDiv.isConnected) {
            this.element.innerHTML = ''; // Clear "no areas" message or old list
            this.listHostDiv = document.createElement('div');
            this.listHostDiv.id = 'area-list'; // Matching ID from original HTML structure
            this.appendChild(this.listHostDiv);
        }
    }

    private renderFullList(): void {
        if (this.areas.length === 0) {
            this.element.innerHTML = '<p>Noch keine Bereiche für diesen Tresen erfasst.</p>';
            this.listHostDiv?.remove();
            this.listHostDiv = null!;
            this.listItemComponents.clear();
            return;
        }

        this.ensureListHostStructure();

        this.listHostDiv.innerHTML = '';
        this.listItemComponents.clear();

        this.areas.forEach(area => {
            this.createAndAppendAreaItem(area);
        });
    }

    private createAndAppendAreaItem(area: Area): AreaListItemComponent {
        if (!this.listHostDiv) this.ensureListHostStructure(); // Should exist if areas.length > 0

        const itemComponent = new AreaListItemComponent(area, this.itemCallbacks);
        this.listItemComponents.set(area.id, itemComponent);
        itemComponent.appendTo(this.listHostDiv);
        return itemComponent;
    }

    private insertAreaItemSorted(area: Area): void {
        if (!this.listHostDiv) {
            this.renderFullList();
            return;
        }

        const itemComponent = new AreaListItemComponent(area, this.itemCallbacks);
        this.listItemComponents.set(area.id, itemComponent);
        const newItemElement = itemComponent.getElement();

        let inserted = false;
        const sortedIndex = this.areas.findIndex(a => a.id === area.id);

        if (sortedIndex === this.areas.length - 1 || this.areas.length === 1) {
             this.listHostDiv.appendChild(newItemElement);
             inserted = true;
        } else {
            const nextAreaId = this.areas[sortedIndex + 1]?.id;
            if (nextAreaId) {
                const nextItemComponent = this.listItemComponents.get(nextAreaId);
                if (nextItemComponent && nextItemComponent.getElement().isConnected) {
                     this.listHostDiv.insertBefore(newItemElement, nextItemComponent.getElement());
                     inserted = true;
                }
            }
        }

        if (!inserted) {
            this.listHostDiv.appendChild(newItemElement);
        }
    }

    /**
     * Sets the areas to be displayed and triggers a full re-render of the list.
     * @param areas - An array of areas to display. Handles null/undefined by treating as empty.
     */
    setAreas(areas: Area[] | null | undefined): void {
        this.areas = this.sortAreas(areas || []); // Pass empty array if areas is null/undefined
        this.renderFullList();
    }

    /**
     * Adds an area to the list and updates the DOM granularly.
     * If the list was empty, it performs a full re-render.
     * @param area - The area to add.
     */
    addArea(area: Area): void {
        const wasEmpty = this.areas.length === 0;
        this.areas.push(area);
        this.areas = this.sortAreas(this.areas);

        if (wasEmpty && this.areas.length > 0) {
            this.renderFullList();
            return;
        }

        this.ensureListHostStructure();
        this.insertAreaItemSorted(area);
    }

    updateArea(area: Area): void {
        const index = this.areas.findIndex(a => a.id === area.id);
        if (index === -1) {
            this.addArea(area);
            return;
        }

        const oldAreaAtIndex = this.areas[index]!; // Assert non-null
        const oldDisplayOrder = oldAreaAtIndex.displayOrder;
        const oldName = oldAreaAtIndex.name;

        this.areas[index] = area; // Update in the internal array

        const itemComponent = this.listItemComponents.get(area.id);
        if (!itemComponent) {
            this.renderFullList();
            return;
        }

        itemComponent.update(area);

        const orderChanged = oldDisplayOrder !== area.displayOrder;
        const nameChanged = oldName.localeCompare(area.name) !== 0;

        if (orderChanged || nameChanged) {
            this.areas = this.sortAreas(this.areas);
            const currentElement = itemComponent.getElement();
            currentElement.remove();
            this.listItemComponents.delete(area.id); // Remove before reinserting via map
            this.insertAreaItemSorted(area);
        }
    }

    removeArea(areaId: string): void {
        this.areas = this.areas.filter(a => a.id !== areaId);
        const itemComponent = this.listItemComponents.get(areaId);
        if (itemComponent) {
            itemComponent.remove();
            this.listItemComponents.delete(areaId);
        }

        if (this.areas.length === 0) {
            this.renderFullList();
        }
    }
}
console.log("AreaListComponent loaded.");
