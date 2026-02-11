import { dbService } from '../../services/indexeddb.service';
import { Location, Product, InventoryEntry, Area, Counter } from '../../models';
import { calculateAreaConsumption } from '../../services/calculation.service';
import { Chart, registerables } from 'chart.js';
import { showToast } from './toast-notifications';

Chart.register(...registerables);

let analyticsViewContainer: HTMLElement | null = null;
let loadedLocations: Location[] = [];
let loadedProducts: Product[] = [];

let consumptionChart: Chart | null = null;
let costChart: Chart | null = null;
let consumptionByCategoryChart: Chart | null = null;

/**
 * Initialisiert die Analytics-Ansicht im angegebenen Container für interaktive Verbrauchs- und Kostenberichte.
 *
 * Erstellt die Benutzeroberfläche mit Auswahlfeldern für Standort, Tresen und Bereich sowie einen Button zur Berichtsgenerierung. Lädt Standorte und Produkte aus der Datenbank, befüllt die Auswahlfelder, bindet Event-Listener und initialisiert die Diagramme mit leeren Daten.
 *
 * @param container - Das HTML-Element, in dem die Analytics-Ansicht angezeigt werden soll
 */
export async function initAnalyticsView(container: HTMLElement): Promise<void> {
    analyticsViewContainer = container;
    analyticsViewContainer.innerHTML = `
        <div class="panel">
            <h2 class="panel-title">Analyse & Berichte</h2>
            <div id="analytics-controls" class="flex space-x-4 mb-4 p-2 bg-gray-100 rounded items-center">
                <select id="analytics-location-select" class="form-control form-control-sm">
                    <option value="">Gesamten Standort wählen...</option>
                </select>
                <select id="analytics-counter-select" class="form-control form-control-sm" disabled>
                    <option value="">Tresen wählen (optional)...</option>
                </select>
                <select id="analytics-area-select" class="form-control form-control-sm" disabled>
                    <option value="">Bereich wählen (optional)...</option>
                </select>
                <button id="generate-report-btn" class="btn btn-primary btn-sm">Bericht generieren</button>
            </div>
            <div id="charts-container" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                    <h3 class="panel-subtitle">Verbrauch nach Produkt (Volumen ml)</h3>
                    <canvas id="consumption-chart"></canvas>
                    <button id="export-consumption-chart-btn" class="btn btn-secondary btn-sm mt-2">Verbrauchsdiagramm exportieren (PNG)</button>
                </div>
                <div>
                    <h3 class="panel-subtitle">Kosten nach Produkt (€)</h3>
                    <canvas id="cost-chart"></canvas>
                    <button id="export-cost-chart-btn" class="btn btn-secondary btn-sm mt-2">Kostendiagramm exportieren (PNG)</button>
                </div>
                <div>
                    <h3 class="panel-subtitle">Verbrauch nach Kategorie (Volumen ml)</h3>
                    <canvas id="consumption-by-category-chart"></canvas>
                    <button id="export-consumption-by-category-chart-btn" class="btn btn-secondary btn-sm mt-2">Kategoriediagramm exportieren (PNG)</button>
                </div>
            </div>
            <div id="report-summary" class="mt-4"></div>
        </div>
    `;

    [loadedLocations, loadedProducts] = await Promise.all([
        dbService.loadLocations(),
        dbService.loadProducts()
    ]);

    populateLocationSelector();
    document.getElementById('analytics-location-select')?.addEventListener('change', handleLocationSelectionForAnalytics);
    document.getElementById('analytics-counter-select')?.addEventListener('change', handleCounterSelectionForAnalytics);
    document.getElementById('analytics-area-select')?.addEventListener('change', handleAreaSelectionForAnalytics);
    document.getElementById('generate-report-btn')?.addEventListener('click', generateReport);

    document.getElementById('export-consumption-chart-btn')?.addEventListener('click', () => {
        exportChartToPNG(consumptionChart, 'consumption-chart.png', 'Verbrauchsdiagramm');
    });
    document.getElementById('export-cost-chart-btn')?.addEventListener('click', () => {
        exportChartToPNG(costChart, 'cost-chart.png', 'Kostendiagramm');
    });

    document.getElementById('export-consumption-by-category-chart-btn')?.addEventListener('click', () => {
        exportChartToPNG(consumptionByCategoryChart, 'consumption-by-category-chart.png', 'Kategoriediagramm');
    });

    // Initialize charts with empty data
    renderCharts([], []);
}


