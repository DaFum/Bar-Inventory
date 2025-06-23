/**
 * Generates a simple unique ID.
 * Prefixes with a given type string.
 * Example: generateId('user') -> "user_q5xmdi72l"
 * Not cryptographically secure, but good enough for local unique IDs.
 */
export function generateId(prefix: string = 'id'): string {
    const randomPart = Math.random().toString(36).substring(2, 11);
    return `${prefix}_${randomPart}`;
}

/**
 * Debounces a function, ensuring it's only called after a certain delay
 * since the last time it was invoked.
 * @param func The function to debounce.
 * @param delay The debounce delay in milliseconds.
 * @returns A debounced version of the function.
 */
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
        const context = this;
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}

/**
 * Formats a date object into a string.
 * Example: formatDate(new Date()) -> "YYYY-MM-DD HH:mm:ss"
 */
export function formatDate(date: Date, locale: string = 'de-DE'): string {
    return date.toLocaleString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

console.log("Helper utilities loaded.");
