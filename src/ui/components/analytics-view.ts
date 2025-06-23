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

/**
 * Initialisiert die Analytics-Ansicht im angegebenen Container für interaktive Verbrauchs- und Kostenberichte.
 *
 * Erstellt die Benutzeroberfläche mit Auswahlfeldern für Standort, Tresen und Bereich sowie einen Button zur Berichtsgenerierung. Lädt Standorte und Produkte aus der Datenbank, befüllt die Auswahlfelder, bindet Event-Listener für die Benutzerinteraktion und initialisiert die Diagramme mit leeren Daten.
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
                </div>
                <div>
                    <h3 class="panel-subtitle">Kosten nach Produkt (€)</h3>
                    <canvas id="cost-chart"></canvas>
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

    // Initialize charts with empty data
    renderCharts([], []);
}

/**
 * Befüllt das Standort-Auswahlfeld mit allen geladenen Standorten und setzt es auf den Ausgangszustand zurück.
 *
 * Entfernt vorhandene Optionen und fügt eine Standardoption sowie alle verfügbaren Standorte hinzu.
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
 * Behandelt die Auswahl eines Standorts im Analysebereich und aktualisiert die Tresen- und Bereichsauswahl entsprechend.
 *
 * Setzt die Tresen- und Bereichsauswahl zurück und deaktiviert sie. Bei Auswahl eines Standorts werden die zugehörigen Tresen angezeigt und auswählbar gemacht. Löst automatisch die Berichtserstellung aus oder setzt Auswertung und Diagramme zurück, wenn kein Standort gewählt ist.
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
 * Reagiert auf die Auswahl eines Zählers, aktualisiert die Bereichsauswahl und startet die automatische Berichtserstellung.
 *
 * Wenn ein Standort und ein Zähler ausgewählt sind, werden die zugehörigen Bereiche in der Auswahl angezeigt und aktiviert. Andernfalls wird die Bereichsauswahl zurückgesetzt und deaktiviert. Nach jeder Änderung wird automatisch ein Bericht generiert.
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
    consumptionChart = null;
    costChart = null;
    document.getElementById('charts-container')!.innerHTML = `
        <div>
            <h3 class="panel-subtitle">Verbrauch nach Produkt (Volumen ml)</h3>
            <canvas id="consumption-chart"></canvas>
        </div>
        <div>
            <h3 class="panel-subtitle">Kosten nach Produkt (€)</h3>
            <canvas id="cost-chart"></canvas>
        </div>`; // Re-add canvas elements
    document.getElementById('report-summary')!.innerHTML = "";
     renderCharts([], []); // Re-initialize with empty data
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
    if (!location) return;

    let itemsToAnalyze: InventoryEntry[] = [];
    let reportScopeName = location.name;

    if (areaId) { // Specific area selected
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

    if (itemsToAnalyze.length === 0) {
        showToast("Keine Inventurdaten im ausgewählten Bereich/Standort für die Analyse gefunden.", "info");
        clearReportAndCharts();
        return;
    }

    // This is important if itemsToAnalyze comes from multiple areas,
    // as a product might appear in several area.inventoryItems lists.
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
    const finalItemsToCalculate = Array.from(aggregatedInventoryEntries.values());


    const consumptionReport = calculateAreaConsumption(finalItemsToCalculate, loadedProducts);

    // Filter out items with zero or positive consumption for charts to make them cleaner
    const consumedItemsForChart = consumptionReport.filter(c => c.consumedVolumeMl !== undefined && c.consumedVolumeMl > 0);

    const productNames = consumedItemsForChart.map(c => loadedProducts.find(p => p.id === c.productId)?.name || 'Unbekannt');
    const consumptionValuesMl = consumedItemsForChart.map(c => c.consumedVolumeMl || 0);
    const costValues = consumedItemsForChart.map(c => c.costOfConsumption);

    renderCharts(productNames, consumptionValuesMl, costValues);

    // Display summary
    const summaryContainer = document.getElementById('report-summary')!;
    const totalConsumedItemsCount = consumptionReport.reduce((sum, item) => sum + (item.consumedUnits > 0 ? 1 : 0), 0);
    const totalOverallCost = consumptionReport.reduce((sum, item) => sum + item.costOfConsumption, 0);
    summaryContainer.innerHTML = `
        <h3 class="panel-subtitle">Zusammenfassung für: ${reportScopeName}</h3>
        <p>Anzahl verschiedener verbrauchter Produkte: ${totalConsumedItemsCount}</p>
        <p>Gesamtkosten des Verbrauchs: ${totalOverallCost.toFixed(2)} €</p>
    `;
     showToast(`Bericht für ${reportScopeName} generiert.`, "success");
}


/**
 * Visualisiert den Produktverbrauch und die Kosten als Diagramme.
 *
 * Erstellt ein Balkendiagramm für den Verbrauch (ml) pro Produkt und ein Tortendiagramm für die Kosten (€) pro Produkt, sofern Kostenwerte angegeben sind. Bereits vorhandene Diagramme werden vor der Neuerstellung entfernt.
 *
 * @param productNames - Namen der Produkte für die Diagrammbeschriftungen
 * @param consumptionValuesMl - Verbrauchswerte der Produkte in Millilitern
 * @param costValues - (Optional) Kostenwerte der Produkte in Euro für das Tortendiagramm
 */
function renderCharts(productNames: string[], consumptionValuesMl: number[], costValues?: number[]): void {
    const consumptionCtx = document.getElementById('consumption-chart') as HTMLCanvasElement;
    const costCtx = document.getElementById('cost-chart') as HTMLCanvasElement;

    if (!consumptionCtx || !costCtx) {
        console.error("Canvas elements for charts not found.");
        return;
    }

    if (consumptionChart) {
        consumptionChart.destroy();
    }
    if (costChart) {
        costChart.destroy();
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
}

console.log("Analytics View UI component loaded.");
