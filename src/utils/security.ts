/**
 * Maskiert spezielle HTML-Zeichen in einer Zeichenkette durch ihre entsprechenden HTML-Entitäten, um Cross-Site-Scripting (XSS) zu verhindern.
 *
 * Gibt eine leere Zeichenkette zurück, wenn der Eingabewert `undefined` oder `null` ist.
 *
 * @param str - Die zu maskierende Zeichenkette oder `undefined`/`null`
 * @returns Die Zeichenkette mit ersetzten HTML-Sonderzeichen
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
