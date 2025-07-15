/**
 * DOM testing utilities for component tests
 */

export const domTestHelpers = {
    /**
     * Simulate user typing in an input field
     */
    simulateTyping: (element: HTMLInputElement | HTMLTextAreaElement, text: string) => {
        element.focus();
        element.value = text;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    },
    
    /**
     * Simulate form submission via Enter key
     */
    simulateEnterKeySubmission: (element: HTMLElement) => {
        const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(enterEvent);
    },
    
    /**
     * Simulate Escape key press
     */
    simulateEscapeKey: (element: HTMLElement) => {
        const escapeEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(escapeEvent);
    },
    
    /**
     * Simulate tab navigation
     */
    simulateTabNavigation: (fromElement: HTMLElement, direction: 'forward' | 'backward' = 'forward') => {
        const tabEvent = new KeyboardEvent('keydown', {
            key: 'Tab',
            shiftKey: direction === 'backward',
            bubbles: true,
            cancelable: true
        });
        fromElement.dispatchEvent(tabEvent);
    },
    
    /**
     * Check if element is properly focused
     */
    isFocused: (element: HTMLElement): boolean => {
        return document.activeElement === element;
    },
    
    /**
     * Get all focusable elements within a container
     */
    getFocusableElements: (container: HTMLElement): HTMLElement[] => {
        const focusableSelectors = [
            'input:not([disabled]):not([tabindex="-1"])',
            'textarea:not([disabled]):not([tabindex="-1"])',
            'button:not([disabled]):not([tabindex="-1"])',
            'select:not([disabled]):not([tabindex="-1"])',
            '[tabindex]:not([tabindex="-1"])'
        ].join(', ');
        
        return Array.from(container.querySelectorAll(focusableSelectors));
    },
    
    /**
     * Simulate clipboard paste operation
     */
    simulatePaste: (element: HTMLElement, text: string) => {
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', text);
        
        const pasteEvent = new ClipboardEvent('paste', {
            clipboardData: dataTransfer,
            bubbles: true,
            cancelable: true
        });
        
        element.dispatchEvent(pasteEvent);
    },
    
    /**
     * Wait for next animation frame (useful for async DOM updates)
     */
    waitForNextFrame: (): Promise<void> => {
        return new Promise(resolve => requestAnimationFrame(() => resolve()));
    },
    
    /**
     * Create mock file for file input testing
     */
    createMockFile: (name: string, size: number, type: string): File => {
        const blob = new Blob([''], { type });
        const file = new File([blob], name, { type });
        Object.defineProperty(file, 'size', { value: size });
        return file;
    }
};