import { BaseComponent } from '../core/base-component';
import { Counter } from '../../models';
import { escapeHtml } from '../../utils/security';
import { showToast } from './toast-notifications';

export type CounterFormSubmitCallback = (
    counterData: Pick<Counter, 'id' | 'name' | 'description'>
) => Promise<void>;
export type CounterFormCancelCallback = () => void;

export interface CounterFormComponentOptions {
    counter?: Counter;
    onSubmit: CounterFormSubmitCallback;
    onCancel: CounterFormCancelCallback;
}

/**
 * Component for rendering and managing the counter add/edit form.
 */
export class CounterFormComponent extends BaseComponent<HTMLDivElement> {
    /** The counter currently being edited, or null if creating a new one. */
    public currentEditingCounter: Counter | null; // Public for location-manager to check
    private onSubmitCallback: CounterFormSubmitCallback;
    private onCancelCallback: CounterFormCancelCallback;

    private nameInput!: HTMLInputElement;
    private descriptionInput!: HTMLInputElement;
    private formElement!: HTMLFormElement;
    private formTitleId = 'counter-form-title-comp';

    /**
     * Creates an instance of CounterFormComponent.
     * @param options - Configuration options for the form.
     */
    constructor(options: CounterFormComponentOptions) {
        super('div');
        this.currentEditingCounter = options.counter || null;
        this.onSubmitCallback = options.onSubmit;
        this.onCancelCallback = options.onCancel;
        this.render();
    }

    render(): void {
        const counter = this.currentEditingCounter;
        this.element.innerHTML = `
            <h5 id="${this.formTitleId}">${counter ? 'Tresen bearbeiten' : 'Neuen Tresen erstellen'}</h5>
            <form id="counter-form-actual" aria-labelledby="${this.formTitleId}">
                <div class="form-group">
                    <label for="counter-name-form-comp">Name des Tresens:</label>
                    <input type="text" id="counter-name-form-comp" value="${escapeHtml(counter?.name || '')}" required class="form-control form-control-sm" aria-required="true">
                </div>
                <div class="form-group">
                    <label for="counter-description-form-comp">Beschreibung (optional):</label>
                    <input type="text" id="counter-description-form-comp" value="${escapeHtml(counter?.description || '')}" class="form-control form-control-sm">
                </div>
                <button type="submit" class="btn btn-success btn-sm">${counter ? 'Änderungen speichern' : 'Tresen erstellen'}</button>
                <button type="button" id="cancel-counter-edit-form-comp" class="btn btn-secondary btn-sm">Abbrechen</button>
            </form>
        `;
        this.bindElements();
        this.attachEventListeners();
    }

    private bindElements(): void {
        const form = this.element.querySelector<HTMLFormElement>('#counter-form-actual');
        if (!form) throw new Error("Counter form element not found during bind");
        this.formElement = form;

        const nameIn = this.element.querySelector<HTMLInputElement>('#counter-name-form-comp');
        if (!nameIn) throw new Error("Counter name input not found");
        this.nameInput = nameIn;

        const descIn = this.element.querySelector<HTMLInputElement>('#counter-description-form-comp');
        if (!descIn) throw new Error("Counter description input not found");
        this.descriptionInput = descIn;
    }

    private attachEventListeners(): void {
        this.formElement.addEventListener('submit', this.handleSubmit.bind(this));

        const cancelButton = this.element.querySelector<HTMLButtonElement>('#cancel-counter-edit-form-comp');
        if (cancelButton) { // Should always exist
            cancelButton.addEventListener('click', this.handleCancel.bind(this));
        } else {
            console.warn("Cancel button not found in CounterFormComponent");
        }
    }

    private async handleSubmit(event: Event): Promise<void> {
        event.preventDefault();
        if (!this.nameInput.value.trim()) {
            showToast("Name des Tresens darf nicht leer sein.", "error");
            this.nameInput.focus();
            return;
        }

        const nameValue = this.nameInput.value.trim();
        const descriptionValue = this.descriptionInput.value.trim();

        const counterDataToSubmit: Pick<Counter, 'id' | 'name' | 'description'> = {
            id: this.currentEditingCounter?.id || '',
            name: nameValue,
        };

        if (descriptionValue) { // Only add if not an empty string
            counterDataToSubmit.description = descriptionValue;
        }

        try {
            await this.onSubmitCallback(counterDataToSubmit);
        } catch (error) {
            // User feedback for store errors should be handled by the caller of the store method.
            console.error("CounterFormComponent: Error during submission callback", error);
        }
    }

    private handleCancel(): void {
        this.onCancelCallback();
    }

    /**
     * Shows the form, optionally pre-filled with counter data for editing.
     * @param counter - Optional counter data to edit. If undefined, form is for a new counter.
     */
    public show(counter?: Counter): void {
        this.currentEditingCounter = counter || null;
        const isEditing = !!counter;

        this.nameInput.value = counter?.name || '';
        this.descriptionInput.value = counter?.description || '';

        const titleElement = this.element.querySelector<HTMLHeadingElement>(`#${this.formTitleId}`);
        if (titleElement) {
            titleElement.textContent = isEditing ? 'Tresen bearbeiten' : 'Neuen Tresen erstellen';
        }
        const submitButton = this.formElement?.querySelector<HTMLButtonElement>('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = isEditing ? 'Änderungen speichern' : 'Tresen erstellen';
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
        this.currentEditingCounter = null;
    }
}
console.log("CounterFormComponent loaded.");
