/**
 * Escapes HTML special characters to prevent XSS.
 * @param str The string to escape.
 * @returns The escaped string.
 */
export function escapeHtml(str: string | undefined | null): string {
    if (str === undefined || str === null) {
        return '';
    }
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
