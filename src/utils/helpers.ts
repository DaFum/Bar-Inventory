/**
 * Generiert eine lokal eindeutige ID mit optionalem Präfix.
 *
 * Die ID setzt sich aus dem angegebenen Präfix und einer zufälligen alphanumerischen Zeichenkette zusammen. Nicht für sicherheitskritische oder kryptografische Zwecke geeignet.
 *
 * @param prefix - Optionales Präfix für die ID (Standard: 'id')
 * @returns Die generierte ID als Zeichenkette
 */
export function generateId(prefix: string = 'id'): string {
    const randomPart = Math.random().toString(36).substring(2, 11);
    return `${prefix}_${randomPart}`;
}

/**
 * Gibt eine entprellte Version der übergebenen Funktion zurück, die erst nach Ablauf der angegebenen Verzögerung nach dem letzten Aufruf ausgeführt wird.
 *
 * @param func - Die Funktion, die entprellt werden soll
 * @param delay - Die Zeit in Millisekunden, die nach dem letzten Aufruf abgewartet wird, bevor die Funktion ausgeführt wird
 * @returns Eine Funktion, die das Entprellen übernimmt und die Ausführung von `func` verzögert
 */
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func.apply(this, args);
            // Removed incorrect line: func.apply(context, args);
            timeoutId = null;
        }, delay);
    }
}

/**
 * Gibt das angegebene Datum als lokalisierte Zeichenkette mit Jahr, Monat, Tag, Stunde, Minute und Sekunde zurück.
 *
 * @param date - Das zu formatierende Datum
 * @param locale - Die gewünschte Locale für die Formatierung (Standard: 'de-DE')
 * @returns Die formatierte Datums- und Uhrzeitzeichenkette entsprechend der angegebenen Locale
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

// console.log("Helper utilities loaded.");

export const PREDEFINED_CATEGORIES = [
    "Spirituose", "Bier", "Wein", "Softdrink", "Sirup", "Sonstiges"
];
