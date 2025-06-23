let toastContainer: HTMLElement | null = null;

function ensureToastContainer(): HTMLElement {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-notifications-container';
        // Basic styling for the container - can be enhanced in CSS
        toastContainer.style.position = 'fixed';
        toastContainer.style.bottom = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '1000';
        toastContainer.style.display = 'flex';
        toastContainer.style.flexDirection = 'column';
        toastContainer.style.gap = '10px';
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export function showToast(message: string, type: ToastType = 'info', duration: number = 3000): void {
    const container = ensureToastContainer();

    const toastElement = document.createElement('div');
    toastElement.className = `toast toast-${type}`; // CSS classes for styling
    toastElement.textContent = message;

    // Accessibility attributes
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');

    // Basic styling for toast - can be enhanced in CSS
    toastElement.style.padding = '10px 20px';
    toastElement.style.borderRadius = '4px';
    toastElement.style.color = 'white';
    toastElement.style.opacity = '0.9';
    toastElement.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    toastElement.style.transform = 'translateX(100%)'; // Start off-screen

    switch (type) {
        case 'success':
            toastElement.style.backgroundColor = '#2ecc71'; // Green
            break;
        case 'error':
            toastElement.style.backgroundColor = '#e74c3c'; // Red
            break;
        case 'warning':
            toastElement.style.backgroundColor = '#f39c12'; // Orange
            break;
        case 'info':
        default:
            toastElement.style.backgroundColor = '#3498db'; // Blue
            break;
    }

    container.appendChild(toastElement);

    // Animate in
    setTimeout(() => {
        toastElement.style.transform = 'translateX(0)';
    }, 10); // Small delay to allow CSS transition to catch

    // Auto-dismiss
    setTimeout(() => {
        toastElement.style.opacity = '0';
        toastElement.style.transform = 'translateX(100%)';
        setTimeout(() => {
            toastElement.remove();
            if (container.childElementCount === 0) {
                // Optionally remove container if empty, or keep it for future toasts
                // toastContainer.remove();
                // toastContainer = null;
            }
        }, 500); // Wait for fade out animation
    }, duration);
}

console.log("Toast Notification module loaded.");