/**
 * Exportiert das angegebene Chart.js-Diagramm als PNG-Datei.
 * @param chartInstance Das Chart.js-Instanzobjekt.
 * @param defaultFilename Der Standarddateiname für die heruntergeladene Datei.
 * @param chartNameForNotification Der Name des Diagramms für Toast-Benachrichtigungen.
 */
function exportChartToPNG(chartInstance: Chart | null, defaultFilename: string, chartNameForNotification: string): void {
    if (!chartInstance || !chartInstance.canvas) {
        showToast(`Export für ${chartNameForNotification} fehlgeschlagen: Diagramm nicht initialisiert oder nicht sichtbar.`, 'error');
        console.error('Chart instance or canvas is not available for export.');
        return;
    }

    try {
        const imageBase64 = chartInstance.toBase64Image();
        const link = document.createElement('a');
        link.href = imageBase64;
        link.download = defaultFilename;

        // Append link to body, click it, and remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast(`${chartNameForNotification} erfolgreich als PNG exportiert.`, 'success');
    } catch (error) {
        showToast(`Export für ${chartNameForNotification} fehlgeschlagen. Details im Log.`, 'error');
        console.error(`Error exporting chart ${defaultFilename}:`, error);
    }
}


/**
 * Befüllt das Standort-Auswahlfeld mit allen verfügbaren Standorten und setzt es auf den Standardwert zurück.
 *
 * Entfernt vorhandene Optionen, fügt eine Option für die Gesamtauswahl hinzu und ergänzt alle geladenen Standorte als auswählbare Optionen.
 */
function populateLocationSelector(): void {
    const locSelect = document.getElementById('analytics-location-select') as HTMLSelectElement;
    if (!locSelect) return;
    locSelect.innerHTML = '<option value="">Gesamten Standort wählen...</option>'; // Reset
    loadedLocations.forEach(loc => {
        locSelect.add(new Option(loc.name, loc.id));
    });
}

/**
 * Reagiert auf die Auswahl eines Standorts im Analysebereich und aktualisiert die Tresen- und Bereichsauswahl entsprechend.
 *
 * Setzt die Tresen- und Bereichsauswahl zurück und deaktiviert sie zunächst. Bei Auswahl eines Standorts werden die zugehörigen Tresen angezeigt und auswählbar gemacht. Löst automatisch die Berichtserstellung aus, wenn ein Standort gewählt ist, oder setzt Auswertung und Diagramme zurück, falls kein Standort ausgewählt wurde.
 */
function handleLocationSelectionForAnalytics(): void {
    const locId = (document.getElementById('analytics-location-select') as HTMLSelectElement).value;
    const counterSelect = document.getElementById('analytics-counter-select') as HTMLSelectElement;
    const areaSelect = document.getElementById('analytics-area-select') as HTMLSelectElement;

    counterSelect.innerHTML = '<option value="">Tresen wählen (optional)...</option>';
    areaSelect.innerHTML = '<option value="">Bereich wählen (optional)...</option>';
    counterSelect.disabled = true;
    areaSelect.disabled = true;

    if (locId) {
        const location = loadedLocations.find(l => l.id === locId);
        if (location) {
            location.counters.forEach(counter => {
                counterSelect.add(new Option(counter.name, counter.id));
            });
            counterSelect.disabled = false;
        }
    }
    // Auto-generate report if a location is selected, or clear if no location
    if (locId) generateReport(); else clearReportAndCharts();
}

/**
 * Aktualisiert die Bereichsauswahl basierend auf der gewählten Zählerauswahl und startet automatisch die Berichtserstellung.
 *
 * Wenn ein Standort und ein Zähler ausgewählt sind, werden die zugehörigen Bereiche zur Auswahl angeboten und die Auswahl aktiviert. Andernfalls wird die Bereichsauswahl zurückgesetzt und deaktiviert. Im Anschluss wird automatisch ein Bericht generiert.
 */
