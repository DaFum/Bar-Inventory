import { initInventoryView } from './inventory-view';
import { dbService } from '../../services/indexeddb.service';
import * as CalculationService from '../../services/calculation.service';
import * as ExportService from '../../services/export.service';
import * as ToastNotifications from './toast-notifications';
import * as Helpers from '../../utils/helpers';
import { Location, Product, InventoryEntry, Area, Counter } from '../../models';
import { escapeHtml } from '../../utils/security';

// Mocks
jest.mock('../../services/indexeddb.service');
jest.mock('../../services/calculation.service');
jest.mock('../../services/export.service');
jest.mock('./toast-notifications');
jest.mock('../../utils/helpers', () => ({
  ...jest.requireActual('../../utils/helpers'), // Retain actual debounce for coverage if desired, or mock it
  debounce: jest.fn((fn) => fn), // Simple pass-through for debounce
  generateId: jest.fn(() => 'mock-id'),
}));
jest.mock('../../utils/security', () => ({
    escapeHtml: jest.fn(str => str), // Pass-through
}));


describe('Inventory View (inventory-view.ts)', () => {
    let container: HTMLElement;
    let mockLocations: Location[];
    let mockProducts: Product[];

    const mockArea1: Area = { id: 'area1', name: 'Main Shelf', inventoryItems: [], displayOrder: 1 };
    const mockArea2: Area = { id: 'area2', name: 'Fridge', inventoryItems: [], displayOrder: 2 };
    const mockCounter1: Counter = { id: 'counter1', name: 'Front Bar', areas: [mockArea1, mockArea2], description: '' };
    // Removed 'products: []' and 'inventoryEntries: []' as they are not part of Location model
    const mockLocation1: Location = { id: 'loc1', name: 'Downtown Bar', counters: [mockCounter1], description: '' };


    beforeEach(async () => {
        container = document.createElement('div');
        document.body.appendChild(container);

        jest.clearAllMocks();

        // Reset internal state by re-assigning mock data (inventory-view uses a module-level state object)
        mockLocations = [JSON.parse(JSON.stringify(mockLocation1))]; // Deep clone
        mockProducts = [
            { id: 'prod1', name: 'Vodka', category: 'Spirits', volume: 750, itemsPerCrate: 12, pricePerBottle: 20, pricePer100ml: 2.67 },
            { id: 'prod2', name: 'Orange Juice', category: 'Mixers', volume: 1000, itemsPerCrate: 0, pricePerBottle: 3, pricePer100ml: 0.3 },
        ];

        // Mock initial inventory items for area1
        mockArea1.inventoryItems = [
            { productId: 'prod1', startCrates: 1, startBottles: 2, startOpenVolumeMl: 100, endCrates: 0, endBottles: 1, endOpenVolumeMl: 500 },
            { productId: 'prod2', startCrates: 0, startBottles: 5, startOpenVolumeMl: 0, endCrates: 0, endBottles: 2, endOpenVolumeMl: 0 },
        ];
        mockArea2.inventoryItems = []; // Fridge starts empty for some tests


        (dbService.loadLocations as jest.Mock).mockResolvedValue(JSON.parse(JSON.stringify(mockLocations)));
        (dbService.loadProducts as jest.Mock).mockResolvedValue(JSON.parse(JSON.stringify(mockProducts)));
        (dbService.saveLocation as jest.Mock).mockResolvedValue('loc1');

    (CalculationService.calculateAreaConsumption as jest.Mock).mockImplementation((items: InventoryEntry[], prods: Product[]) => {
      return items.map((item: InventoryEntry) => ({
                productId: item.productId,
                consumedVolumeMl: (item.startOpenVolumeMl || 0) - (item.endOpenVolumeMl || 0), // Simplified
        consumedUnits: ((item.startOpenVolumeMl || 0) - (item.endOpenVolumeMl || 0)) / (prods.find((p: Product) => p.id === item.productId)?.volume || 1),
                costOfConsumption: 0, // Simplified
                notes: [],
            }));
        });
        (ExportService.exportService.exportAreaInventoryToCsv as jest.Mock);

        await initInventoryView(container); // Initialize the view
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    test('initInventoryView should set up HTML structure and load initial data', () => {
        expect(container.querySelector('#inventory-selection-bar')).not.toBeNull();
        expect(container.querySelector('#inventory-table-container')).not.toBeNull();
        expect(container.querySelector('#inventory-actions-bar')).not.toBeNull();
        expect(dbService.loadLocations).toHaveBeenCalled();
        expect(dbService.loadProducts).toHaveBeenCalled();
        expect(container.querySelector('#location-select-inv option[value="loc1"]')).not.toBeNull();
    });

    describe('Selection Bar and Phase Switching', () => {
        test('selecting location, counter, and area should render inventory table', async () => {
            const locSelect = container.querySelector('#location-select-inv') as HTMLSelectElement;
            locSelect.value = 'loc1';
            locSelect.dispatchEvent(new Event('change'));
            await Promise.resolve(); // Wait for async operations in event handlers

            const counterSelect = container.querySelector('#counter-select-inv') as HTMLSelectElement;
            expect(counterSelect.disabled).toBe(false);
            counterSelect.value = 'counter1';
            counterSelect.dispatchEvent(new Event('change'));
            await Promise.resolve();

            const areaSelect = container.querySelector('#area-select-inv') as HTMLSelectElement;
            expect(areaSelect.disabled).toBe(false);
            areaSelect.value = 'area1';
            areaSelect.dispatchEvent(new Event('change'));
            await Promise.resolve();

            expect(container.querySelector('.inventory-table')).not.toBeNull();
            expect(container.querySelector('#inventory-actions-bar button')).not.toBeNull(); // Save button etc.
        });

        test('switching phase should re-render table and update button styles', async () => {
            // First, select an area to make phase switching meaningful for table content
            (container.querySelector('#location-select-inv') as HTMLSelectElement).value = 'loc1';
            (container.querySelector('#location-select-inv') as HTMLSelectElement).dispatchEvent(new Event('change'));
            await Promise.resolve();
            (container.querySelector('#counter-select-inv') as HTMLSelectElement).value = 'counter1';
            (container.querySelector('#counter-select-inv') as HTMLSelectElement).dispatchEvent(new Event('change'));
            await Promise.resolve();
            (container.querySelector('#area-select-inv') as HTMLSelectElement).value = 'area1';
            (container.querySelector('#area-select-inv') as HTMLSelectElement).dispatchEvent(new Event('change'));
            await Promise.resolve();

            const endPhaseBtn = container.querySelector('#phase-end-btn') as HTMLButtonElement;
            endPhaseBtn.click();
            await Promise.resolve();

            expect(endPhaseBtn.classList.contains('btn-primary')).toBe(true);
            expect(container.querySelector('#phase-start-btn')?.classList.contains('btn-secondary')).toBe(true);
            // Check if table content reflects 'end' phase (e.g., input values for endCrstes)
            const firstCrateInput = container.querySelector('.inventory-table input[data-field="endCrates"]') as HTMLInputElement;
            expect(firstCrateInput).not.toBeNull();
            expect(firstCrateInput.value).toBe(mockArea1.inventoryItems[0].endCrates?.toString() || '0');

            const consumptionPhaseBtn = container.querySelector('#phase-consumption-btn') as HTMLButtonElement;
            consumptionPhaseBtn.click();
            await Promise.resolve();
            expect(consumptionPhaseBtn.classList.contains('btn-primary')).toBe(true);
            expect(container.querySelector('.consumption-table')).not.toBeNull();
        });
    });

    describe('Inventory Table Interaction (Start/End Phase)', () => {
        beforeEach(async () => {
            // Select loc1, counter1, area1
            (container.querySelector('#location-select-inv') as HTMLSelectElement).value = 'loc1';
            (container.querySelector('#location-select-inv') as HTMLSelectElement).dispatchEvent(new Event('change'));
            await Promise.resolve();
            (container.querySelector('#counter-select-inv') as HTMLSelectElement).value = 'counter1';
            (container.querySelector('#counter-select-inv') as HTMLSelectElement).dispatchEvent(new Event('change'));
            await Promise.resolve();
            (container.querySelector('#area-select-inv') as HTMLSelectElement).value = 'area1';
            (container.querySelector('#area-select-inv') as HTMLSelectElement).dispatchEvent(new Event('change'));
            await Promise.resolve(); // Ensures table is rendered
        });

        test('input fields should update in-memory state (debounced)', () => {
            const vodkaCratesInput = container.querySelector('.inventory-table tr[data-product-id="prod1"] input[data-field="startCrates"]') as HTMLInputElement;
            vodkaCratesInput.value = '3';
            vodkaCratesInput.dispatchEvent(new Event('input'));

            // Debounce is mocked to be pass-through, so change should be immediate for test state
            const itemInState = mockLocations[0]!.counters[0]!.areas[0]!.inventoryItems.find((i: InventoryEntry) => i.productId === 'prod1');
            expect(itemInState?.startCrates).toBe(3);
        });

        test('saveCurrentInventory should call dbService.saveLocation', () => {
            const saveBtn = container.querySelector('#save-inventory-btn') as HTMLButtonElement;
            saveBtn.click();
            expect(dbService.saveLocation).toHaveBeenCalledWith(mockLocations[0]); // The state.selectedLocation
            expect(ToastNotifications.showToast).toHaveBeenCalledWith(expect.stringContaining('gespeichert!'), 'success');
        });

        test('fillDefaultValues should update UI and in-memory state for "full" values', () => {
            window.confirm = jest.fn(() => true);
            const fillBtn = container.querySelector('#fill-defaults-btn') as HTMLButtonElement;
            fillBtn.click();

            const item1 = mockLocations[0]!.counters[0]!.areas[0]!.inventoryItems.find((i: InventoryEntry) => i.productId === 'prod1'); // Vodka
            const item2 = mockLocations[0]!.counters[0]!.areas[0]!.inventoryItems.find((i: InventoryEntry) => i.productId === 'prod2'); // OJ

            expect(item1?.startCrates).toBe(1); // Vodka has itemsPerCrate
            expect(item1?.startBottles).toBe(0);
            expect(item2?.startCrates).toBe(0); // OJ does not
            expect(item2?.startBottles).toBe(1);

            expect(ToastNotifications.showToast).toHaveBeenCalledWith(expect.stringContaining("'Alles voll'"), "info");
            // Check if table re-rendered (e.g., one of the inputs reflects the new value)
            const vodkaCratesInput = container.querySelector('.inventory-table tr[data-product-id="prod1"] input[data-field="startCrates"]') as HTMLInputElement;
            expect(vodkaCratesInput.value).toBe('1');
        });
    });

    describe('Consumption View', () => {
        beforeEach(async () => {
            // Select loc1, counter1, area1
            (container.querySelector('#location-select-inv') as HTMLSelectElement).value = 'loc1';
            (container.querySelector('#location-select-inv') as HTMLSelectElement).dispatchEvent(new Event('change'));
            await Promise.resolve();
            (container.querySelector('#counter-select-inv') as HTMLSelectElement).value = 'counter1';
            (container.querySelector('#counter-select-inv') as HTMLSelectElement).dispatchEvent(new Event('change'));
            await Promise.resolve();
            (container.querySelector('#area-select-inv') as HTMLSelectElement).value = 'area1';
            (container.querySelector('#area-select-inv') as HTMLSelectElement).dispatchEvent(new Event('change'));
            await Promise.resolve();

            // Switch to consumption phase
            (container.querySelector('#phase-consumption-btn') as HTMLButtonElement).click();
            await Promise.resolve();
        });

        test('should render consumption table with calculated data', () => {
            expect(CalculationService.calculateAreaConsumption).toHaveBeenCalled();
            expect(container.querySelector('.consumption-table')).not.toBeNull();
            expect(container.querySelector('.consumption-table tbody tr td')?.textContent).toContain('Vodka'); // Product name
        });

        test('export consumption button should call exportService', () => {
            const exportBtn = container.querySelector('#export-consumption-btn') as HTMLButtonElement;
            exportBtn.click();
            expect(ExportService.exportService.exportAreaInventoryToCsv).toHaveBeenCalledWith(
                mockLocations[0]!.counters[0]!.areas[0], // selectedArea
                mockLocations[0]!.name, // selectedLocation.name
                mockLocations[0]!.counters[0]!.name, // selectedCounter.name
                mockProducts, // loadedProducts
                true
            );
            expect(ToastNotifications.showToast).toHaveBeenCalledWith(expect.stringContaining("erfolgreich als CSV exportiert"), "success");
        });
    });

    test('prepareInventoryItemsForArea should add missing products and sort them', () => {
        // Simulate an area with only one product initially
        const testArea: Area = { id: 'testArea', name: 'Test', inventoryItems: [
            { productId: 'prod2', startCrates: 1, endCrates: 0 } // Only OJ
        ], displayOrder: 1 };
        // Replace selectedArea in the module's state (this is tricky due to module-level state)
        // For this test, we'll assume we can manipulate the state for `state.selectedArea` before calling a function that uses it.
        // This would be easier if state was passed around or part of a class instance.
        // The function `prepareInventoryItemsForArea` is internal. We test its effect when `renderInventoryTable` is called.

        // To test this, we need to simulate selecting an area that doesn't have all products
        // Let's set up a new location for this and select it.
        const partialLocation: Location = {
            id: 'locPartial', name: 'Partial Loc', counters: [
                { id: 'counterPartial', name: 'Partial Counter', areas: [testArea], description: '' }
            ], products: [], inventoryEntries: [], description: ''
        };
        (dbService.loadLocations as jest.Mock).mockResolvedValue([partialLocation, ...mockLocations]);
        (dbService.loadProducts as jest.Mock).mockResolvedValue(mockProducts); // prod1 and prod2

        // Re-init to pick up new locations
        initInventoryView(container).then(async () => {
            (container.querySelector('#location-select-inv') as HTMLSelectElement).value = 'locPartial';
            (container.querySelector('#location-select-inv') as HTMLSelectElement).dispatchEvent(new Event('change'));
            await Promise.resolve();
            (container.querySelector('#counter-select-inv') as HTMLSelectElement).value = 'counterPartial';
            (container.querySelector('#counter-select-inv') as HTMLSelectElement).dispatchEvent(new Event('change'));
            await Promise.resolve();
            (container.querySelector('#area-select-inv') as HTMLSelectElement).value = 'testArea';
            (container.querySelector('#area-select-inv') as HTMLSelectElement).dispatchEvent(new Event('change'));
            await Promise.resolve();

            // Now, `testArea` (which is `state.selectedArea` internally) should have both prod1 and prod2
            const items = partialLocation.counters[0]!.areas[0]!.inventoryItems;
            expect(items.length).toBe(mockProducts.length); // Should have items for Vodka and OJ
            expect(items.find((i: InventoryEntry) => i.productId === 'prod1')).toBeTruthy(); // Vodka should have been added
            // Check sort order (Vodka/Spirits before OJ/Mixers)
            const prod1InArea = items.find((i: InventoryEntry) => i.productId === 'prod1');
            const prod2InArea = items.find((i: InventoryEntry) => i.productId === 'prod2');
            const prod1Index = items.indexOf(prod1InArea!);
            const prod2Index = items.indexOf(prod2InArea!);
            // Assuming category for prod1 (Spirits) comes after prod2 (Mixers) alphabetically
            // Product 1: Vodka (Spirits), Product 2: Orange Juice (Mixers)
            // So, Mixers should come before Spirits
            expect(items[0]!.productId).toBe('prod2'); // Orange Juice (Mixers)
            expect(items[1]!.productId).toBe('prod1'); // Vodka (Spirits)
        });
    });
});
