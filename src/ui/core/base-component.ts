/**
 * Represents a base class for UI components.
 * @template T - The type of the root HTML element for this component.
 */
export class BaseComponent<T extends HTMLElement> {
    protected readonly element: T;

    /**
     * Creates an instance of BaseComponent.
     * @param tagName - The HTML tag name for the root element of the component.
     * @param id - Optional ID for the root element.
     * @param classNames - Optional array of CSS class names to apply to the root element.
     */
    constructor(tagName: keyof HTMLElementTagNameMap, id?: string, classNames?: string[]) {
        this.element = document.createElement(tagName) as T;
        if (id) {
            this.element.id = id;
        }
        if (classNames) {
            this.element.classList.add(...classNames);
        }
    }

    /**
     * Gets the root HTML element of the component.
     * @returns The root HTML element.
     */
    getElement(): T {
        return this.element;
    }

    /**
     * Appends the component's root element to a parent HTML element.
     * @param parentElement - The HTML element to append this component to.
     */
    appendTo(parentElement: HTMLElement): void {
        parentElement.appendChild(this.element);
    }

    /**
     * Removes the component's root element from the DOM.
     */
    remove(): void {
        this.element.remove();
    }

    /**
     * Renders the component. This method is intended to be overridden by subclasses
     * to populate the component's element with content and attach event listeners.
     *
     * Subclasses should call super.render() if they wish to chain functionality,
     * or simply implement their own rendering logic.
     */
    render(): void {
        // Base implementation can be empty or provide common setup.
        // Subclasses will override this to build their specific DOM structure
        // and attach event listeners.
    }

    /**
     * Sets the inner HTML of the component's root element.
     * Use with caution due to potential XSS risks if content is user-generated.
     * Prefer building DOM with `document.createElement` and `appendChild` or using a templating library.
     * @param html - The HTML string to set.
     */
    protected setHtml(html: string): void {
        this.element.innerHTML = html;
    }

    /**
     * Appends a child element to the component's root element.
     * @param child - The child element to append.
     */
    protected appendChild(child: HTMLElement | BaseComponent<any>): void {
        if (child instanceof BaseComponent) {
            this.element.appendChild(child.getElement());
        } else {
            this.element.appendChild(child);
        }
    }

    /**
     * Adds an event listener to the component's root element.
     * @param type - The event type.
     * @param listener - The event listener.
     * @param options - Optional event listener options.
     */
    protected addEventListener<K extends keyof HTMLElementEventMap>(
        type: K,
        listener: (this: T, ev: HTMLElementEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ): void {
        this.element.addEventListener(type, listener as EventListener, options);
    }

    /**
     * Removes an event listener from the component's root element.
     * @param type - The event type.
     * @param listener - The event listener.
     * @param options - Optional event listener options.
     */
    protected removeEventListener<K extends keyof HTMLElementEventMap>(
        type: K,
        listener: (this: T, ev: HTMLElementEventMap[K]) => any,
        options?: boolean | EventListenerOptions
    ): void {
        this.element.removeEventListener(type, listener as EventListener, options);
    }
}
