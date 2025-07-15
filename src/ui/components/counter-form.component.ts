import { BaseComponent } from '../core/base-component';
import { Counter } from '../../models';
import { escapeHtml } from '../../utils/security';
import { showToast } from './toast-notifications';

export type CounterFormSubmitCallback = (
  counterData: Pick<Counter, 'id' | 'name' | 'description'>,
) => Promise<void>;
export type CounterFormCancelCallback = () => void;

export interface CounterFormOptions {
  onSubmit: CounterFormSubmitCallback;
  onCancel: CounterFormCancelCallback;
}

export class CounterFormComponent extends BaseComponent<HTMLDivElement> {
  public currentEditingCounter: Counter | null = null;
  private readonly onSubmit: CounterFormSubmitCallback;
  private readonly onCancel: CounterFormCancelCallback;
  private nameInput!: HTMLInputElement;
  private descriptionInput!: HTMLInputElement;
  private form!: HTMLFormElement;

  constructor(container: HTMLElement, options: CounterFormOptions) {
    super('div');
    this.element.classList.add('hidden');
    this.onSubmit = options.onSubmit;
    this.onCancel = options.onCancel;
    container.appendChild(this.element);
    this.render();
  }

  public show(counter?: Counter): void {
    this.currentEditingCounter = counter || null;
    this.render();
    this.element.classList.remove('hidden');
    this.nameInput.focus();
  }

  public hide(): void {
    this.element.classList.add('hidden');
  }

  public destroy(): void {
    this.element.remove();
  }

  render(): void {
    const isEditing = !!this.currentEditingCounter;
    const title = isEditing ? 'Tresen bearbeiten' : 'Neuen Tresen erstellen';
    const buttonText = isEditing ? 'Änderungen speichern' : 'Tresen erstellen';
    const name = this.currentEditingCounter?.name || '';
    const description = this.currentEditingCounter?.description || '';

    this.element.innerHTML = `
      <div class="counter-form-component">
        <h5>${title}</h5>
        <form>
          <div class="form-group">
            <label for="counter-name-form-comp">Name</label>
            <input type="text" id="counter-name-form-comp" class="form-control" value="${escapeHtml(name)}" required>
          </div>
          <div class="form-group">
            <label for="counter-description-form-comp">Beschreibung</label>
            <input type="text" id="counter-description-form-comp" class="form-control" value="${escapeHtml(description)}">
          </div>
          <button type="submit" class="btn btn-primary">${buttonText}</button>
          <button type="button" class="btn btn-secondary cancel-btn">Abbrechen</button>
        </form>
      </div>
    `;

    this.bindElements();
    this.attachEventListeners();
  }

  private bindElements(): void {
    this.form = this.element.querySelector('form')!;
    this.nameInput = this.element.querySelector('#counter-name-form-comp') as HTMLInputElement;
    this.descriptionInput = this.element.querySelector('#counter-description-form-comp') as HTMLInputElement;
  }

  private attachEventListeners(): void {
    this.form.addEventListener('submit', this.handleFormSubmit.bind(this));
    const cancelButton = this.element.querySelector('.cancel-btn');
    cancelButton?.addEventListener('click', this.handleCancel.bind(this));
  }

  private async handleFormSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const name = this.nameInput.value.trim();
    if (!name) {
      showToast('Name is required.', 'error');
      return;
    }

    const description = this.descriptionInput.value.trim();
    const counterData: Pick<Counter, 'id' | 'name' | 'description'> = {
      id: this.currentEditingCounter?.id || '',
      name,
      description,
    };

    try {
      await this.onSubmit(counterData);
      this.hide();
    } catch (error) {
      showToast('Error saving counter.', 'error');
      console.error('Failed to save counter:', error);
    }
  }

  private handleCancel(): void {
    this.hide();
    if (this.onCancel) {
      this.onCancel();
    }
  }
}
