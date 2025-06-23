# Inventur-App für Bars – Vollständiges Pflichtenheft  

---

## 1 · Projektbeschreibung  
Die Anwendung unterstützt Bar-Teams dabei, Bestände **direkt vor Ort** schnell, offline und fehlerfrei zu erfassen.  
Mitarbeitende gehen mit einem Tablet/Smartphone von **Bereich zu Bereich**, tragen Mengen ein und erhalten in Echtzeit Verbrauchs- sowie Analyse-Daten.  

**Leitziele**  
* **Offline-Betrieb** (IndexedDB + spätere Synchronisation)  
* **Touch-optimierte** Oberfläche ohne lange Klickwege  
* Minimale Einarbeitung, barrierearm, multi-location-fähig  

---

## 2 · Arbeiten mit der App (Workflow)  

| Schritt | Ablauf | Besondere Funktionen |
|--------|------------------------------------------------|----------------------------------------------|
| **2.1 Einrichtung** | Location, Tresen & Bereiche anlegen **oder** per Import (JSON/XLS) einlesen | Mehrere Bars pro Unternehmen |
| **2.2 Inventur starten** | Bereich öffnen → Inventurliste erscheint | Große Felder für Kästen, Flaschen, offene ml |
| **2.3 Eingabe-Flow** | Wert eingeben → **Auto-Fokus** springt nach < 500 ms weiter | Reihenfolge per **Drag-and-Drop** personalisierbar |
| **2.4 Standardwerte** | „Alles voll“-Button trägt hinterlegte Soll-Mengen ein | Jederzeit manuell änderbar |
| **2.5 Speichern** | Toast meldet Erfolg/Fehler → Daten sofort in IndexedDB | Inline-Validierung verhindert Tippfehler |
| **2.6 Schichtende** | Endbestände eingeben → App berechnet Verbrauch & Kosten | Manager exportiert XLS/CSV oder öffnet Diagramme |

---

## 3 · Funktionsumfang  

### 3.1 Standort- / Tresen- / Bereichsverwaltung  
* Beliebig viele Locations → Tresen → Bereiche  
* Struktur-Import/-Export (JSON / XLS) für rasches Setup  
* Visualisierung der Inventurdaten pro Ebene (Heat-Map / Diagramm)  

### 3.2 Inventurlisten  
* Pro Bereich editierbar, versionsgespeichert  
* Felder: **Kästen, Flaschen, offene ml** – je **Start & Ende** der Schicht  

### 3.3 Produkt-Grundkatalog  
* Stammdaten: Kategorie, Name, Volumen (ml/L), Flaschen / Kasten, Preis / Flasche, Preis / 100 ml, Produktbild  
* Produkte via Dropdown einem Bereich zuordnen  

### 3.4 Verbrauchs- & Kostenberechnung  
* Automatische Differenz (Start ↔ Ende)  
* Kosten = Verbrauch × Preis / Einheit  
* Ergebnis in Listen + Charts, Export einschl. Kostenzeilen  

### 3.5 Import / Export  
* **CSV** & **XLS** mit vollständigen Produkt- & Verbrauchsdaten, Preisen, Bildpfad  
* Exportbereich: einzelner Bereich, gesamter Tresen oder komplette Location  

### 3.6 Analytics  
* Recharts-Diagramme nach Produktkategorie, Bereich, Zeitraum  
* Farbliche Abgrenzung, Hover-Details, Export als PNG  

---

## 4 · Benutzeroberfläche (UI) & UX  
* Modernes, responsives Design + Dark Mode  
* Buttons ≥ 48 dp, Gesten-Support, einspaltiger Flow (kein Scroll-Kerker)  
* **Drag-and-Drop**-Layout (Reihenfolge pro Nutzer persistent)  
* **Sofort-Feedback** (Toasts, Inline-Fehler) bei jeder Aktion  

---

## 5 · Usability & Zugänglichkeit  
* WCAG 2.1 AA: hohe Kontraste, skalierbare Schrift, ARIA-Labels, Screen-Reader-Support  
* Schritt-für-Schritt-Tooltips & Demo-Modus für neue Mitarbeitende  
* Keine überflüssigen Dialoge; max. zwei Taps pro Feld  

---

## 6 · Sicherheit & Datenintegrität  
* **Benutzerrollen**: Manager / Mitarbeiter (Rollenauswahl genügt, später erweiterbar)  
* **Lokale Back-ups**: Automatischer IndexedDB-Export mit Zeitstempel nach jeder Inventur  
* **Sync-Konflikte**: Last-Write-Wins + Konfliktprotokoll zur manuellen Klärung  
* Verschlüsselte Dateiexporte (AES-ZIP) auf Wunsch des Betreibers  

---

## 7 · Performance & Offline-Architektur  
* IndexedDB für > 100 k Datensätze ohne spürbare Verzögerung  
* **Debounced Writes** (< 16 ms) und Chunk-Sync im Hintergrund  
* Lazy-Loading für Produktbilder & Chart-Daten  
* Service-Worker-Cache + Background Sync für PWA-Fähigkeit  

---

## 8 · Anwendungsfälle  
1. **Tresen-Setup**  
   * Manager importiert Struktur, hinterlegt Standardwerte, weist Produkte zu.  
2. **Inventur-Runde**  
   * Mitarbeiter zählt „Kühlschrank 1“, nutzt Standardwert-Button, korrigiert offene ml.  
3. **Schichtende**  
   * App berechnet Verbrauch & Kosten, XLS-Report geht per Mail an die Geschäftsführung.  
4. **Multi-Location-Controlling**  
   * Unternehmensleitung konsolidiert Exporte mehrerer Bars, vergleicht KPIs.  

---

*Dokumentversion 1.0 – Stand Jun 2025*