function handleCounterSelectionForAnalytics(): void {
    const locId = (document.getElementById('analytics-location-select') as HTMLSelectElement).value;
    const counterId = (document.getElementById('analytics-counter-select') as HTMLSelectElement).value;
    const areaSelect = document.getElementById('analytics-area-select') as HTMLSelectElement;

    areaSelect.innerHTML = '<option value="">Bereich wählen (optional)...</option>';
    areaSelect.disabled = true;

    if (locId && counterId) {
        const location = loadedLocations.find(l => l.id === locId);
        const counter = location?.counters.find(c => c.id === counterId);
        if (counter) {
            counter.areas.forEach(area => {
                areaSelect.add(new Option(area.name, area.id));
            });
            areaSelect.disabled = false;
        }
    }
    // Auto-generate report based on new selection
    generateReport();
}

/**
 * Löst nach Auswahl einer Area im Analyse-View automatisch die Erstellung des Verbrauchs- und Kostenberichts aus.
 */
function handleAreaSelectionForAnalytics(): void {
    // Auto-generate report based on new selection
    generateReport();
}

/**
 * Setzt die Diagramme und die Berichtszusammenfassung im Analysebereich auf den Ausgangszustand zurück.
 *
 * Entfernt bestehende Diagramme, setzt die Canvas-Elemente neu ein, leert die Zusammenfassung und initialisiert die Diagramme ohne Daten.
 */
function clearReportAndCharts(): void {
    if (consumptionChart) consumptionChart.destroy();
    if (costChart) costChart.destroy();
    if (consumptionByCategoryChart) consumptionByCategoryChart.destroy();
    consumptionChart = null;
    costChart = null;
    consumptionByCategoryChart = null;

    // Instead of replacing innerHTML, which removes buttons,
    // charts will be re-created on existing canvas elements by renderCharts.
    // We still need to clear any previous chart-specific content if renderCharts doesn't fully overwrite.
    // However, Chart.js typically clears the canvas.

    document.getElementById('report-summary')!.innerHTML = "";
    renderCharts([], []); // Re-initialize with empty data on existing canvases
}


/**
 * Aggregiert Inventurdaten basierend auf Standort, Tresen und Bereich.
 * @param location Das ausgewählte Standortobjekt.
 * @param counterId Die ID des ausgewählten Tresens (optional).
 * @param areaId Die ID des ausgewählten Bereichs (optional).
 * @returns Ein Objekt mit den zu analysierenden Inventureinträgen und dem Namen des Berichtsumfangs.
 */
function _aggregateInventoryData(location: Location, counterId?: string, areaId?: string): { itemsToAnalyze: InventoryEntry[], reportScopeName: string } {
    let itemsToAnalyze: InventoryEntry[] = [];
    let reportScopeName = location.name;

    if (areaId && counterId) { // Specific area selected
        const counter = location.counters.find(c => c.id === counterId);
        const area = counter?.areas.find(a => a.id === areaId);
        if (area) {
            itemsToAnalyze = area.inventoryItems;
            reportScopeName = `${location.name} > ${counter?.name} > ${area.name}`;
        }
    } else if (counterId) { // Specific counter selected, all its areas
        const counter = location.counters.find(c => c.id === counterId);
        if (counter) {
            counter.areas.forEach(area => itemsToAnalyze.push(...area.inventoryItems));
            reportScopeName = `${location.name} > ${counter.name}`;
        }
    } else { // Entire location selected
        location.counters.forEach(counter => {
            counter.areas.forEach(area => itemsToAnalyze.push(...area.inventoryItems));
        });
    }

    // Aggregate items if they come from multiple areas (e.g. whole counter or whole location)
    // to avoid issues with the same product appearing in multiple inventoryItem lists.
    if (!areaId) { // Aggregation needed if not a specific area
        const aggregatedInventoryEntries = new Map<string, InventoryEntry>();
        for (const item of itemsToAnalyze) {
            if (!aggregatedInventoryEntries.has(item.productId)) {
                aggregatedInventoryEntries.set(item.productId, { ...item }); // Copy item
            } else {
                const existing = aggregatedInventoryEntries.get(item.productId)!;
                existing.startCrates = (existing.startCrates || 0) + (item.startCrates || 0);
                existing.startBottles = (existing.startBottles || 0) + (item.startBottles || 0);
                existing.startOpenVolumeMl = (existing.startOpenVolumeMl || 0) + (item.startOpenVolumeMl || 0);
                existing.endCrates = (existing.endCrates || 0) + (item.endCrates || 0);
                existing.endBottles = (existing.endBottles || 0) + (item.endBottles || 0);
                existing.endOpenVolumeMl = (existing.endOpenVolumeMl || 0) + (item.endOpenVolumeMl || 0);
            }
        }
        itemsToAnalyze = Array.from(aggregatedInventoryEntries.values());
    }

    return { itemsToAnalyze, reportScopeName };
}

