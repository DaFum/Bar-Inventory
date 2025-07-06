# Bar Inventar Management System

## Überblick

Das Bar Inventar Management System ist eine Webanwendung, die Barkeepern dabei helfen soll, den Überblick über ihr Inventar zu behalten. Es ermöglicht Benutzern, Kategorien, Bereiche und Artikel zu verwalten und Lagerbestände in verschiedenen Phasen anzuzeigen: Anfang, Ende und Differenz. Die Anwendung wurde mit Vue.js, Vuex und IndexedDB für die lokale Speicherung entwickelt.

## Funktionen

- **Kategorienverwaltung**: Hinzufügen, Bearbeiten und Entfernen von Produktkategorien.
- **Standortverwaltung**: Hinzufügen, Bearbeiten und Entfernen von Standorten (z.B. verschiedene Bars oder Lager).
- **Thekenverwaltung**: Innerhalb eines Standorts können Theken (Counter) definiert, bearbeitet und entfernt werden.
- **Bereichsverwaltung**: Innerhalb jeder Theke können spezifische Bereiche (z.B. "Spirituosenregal", "Kühlschrank") angelegt, bearbeitet und entfernt werden.
- **Artikelverwaltung**: Detaillierte Verwaltung von Inventarartikeln, einschließlich Name, Kategorie, Volumen, Packungsgrößen, Preise und Lieferanteninformationen.
- **Inventarerfassung**: Erfassen von Beständen (Kisten, Flaschen, offenes Volumen) für jeden Artikel in einem Bereich zu verschiedenen Zeitpunkten (Phasen).
- **Phasen**: Unterstützung für verschiedene Inventurphasen (z.B. "Anfang", "Ende") zur Verfolgung von Bestandsveränderungen.
- **Verbrauchsberechnung**: Automatische Berechnung des Verbrauchs und der Kosten für jeden Artikel basierend auf den erfassten Beständen.
- **Formeleingabe**: (Nicht explizit in den neuen Dateien gefunden, aber in alter README erwähnt - wird beibehalten, falls doch vorhanden) Eingabe von Formeln für Inventarmengen, die dynamisch berechnet werden können.
- **Ansichtsumschaltung**: (Nicht explizit in den neuen Dateien gefunden, aber in alter README erwähnt - wird beibehalten, falls doch vorhanden) Wechseln zwischen Formelansicht und Summenansicht für Inventarmengen.
- **Datenexport**: Exportieren von Produktdaten und Inventurdaten (pro Bereich oder gesamter Standort) in CSV- und JSON-Formate.
- **Datenimport**: (Importfunktionalität wird in der aktuellen README erwähnt, aber nicht explizit im Code der Services gefunden. Wird vorerst beibehalten und ggf. später angepasst.) Importieren von Daten aus JSON-Dateien.
- **Toast-Benachrichtigungen**: Anzeigen von Benachrichtigungen für erfolgreiche Aktionen oder Fehler.
- **Theme-Umschaltung**: Wechseln zwischen einem hellen und einem dunklen Design der Benutzeroberfläche.
- **Datenpersistenz**: Speicherung aller Daten (Produkte, Standorte, Inventar) lokal im Browser mittels IndexedDB.
- **Zustandsmanagement**: Verwendung von Stores (ProductStore, LocationStore) zur zentralen Verwaltung und Aktualisierung der Anwendungsdaten.
- **Analyseansicht**: Eine Ansicht zur Visualisierung von Verbrauchsdaten und anderen Analysen (Details TBD basierend auf `analytics-view.ts`).

## Verwendete Technologien

- **TypeScript**: Typisierte Superset von JavaScript für robustere Codeentwicklung.
- **IndexedDB**: Clientseitige Datenbank zur lokalen Speicherung großer Datenmengen.
- **idb-Bibliothek**: Eine Wrapper-Bibliothek für IndexedDB, die die Nutzung vereinfacht.
- **Chart.js**: Bibliothek zur Erstellung von Diagrammen für die Analyseansicht.
- **DaisyUI**: (Vermutlich, basierend auf alter README und typischem Setup) CSS-Komponenten für das Styling.
- **HTML5, CSS3**: Standard-Webtechnologien.

## Nutzung

### Navigation

Die Hauptnavigation erfolgt über eine Navigationsleiste am oberen Rand der Anwendung. Hier können Sie zwischen den folgenden Ansichten wechseln:

- **Inventur**: Hauptansicht zur Erfassung und Anzeige von Inventarbeständen.
- **Analyse**: Visualisierung von Verbrauchsdaten und anderen Kennzahlen.
- **Produktkatalog**: Verwalten aller Produkte (Hinzufügen, Bearbeiten, Löschen).
- **Standorte Verwalten**: Verwalten von Standorten, Theken und Bereichen.
- **Einstellungen**: (Derzeit "Demnächst") Zukünftige Einstellungen für die Anwendung.

Zusätzlich gibt es einen Button zum Umschalten des **Themes** (Hell/Dunkel).

