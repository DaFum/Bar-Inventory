import { Location, Product, Area } from '../models';
import { CalculatedConsumption, calculateAreaConsumption } from './calculation.service';
import { showToast } from '../ui/components/toast-notifications';

interface AreaInventoryRow {
  productId: string;
  productName: string;
  category: string;
  productVolumeMl: number;
  startCrates: number;
  startBottles: number;
  startOpenVolumeMl: number;
  endCrates: number;
  endBottles: number;
  endOpenVolumeMl: number;
  consumedUnits?: string;
  consumedVolumeMl?: string;
  costOfConsumption?: string;
  consumptionNotes?: string;
}

/**
 * Konvertiert ein Array von Objekten in einen CSV-formatierten String.
 *
 * Erstellt eine CSV-Zeichenkette mit optionalen Spaltenüberschriften. Werte werden in doppelte Anführungszeichen gesetzt und enthaltene Anführungszeichen werden maskiert. Gibt einen leeren String zurück, wenn keine Daten vorhanden sind.
 *
 * @param data - Die zu konvertierenden Objekte
 * @param columns - Optional: Zu verwendende Spaltenüberschriften; werden die nicht angegeben, werden die Schlüssel des ersten Objekts verwendet
 * @returns Der erzeugte CSV-Inhalt als String oder ein leerer String, falls keine Daten vorhanden sind
 */
