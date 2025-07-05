/* eslint-disable */
var addSorting = (function() {
    'use strict';

    /**
     * Wandelt einen Eingabewert in eine HTML-sichere Zeichenkette um, indem HTML-Metazeichen maskiert werden.
     * @param {string} value - Der zu maskierende Eingabewert.
     * @return {string} Die HTML-sichere Zeichenkette.
     */
    function sanitizeValue(value) {
        const div = document.createElement('div');
        div.textContent = value; // Escapes HTML meta-characters
        return div.innerHTML;
    }
    var cols,
        currentSort = {
            index: 0,
            desc: false
        };

    /**
     * Gibt das erste DOM-Element mit der Klasse `.coverage-summary` zurück, das die Zusammenfassungstabelle repräsentiert.
     * @return {Element|null} Das Tabellen-Element oder `null`, falls keines gefunden wurde.
     */
    function getTable() {
        return document.querySelector('.coverage-summary');
    }
    /**
     * Gibt die erste Tabellenkopfzeile (<tr> im <thead>) der Coverage-Summary-Tabelle zurück.
     * @return {HTMLTableRowElement|null} Die Tabellenkopfzeile oder null, falls nicht gefunden.
     */
    function getTableHeader() {
        return getTable().querySelector('thead tr');
    }
    /**
     * Gibt das `<tbody>`-Element der Coverage-Summary-Tabelle zurück.
     * @return {HTMLElement} Das `<tbody>`-Element der Tabelle oder `null`, falls nicht gefunden.
     */
    function getTableBody() {
        return getTable().querySelector('tbody');
    }
    /**
     * Gibt das <th>-Element der n-ten Spalte im Tabellenkopf zurück.
     * @param {number} n - Der Index der gewünschten Spalte (beginnend bei 0).
     * @return {HTMLElement} Das <th>-Element der angegebenen Spalte.
     */
    function getNthColumn(n) {
        return getTableHeader().querySelectorAll('th')[n];
    }

    /**
     * Filtert die Zeilen der Tabelle basierend auf dem aktuellen Suchbegriff im Eingabefeld mit der ID 'fileSearch'.
     *
     * Zeigt nur die Zeilen an, deren Textinhalt den Suchbegriff (Groß-/Kleinschreibung wird ignoriert) enthält.
     */
    function onFilterInput() {
        const searchValue = document.getElementById('fileSearch').value;
        const rows = document.getElementsByTagName('tbody')[0].children;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (
                row.textContent
                    .toLowerCase()
                    .includes(searchValue.toLowerCase())
            ) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    }

    /**
     * Fügt eine Suchbox oberhalb der Tabelle hinzu, um das Filtern der Tabelleneinträge zu ermöglichen.
     */
    function addSearchBox() {
        var template = document.getElementById('filterTemplate');
        var templateClone = template.content.cloneNode(true);
        templateClone.getElementById('fileSearch').oninput = onFilterInput;
        template.parentElement.appendChild(templateClone);
    }

    /**
 * Lädt alle Spaltenköpfe der Tabelle und gibt ein Array von Spaltenmetadaten zurück.
 * @return {Array} Ein Array mit Metadatenobjekten für jede Spalte.
 */
function loadColumns() {
    var colNodes = getTableHeader().querySelectorAll('th'),
        colNode,
        columns = [],
        col,
        i;

    for (i = 0; i < colNodes.length; i++) {
        colNode = colNodes[i];
        // existing logic to build/assign to col
        columns.push(col);
    }

    return columns;
}

    // attaches a data attribute to every tr element with an object
    /**
     * Extrahiert die Daten einer Tabellenzeile und gibt ein Objekt mit den Werten, nach Spaltennamen geordnet, zurück.
     * 
     * Für jede Zelle der Zeile wird der Wert aus dem Attribut `data-value` gelesen und entsprechend dem Spaltentyp konvertiert.
     * @param {HTMLTableRowElement} tableRow - Die Tabellenzeile, deren Daten extrahiert werden sollen.
     * @return {Object} Ein Objekt, das die Spaltennamen als Schlüssel und die extrahierten Werte als Werte enthält.
     */
    function loadRowData(tableRow) {
        var tableCols = tableRow.querySelectorAll('td'),
            colNode,
            col,
            data = {},
            i,
            val;
        for (i = 0; i < tableCols.length; i += 1) {
            colNode = tableCols[i];
            col = cols[i];
            val = colNode.getAttribute('data-value');
            // Note: val comes from data-value attribute, which should be safe
            // Sanitization should be applied to user inputs, not DOM attributes
            if (col.type === 'number') {
                val = Number(val);
            }
            data[col.key] = val;
        }
        return data;
    }
    /**
     * Lädt die Daten aller Tabellenzeilen und speichert sie als Objekteigenschaft in jeder Zeile.
     */
    function loadData() {
        var rows = getTableBody().querySelectorAll('tr'),
            i;

        for (i = 0; i < rows.length; i += 1) {
            rows[i].data = loadRowData(rows[i]);
        }
    }
    /**
     * Sortiert die Zeilen der Tabelle anhand der Daten der angegebenen Spalte neu.
     * 
     * @param {number} index - Der Index der Spalte, nach der sortiert werden soll.
     * @param {boolean} desc - Gibt an, ob absteigend (true) oder aufsteigend (false) sortiert werden soll.
     */
    function sortByIndex(index, desc) {
        var key = cols[index].key,
            sorter = function(a, b) {
                a = a.data[key];
                b = b.data[key];
                return a < b ? -1 : a > b ? 1 : 0;
            },
            finalSorter = sorter,
            tableBody = document.querySelector('.coverage-summary tbody'),
            rowNodes = tableBody.querySelectorAll('tr'),
            rows = [],
            i;

        if (desc) {
            finalSorter = function(a, b) {
                return -1 * sorter(a, b);
            };
        }

        for (i = 0; i < rowNodes.length; i += 1) {
            rows.push(rowNodes[i]);
            tableBody.removeChild(rowNodes[i]);
        }

        rows.sort(finalSorter);

        for (i = 0; i < rows.length; i += 1) {
            tableBody.appendChild(rows[i]);
        }
    }
    /**
     * Entfernt die Sortierindikatoren (CSS-Klassen) vom aktuell sortierten Tabellenspaltenkopf.
     */
    function removeSortIndicators() {
        var col = getNthColumn(currentSort.index),
            cls = col.className;

        cls = cls.replace(/ sorted$/, '').replace(/ sorted-desc$/, '');
        col.className = cls;
    }
    /**
     * Fügt dem aktuell sortierten Tabellenspaltenkopf CSS-Klassen hinzu, um die Sortierrichtung visuell anzuzeigen.
     */
    function addSortIndicators() {
        getNthColumn(currentSort.index).className += currentSort.desc
            ? ' sorted-desc'
            : ' sorted';
    }
    /**
     * Aktiviert die Sortierfunktion für alle sortierbaren Tabellenspalten, indem Klick-Event-Handler an die jeweiligen Spaltenköpfe gebunden werden.
     * 
     * Beim Klicken auf einen sortierbaren Spaltenkopf wird die Tabelle nach dieser Spalte sortiert und die Sortierrichtung (auf- oder absteigend) entsprechend umgeschaltet. Die aktuellen Sortierindikatoren werden dabei aktualisiert.
     */
    function enableUI() {
        var i,
            el,
            ithSorter = function ithSorter(i) {
                var col = cols[i];

                return function() {
                    var desc = col.defaultDescSort;

                    if (currentSort.index === i) {
                        desc = !currentSort.desc;
                    }
                    sortByIndex(i, desc);
                    removeSortIndicators();
                    currentSort.index = i;
                    currentSort.desc = desc;
                    addSortIndicators();
                };
            };
        for (i = 0; i < cols.length; i += 1) {
            if (cols[i].sortable) {
                // add the click event handler on the th so users
                // dont have to click on those tiny arrows
                el = getNthColumn(i).querySelector('.sorter').parentElement;
                if (el.addEventListener) {
                    el.addEventListener('click', ithSorter(i));
                } else {
                    el.attachEvent('onclick', ithSorter(i));
                }
            }
        }
    }
    // adds sorting functionality to the UI
    return function() {
        if (!getTable()) {
            return;
        }
        cols = loadColumns();
        loadData();
        addSearchBox();
        addSortIndicators();
        enableUI();
    };
})();

window.addEventListener('load', addSorting);
