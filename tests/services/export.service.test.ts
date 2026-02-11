import { exportService } from '../../src/services/export.service';
import { Product, Location, Area, Counter, InventoryEntry } from '../../src/models';
import * as CalculationService from '../../src/services/calculation.service';
import * as ToastNotifications from '../../src/ui/components/toast-notifications';

// Mocks
jest.mock('../../src/services/calculation.service', () => ({
  calculateAreaConsumption: jest.fn(),
}));
jest.mock('../../src/ui/components/toast-notifications', () => ({
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
// }); // Premature closing moved to the end of the file

// Mock Blob constructor
// Moved this mock to the top of the file for better organization, though Jest hoists mocks.
// (global as any).Blob = jest.fn((content, options) => ({ content, options }));
// Actually, this should be fine here as it's a global mock setup, not a module mock.
// Let's keep it here for now unless it causes issues. If it's meant to mock the Blob for the service,
// it should be at the top level or Jest-mocked if Blob is imported.
// Given the usage `(global.Blob as any).mock.calls`, this seems to be a global override for testing.

// Re-instating the global Blob mock as it seems intended for the tests below.
(global as any).Blob = jest.fn((content, options) => ({ content, options }));

  describe('Error handling and edge cases', () => {
    it('should handle Blob creation failure gracefully', () => {
      const originalBlob = global.Blob;
      try {
        (global as any).Blob = jest.fn(() => {
          throw new Error('Blob creation failed');
        });
    
        expect(() => exportService.exportProductsToCsv(mockProducts)).not.toThrow();
        expect(ToastNotifications.showToast).toHaveBeenCalledWith(
          expect.stringContaining('Fehler beim Erstellen der Exportdatei'),
          'error'
        );
      } finally {
        (global as any).Blob = originalBlob;
      }
    });

    it('should handle URL.createObjectURL failure gracefully', () => {
      createObjectURLSpy.mockImplementation(() => {
        throw new Error('createObjectURL failed');
      });
      
      expect(() => exportService.exportProductsToCsv(mockProducts)).not.toThrow();
      expect(ToastNotifications.showToast).toHaveBeenCalledWith(
        expect.stringContaining('Fehler beim Erstellen des Download-Links'),
        'error'
      );
    });

    it('should handle DOM manipulation errors gracefully', () => {
      createElementSpy.mockImplementation(() => {
        throw new Error('createElement failed');
      });
      
      expect(() => exportService.exportProductsToCsv(mockProducts)).not.toThrow();
      expect(ToastNotifications.showToast).toHaveBeenCalledWith(
        expect.stringContaining('Fehler beim Erstellen des Download-Elements'),
        'error'
      );
    });

    it('should handle products with null/undefined values', () => {
      const productsWithNulls = [
        { id: 'p1', name: null, category: undefined, volume: 700, pricePerBottle: 20 },
        { id: 'p2', name: 'Product B', category: 'Cat2', volume: null, pricePerBottle: undefined }
      ] as any[];
      
      exportService.exportProductsToCsv(productsWithNulls);
      const blobContent = (global.Blob as any).mock.calls[0][0][0];
      expect(blobContent).toContain('""'); // null/undefined should be converted to empty strings
    });

    it('should handle very large datasets', () => {
      const largeProducts = Array.from({ length: 10000 }, (_, i) => ({
        id: `p${i}`,
        name: `Product ${i}`,
        category: `Category ${i % 10}`,
        volume: 500 + i,
        pricePerBottle: 10 + i * 0.1
      }));
      
      expect(() => exportService.exportProductsToCsv(largeProducts)).not.toThrow();
      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it('should handle special characters in filenames', () => {
      const locationWithSpecialChars = {
        ...mockLocation,
        name: 'Café "Münchën" <Bar> & Grill / Lounge'
      };
      
      exportService.exportLocationToJson(locationWithSpecialChars);
      const downloadCall = createElementSpy.mock.results[0]!.value;
      expect(downloadCall.download).toBe('location_export_Café_Münchën__Bar___Grill___Lounge.json');
    });

    it('should handle empty strings in data', () => {
      const productsWithEmptyStrings = [
        { id: '', name: '', category: '', volume: 0, pricePerBottle: 0 }
      ];
      
      exportService.exportProductsToCsv(productsWithEmptyStrings);
      const blobContent = (global.Blob as any).mock.calls[0][0][0];
      expect(blobContent).toContain('""'); // Empty strings should be properly quoted
    });
  });

  describe('Data formatting and validation', () => {
    it('should format numbers consistently in CSV', () => {
      const productsWithDecimals = [
        { id: 'p1', name: 'Product A', category: 'TestCat', volume: 700.5, pricePerBottle: 20.999, pricePer100ml: 2.8571428571 }
      ];
      
      exportService.exportProductsToCsv(productsWithDecimals as Product[]);
      const blobContent = (global.Blob as any).mock.calls[0][0][0];
      expect(blobContent).toContain('700.5');
      expect(blobContent).toContain('20.999');
      expect(blobContent).toContain('2.8571428571');
    });

    it('should handle products with all optional fields missing', () => {
      const minimalProducts = [
        { id: 'p1', name: 'Product A', category: 'Cat1', volume: 700, pricePerBottle: 20 }
      ];
      
      exportService.exportProductsToCsv(minimalProducts);
      const blobContent = (global.Blob as any).mock.calls[0][0][0];
      expect(blobContent).toContain('"p1","Product A","Cat1","700","","20","","","",""');
    });

    it('should handle complex inventory data with edge cases', () => {
      const complexArea = {
        ...mockArea,
        inventoryItems: [
          { productId: 'p1', startCrates: 0, startBottles: 0, startOpenVolumeMl: 0, endCrates: 0, endBottles: 0, endOpenVolumeMl: 0 },
          { productId: 'p2', startCrates: 100, startBottles: 99, startOpenVolumeMl: 999.99, endCrates: 50, endBottles: 49, endOpenVolumeMl: 499.99 }
        ]
      };
      
      (CalculationService.calculateAreaConsumption as jest.Mock).mockReturnValue([
        { productId: 'p1', consumedUnits: 0, consumedVolumeMl: 0, costOfConsumption: 0, notes: [] },
        { productId: 'p2', consumedUnits: 50.5, consumedVolumeMl: 25249.99, costOfConsumption: 1262.495, notes: ['High consumption'] }
      ]);
      
      exportService.exportAreaInventoryToCsv(complexArea, mockLocation.name, mockCounter.name, mockProducts, true);
      const blobContent = (global.Blob as any).mock.calls[0][0][0];
      expect(blobContent).toContain('"0.00","0","0.00",""'); // Zero consumption case
      expect(blobContent).toContain('"50.50","25249.99","1262.50","High consumption"'); // High consumption case
    });

    it('should handle JSON export with deeply nested data', () => {
      const complexLocation = {
        ...mockLocation,
        counters: [
          {
            ...mockCounter,
            areas: [
              {
                ...mockArea,
                inventoryItems: Array.from({ length: 100 }, (_, i) => ({
                  productId: `p${i}`,
                  startCrates: i,
                  startBottles: i * 2,
                  startOpenVolumeMl: i * 100,
                  endCrates: i - 1,
                  endBottles: i * 2 - 1,
                  endOpenVolumeMl: i * 100 - 50
                }))
              }
            ]
          }
        ]
      };
      
      exportService.exportLocationToJson(complexLocation);
      const jsonContent = (global.Blob as any).mock.calls[0][0][0];
      const parsedJson = JSON.parse(jsonContent);
      expect(parsedJson.counters[0].areas[0].inventoryItems).toHaveLength(100);
    });
  });

  describe('Filename generation and sanitization', () => {
    it('should sanitize filenames with various special characters', () => {
      const testCases = [
        { input: 'Normal Name', expected: 'Normal_Name' },
        { input: 'Name/With\\Slashes', expected: 'Name_With_Slashes' },
        { input: 'Name:With*Colons?', expected: 'Name_With_Colons_' },
        { input: 'Name"With<Quotes>', expected: 'Name_With_Quotes_' },
        { input: 'Name|With|Pipes', expected: 'Name_With_Pipes' },
        { input: 'ümlaut äöü ÄÖÜ ß', expected: 'ümlaut_äöü_ÄÖÜ_ß' }
      ];
      
      testCases.forEach(({ input, expected }) => {
        const area = { ...mockArea, name: input };
        exportService.exportAreaInventoryToCsv(area, mockLocation.name, mockCounter.name, mockProducts, false);
        const downloadCall = createElementSpy.mock.results[createElementSpy.mock.results.length - 1]!.value;
        expect(downloadCall.download).toContain(expected);
      });
    });

    it('should handle extremely long filenames', () => {
      const longName = 'A'.repeat(300);
      const area = { ...mockArea, name: longName };
      
      exportService.exportAreaInventoryToCsv(area, mockLocation.name, mockCounter.name, mockProducts, false);
      const downloadCall = createElementSpy.mock.results[0]!.value;
      expect(downloadCall.download.length).toBeLessThan(255); // Common filesystem limit
    });
  });

  describe('Memory management and cleanup', () => {
    it('should revoke object URLs even when download fails', () => {
      linkClickSpy.mockImplementation(() => {
        throw new Error('Click failed');
      });
      
      expect(() => exportService.exportProductsToCsv(mockProducts)).not.toThrow();
      expect(revokeObjectURLSpy).toHaveBeenCalled();
    });

    it('should clean up DOM elements even when errors occur', () => {
      removeChildSpy.mockImplementation(() => {
        throw new Error('removeChild failed');
      });
      
      expect(() => exportService.exportProductsToCsv(mockProducts)).not.toThrow();
      expect(removeChildSpy).toHaveBeenCalled();
    });

    it('should handle multiple rapid export calls without memory leaks', () => {
      for (let i = 0; i < 10; i++) {
        exportService.exportProductsToCsv(mockProducts);
      }
      
      expect(createObjectURLSpy).toHaveBeenCalledTimes(10);
      expect(revokeObjectURLSpy).toHaveBeenCalledTimes(10);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle export when calculation service returns empty results', () => {
      (CalculationService.calculateAreaConsumption as jest.Mock).mockReturnValue([]);
      
      exportService.exportAreaInventoryToCsv(mockArea, mockLocation.name, mockCounter.name, mockProducts, true);
      const blobContent = (global.Blob as any).mock.calls[0][0][0];
      expect(blobContent).toContain('productId,productName,category,volume,pricePerBottle,pricePer100ml,startCrates,startBottles,startOpenVolumeMl,endCrates,endBottles,endOpenVolumeMl,consumedUnits,consumedVolumeMl,costOfConsumption,consumptionNotes');
    });

    it('should handle products not found in product list during inventory export', () => {
      const areaWithUnknownProduct = {
        ...mockArea,
        inventoryItems: [
          { productId: 'unknown', startCrates: 1, startBottles: 1, startOpenVolumeMl: 100, endCrates: 0, endBottles: 0, endOpenVolumeMl: 0 }
        ]
      };
      
      (CalculationService.calculateAreaConsumption as jest.Mock).mockReturnValue([
        { productId: 'unknown', consumedUnits: 1, consumedVolumeMl: 600, costOfConsumption: 0, notes: [] }
      ]);
      
      exportService.exportAreaInventoryToCsv(areaWithUnknownProduct, mockLocation.name, mockCounter.name, mockProducts, true);
      const blobContent = (global.Blob as any).mock.calls[0][0][0];
      expect(blobContent).toContain('"unknown","Unbekanntes Produkt","","","","","1","1","100","0","0","0","1.00","600","0.00",""');
    });

    it('should handle calculation service throwing errors', () => {
      (CalculationService.calculateAreaConsumption as jest.Mock).mockImplementation(() => {
        throw new Error('Calculation failed');
      });
      
      expect(() => exportService.exportAreaInventoryToCsv(mockArea, mockLocation.name, mockCounter.name, mockProducts, true)).not.toThrow();
      expect(ToastNotifications.showToast).toHaveBeenCalledWith(
        expect.stringContaining('Fehler bei der Berechnung'),
        'error'
      );
    });
  });

  describe('CSV format validation', () => {
    it('should produce valid CSV with proper escaping for all special characters', () => {
      const productsWithSpecialChars = [
        { 
          id: 'p1', 
          name: 'Product "With" Quotes, Commas\nAnd Newlines\r\nAnd Carriage Returns', 
          category: 'Cat,1', 
          volume: 700, 
          pricePerBottle: 20,
          supplier: 'Supplier\twith\ttabs'
        }
      ];
      
      exportService.exportProductsToCsv(productsWithSpecialChars);
      const blobContent = (global.Blob as any).mock.calls[0][0][0];
      
      // Check proper CSV escaping
      expect(blobContent).toContain('"Product ""With"" Quotes, Commas\nAnd Newlines\r\nAnd Carriage Returns"');
      expect(blobContent).toContain('"Cat,1"');
      expect(blobContent).toContain('"Supplier\twith\ttabs"');
    });

    it('should maintain consistent column order in CSV output', () => {
      exportService.exportProductsToCsv(mockProducts);
      const blobContent = (global.Blob as any).mock.calls[0][0][0];
      const lines = blobContent.split('\n');
      const headers = lines[0].split(',');
      
      expect(headers).toEqual([
        'id', 'name', 'category', 'volume', 'itemsPerCrate', 
        'pricePerBottle', 'pricePer100ml', 'supplier', 'imageUrl', 'notes'
      ]);
    });
  });
}); // Closes the main ExportService describe block

  describe('Advanced Data Validation and Edge Cases', () => {
    it('should handle products with extremely long field values', () => {
      const longString = 'A'.repeat(10000);
      const productsWithLongValues = [
        { 
          id: 'p1', 
          name: longString, 
          category: longString, 
          volume: 700, 
          pricePerBottle: 20,
          supplier: longString,
          notes: longString
        }
      ];
      
      expect(() => exportService.exportProductsToCsv(productsWithLongValues)).not.toThrow();
      const blobContent = (global.Blob as any).mock.calls[0][0][0];
      expect(blobContent).toContain(`"${longString}"`);
    });

    it('should handle products with Unicode and emoji characters', () => {
      const productsWithUnicode = [
        { 
          id: '🍺1', 
          name: 'Bière Française 🇫🇷', 
          category: 'Alcool 🍻', 
          volume: 500, 
          pricePerBottle: 25.50,
          supplier: 'Ünîcødê Suppłîęr'
        }
      ];
      
      exportService.exportProductsToCsv(productsWithUnicode);
      const blobContent = (global.Blob as any).mock.calls[0][0][0];
      expect(blobContent).toContain('🍺1');
      expect(blobContent).toContain('Bière Française 🇫🇷');
      expect(blobContent).toContain('Alcool 🍻');
    });

    it('should handle numeric values at extreme ranges', () => {
      const productsWithExtremeValues = [
        { 
          id: 'p1', 
          name: 'Product A', 
          category: 'Test', 
          volume: Number.MAX_SAFE_INTEGER, 
          pricePerBottle: Number.MIN_VALUE,
          pricePer100ml: 999999999.999999999
        },
        { 
          id: 'p2', 
          name: 'Product B', 
          category: 'Test', 
          volume: 0, 
          pricePerBottle: 0,
          pricePer100ml: 0.000000001
        }
      ];
      
      exportService.exportProductsToCsv(productsWithExtremeValues);
      const blobContent = (global.Blob as any).mock.calls[0][0][0];
      expect(blobContent).toContain(Number.MAX_SAFE_INTEGER.toString());
      expect(blobContent).toContain(Number.MIN_VALUE.toString());
    });

    it('should handle products with scientific notation values', () => {
      const productsWithScientificNotation = [
        { 
          id: 'p1', 
          name: 'Product A', 
          category: 'Test', 
          volume: 1e10, 
          pricePerBottle: 1.23e-5,
          pricePer100ml: 4.56e+3
        }
      ];
      
      exportService.exportProductsToCsv(productsWithScientificNotation);
      const blobContent = (global.Blob as any).mock.calls[0][0][0];
      expect(blobContent).toContain('10000000000'); // 1e10
      expect(blobContent).toContain('0.0000123'); // 1.23e-5
    });

    it('should handle circular reference-like data structures safely', () => {
      const locationWithDeepNesting = {
        id: 'loc1',
        name: 'Test Location',
        address: '123 Test St',
        counters: Array.from({ length: 50 }, (_, i) => ({
          id: `ctr${i}`,
          name: `Counter ${i}`,
          description: `Description ${i}`,
          areas: Array.from({ length: 20 }, (_, j) => ({
            id: `area${i}-${j}`,
            name: `Area ${i}-${j}`,
            displayOrder: j,
            inventoryItems: Array.from({ length: 100 }, (_, k) => ({
              productId: `p${k}`,
              startCrates: k % 10,
              startBottles: k % 20,
              startOpenVolumeMl: k * 10,
              endCrates: (k % 10) - 1,
              endBottles: (k % 20) - 1,
              endOpenVolumeMl: k * 10 - 5
            }))
          }))
        }))
      };
      
      expect(() => exportService.exportLocationToJson(locationWithDeepNesting)).not.toThrow();
      const jsonContent = (global.Blob as any).mock.calls[0][0][0];
      expect(() => JSON.parse(jsonContent)).not.toThrow();
    });
  });

  describe('Performance and Stress Testing', () => {
    it('should handle export of maximum realistic product count efficiently', () => {
      const startTime = Date.now();
      const massiveProducts = Array.from({ length: 50000 }, (_, i) => ({
        id: `product-${i}`,
        name: `Product ${i}`,
        category: `Category ${i % 100}`,
        volume: 500 + (i % 1000),
        pricePerBottle: 10 + (i * 0.01),
        pricePer100ml: 2 + (i * 0.001),
        itemsPerCrate: 12,
        supplier: `Supplier ${i % 50}`,
        imageUrl: `https://example.com/image${i}.jpg`,
        notes: `Notes for product ${i}`
      }));
      
      exportService.exportProductsToCsv(massiveProducts);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it('should handle memory-intensive inventory data without issues', () => {
      const memoryIntensiveArea = {
        id: 'area1',
        name: 'Memory Test Area',
        displayOrder: 1,
        inventoryItems: Array.from({ length: 10000 }, (_, i) => ({
          productId: `p${i}`,
          startCrates: Math.floor(Math.random() * 100),
          startBottles: Math.floor(Math.random() * 24),
          startOpenVolumeMl: Math.random() * 500,
          endCrates: Math.floor(Math.random() * 100),
          endBottles: Math.floor(Math.random() * 24),
          endOpenVolumeMl: Math.random() * 500
        }))
      };

      const largeProductList = Array.from({ length: 5000 }, (_, i) => ({
        id: `p${i}`,
        name: `Product ${i}`,
        category: `Category ${i % 50}`,
        volume: 500,
        pricePerBottle: 20
      }));

      (CalculationService.calculateAreaConsumption as jest.Mock).mockReturnValue(
        Array.from({ length: 10000 }, (_, i) => ({
          productId: `p${i}`,
          consumedUnits: Math.random() * 10,
          consumedVolumeMl: Math.random() * 5000,
          costOfConsumption: Math.random() * 200,
          notes: [`Note ${i}`]
        }))
      );
      
      expect(() => exportService.exportAreaInventoryToCsv(
        memoryIntensiveArea, 
        'Test Location', 
        'Test Counter', 
        largeProductList, 
        true
      )).not.toThrow();
    });

    it('should handle rapid successive export calls without resource exhaustion', () => {
      const rapidCallCount = 100;
      const promises: Promise<void>[] = [];
      
      for (let i = 0; i < rapidCallCount; i++) {
        promises.push(
          new Promise<void>(resolve => {
            setTimeout(() => {
              exportService.exportProductsToCsv([mockProducts[0]!]);
              resolve();
            }, Math.random() * 10);
          })
        );
      }
      
      expect(() => Promise.all(promises)).not.toThrow();
      expect(createObjectURLSpy.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('Browser Compatibility and Environment Testing', () => {
    it('should handle missing URL API gracefully', () => {
      const originalURL = global.URL;
      try {
        delete (global as any).URL;
        
        expect(() => exportService.exportProductsToCsv(mockProducts)).not.toThrow();
        expect(ToastNotifications.showToast).toHaveBeenCalledWith(
          expect.stringContaining('Browser nicht unterstützt'),
          'error'
        );
      } finally {
        (global as any).URL = originalURL;
      }
    });

    it('should handle missing document.createElement gracefully', () => {
      const originalCreateElement = document.createElement;
      try {
        (document as any).createElement = undefined;
        
        expect(() => exportService.exportProductsToCsv(mockProducts)).not.toThrow();
        expect(ToastNotifications.showToast).toHaveBeenCalledWith(
          expect.stringContaining('Browser nicht unterstützt'),
          'error'
        );
      } finally {
        document.createElement = originalCreateElement;
      }
    });

    it('should handle missing Blob constructor gracefully', () => {
      const originalBlob = global.Blob;
      try {
        delete (global as any).Blob;
        
        expect(() => exportService.exportProductsToCsv(mockProducts)).not.toThrow();
        expect(ToastNotifications.showToast).toHaveBeenCalledWith(
          expect.stringContaining('Browser nicht unterstützt'),
          'error'
        );
      } finally {
        (global as any).Blob = originalBlob;
      }
    });

    it('should handle DOM elements without style property', () => {
      createElementSpy.mockReturnValue({
        href: '',
        download: '',
        click: linkClickSpy
        // Intentionally omitting style property
      } as any);
      
      expect(() => exportService.exportProductsToCsv(mockProducts)).not.toThrow();
      expect(linkClickSpy).toHaveBeenCalled();
    });
  });

  describe('Security and Data Integrity Testing', () => {
    it('should sanitize potentially malicious filenames', () => {
      const maliciousNames = [
        '../../../etc/passwd',
        'test<script>alert("xss")</script>',
        'CON', 'PRN', 'AUX', 'NUL', // Windows reserved names
        'file.exe',
        'test\x00null.txt'
      ];
      
      maliciousNames.forEach(name => {
        const testArea = { ...mockArea, name };
        exportService.exportAreaInventoryToCsv(testArea, mockLocation.name, mockCounter.name, mockProducts, false);
        const downloadCall = createElementSpy.mock.results[createElementSpy.mock.results.length - 1]!.value;
        
        expect(downloadCall.download).not.toContain('../');
        expect(downloadCall.download).not.toContain('<script>');
        expect(downloadCall.download).not.toContain('\x00');
      });
    });

    it('should prevent CSV injection in exported data', () => {
      const maliciousProducts = [
        { 
          id: '=cmd|"/c calc"!A0', 
          name: '@SUM(1+1)*cmd|"/c calc"!A0', 
          category: '+2+5+cmd|"/c calc"!A0',
          volume: 700, 
          pricePerBottle: 20,
          supplier: '-2+3+cmd|"/c calc"!A0'
        }
      ];
      
      exportService.exportProductsToCsv(maliciousProducts);
      const blobContent = (global.Blob as any).mock.calls[0][0][0];
      
      // CSV injection attempts should be escaped or neutralized
      expect(blobContent).not.toMatch(/^[=@+\-]/m); // Formula indicators at start of fields
    });

    it('should handle extremely large single field values without causing DoS', () => {
      const megabyteString = 'A'.repeat(1024 * 1024); // 1MB string
      const productWithLargeField = [
        { 
          id: 'p1', 
          name: megabyteString, 
          category: 'Test', 
          volume: 700, 
          pricePerBottle: 20
        }
      ];
      
      const startTime = Date.now();
      exportService.exportProductsToCsv(productWithLargeField);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(10000); // Should not hang
      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it('should validate JSON structure integrity in exports', () => {
      exportService.exportLocationToJson(mockLocation);
      const jsonContent = (global.Blob as any).mock.calls[0][0][0];
      const parsedJson = JSON.parse(jsonContent);
      
      // Verify required structure
      expect(parsedJson).toHaveProperty('exportTimestamp');
      expect(parsedJson).toHaveProperty('locationDetails');
      expect(parsedJson).toHaveProperty('counters');
      expect(Array.isArray(parsedJson.counters)).toBe(true);
      
      // Verify no prototype pollution
      expect(parsedJson.__proto__).toBeUndefined();
      expect(parsedJson.constructor).toBeUndefined();
    });
  });

  describe('Internationalization and Localization', () => {
    it('should handle right-to-left text in exports', () => {
      const rtlProducts = [
        { 
          id: 'p1', 
          name: 'منتج عربي', 
          category: 'فئة اختبار', 
          volume: 700, 
          pricePerBottle: 20,
          supplier: 'مورد عربي'
        }
      ];
      
      exportService.exportProductsToCsv(rtlProducts);
      const blobContent = (global.Blob as any).mock.calls[0][0][0];
      expect(blobContent).toContain('منتج عربي');
      expect(blobContent).toContain('فئة اختبار');
    });

    it('should handle mixed language content correctly', () => {
      const multilingualProducts = [
        { 
          id: 'p1', 
          name: 'Product English Deutsch Français 日本語 中文 العربية', 
          category: 'Mixed Languages', 
          volume: 700, 
          pricePerBottle: 20
        }
      ];
      
      exportService.exportProductsToCsv(multilingualProducts);
      const blobContent = (global.Blob as any).mock.calls[0][0][0];
      expect(blobContent).toContain('Product English Deutsch Français 日本語 中文 العربية');
    });

    it('should maintain UTF-8 encoding in blob creation', () => {
      exportService.exportProductsToCsv(mockProducts);
      const blobOptions = (global.Blob as any).mock.calls[0][1];
      expect(blobOptions.type).toContain('charset=utf-8');
    });
  });

  describe('Real-world Integration Scenarios', () => {
    it('should handle export during network connectivity issues', () => {
      // Simulate network-related errors that might affect blob creation or URL generation
      createObjectURLSpy.mockImplementation(() => {
        throw new DOMException('Network error', 'NetworkError');
      });
      
      expect(() => exportService.exportProductsToCsv(mockProducts)).not.toThrow();
      expect(ToastNotifications.showToast).toHaveBeenCalledWith(
        expect.stringContaining('Fehler beim Erstellen des Download-Links'),
        'error'
      );
    });

    it('should handle concurrent exports of different types', () => {
      // Simulate multiple concurrent export operations
      exportService.exportProductsToCsv(mockProducts);
      exportService.exportAreaInventoryToCsv(mockArea, mockLocation.name, mockCounter.name, mockProducts, true);
      exportService.exportLocationToJson(mockLocation);
      
      expect(createObjectURLSpy).toHaveBeenCalledTimes(3);
      expect(revokeObjectURLSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle products with incomplete calculation data', () => {
      (CalculationService.calculateAreaConsumption as jest.Mock).mockReturnValue([
        { productId: 'p1', consumedUnits: null, consumedVolumeMl: undefined, costOfConsumption: NaN, notes: null },
        { productId: 'p2' } // Missing calculation fields
      ]);
      
      exportService.exportAreaInventoryToCsv(mockArea, mockLocation.name, mockCounter.name, mockProducts, true);
      const blobContent = (global.Blob as any).mock.calls[0][0][0];
      
      // Should handle null/undefined/NaN values gracefully
      expect(blobContent).toContain('""'); // Should convert to empty strings
    });

    it('should maintain data consistency across multiple export formats', () => {
      // Export same data in different formats and verify consistency
      exportService.exportAreaInventoryToCsv(mockArea, mockLocation.name, mockCounter.name, mockProducts, false);
      const csvContent = (global.Blob as any).mock.calls[0][0][0];
      
      exportService.exportLocationToJson(mockLocation);
      const jsonContent = (global.Blob as any).mock.calls[1][0][0];
      const jsonData = JSON.parse(jsonContent);
      
      // Verify that core data matches between formats
      expect(csvContent).toContain(mockArea.inventoryItems[0]!.productId);
      expect(jsonData.counters[0].areas[0].inventoryItems[0].productId).toBe(mockArea.inventoryItems[0]!.productId);
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should provide meaningful error messages for common user errors', () => {
      // Test various error scenarios that users might encounter
      const errorScenarios = [
        { 
          setup: () => (global as any).Blob = undefined,
          expectedMessage: 'Browser nicht unterstützt'
        },
        { 
          setup: () => createObjectURLSpy.mockImplementation(() => { throw new Error('Quota exceeded'); }),
          expectedMessage: 'Fehler beim Erstellen des Download-Links'
        },
        { 
          setup: () => createElementSpy.mockImplementation(() => { throw new Error('DOM not available'); }),
          expectedMessage: 'Fehler beim Erstellen des Download-Elements'
        }
      ];
      
      errorScenarios.forEach(({ setup, expectedMessage }) => {
        jest.clearAllMocks();
        setup();
        
        expect(() => exportService.exportProductsToCsv(mockProducts)).not.toThrow();
        expect(ToastNotifications.showToast).toHaveBeenCalledWith(
          expect.stringContaining(expectedMessage),
          'error'
        );
      });
    });

    it('should generate descriptive filenames that help users identify content', () => {
      const timestamp = new Date().toISOString().split('T')[0];
      
      exportService.exportAreaInventoryToCsv(mockArea, mockLocation.name, mockCounter.name, mockProducts, true);
      const downloadCall = createElementSpy.mock.results[0]!.value;
      
      expect(downloadCall.download).toContain(mockLocation.name.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_'));
      expect(downloadCall.download).toContain(mockCounter.name.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_'));
      expect(downloadCall.download).toContain(mockArea.name.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_'));
      expect(downloadCall.download).toContain('.csv');
    });

    it('should handle downloads in browsers with restrictive download policies', () => {
      // Simulate browsers that might block automatic downloads
      linkClickSpy.mockImplementation(() => {
        throw new DOMException('Download blocked by policy', 'SecurityError');
      });
      
      expect(() => exportService.exportProductsToCsv(mockProducts)).not.toThrow();
      expect(ToastNotifications.showToast).toHaveBeenCalledWith(
        expect.stringContaining('Download konnte nicht gestartet werden'),
        'error'
      );
    });
  });