function arrayToCsv(data: Array<Record<string, unknown>>, columns?: string[]): string {
  if (!data || data.length === 0) {
    return columns ? columns.join(',') : '';
  }

  // Ensure data[0] exists before trying to get its keys
  const columnHeaders = columns || (data[0] ? Object.keys(data[0]) : []);

  const csvRows = [];
  // Only add header row if there are headers
  if (columnHeaders.length > 0) {
    csvRows.push(columnHeaders.join(',')); // Add header row
  }

  for (const row of data) {
    const values = columnHeaders.map((header) => {
      const escaped = (
        '' + (row[header] !== undefined && row[header] !== null ? row[header] : '')
      ).replace(/"/g, '""'); // Escape double quotes
      return `"${escaped}"`; // Wrap all values in double quotes
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Startet im Browser den Download einer Datei mit dem angegebenen Inhalt, Dateinamen und MIME-Typ.
 *
 * @param content - Der Inhalt der herunterzuladenden Datei
 * @param fileName - Der gewünschte Dateiname
 * @param contentType - Der MIME-Typ des Inhalts (z.B. 'text/csv' oder 'application/json')
 */
function triggerDownload(content: string, fileName: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export class ExportService {
  /**
   * Exports product catalog data to CSV.
   * @param products Array of Product objects.
   */
  public exportProductsToCsv(products: Product[]): void {
    if (!products || products.length === 0) {
      showToast('Keine Produkte zum Exportieren vorhanden.', 'info');
      return;
    }
    const columns = [
      'id',
      'name',
      'category',
      'volume',
      'itemsPerCrate',
      'pricePerBottle',
      'pricePer100ml',
      'supplier',
      'imageUrl',
      'notes',
    ];
    const csvData = arrayToCsv(products as unknown as Array<Record<string, unknown>>, columns);
    triggerDownload(csvData, 'produktkatalog.csv', 'text/csv;charset=utf-8;');
  }

  /**
   * Exports inventory data for a specific area (start, end, and optionally consumption) to CSV.
   * @param area The Area object.
   * @param locationName Name of the location.
   * @param counterName Name of the counter.
   * @param allProducts Array of all Product definitions (for names, categories etc.).
   * @param includeConsumption Whether to include calculated consumption data.
   */
  public exportAreaInventoryToCsv(
    area: Area,
    locationName: string,
    counterName: string,
    allProducts: Product[],
    includeConsumption: boolean = true
  ): void {
    if (!area || !area.inventoryItems || area.inventoryItems.length === 0) {
      showToast('Keine Inventurdaten für diesen Bereich zum Exportieren vorhanden.', 'info');
      return;
    }

    const flatData: AreaInventoryRow[] = [];
    let consumptionData: CalculatedConsumption[] | null = null;

    if (includeConsumption) {
      consumptionData = calculateAreaConsumption(area.inventoryItems, allProducts);
    }

    for (const item of area.inventoryItems) {
      const product = allProducts.find((p) => p.id === item.productId);
      if (!product) continue;

      const row: AreaInventoryRow = {
        productId: product.id,
        productName: product.name,
        category: product.category,
        productVolumeMl: product.volume,
        startCrates: item.startCrates || 0,
        startBottles: item.startBottles || 0,
        startOpenVolumeMl: item.startOpenVolumeMl || 0,
        endCrates: item.endCrates || 0,
        endBottles: item.endBottles || 0,
        endOpenVolumeMl: item.endOpenVolumeMl || 0,
      };

      if (includeConsumption && consumptionData) {
        const consumedItem = consumptionData.find((c) => c.productId === product.id);
        if (consumedItem) {
          row.consumedUnits = consumedItem.consumedUnits.toFixed(2);
          row.consumedVolumeMl = consumedItem.consumedVolumeMl?.toFixed(0) || ''; // Ensure string
          row.costOfConsumption = consumedItem.costOfConsumption.toFixed(2);
          row.consumptionNotes = consumedItem.notes?.join('; ') || '';
        }
      }
      flatData.push(row);
    }

    if (flatData.length === 0) {
      showToast('Keine aufbereiteten Daten zum Exportieren.', 'info');
      return;
    }

    const columns = [
      'productId',
      'productName',
      'category',
      'productVolumeMl',
      'startCrates',
      'startBottles',
      'startOpenVolumeMl',
      'endCrates',
      'endBottles',
      'endOpenVolumeMl',
    ];
    if (includeConsumption) {
      columns.push('consumedUnits', 'consumedVolumeMl', 'costOfConsumption', 'consumptionNotes');
    }

    const csvData = arrayToCsv(flatData as unknown as Array<Record<string, unknown>>, columns);
    // Better sanitize user input for file names
    const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_');
    const fileName = `inventur_${sanitize(locationName)}_${sanitize(
      counterName
    )}_${sanitize(area.name)}.csv`;
    triggerDownload(csvData, fileName, 'text/csv;charset=utf-8;');
  }

  /**
   * Exports all data for a location (all counters, all areas) to a structured JSON file.
   * This is more for backup or internal transfer than for direct spreadsheet use.
   * @param location The Location object.
   */
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  public exportLocationToJson(location: Location): void {
    // Decide if products should be embedded or if product catalog is separate
    // The _allProducts parameter was removed as it was unused.
    // If it were to be used, it would be included in dataToExport.
    const dataToExport = {
      locationDetails: {
        id: location.id,
        name: location.name,
        address: location.address,
        // any other location metadata
      },
      counters: location.counters.map((counter) => ({
        id: counter.id,
        name: counter.name,
        description: counter.description,
        areas: counter.areas.map((area) => ({
          id: area.id,
          name: area.name,
          description: area.description,
          displayOrder: area.displayOrder,
          inventoryItems: area.inventoryItems, // These contain the start/end counts
        })),
      })),
      // Optionally include product catalog if `allProducts` is provided
      // productCatalog: allProducts
    };

    const jsonContent = JSON.stringify(dataToExport, null, 2); // Pretty print JSON
    const fileName = `location_export_${location.name.replace(/\s/g, '_')}.json`;
    triggerDownload(jsonContent, fileName, 'application/json;charset=utf-8;');
  }

  // XLS export is more complex and usually requires a library like SheetJS (xlsx).
  // For now, focusing on CSV and JSON.
  // public exportToXls(data: any[], sheetName: string, fileName: string): void { ... }
}

export const exportService = new ExportService();
