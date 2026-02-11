import { BaseComponent } from '../core/base-component';
import { Location } from '../../models';
import { escapeHtml } from '../../utils/security';
import { showToast } from './toast-notifications'; // For potential inline validation feedback

export type LocationFormSubmitCallback = (locationData: Pick<Location, 'id' | 'name' | 'address'>) => Promise<void>;
export type LocationFormCancelCallback = () => void;

export interface LocationFormComponentOptions {
    location?: Location; // Location to edit, undefined for new location
    onSubmit: LocationFormSubmitCallback;
    onCancel: LocationFormCancelCallback;
}

/**
 * Component for rendering and managing the location add/edit form.
 * This form handles basic location details like name and address.
 */
export class LocationFormComponent extends BaseComponent<HTMLDivElement> {
    /** The location currently being edited, or null if creating a new one. */
    public currentEditingLocation: Location | null = null;
    private onSubmitCallback: LocationFormSubmitCallback;
    private onCancelCallback: LocationFormCancelCallback;

    private nameInput!: HTMLInputElement;
    private addressInput!: HTMLInputElement;
    private formElement!: HTMLFormElement;
    private formTitleId = 'location-form-title-comp'; // Unique ID for ARIA

    /**
     * Creates an instance of LocationFormComponent.
     * @param options - Configuration options for the form.
     */
    constructor(options: LocationFormComponentOptions) {
        super('div');
        this.currentEditingLocation = options.location || null;
        this.onSubmitCallback = options.onSubmit;
        this.onCancelCallback = options.onCancel;
        this.render();
    }

    render(): void {
        const location = this.currentEditingLocation;
        this.element.innerHTML = `
            <h3 id="${this.formTitleId}" class="panel-subtitle">${location ? 'Edit Location' : 'Create New Location'}</h3>
            <form id="location-form-actual" aria-labelledby="${this.formTitleId}">
                <div class="form-group">
                    <label for="location-name-form-comp">Location Name:</label>
                    <input type="text" id="location-name-form-comp" value="${escapeHtml(location?.name || '')}" required class="form-control" aria-required="true">
                </div>
                <div class="form-group">
                    <label for="location-address-form-comp">Address (optional):</label>
                    <input type="text" id="location-address-form-comp" value="${escapeHtml(location?.address || '')}" class="form-control">
                </div>
                <button type="submit" class="btn btn-success">${location ? 'Save Changes' : 'Create Location'}</button>
                <button type="button" id="cancel-location-edit-form-comp" class="btn btn-secondary">Cancel</button>
            </form>
        `;
        this.bindElements();
        this.attachEventListeners();
    }

    private bindElements(): void {
        const form = this.element.querySelector<HTMLFormElement>('#location-form-actual');
        if (!form) throw new Error("Location form element not found during bind");
        this.formElement = form;

        const nameInput = this.element.querySelector<HTMLInputElement>('#location-name-form-comp');
        if (!nameInput) throw new Error("Location name input not found");
        this.nameInput = nameInput;

        const addressInput = this.element.querySelector<HTMLInputElement>('#location-address-form-comp');
        if (!addressInput) throw new Error("Location address input not found");
        this.addressInput = addressInput;
    }

    private attachEventListeners(): void {
        this.formElement.addEventListener('submit', this.handleSubmit.bind(this));

        const cancelButton = this.element.querySelector<HTMLButtonElement>('#cancel-location-edit-form-comp');
        if (cancelButton) { // Should always exist
            cancelButton.addEventListener('click', this.handleCancel.bind(this));
        } else {
            console.warn("Cancel button not found in LocationFormComponent");
        }
    }

    private async handleSubmit(event: Event): Promise<void> {
        event.preventDefault();
        if (!this.nameInput.value.trim()) {
            showToast("Name des Standorts darf nicht leer sein.", "error");
            this.nameInput.focus();
            return;
        }

        const name = this.nameInput.value.trim();
        const addressValue = this.addressInput.value.trim();

        const dataForCallback: Pick<Location, 'id' | 'name' | 'address'> = {
            id: this.currentEditingLocation?.id || '',
            name: name, // Uses existing 'name'
            // 'address' will be added conditionally
        };

        if (addressValue) { // Uses existing 'addressValue'; only add 'address' if it's not an empty string
            dataForCallback.address = addressValue;
        }
        // If addressValue is empty, dataForCallback.address remains undefined (omitted property),
        // which is correct for an optional property under exactOptionalPropertyTypes.

        try {
            await this.onSubmitCallback(dataForCallback);
        } catch (error) {
            console.error("LocationFormComponent: Error during submission callback", error);
        }
    }

    private handleCancel(): void {
        this.onCancelCallback();
    }

    /**
     * Shows the form, optionally pre-filled with location data for editing.
     * @param location - Optional location data to edit. If undefined, form is for a new location.
     */
    public show(location?: Location): void {
        this.currentEditingLocation = location || null;
        const isEditing = !!location;

        // Update form fields
        this.nameInput.value = location?.name || '';
        this.addressInput.value = location?.address || '';

        const titleElement = this.element.querySelector<HTMLHeadingElement>(`#${this.formTitleId}`);
        if (titleElement) {
            titleElement.textContent = isEditing ? 'Standort bearbeiten' : 'Neuen Standort erstellen';
        }
        const submitButton = this.formElement?.querySelector<HTMLButtonElement>('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = isEditing ? 'Änderungen speichern' : 'Standort erstellen';
        }
        this.element.style.display = 'block';
        this.nameInput.focus();
    }

    /**
     * Hides the form and resets its editing state.
     * Form field values are not explicitly reset here, assuming `show()` will always repopulate.
     */
    public hide(): void {
        this.element.style.display = 'none';
        this.currentEditingLocation = null;
    }
}
console.log("LocationFormComponent loaded.");
