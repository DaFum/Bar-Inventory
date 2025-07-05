import { BaseComponent } from '../core/base-component';
import { Counter, Location as LocationModel } from '../../models';
import { CounterListItemComponent, CounterListItemCallbacks } from './counter-list-item.component';

/**
 * Component responsible for rendering a list of counters for a location.
 * Manages CounterListItemComponent instances.
 */
export class CounterListComponent extends BaseComponent<HTMLDivElement> {
    private location: LocationModel;
    private counters: Counter[] = [];
    private itemCallbacks: CounterListItemCallbacks;
    private listHostDiv!: HTMLDivElement; // Div that will host the counter items
    private listItemComponents: Map<string, CounterListItemComponent> = new Map();

    /**
     * Creates an instance of CounterListComponent.
     * @param location - The parent location to which these counters belong.
     * @param initialCounters - An initial array of counters to display.
     * @param itemCallbacks - Callbacks for actions on individual counter items.
     */
    constructor(location: LocationModel, initialCounters: Counter[], itemCallbacks: CounterListItemCallbacks) {
        super('div');
        this.location = location;
        this.itemCallbacks = itemCallbacks;
        this.setCounters(initialCounters);
    }

    /** Sorts counters by name. */
    private sortCounters(counters: Counter[]): Counter[] {
        return [...counters].sort((a, b) => a.name.localeCompare(b.name));
    }

    private ensureListHostStructure(): void {
        if (!this.listHostDiv || !this.listHostDiv.isConnected) {
            this.element.innerHTML = '';
            this.listHostDiv = document.createElement('div');
            this.listHostDiv.id = 'counter-list'; // From original HTML
            this.appendChild(this.listHostDiv);
        }
    }

    private renderFullList(): void {
        if (this.counters.length === 0) {
            this.element.innerHTML = '<p>Noch keine Tresen für diesen Standort erfasst.</p>';
            if (this.listHostDiv && this.listHostDiv.isConnected) this.listHostDiv.remove();
            this.listHostDiv = undefined as any;
            this.listItemComponents.clear();
            return;
        }

        this.ensureListHostStructure();

        this.listHostDiv.innerHTML = '';
        this.listItemComponents.clear();

        this.counters.forEach(counter => {
            this.createAndAppendCounterItem(counter);
        });
    }

    private createAndAppendCounterItem(counter: Counter): CounterListItemComponent {
        if (!this.listHostDiv) this.ensureListHostStructure();

        const itemComponent = new CounterListItemComponent(this.location, counter, this.itemCallbacks);
        this.listItemComponents.set(counter.id, itemComponent);
        if(this.listHostDiv) { // Check again as ensureListHostStructure might not run if element exists but listHostDiv is undefined
             itemComponent.appendTo(this.listHostDiv);
        } else {
            console.error("CounterListComponent: listHostDiv not available for appending counter item.");
        }
        return itemComponent;
    }