/**
 * Berechnet Verbrauchsdaten aus Inventureinträgen und Produktinformationen.
 * @param items Die aggregierten Inventureinträge.
 * @param products Eine Liste aller geladenen Produkte.
 * @returns Ein Objekt mit Produktnamen, Verbrauchswerten, Kostenwerten und dem detaillierten Verbrauchsbericht.
 */
function _calculateConsumptionData(items: InventoryEntry[], products: Product[]): { productNames: string[], consumptionValuesMl: number[], costValues: number[], consumptionReport: any[], consumptionByCategory: { [category: string]: number } } {
    const consumptionReport = calculateAreaConsumption(items, products);

    // Filter out items with zero or negative consumption for charts to make them cleaner
    const consumedItemsForChart = consumptionReport.filter(c => c.consumedVolumeMl !== undefined && c.consumedVolumeMl > 0);

    const productNames = consumedItemsForChart.map(c => products.find(p => p.id === c.productId)?.name || 'Unbekannt');
    const consumptionValuesMl = consumedItemsForChart.map(c => c.consumedVolumeMl || 0);
    const costValues = consumedItemsForChart.map(c => c.costOfConsumption);

    const productMap = new Map(products.map(p => [p.id, p]));
    const consumptionByCategory: { [category: string]: number } = {};
    consumedItemsForChart.forEach(c => {
        const product = productMap.get(c.productId);
        if (product) {
            consumptionByCategory[product.category] = (consumptionByCategory[product.category] || 0) + (c.consumedVolumeMl || 0);
        }
    });

    return { productNames, consumptionValuesMl, costValues, consumptionReport, consumptionByCategory };
}

/**
 * Aktualisiert die UI mit den generierten Berichtsdaten (Diagramme und Zusammenfassung).
 * @param consumptionData Die berechneten Verbrauchsdaten.
 * @param scopeName Der Name des Bereichs, für den der Bericht generiert wurde.
 */
function _updateReportUI(
    consumptionData: {
        productNames: string[],
        consumptionValuesMl: number[],
        costValues: number[],
        consumptionReport: any[],
        consumptionByCategory: { [category: string]: number }
    },
    scopeName: string
): void {
    renderCharts(consumptionData.productNames, consumptionData.consumptionValuesMl, consumptionData.costValues, consumptionData.consumptionByCategory);

    const summaryContainer = document.getElementById('report-summary')!;
    const totalConsumedItemsCount = consumptionData.consumptionReport.reduce((sum, item) => sum + (item.consumedUnits > 0 ? 1 : 0), 0);
    const totalOverallCost = consumptionData.consumptionReport.reduce((sum, item) => sum + item.costOfConsumption, 0);
    summaryContainer.innerHTML = `
        <h3 class="panel-subtitle">Zusammenfassung für: ${scopeName}</h3>
        <p>Anzahl verschiedener verbrauchter Produkte: ${totalConsumedItemsCount}</p>
        <p>Gesamtkosten des Verbrauchs: ${totalOverallCost.toFixed(2)} €</p>
    `;
    showToast(`Bericht für ${scopeName} generiert.`, "success");
}


/**
 * Generiert einen Verbrauchs- und Kostenbericht für den aktuell ausgewählten Standort, Tresen oder Bereich und visualisiert die Ergebnisse in Diagrammen.
 *
 * Aggregiert die relevanten Inventurdaten, berechnet den Produktverbrauch und die Kosten, filtert nicht konsumierte Produkte heraus und aktualisiert die Diagramme sowie die Zusammenfassung im UI. Bei fehlender Auswahl oder fehlenden Daten werden Hinweise angezeigt und die Anzeige zurückgesetzt.
 */
