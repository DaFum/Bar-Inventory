/**
 * Erzeugt eine einfache, lokal eindeutige ID mit einem angegebenen Präfix.
 *
 * Die ID besteht aus dem Präfix, gefolgt von einem Unterstrich und einer zufälligen alphanumerischen Zeichenkette.
 * Nicht für kryptografische Zwecke geeignet.
 *
 * @param prefix - Das Präfix für die generierte ID (Standard: 'id')
 * @returns Die generierte eindeutige ID als Zeichenkette
 */
export function generateId(prefix: string = 'id'): string {
    const randomPart = Math.random().toString(36).substring(2, 11);
    return `${prefix}_${randomPart}`;
}

/**
 * Gibt eine entprellte Version der übergebenen Funktion zurück, die erst nach Ablauf der angegebenen Verzögerung seit dem letzten Aufruf ausgeführt wird.
 *
 * @param func - Die zu entprellende Funktion
 * @param delay - Die Verzögerung in Millisekunden
 * @returns Die entprellte Funktion
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
 * Formatiert ein Datum als lokalisierte Zeichenkette mit Jahr, Monat, Tag, Stunde, Minute und Sekunde.
 *
 * @param date - Das zu formatierende Datum
 * @param locale - Die zu verwendende Locale (Standard: 'de-DE')
 * @returns Die formatierte Datums- und Uhrzeitzeichenkette
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