    private insertCounterItemSorted(counter: Counter): void {
        if (!this.listHostDiv) {
            this.renderFullList();
            if (!this.listHostDiv) return;
        }

        const itemComponent = new CounterListItemComponent(this.location, counter, this.itemCallbacks);
        this.listItemComponents.set(counter.id, itemComponent);
        const newItemElement = itemComponent.getElement();

        let inserted = false;
        const sortedIndex = this.counters.findIndex(c => c.id === counter.id);

        if (this.counters.length === 1 || sortedIndex === this.counters.length - 1) {
             this.listHostDiv.appendChild(newItemElement);
             inserted = true;
        } else if (sortedIndex !== -1) {
            const nextCounterInSortedList = this.counters[sortedIndex + 1];
            if (nextCounterInSortedList) {
                const nextItemComponent = this.listItemComponents.get(nextCounterInSortedList.id);
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
     * Updates the reference to the parent location. This is important if the location data
     * itself (e.g., name, address) changes, as CounterListItemComponent holds this reference.
     * @param location - The updated parent location data.
     */
    updateLocationReference(location: LocationModel): void {
        this.location = location;
        // Notify all child items about the potentially updated location context.
        // Children (CounterListItemComponent) will decide if they need to re-render based on this.
        this.listItemComponents.forEach(itemComp => {
            const counterInNewLocationRef = location.counters.find(c => c.id === itemComp.getCounterId());
            if (counterInNewLocationRef) {
                 itemComp.update(this.location, counterInNewLocationRef);
            } else {
                 // If counter somehow disappeared from the new location reference, remove it from list
                 itemComp.remove();
                 this.listItemComponents.delete(itemComp.getCounterId());
                 this.counters = this.counters.filter(c => c.id !== itemComp.getCounterId());
            }
        });
        // If counters array length changed due to removals, re-render if empty
        if (this.counters.length === 0 && this.listItemComponents.size === 0) {
            this.renderFullList();
        }
    }

    /**
     * Sets the counters to be displayed and triggers a full re-render of the list.
     * @param counters - An array of counters to display.
     */
    setCounters(counters: Counter[]): void {
        this.counters = this.sortCounters(counters || []);
        this.renderFullList();
    }

    /**
     * Adds a counter to the list and updates the DOM granularly.
     * If the list was empty, it performs a full re-render.
     * @param counter - The counter to add.
     */
    addCounter(counter: Counter): void {
        const wasEmpty = this.counters.length === 0;
        if (this.counters.find(c => c.id === counter.id)) return; // Avoid duplicates

        this.counters.push(counter);
        this.counters = this.sortCounters(this.counters);

        if (wasEmpty && this.counters.length > 0) {
            this.renderFullList();
            return;
        }

        this.ensureListHostStructure();
        this.insertCounterItemSorted(counter);
    }

    /**
     * Updates a counter in the list and updates the DOM granularly.
     * If the counter's name changes, its DOM position is updated to maintain sort order.
     * @param counter - The counter with updated data.
     */
    updateCounter(counter: Counter): void {
        const index = this.counters.findIndex(c => c.id === counter.id);
        if (index === -1) {
            this.addCounter(counter);
            return;
        }

        const oldCounterAtIndex = this.counters[index]!; // Assert non-null
        const oldName = oldCounterAtIndex.name; // Store old name

        this.counters[index] = counter; // Update in the internal array

        const itemComponent = this.listItemComponents.get(counter.id);
        if (!itemComponent) {
            this.renderFullList();
            return;
        }

        itemComponent.update(this.location, counter);

        if (oldName.localeCompare(counter.name) !== 0) { // Name is the sort key
            this.counters = this.sortCounters(this.counters);
            const currentElement = itemComponent.getElement();
            currentElement.remove();
            // itemComponent is still in the map, its element is just detached.
            this.insertCounterItemSorted(counter); // Re-insert based on new sorted order
        }
    }

    /**
     * Removes a counter from the list and updates the DOM granularly.
     * If the list becomes empty, it shows the "no counters" message.
     * @param counterId - The ID of the counter to remove.
     */
    removeCounter(counterId: string): void {
        this.counters = this.counters.filter(c => c.id !== counterId);
        const itemComponent = this.listItemComponents.get(counterId);
        if (itemComponent) {
            itemComponent.remove();
            this.listItemComponents.delete(counterId);
        }

        if (this.counters.length === 0) {
            this.renderFullList();
        }
    }

    /**
     * Toggles the visibility of the area management section for a specific counter.
     * Ensures only one counter's areas are shown at a time.
     * @param counterId - The ID of the counter whose areas to show/hide.
     * @param show - True to show, false to hide.
     */
    toggleAreaManagementForCounter(counterId: string, show: boolean): void {
        this.listItemComponents.forEach((item, id) => {
            if (id === counterId) {
                item.toggleAreasManagementVisibility(show);
            } else {
                item.toggleAreasManagementVisibility(false); // Hide for all others
            }
        });
    }
}
console.log("CounterListComponent loaded.");
