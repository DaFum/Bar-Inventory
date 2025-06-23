/**
 * Wandelt HTML-Sonderzeichen in einer Zeichenkette in ihre entsprechenden HTML-Entitäten um, um Cross-Site-Scripting (XSS) zu verhindern.
 *
 * Gibt eine leere Zeichenkette zurück, wenn der Eingabewert `undefined` oder `null` ist.
 *
 * @param str - Die zu maskierende Zeichenkette
 * @returns Die maskierte Zeichenkette mit ersetzten HTML-Sonderzeichen
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