async function generateReport(): Promise<void> {
    const locationId = (document.getElementById('analytics-location-select') as HTMLSelectElement).value;
    const counterId = (document.getElementById('analytics-counter-select') as HTMLSelectElement).value;
    const areaId = (document.getElementById('analytics-area-select') as HTMLSelectElement).value;

    if (!locationId) {
        showToast("Bitte einen Standort auswählen.", "info");
        clearReportAndCharts();
        return;
    }

    const location = loadedLocations.find(l => l.id === locationId);
    if (!location) {
        showToast("Ausgewählter Standort nicht gefunden.", "error");
        clearReportAndCharts();
        return;
    }

    // Ensure counterId is provided when areaId is used, as _aggregateInventoryData expects this for area-specific logic
    if (areaId && !counterId) {
        showToast("Fehler: Bereich kann nicht ohne zugehörigen Tresen ausgewählt werden.", "error");
        clearReportAndCharts();
        return;
    }

    const { itemsToAnalyze, reportScopeName } = _aggregateInventoryData(location, counterId, areaId);

    if (itemsToAnalyze.length === 0) {
        showToast("Keine Inventurdaten im ausgewählten Bereich/Standort für die Analyse gefunden.", "info");
        clearReportAndCharts();
        return;
    }

    const consumptionData = _calculateConsumptionData(itemsToAnalyze, loadedProducts);
    _updateReportUI(consumptionData, reportScopeName);
}


/**
 * Visualisiert Verbrauchs- und Kostenwerte von Produkten als Diagramme.
 *
 * Erstellt ein Balkendiagramm für den Produktverbrauch in Millilitern und, falls Kostenwerte angegeben sind, ein Tortendiagramm für die Produktkosten in Euro. Vorhandene Diagramme werden vor der Neuerstellung entfernt.
 *
 * @param productNames - Produktnamen für die Diagrammbeschriftungen
 * @param consumptionValuesMl - Verbrauchswerte der Produkte in Millilitern
 * @param costValues - (Optional) Kostenwerte der Produkte in Euro für das Tortendiagramm
 */
function renderCharts(productNames: string[], consumptionValuesMl: number[], costValues?: number[], consumptionByCategory?: { [category: string]: number }): void {
    const consumptionCtx = document.getElementById('consumption-chart') as HTMLCanvasElement;
    const costCtx = document.getElementById('cost-chart') as HTMLCanvasElement;
    const consumptionByCategoryCtx = document.getElementById('consumption-by-category-chart') as HTMLCanvasElement;

    if (!consumptionCtx || !costCtx || !consumptionByCategoryCtx) {
        console.error("Canvas elements for charts not found.");
        return;
    }

    if (consumptionChart) {
        consumptionChart.destroy();
    }
    if (costChart) {
        costChart.destroy();
    }
    if (consumptionByCategoryChart) {
        consumptionByCategoryChart.destroy();
    }

    consumptionChart = new Chart(consumptionCtx, {
        type: 'bar', // Example: Bar chart for consumption
        data: {
            labels: productNames,
            datasets: [{
                label: 'Verbrauch (ml)',
                data: consumptionValuesMl,
                backgroundColor: 'rgba(54, 162, 235, 0.6)', // Blue
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true, // Keep aspect ratio
            scales: { y: { beginAtZero: true } }
        }
    });

    if (costValues) {
        costChart = new Chart(costCtx, {
            type: 'pie', // Example: Pie chart for costs
            data: {
                labels: productNames,
                datasets: [{
                    label: 'Kosten (€)',
                    data: costValues,
                    backgroundColor: [ // Example colors, can be dynamic or more extensive
                        'rgba(255, 99, 132, 0.6)',  // Red
                        'rgba(75, 192, 192, 0.6)',  // Green
                        'rgba(255, 205, 86, 0.6)',  // Yellow
                        'rgba(201, 203, 207, 0.6)', // Grey
                        'rgba(153, 102, 255, 0.6)', // Purple
                        'rgba(255, 159, 64, 0.6)'   // Orange
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
            }
        });
    }

    if (consumptionByCategory) {
        consumptionByCategoryChart = new Chart(consumptionByCategoryCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(consumptionByCategory),
                datasets: [{
                    label: 'Verbrauch nach Kategorie (ml)',
                    data: Object.values(consumptionByCategory),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
            }
        });
    }
}

console.log("Analytics View UI component loaded.");
