import { exportService } from './export.service';
import { Product, Location, Area, Counter, InventoryEntry } from '../models';
import * as CalculationService from './calculation.service';
import * as ToastNotifications from '../ui/components/toast-notifications';

// Mocks
jest.mock('./calculation.service', () => ({
  calculateAreaConsumption: jest.fn(),
}));
jest.mock('../ui/components/toast-notifications', () => ({
  showToast: jest.fn(),
}));

describe('ExportService', () => {
  let mockProducts: Product[];
  let mockArea: Area;
  let mockLocation: Location;
  let mockCounter: Counter;

  // Mock DOM and URL methods
  let createElementSpy: jest.SpyInstance;
  let appendChildSpy: jest.SpyInstance;
  let removeChildSpy: jest.SpyInstance;
  let createObjectURLSpy: jest.SpyInstance;
  let revokeObjectURLSpy: jest.SpyInstance;
  let linkClickSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProducts = [
      { id: 'p1', name: 'Product A', category: 'Cat1', volume: 700, pricePerBottle: 20, itemsPerCrate: 10, pricePer100ml: 2.85 },
      { id: 'p2', name: 'Product B', category: 'Cat2', volume: 500, pricePerBottle: 15 },
    ];
    mockArea = {
      id: 'area1', name: 'Main Shelf', displayOrder: 1,
      inventoryItems: [
        { productId: 'p1', startCrates: 1, startBottles: 2, startOpenVolumeMl: 100, endCrates: 0, endBottles: 1, endOpenVolumeMl: 50 },
        { productId: 'p2', startCrates: 0, startBottles: 5, startOpenVolumeMl: 0, endCrates: 0, endBottles: 2, endOpenVolumeMl: 0 },
      ]
    };
    mockCounter = { id: 'ctr1', name: 'Front Bar', description: 'Main', areas: [mockArea] };
    mockLocation = { id: 'loc1', name: 'Central Bar', address: '1 Main St', counters: [mockCounter] };

    (CalculationService.calculateAreaConsumption as jest.Mock).mockReturnValue([
      { productId: 'p1', consumedUnits: 1.5, consumedVolumeMl: 1050, costOfConsumption: 30, notes: [] },
      { productId: 'p2', consumedUnits: 3, consumedVolumeMl: 1500, costOfConsumption: 22.5, notes: [] },
    ]);

    // Setup DOM mocks
    linkClickSpy = jest.fn();
    createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: linkClickSpy,
      style: {} // Add style property if needed by any part of the code
    } as any);
    appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(node => node);
    removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(node => node);

    // Ensure URL static methods are defined before spying
    if (typeof URL.createObjectURL === 'undefined') {
      URL.createObjectURL = jest.fn().mockReturnValue('blob:http://localhost/mock-url-default');
    }
    if (typeof URL.revokeObjectURL === 'undefined') {
      URL.revokeObjectURL = jest.fn();
    }

    createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/mock-url-spy');
    revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original implementations
    if (createElementSpy) createElementSpy.mockRestore();
    if (appendChildSpy) appendChildSpy.mockRestore();
    if (removeChildSpy) removeChildSpy.mockRestore();
    if (createObjectURLSpy) createObjectURLSpy.mockRestore();
    if (revokeObjectURLSpy) revokeObjectURLSpy.mockRestore();

    // Clean up potentially added URL methods to avoid interference if they were added by these tests
    // This is a bit simplistic; a more robust way would be to store original and restore.
    // However, spyOn should handle restoring the original if it existed.
    // If we added them as jest.fn(), they might persist if not part of a class/object Jest fully manages.
    // For now, let's assume mockRestore is enough for spied methods.
    // If URL.createObjectURL was originally undefined and we set it to jest.fn(),
    // mockRestore on a spy of that jest.fn() might not remove it.
    // A safer cleanup would be:
    // delete (URL as any).createObjectURL; // if we knew we added it.
    // For simplicity, we'll rely on mockRestore for now.
  });


  describe('arrayToCsv internal function (indirectly tested via public methods)', () => {
    it('should correctly format data with headers', () => {
        exportService.exportProductsToCsv(mockProducts);
        const blobContent = (global.Blob as any).mock.calls[0][0][0];
        expect(blobContent).toContain('id,name,category,volume,itemsPerCrate,pricePerBottle,pricePer100ml,supplier,imageUrl,notes');
        expect(blobContent).toContain('"p1","Product A","Cat1","700","10","20","2.85","","",""'); // Check one data row
    });
    it('should handle empty data array by returning only headers', () => {
        exportService.exportProductsToCsv([]);
        // showToast would be called for empty products. To test arrayToCsv directly, we'd need to export it.
        // For now, we check that triggerDownload is not called, and showToast is.
        expect(ToastNotifications.showToast).toHaveBeenCalledWith('Keine Produkte zum Exportieren vorhanden.', 'info');
        expect(createObjectURLSpy).not.toHaveBeenCalled();
    });
     it('should escape double quotes within values', () => {
        const productsWithQuotes = [{ ...mockProducts[0]!, name: 'Product "A"' }]; // Added non-null assertion
        exportService.exportProductsToCsv(productsWithQuotes);
        const blobContent = (global.Blob as any).mock.calls[0][0][0];
        expect(blobContent).toContain('"Product ""A"""');
    });
  });

  describe('triggerDownload internal function (indirectly tested)', () => {
    it('should create a link, click it, and revoke object URL', () => {
      exportService.exportProductsToCsv([mockProducts[0]!]); // Added non-null assertion
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(linkClickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();
    });
  });

  describe('exportProductsToCsv', () => {
    it('should export products to CSV', () => {
      exportService.exportProductsToCsv(mockProducts);
      expect(createObjectURLSpy).toHaveBeenCalled();
      const downloadCall = createElementSpy.mock.results[0]!.value; // Added non-null assertion
      expect(downloadCall.download).toBe('produktkatalog.csv');
      expect((global.Blob as any).mock.calls[0][1].type).toBe('text/csv;charset=utf-8;');
    });

    it('should show toast and not download if no products', () => {
      exportService.exportProductsToCsv([]);
      expect(ToastNotifications.showToast).toHaveBeenCalledWith('Keine Produkte zum Exportieren vorhanden.', 'info');
      expect(createObjectURLSpy).not.toHaveBeenCalled();
    });
  });

  describe('exportAreaInventoryToCsv', () => {
    it('should export area inventory with consumption data to CSV', () => {
      exportService.exportAreaInventoryToCsv(mockArea, mockLocation.name, mockCounter.name, mockProducts, true);
      expect(CalculationService.calculateAreaConsumption).toHaveBeenCalledWith(mockArea.inventoryItems, mockProducts);
      expect(createObjectURLSpy).toHaveBeenCalled();
      const downloadCall = createElementSpy.mock.results[0]!.value; // Added non-null assertion
      const expectedFileName = `inventur_${mockLocation.name.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_')}_${mockCounter.name.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_')}_${mockArea.name.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_')}.csv`;
      expect(downloadCall.download).toBe(expectedFileName);

      const blobContent = (global.Blob as any).mock.calls[0][0][0];
      expect(blobContent).toContain('consumedUnits,consumedVolumeMl,costOfConsumption,consumptionNotes');
      expect(blobContent).toContain('"1.50","1050","30.00",""'); // Consumption data for p1
    });

    it('should export area inventory without consumption data if specified', () => {
      exportService.exportAreaInventoryToCsv(mockArea, mockLocation.name, mockCounter.name, mockProducts, false);
      expect(CalculationService.calculateAreaConsumption).not.toHaveBeenCalled();
      const blobContent = (global.Blob as any).mock.calls[0][0][0];
      expect(blobContent).not.toContain('consumedUnits');
    });

    it('should show toast if area has no inventory items', () => {
      const emptyArea = { ...mockArea, inventoryItems: [] };
      exportService.exportAreaInventoryToCsv(emptyArea, mockLocation.name, mockCounter.name, mockProducts);
      expect(ToastNotifications.showToast).toHaveBeenCalledWith('Keine Inventurdaten für diesen Bereich zum Exportieren vorhanden.', 'info');
      expect(createObjectURLSpy).not.toHaveBeenCalled();
    });
  });

  describe('exportLocationToJson', () => {
    it('should export location data to JSON', () => {
      exportService.exportLocationToJson(mockLocation);
      expect(createObjectURLSpy).toHaveBeenCalled();
      const downloadCall = createElementSpy.mock.results[0]!.value; // Added non-null assertion
      expect(downloadCall.download).toBe(`location_export_${mockLocation.name.replace(/\s/g, '_')}.json`);
      expect((global.Blob as any).mock.calls[0][1].type).toBe('application/json;charset=utf-8;');

      const jsonContent = (global.Blob as any).mock.calls[0][0][0];
      const parsedJson = JSON.parse(jsonContent);
      expect(parsedJson.locationDetails.id).toBe(mockLocation.id);
      expect(parsedJson.counters[0]!.id).toBe(mockCounter.id); // Added non-null assertion
      expect(parsedJson.counters[0]!.areas[0]!.id).toBe(mockArea.id); // Added non-null assertion
    });
  });
});

// Mock Blob constructor
(global as any).Blob = jest.fn((content, options) => ({ content, options }));
