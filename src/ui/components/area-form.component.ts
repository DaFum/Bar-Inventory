import { BaseComponent } from '../core/base-component';
import { Area } from '../../models';
import { escapeHtml } from '../../utils/security';
import { showToast } from './toast-notifications';

export type AreaFormSubmitCallback = (
    areaData: Pick<Area, 'id' | 'name' | 'description' | 'displayOrder'>
) => Promise<void>;
export type AreaFormCancelCallback = () => void;

export interface AreaFormComponentOptions {
    area?: Area;
    onSubmit: AreaFormSubmitCallback;
    onCancel: AreaFormCancelCallback;
}

/**
 * Component for rendering and managing the area add/edit form.
 */
export class AreaFormComponent extends BaseComponent<HTMLDivElement> {
    /** The area currently being edited, or null if creating a new one. */
    public currentEditingArea: Area | null; // Public for potential external checks if needed
    private onSubmitCallback: AreaFormSubmitCallback;
    private onCancelCallback: AreaFormCancelCallback;

    private nameInput!: HTMLInputElement;
    private descriptionInput!: HTMLInputElement;
    private displayOrderInput!: HTMLInputElement;
    private formElement!: HTMLFormElement;
    private formTitleId = 'area-form-title-comp';

    /**
     * Creates an instance of AreaFormComponent.
     * @param options - Configuration options for the form.
     */
    constructor(options: AreaFormComponentOptions) {
        super('div');
        this.currentEditingArea = options.area || null;
        this.onSubmitCallback = options.onSubmit;
        this.onCancelCallback = options.onCancel;
        this.render();
    }

    render(): void {
        const area = this.currentEditingArea;
        this.element.innerHTML = `
            <h6 id="${this.formTitleId}">${area ? 'Bereich bearbeiten' : 'Neuen Bereich erstellen'}</h6>
            <form id="area-form-actual" aria-labelledby="${this.formTitleId}">
                <div class="form-group">
                    <label for="area-name-form-comp">Name des Bereichs:</label>
                    <input type="text" id="area-name-form-comp" value="${escapeHtml(area?.name || '')}" required class="form-control form-control-sm" aria-required="true">
                </div>
                <div class="form-group">
                    <label for="area-description-form-comp">Beschreibung (optional):</label>
                    <input type="text" id="area-description-form-comp" value="${escapeHtml(area?.description || '')}" class="form-control form-control-sm">
                </div>
                <div class="form-group">
                    <label for="area-display-order-form-comp">Anzeigereihenfolge (optional):</label>
                    <input type="number" id="area-display-order-form-comp" value="${area?.displayOrder || ''}" class="form-control form-control-sm">
                </div>
                <button type="submit" class="btn btn-success btn-xs">${area ? 'Änderungen speichern' : 'Bereich erstellen'}</button>
                <button type="button" id="cancel-area-edit-form-comp" class="btn btn-secondary btn-xs">Abbrechen</button>
            </form>
        `;
        this.bindElements();
        this.attachEventListeners();
    }

    private bindElements(): void {
        const form = this.element.querySelector<HTMLFormElement>('#area-form-actual');
        if (!form) throw new Error("Area form element not found during bind");
        this.formElement = form;

        const nameIn = this.element.querySelector<HTMLInputElement>('#area-name-form-comp');
        if (!nameIn) throw new Error("Area name input not found");
        this.nameInput = nameIn;

        const descIn = this.element.querySelector<HTMLInputElement>('#area-description-form-comp');
        if (!descIn) throw new Error("Area description input not found");
        this.descriptionInput = descIn;

        const orderIn = this.element.querySelector<HTMLInputElement>('#area-display-order-form-comp');
        if(!orderIn) throw new Error("Area display order input not found");
        this.displayOrderInput = orderIn;
    }

    private attachEventListeners(): void {
        this.formElement.addEventListener('submit', this.handleSubmit.bind(this));

        const cancelButton = this.element.querySelector<HTMLButtonElement>('#cancel-area-edit-form-comp');
        if (cancelButton) { // Should always exist
            cancelButton.addEventListener('click', this.handleCancel.bind(this));
        } else {
            console.warn("Cancel button not found in AreaFormComponent");
        }
    }

    private async handleSubmit(event: Event): Promise<void> {
        event.preventDefault();
        if (!this.nameInput.value.trim()) {
            showToast("Name des Bereichs darf nicht leer sein.", "error");
            this.nameInput.focus();
            return;
        }

        const displayOrderVal = this.displayOrderInput.value.trim();
        let displayOrderNum: number | undefined = undefined;
        if (displayOrderVal) {
            displayOrderNum = parseInt(displayOrderVal, 10);
            if (isNaN(displayOrderNum)) {
                 showToast("Anzeigereihenfolge muss eine gültige Zahl sein.", "error");
                 this.displayOrderInput.focus();
                 return;
            }
        }

        const areaData: Pick<Area, 'id' | 'name' | 'description' | 'displayOrder'> = {
            id: this.currentEditingArea?.id || '',
            name: this.nameInput.value.trim(),
            description: this.descriptionInput.value.trim() || undefined,
            displayOrder: displayOrderNum
        };

        try {
            await this.onSubmitCallback(areaData);
        } catch (error) {
            console.error("AreaFormComponent: Error during submission callback", error);
            // User feedback for store errors should be handled by the caller of the store method.
        }
    }

    private handleCancel(): void {
        this.onCancelCallback();
    }

    /**
     * Shows the form, optionally pre-filled with area data for editing.
     * @param area - Optional area data to edit. If undefined, form is for a new area.
     */
    public show(area?: Area): void {
        this.currentEditingArea = area || null;
        const isEditing = !!area;

        this.nameInput.value = area?.name || '';
        this.descriptionInput.value = area?.description || '';
        this.displayOrderInput.value = area?.displayOrder?.toString() || '';

        const titleElement = this.element.querySelector<HTMLHeadingElement>(`#${this.formTitleId}`);
        if (titleElement) {
            titleElement.textContent = isEditing ? 'Bereich bearbeiten' : 'Neuen Bereich erstellen';
        }
        const submitButton = this.formElement?.querySelector<HTMLButtonElement>('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = isEditing ? 'Änderungen speichern' : 'Bereich erstellen';
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
        this.currentEditingArea = null;
    }
}
console.log("AreaFormComponent loaded.");
