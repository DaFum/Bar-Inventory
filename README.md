# Bar Bestandsverwaltungssystem

## Überblick

Das Bar Bestandsverwaltungssystem ist eine Webanwendung, die Bar-Managern hilft, den Überblick über ihren Bestand zu behalten. Es ermöglicht Benutzern, Kategorien, Bereiche und Artikel zu verwalten und die Bestände in verschiedenen Phasen anzuzeigen: Anfang, Ende und Differenz. Die Anwendung wurde mit TypeScript, HTML und CSS erstellt und verwendet IndexedDB für die lokale Speicherung.

## Funktionen

- **Kategorienverwaltung**: Kategorien hinzufügen, bearbeiten und entfernen.
- **Bereichsverwaltung**: Bereiche innerhalb der Bar hinzufügen, bearbeiten und entfernen.
- **Artikelverwaltung**: Bestandsartikel hinzufügen, bearbeiten und entfernen.
- **Phasen**: Bestand am Anfang und Ende eines Zeitraums verfolgen und automatisch die Differenz berechnen.
- **Formeleingabe**: Formeln für Bestandsmengen eingeben, die dynamisch berechnet werden können.
- **Ansichtsumschaltung**: Zwischen Formelansicht und Summenansicht für Bestandsmengen wechseln.
- **Export/Import**: Bestandsdaten in CSV- oder JSON-Dateien exportieren und Daten aus JSON-Dateien importieren.
- **Benachrichtigungen**: Toast-Benachrichtigungen für erfolgreiche Aktionen anzeigen.
- **Theme-Umschaltung**: Zwischen verschiedenen Farbthemen wechseln.

## Verwendete Technologien

- **TypeScript**: Eine statisch typisierte Obermenge von JavaScript.
- **IndexedDB**: Low-Level-API für die clientseitige Speicherung großer Mengen strukturierter Daten.
- **HTML/CSS**: Standardtechnologien für die Erstellung von Webseiten.

## Nutzung

### Kategorien verwalten

1. Navigieren Sie zur Registerkarte "Verwaltungsansicht".
2. Unter "Kategorien" können Sie neue Kategorien hinzufügen, indem Sie den Kategorienamen eingeben und auf "Kategorie hinzufügen" klicken.
3. Vorhandene Kategorien können entfernt werden, indem Sie auf die Schaltfläche "Entfernen" neben dem Kategorienamen klicken.

### Bereiche verwalten

1. Navigieren Sie zur Registerkarte "Verwaltungsansicht".
2. Unter "Bereiche" können Sie neue Bereiche hinzufügen, indem Sie den Bereichsnamen eingeben und auf "Bereich hinzufügen" klicken.
3. Vorhandene Bereiche können entfernt werden, indem Sie auf die Schaltfläche "Entfernen" neben dem Bereichsnamen klicken.

### Artikel verwalten

1. Navigieren Sie zur Registerkarte "Verwaltungsansicht".
2. Geben Sie unter "Artikel hinzufügen" den Artikelnamen ein und wählen Sie eine Kategorie aus.
3. Klicken Sie auf "Artikel hinzufügen", um den Artikel zum Bestand hinzuzufügen.
4. Vorhandene Artikel können bearbeitet oder entfernt werden, indem Sie auf die entsprechenden Schaltflächen neben dem Artikelnamen in der Bestandsliste klicken.

### Bestand anzeigen und aktualisieren

1. Navigieren Sie zur Registerkarte "Listenansicht".
2. Wechseln Sie mit den Schaltflächen oben zwischen den Phasen "Anfang", "Ende" und "Differenz".
3. Geben Sie Bestandsmengen über Formeln ein (z. B. `5+10`). Das System berechnet dynamisch die Summe.
4. Wechseln Sie mit der Schaltfläche "Formel anzeigen" / "Summe anzeigen" zwischen der Formelansicht und der Summenansicht.
5. Für die Phase "Differenz" können Notizen hinzugefügt werden.

### Daten exportieren und importieren

1. **Export nach CSV**: Klicken Sie auf die Schaltfläche "Export nach CSV", um die Bestandsdaten als CSV-Datei herunterzuladen.
2. **Bestand exportieren**: Klicken Sie auf die Schaltfläche "Bestand exportieren", um die Bestandsdaten als JSON-Datei herunterzuladen.
3. **Bestand importieren**: Klicken Sie auf die Schaltfläche "Bestand importieren" und wählen Sie eine JSON-Datei aus, um die Bestandsdaten hochzuladen und zu aktualisieren.

### Tests ausführen

Um die Tests auszuführen, verwenden Sie den folgenden Befehl in Ihrem Terminal:

```bash
npm test
```

Stellen Sie sicher, dass Sie alle Abhängigkeiten installiert haben, bevor Sie die Tests ausführen, indem Sie `npm install` ausführen.

## Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe die Datei [LICENSE](LICENSE) für Details.

## Danksagungen

- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Tailwind CSS](https://tailwindcss.com/) (indirekt über DaisyUI, falls verwendet, ansonsten entfernen)
- [DaisyUI](https://daisyui.com/) (falls verwendet, ansonsten entfernen)
