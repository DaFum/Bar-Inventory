# Inventur-App für Bars – Vollständiges Pflichtenheft  

## 1 · Projektbeschreibung  
Die App unterstützt Bar-Teams dabei, Bestände **direkt vor Ort** schnell, offline und fehlerfrei zu erfassen.  
Mitarbeitende gehen mit einem Touch-Gerät von **Bereich zu Bereich**, tragen Mengen ein und erhalten in Echtzeit Verbrauchs- und Analyse-Daten.  
**Hauptziele:**  
- **Offline-Betrieb** mit IndexedDB und späterer Synchronisation  
- **Touch-optimierte** Oberfläche ohne lange Klickwege  
- Minimale Einarbeitung, barrierearm, skalierbar auf mehrere Locations  

---

## 2 · Arbeiten mit der App  

| Schritt    | Ablauf                                                | Details / Besondere Funktionen                         |
|------------|-------------------------------------------------------|--------------------------------------------------------|
| **2.1 Einrichtung**      | Location, Tresen & Bereiche anlegen **oder** per Import (JSON/XLS) einlesen  | Mehrere Bars pro Unternehmen unterstützt               |
| **2.2 Inventur starten** | Bereich öffnen → Inventurliste erscheint             | Große Eingabefelder für Kästen, Flaschen, offene ml    |
| **2.3 Eingabe-Flow**     | Auto-Fokus springt nach kurzer Verzögerung zum nächsten Feld | Reihenfolge per **Drag-and-Drop** personalisierbar     |
| **2.4 Standardwerte**    | „Alles voll“-Button trägt gespeicherte Soll-Mengen ein    | Werte jederzeit manuell anpassbar                      |
| **2.5 Speichern**        | Toast zeigt Erfolg / Fehler → Daten in IndexedDB gespeichert | Inline-Validierung verhindert Tippfehler               |
| **2.6 Schichtende**      | Endbestände eingeben → App berechnet Verbrauch & Kosten   | Manager kann XLS/CSV exportieren oder Diagramme öffnen |

**Hinweis für Mitarbeitende:**  
- Nie mehr als zwei Taps pro Feld: Öffnen → Wert eingeben → Weiter  
- Kein langes Scrollen, kein umständliches Menü

---

## 3 · Funktionsumfang  

### 3.1 Standort- / Tresen- / Bereichsverwaltung  
- Anlage und Verwaltung mehrerer **Locations**, **Tresen** und **Bereiche**  
- **Import / Export** der Struktur (JSON / XLS) für schnelles Setup  

### 3.2 Inventurlisten  
- Pro Bereich editierbare Listen mit **Versionierung**  
- Felder: **Kästen**, **Flaschen**, **offene ml** – jeweils **Schichtbeginn** & **Schichtende**  

### 3.3 Produkt-Grundkatalog  
- Stammdaten: Kategorie, Name, Volumen (ml/L), Flaschen pro Kasten, Preis pro Einheit, Bild  
- Auswahl per Dropdown, Zuordnung zu Bereichen  

### 3.4 Verbrauchs- & Kostenberechnung  
- Automatische Differenzbildung (Start ↔ Ende)  
- Kosten = Verbrauch × Preis pro Einheit  
- Ergebnis sofort in Listen und Diagrammen sichtbar  

### 3.5 Import / Export  
- **CSV** und **XLS** mit vollständigen Produkt- & Verbrauchsdaten (inkl. Preise/Bildpfad)  
- Export wahlweise pro **Bereich**, **Tresen** oder gesamte **Location**  

### 3.6 Analytics  
- **Recharts**-Diagramme nach Kategorie, Bereich, Zeitraum  
- Farblich getrennt, Hover-Details und Download als PNG  

---

## 4 · Benutzeroberfläche & UX  
- Modernes, responsives Design + Dark Mode  
- Buttons ≥ 48 dp, Gestensupport, einspaltiger Inventur-Flow  
- Drag-and-Drop-Layout für Eingabefelder (Reihenfolge pro Nutzer gespeichert)  
- Sofort-Feedback: Toasts & Inline-Fehler­meldungen  

---

## 5 · Usability & Zugänglichkeit  
- WCAG 2.1 AA: Kontrast, skalierbare Schrift, ARIA-Labels, Screen-Reader-Support  
- Schritt-für-Schritt-Tooltips für neue Mitarbeitende  
- Kein Scroll-Zwang: alle Felder im Sichtbereich  

---

## 6 · Sicherheit & Datenintegrität  
- **Benutzerrollen**: Manager / Mitarbeiter (Rollenwahl in v1, später Passwort möglich)  
- **Lokale Back-ups**: Automatischer IndexedDB-Export (Zeitstempel) nach jeder Inventur  
- **Sync-Konfliktmanagement**: Last-Write-Wins + Konfliktprotokoll für manuelle Klärung    

---

## 7 · Performance-Anforderungen  
- IndexedDB für > 100 000 Datensätze ohne Verzögerung  
- Debounced Write-Ops und asynchrone Batch-Speicherungen  
- Lazy-Loading und Virtual Scrolling in langen Listen  

---

## 8 · Anwendungsfälle  
1. **Tresen-Setup:** Manager importiert Struktur, legt Standardwerte fest.  
2. **Inventur-Runde:** Mitarbeiter zählt Bereich, nutzt Standardwerte, korrigiert offene ml.  
3. **Schichtende:** Verbrauch & Kosten werden berechnet, XLS/CSV-Report erstellt.  
4. **Multi-Location-Reporting:** Leitung konsolidiert Exporte mehrerer Bars und vergleicht Kennzahlen.  

*Dokumentversion 1.0 – Stand: Juni 2025*

