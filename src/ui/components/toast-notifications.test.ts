import { ToastType } from './toast-notifications'; // Add ToastType back

describe('Toast Notifications', () => {
  let showToast: typeof import('./toast-notifications').showToast;
  // ToastType can still be imported at top for type annotations if needed, or use import('./module').ToastType

  beforeEach(() => {
    // Reset modules to ensure toast-notifications.ts gets a fresh internal state (toastContainer = null)
    jest.resetModules();

    // Re-require the module to get the fresh version with reset internal state
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const toastModule = require('./toast-notifications');
    showToast = toastModule.showToast;

    // Ensure a clean DOM slate for the toast container for each test
    const existingDomContainer = document.getElementById('toast-notifications-container');
    existingDomContainer?.remove();
  });

  afterEach(() => {
    // Clean up any created toast containers after each test
    const container = document.getElementById('toast-notifications-container');
    container?.remove();
    jest.clearAllTimers(); // Clear any pending timers
  });

  // Helper to get the current toast container from the DOM
  const getToastContainer = () => document.getElementById('toast-notifications-container');

  test('should create a toast container if it does not exist', () => {
    expect(getToastContainer()).toBeNull();
    showToast('Test message', 'info', 10); // Short duration for test
    expect(getToastContainer()).not.toBeNull();
    expect(getToastContainer()?.id).toBe('toast-notifications-container');
  });

  test('should display a toast message with the correct text and type', () => {
    const message = 'This is a success toast!';
    showToast(message, 'success', 10);

    const container = getToastContainer();
    expect(container?.childElementCount).toBe(1);
    const toastElement = container?.firstChild as HTMLElement;

    expect(toastElement).not.toBeNull();
    if (!toastElement) return; // Guard for TypeScript
    expect(toastElement.textContent).toBe(message);
    expect(toastElement.classList.contains('toast')).toBe(true);
    expect(toastElement.classList.contains('toast-success')).toBe(true);
    expect(toastElement.style.backgroundColor).toBe('rgb(46, 204, 113)'); // #2ecc71
  });

  test.each([
    ['success', 'rgb(46, 204, 113)'], // #2ecc71
    ['error', 'rgb(231, 76, 60)'],    // #e74c3c
    ['warning', 'rgb(243, 156, 18)'], // #f39c12
    ['info', 'rgb(52, 152, 219)'],    // #3498db
  ])('should apply correct background color for type "%s"', (type, expectedColor) => {
    showToast('Test', type as ToastType, 10);
    const toastElement = getToastContainer()?.firstChild as HTMLElement;
    expect(toastElement).not.toBeNull();
    if (!toastElement) return;
    expect(toastElement.style.backgroundColor).toBe(expectedColor);
  });

  test('should set accessibility attributes on the toast element', () => {
    showToast('Accessible toast', 'info', 10);
    const toastElement = getToastContainer()?.firstChild as HTMLElement;
    expect(toastElement).not.toBeNull();
    if (!toastElement) return;
    expect(toastElement.getAttribute('role')).toBe('alert');
    expect(toastElement.getAttribute('aria-live')).toBe('assertive');
  });

  test('should animate toast in', (done) => {
    jest.useFakeTimers();
    showToast('Animating in', 'info', 100);
    const toastElement = getToastContainer()?.firstChild as HTMLElement;
    expect(toastElement).not.toBeNull();
    if (!toastElement) { done.fail("Toast element not found"); return; }

    expect(toastElement.style.transform).toBe('translateX(100%)'); // Initial state

    jest.advanceTimersByTime(15); // Advance past the 10ms timeout for animation start

    // Check style after animation trigger timeout
    // Note: JSDOM doesn't actually run CSS transitions, so we check the style property directly.
    // This relies on the implementation detail of setting transform directly.
    expect(toastElement.style.transform).toMatch(/^translateX\(0(px)?\)$/);

    jest.useRealTimers(); // Restore real timers before done()
    done();
  });

  test('should automatically dismiss the toast after the specified duration', (done) => {
    jest.useFakeTimers();
    const duration = 500; // Use a short duration for testing
    showToast('Auto-dismiss test', 'info', duration);

    let toastElementInitial = getToastContainer()?.firstChild as HTMLElement;
    expect(toastElementInitial).not.toBeNull();
    if (!toastElementInitial) { done.fail("Initial toast element not found"); return; }


    // Advance timers to just before dismissal animation starts
    jest.advanceTimersByTime(duration - 1);
    let toastElementBeforeDismiss = getToastContainer()?.firstChild as HTMLElement;
    expect(toastElementBeforeDismiss).not.toBeNull();
    if (!toastElementBeforeDismiss) { done.fail("Toast element disappeared before dismiss animation"); return; }
    expect(toastElementBeforeDismiss.style.opacity).not.toBe('0');


    // Advance timers to trigger dismissal animation
    jest.advanceTimersByTime(1);
    let toastElementDismissing = getToastContainer()?.firstChild as HTMLElement;
    // It might still be in the DOM here but opacity and transform are changing
    expect(toastElementDismissing).not.toBeNull();
    if (!toastElementDismissing) { done.fail("Toast element disappeared when dismiss animation should start"); return; }
    expect(toastElementDismissing.style.opacity).toBe('0');
    expect(toastElementDismissing.style.transform).toBe('translateX(100%)');

    // Advance timers past the removal timeout (500ms after opacity change)
    jest.advanceTimersByTime(500);
    expect(getToastContainer()?.firstChild).toBeNull(); // Toast should be removed from DOM

    jest.useRealTimers();
    done();
  });

  test('should handle multiple toasts displayed sequentially', () => {
    showToast('First toast', 'info', 10);
    showToast('Second toast', 'success', 10);

    const container = getToastContainer();
    expect(container?.childElementCount).toBe(2);
    const toasts = container?.children;
    expect(toasts?.[0]!.textContent).toBe('First toast');
    expect(toasts?.[1]!.textContent).toBe('Second toast');
    expect((toasts?.[1] as HTMLElement).style.backgroundColor).toBe('rgb(46, 204, 113)');
  });

  // Test to ensure ensureToastContainer is robust (e.g., called multiple times)
  test('ensureToastContainer can be called multiple times without creating duplicate containers', () => {
    showToast('Toast 1', 'info', 10);
    const container1 = getToastContainer();
    showToast('Toast 2', 'info', 10);
    const container2 = getToastContainer();
    expect(container1).toBe(container2); // Should be the same container instance
    expect(document.querySelectorAll('#toast-notifications-container').length).toBe(1);
  });
});