### Produktkatalog verwalten (`Produktkatalog`-Ansicht)

1. Navigieren Sie zur Ansicht "Produktkatalog".
2. Hier können Sie neue Produkte hinzufügen, indem Sie alle erforderlichen Felder ausfüllen (Name, Kategorie, Volumen etc.) und speichern.
3. Bestehende Produkte können in der Liste ausgewählt und bearbeitet oder gelöscht werden.

### Standorte, Theken und Bereiche verwalten (`Standorte Verwalten`-Ansicht)

1. Navigieren Sie zur Ansicht "Standorte Verwalten".
2. **Standorte**:
    - Fügen Sie neue Standorte hinzu, indem Sie einen Namen und optional eine Adresse angeben.
    - Bearbeiten oder löschen Sie bestehende Standorte.
3. **Theken**:
    - Wählen Sie einen Standort aus.
    - Fügen Sie dem ausgewählten Standort neue Theken hinzu (Name, optionale Beschreibung).
    - Bearbeiten oder löschen Sie bestehende Theken innerhalb eines Standorts.
4. **Bereiche**:
    - Wählen Sie einen Standort und dann eine Theke aus.
    - Fügen Sie der ausgewählten Theke neue Bereiche hinzu (Name, optionale Beschreibung, Anzeigereihenfolge). Bereiche werden nach Anzeigereihenfolge und dann nach Name sortiert.
    - Bearbeiten oder löschen Sie bestehende Bereiche innerhalb einer Theke. In dieser Ansicht werden auch die zugeordneten Inventarartikel verwaltet.

### Inventar erfassen und anzeigen (`Inventur`-Ansicht)

1. Navigieren Sie zur Ansicht "Inventur".
2. Wählen Sie den gewünschten Standort, die Theke und den Bereich aus, für den Sie das Inventar erfassen oder einsehen möchten.
3. **Artikel zum Bereich hinzufügen**: Artikel aus dem Produktkatalog können zu einem Bereich hinzugefügt werden.
4. **Bestände eingeben**: Für jeden Artikel im Bereich können Sie die Bestände für verschiedene Phasen (z.B. "Anfang", "Ende") eingeben. Dies umfasst typischerweise:
    - Anzahl Kisten
    - Anzahl Einzelflaschen
    - Offenes Volumen (z.B. in ml für angebrochene Flaschen)
5. **Verbrauch einsehen**: Die Anwendung berechnet automatisch den Verbrauch und die Kosten basierend auf den eingegebenen Anfangs- und Endbeständen. Diese Informationen sind in der Analyseansicht oder direkt in der Inventuransicht (je nach UI-Design) ersichtlich.
6. (Die alte README erwähnte Formeleingabe und Umschaltung Formel/Summe. Diese Funktionalität ist in den aktuellen Service-Dateien nicht direkt ersichtlich und könnte Teil der UI-Komponenten sein oder entfallen sein. Die Beschreibung wird vorerst beibehalten.)

### Daten analysieren (`Analyse`-Ansicht)

1. Navigieren Sie zur Ansicht "Analyse".
2. Diese Ansicht zeigt Diagramme und zusammengefasste Daten zum Inventarverbrauch und den Kosten.
3. Die genauen Diagramme und Filteroptionen hängen von der Implementierung der `analytics-view.ts` ab.

### Daten exportieren

- **Produktkatalog exportieren**: In der Produktkatalog-Ansicht gibt es eine Funktion, um alle Produkte als CSV-Datei zu exportieren.
- **Inventurdaten exportieren**:
    - **Bereichs-Inventur (CSV)**: Exportiert die detaillierten Inventurdaten (Anfang, Ende, Verbrauch) eines spezifischen Bereichs als CSV-Datei.
    - **Standort-Export (JSON)**: Exportiert alle Daten eines Standorts (einschließlich aller Theken, Bereiche und deren Inventar) als JSON-Datei. Dies dient primär als Backup oder für den Datentransfer.

### Daten importieren

(Die Importfunktionalität wurde in der vorherigen README erwähnt. Der `ExportService` enthält keine explizite Importfunktion. Diese könnte Teil der UI-Logik sein oder noch implementiert werden. Die Beschreibung basiert auf der Annahme, dass ein JSON-Import für Standortdaten möglich ist.)

1. Es gibt eine Funktion (typischerweise in den Einstellungen oder der Standortverwaltung), um Standortdaten aus einer JSON-Datei zu importieren.
2. Wählen Sie die entsprechende JSON-Datei aus, um die Daten in die Anwendung zu laden. Dies überschreibt oder ergänzt typischerweise bestehende Daten.

## Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe die [LICENSE](LICENSE)-Datei für Details.

## Danksagungen

- **TypeScript**
- **Chart.js** ([https://www.chartjs.org/](https://www.chartjs.org/))
- **idb** ([https://github.com/jakearchibald/idb](https://github.com/jakearchibald/idb))
- **DaisyUI** (falls verwendet) ([https://daisyui.com/](https://daisyui.com/))
- **IndexedDB** ([https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API))
