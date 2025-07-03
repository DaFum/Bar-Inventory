import { calculateSingleItemConsumption, calculateAreaConsumption } from './calculation.service';
import { InventoryEntry, Product } from '../models';

// Mock data for testing
const mockProduct: Product = {
  id: 'test-product-1',
  name: 'Test Beer',
  volume: 500, // 500ml per bottle
  itemsPerCrate: 24,
  pricePerBottle: 2.5,
  pricePer100ml: 0.5,
};

const mockProductNoPricing: Product = {
  id: 'test-product-2',
  name: 'Test Product No Price',
  volume: 330,
  itemsPerCrate: 12,
  pricePerBottle: 0,
  pricePer100ml: 0,
};

const mockProductZeroVolume: Product = {
  id: 'test-product-3',
  name: 'Test Product Zero Volume',
  volume: 0,
  itemsPerCrate: 10,
  pricePerBottle: 1.0,
  pricePer100ml: 0,
};

const mockInventoryEntry: InventoryEntry = {
  productId: 'test-product-1',
  startCrates: 2,
  startBottles: 5,
  startOpenVolumeMl: 100,
  endCrates: 1,
  endBottles: 10,
  endOpenVolumeMl: 50,
};

describe('Calculation Service', () => {
  describe('calculateSingleItemConsumption', () => {
    it('should calculate consumption correctly for normal inventory entry', () => {
      const result = calculateSingleItemConsumption(mockInventoryEntry, mockProduct);

      // Start: 2 crates * 24 bottles * 500ml + 5 bottles * 500ml + 100ml = 24000 + 2500 + 100 = 26600ml
      // End: 1 crate * 24 bottles * 500ml + 10 bottles * 500ml + 50ml = 12000 + 5000 + 50 = 17050ml
      // Consumed: 26600 - 17050 = 9550ml
      // Consumed units: 9550ml / 500ml = 19.1 bottles
      // Cost: 9550ml / 100ml * 0.50 = 47.75

      expect(result.productId).toBe('test-product-1');
      expect(result.consumedVolumeMl).toBe(9550);
      expect(result.consumedUnits).toBe(19.1);
      expect(result.costOfConsumption).toBe(47.75);
      expect(result.notes).toHaveLength(0);
    });

    it('should handle zero start inventory', () => {
      const zeroStartEntry: InventoryEntry = {
        productId: 'test-product-1',
        startCrates: 0,
        startBottles: 0,
        startOpenVolumeMl: 0,
        endCrates: 0,
        endBottles: 0,
        endOpenVolumeMl: 0,
      };

      const result = calculateSingleItemConsumption(zeroStartEntry, mockProduct);

      expect(result.consumedVolumeMl).toBe(0);
      expect(result.consumedUnits).toBe(0);
      expect(result.costOfConsumption).toBe(0);
    });

    it('should handle undefined values gracefully', () => {
      const partialEntry: InventoryEntry = {
        productId: 'test-product-1',
        startCrates: undefined,
        startBottles: 5,
        startOpenVolumeMl: undefined,
        endCrates: undefined,
        endBottles: 2,
        endOpenVolumeMl: undefined,
      };

      const result = calculateSingleItemConsumption(partialEntry, mockProduct);

      // Start: 5 bottles * 500ml = 2500ml
      // End: 2 bottles * 500ml = 1000ml
      // Consumed: 2500 - 1000 = 1500ml

      expect(result.consumedVolumeMl).toBe(1500);
      expect(result.consumedUnits).toBe(3);
    });

    it('should detect negative consumption', () => {
      const negativeConsumptionEntry: InventoryEntry = {
        productId: 'test-product-1',
        startCrates: 1,
        startBottles: 0,
        startOpenVolumeMl: 0,
        endCrates: 2,
        endBottles: 0,
        endOpenVolumeMl: 0,
      };

      const result = calculateSingleItemConsumption(negativeConsumptionEntry, mockProduct);

      // Start: 1 crate * 24 bottles * 500ml = 12000ml
      // End: 2 crates * 24 bottles * 500ml = 24000ml
      // Consumed: 12000 - 24000 = -12000ml

      expect(result.consumedVolumeMl).toBe(-12000);
      expect(result.notes).toContain(
        'Negative consumption detected (-12000ml). End count is higher than start.'
      );
    });

    it('should handle product with no pricing information', () => {
      const result = calculateSingleItemConsumption(mockInventoryEntry, mockProductNoPricing);

      expect(result.costOfConsumption).toBe(0);
      expect(result.notes).toContain('Pricing information incomplete for cost calculation.');
    });

    it('should handle product with zero volume', () => {
      const result = calculateSingleItemConsumption(mockInventoryEntry, mockProductZeroVolume);

      expect(result.notes).toContain(
        'Invalid product volume detected. Using raw volume for consumption units.'
      );
      expect(result.consumedUnits).toBe(result.consumedVolumeMl);
    });

    it('should use pricePerBottle when pricePer100ml is not available', () => {
      const productWithBottlePrice: Product = {
        id: 'test-product-bottle-price',
        name: 'Test Product Bottle Price',
        volume: 500,
        itemsPerCrate: 24,
        pricePerBottle: 2.5,
        pricePer100ml: 0,
      };

      const result = calculateSingleItemConsumption(mockInventoryEntry, productWithBottlePrice);

      // Cost: 9550ml * (2.50 / 500ml) = 9550 * 0.005 = 47.75
      expect(result.costOfConsumption).toBe(47.75);
    });

    it('should round cost to 2 decimal places', () => {
      const entryWithPreciseConsumption: InventoryEntry = {
        productId: 'test-product-1',
        startCrates: 0,
        startBottles: 1,
        startOpenVolumeMl: 0,
        endCrates: 0,
        endBottles: 0,
        endOpenVolumeMl: 167, // Results in 333ml consumption
      };

      const result = calculateSingleItemConsumption(entryWithPreciseConsumption, mockProduct);

      // Cost: 333ml / 100ml * 0.50 = 1.665, rounded to 1.67
      expect(result.costOfConsumption).toBe(1.67);
    });

    it('should handle large inventory quantities', () => {
      const largeInventoryEntry: InventoryEntry = {
        productId: 'test-product-1',
        startCrates: 100,
        startBottles: 0,
        startOpenVolumeMl: 0,
        endCrates: 50,
        endBottles: 0,
        endOpenVolumeMl: 0,
      };

      const result = calculateSingleItemConsumption(largeInventoryEntry, mockProduct);

      // Start: 100 crates * 24 bottles * 500ml = 1,200,000ml
      // End: 50 crates * 24 bottles * 500ml = 600,000ml
      // Consumed: 600,000ml

      expect(result.consumedVolumeMl).toBe(600000);
      expect(result.consumedUnits).toBe(1200); // 600,000ml / 500ml per bottle
      expect(result.costOfConsumption).toBe(3000); // 600,000ml / 100ml * 0.50
    });
  });

  describe('calculateAreaConsumption', () => {
    const mockProducts: Product[] = [
      mockProduct,
      mockProductNoPricing,
      {
        id: 'test-product-wine',
        name: 'Test Wine',
        volume: 750,
        itemsPerCrate: 6,
        pricePerBottle: 15.0,
        pricePer100ml: 2.0,
      },
    ];

    const mockInventoryEntries: InventoryEntry[] = [
      mockInventoryEntry,
      {
        productId: 'test-product-2',
        startCrates: 1,
        startBottles: 0,
        startOpenVolumeMl: 0,
        endCrates: 0,
        endBottles: 5,
        endOpenVolumeMl: 0,
      },
      {
        productId: 'test-product-wine',
        startCrates: 2,
        startBottles: 0,
        startOpenVolumeMl: 0,
        endCrates: 1,
        endBottles: 3,
        endOpenVolumeMl: 0,
      },
    ];

    it('should calculate consumption for multiple inventory items', () => {
      const results = calculateAreaConsumption(mockInventoryEntries, mockProducts);

      expect(results).toHaveLength(3);
      expect(results[0].productId).toBe('test-product-1');
      expect(results[1].productId).toBe('test-product-2');
      expect(results[2].productId).toBe('test-product-wine');
    });

    it('should handle missing product definitions', () => {
      const entriesWithMissingProduct: InventoryEntry[] = [
        mockInventoryEntry,
        {
          productId: 'non-existent-product',
          startCrates: 1,
          startBottles: 0,
          startOpenVolumeMl: 0,
          endCrates: 0,
          endBottles: 0,
          endOpenVolumeMl: 0,
        },
      ];

      const results = calculateAreaConsumption(entriesWithMissingProduct, mockProducts);

      expect(results).toHaveLength(2);
      expect(results[1].productId).toBe('non-existent-product');
      expect(results[1].consumedUnits).toBe(0);
      expect(results[1].consumedVolumeMl).toBe(0);
      expect(results[1].costOfConsumption).toBe(0);
      expect(results[1].notes).toContain('Product definition missing (ID: non-existent-product)');
    });

    it('should handle empty inventory array', () => {
      const results = calculateAreaConsumption([], mockProducts);

      expect(results).toHaveLength(0);
    });

    it('should handle empty products array', () => {
      const results = calculateAreaConsumption(mockInventoryEntries, []);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.consumedUnits).toBe(0);
        expect(result.consumedVolumeMl).toBe(0);
        expect(result.costOfConsumption).toBe(0);
        expect(result.notes).toContain(`Product definition missing (ID: ${result.productId})`);
      });
    });

    it('should maintain correct order of results', () => {
      const results = calculateAreaConsumption(mockInventoryEntries, mockProducts);

      expect(results[0].productId).toBe('test-product-1');
      expect(results[1].productId).toBe('test-product-2');
      expect(results[2].productId).toBe('test-product-wine');
    });

    it('should handle duplicate product IDs in inventory', () => {
      const duplicateEntries: InventoryEntry[] = [
        mockInventoryEntry,
        {
          productId: 'test-product-1', // Same product ID as first entry
          startCrates: 1,
          startBottles: 0,
          startOpenVolumeMl: 0,
          endCrates: 0,
          endBottles: 5,
          endOpenVolumeMl: 0,
        },
      ];

      const results = calculateAreaConsumption(duplicateEntries, mockProducts);

      expect(results).toHaveLength(2);
      expect(results[0].productId).toBe('test-product-1');
      expect(results[1].productId).toBe('test-product-1');
      // Both should have different consumption values
      expect(results[0].consumedVolumeMl).not.toBe(results[1].consumedVolumeMl);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle products with very small volumes', () => {
      const smallVolumeProduct: Product = {
        id: 'small-volume',
        name: 'Small Volume Product',
        volume: 0.1, // 0.1ml
        itemsPerCrate: 1000,
        pricePerBottle: 0.01,
        pricePer100ml: 10.0,
      };

      const entry: InventoryEntry = {
        productId: 'small-volume',
        startCrates: 1,
        startBottles: 0,
        startOpenVolumeMl: 0,
        endCrates: 0,
        endBottles: 500,
        endOpenVolumeMl: 0,
      };

      const result = calculateSingleItemConsumption(entry, smallVolumeProduct);

      // Start: 1 crate * 1000 items * 0.1ml = 100ml
      // End: 500 items * 0.1ml = 50ml
      // Consumed: 50ml

      expect(result.consumedVolumeMl).toBe(50);
      expect(result.consumedUnits).toBe(500); // 50ml / 0.1ml per unit
    });

    it('should handle products with very large volumes', () => {
      const largeVolumeProduct: Product = {
        id: 'large-volume',
        name: 'Large Volume Product',
        volume: 5000, // 5L
        itemsPerCrate: 1,
        pricePerBottle: 50.0,
        pricePer100ml: 1.0,
      };

      const entry: InventoryEntry = {
        productId: 'large-volume',
        startCrates: 2,
        startBottles: 0,
        startOpenVolumeMl: 0,
        endCrates: 1,
        endBottles: 0,
        endOpenVolumeMl: 0,
      };

      const result = calculateSingleItemConsumption(entry, largeVolumeProduct);

      // Start: 2 crates * 1 item * 5000ml = 10000ml
      // End: 1 crate * 1 item * 5000ml = 5000ml
      // Consumed: 5000ml

      expect(result.consumedVolumeMl).toBe(5000);
      expect(result.consumedUnits).toBe(1); // 5000ml / 5000ml per unit
      expect(result.costOfConsumption).toBe(50); // 5000ml / 100ml * 1.00
    });

    it('should handle extreme negative consumption', () => {
      const extremeEntry: InventoryEntry = {
        productId: 'test-product-1',
        startCrates: 0,
        startBottles: 0,
        startOpenVolumeMl: 0,
        endCrates: 100,
        endBottles: 0,
        endOpenVolumeMl: 0,
      };

      const result = calculateSingleItemConsumption(extremeEntry, mockProduct);

      expect(result.consumedVolumeMl).toBe(-1200000); // Very negative consumption
      expect(result.notes).toContain(
        'Negative consumption detected (-1200000ml). End count is higher than start.'
      );
    });

    it('should handle products with itemsPerCrate as zero or undefined', () => {
      const productNoItemsPerCrate: Product = {
        id: 'no-items-per-crate',
        name: 'No Items Per Crate',
        volume: 500,
        itemsPerCrate: 0,
        pricePerBottle: 2.5,
        pricePer100ml: 0.5,
      };

      const entry: InventoryEntry = {
        productId: 'no-items-per-crate',
        startCrates: 5, // This should be ignored
        startBottles: 10,
        startOpenVolumeMl: 0,
        endCrates: 3, // This should be ignored
        endBottles: 5,
        endOpenVolumeMl: 0,
      };

      const result = calculateSingleItemConsumption(entry, productNoItemsPerCrate);

      // Only bottles should count: (10 - 5) * 500ml = 2500ml
      expect(result.consumedVolumeMl).toBe(2500);
      expect(result.consumedUnits).toBe(5);
    });
  });

  describe('Cost Calculation Precision', () => {
    it('should handle floating point precision issues', () => {
      const precisionEntry: InventoryEntry = {
        productId: 'test-product-1',
        startCrates: 0,
        startBottles: 0,
        startOpenVolumeMl: 333.33,
        endCrates: 0,
        endBottles: 0,
        endOpenVolumeMl: 0,
      };

      const result = calculateSingleItemConsumption(precisionEntry, mockProduct);

      // Cost should be properly rounded
      expect(result.costOfConsumption).toBeCloseTo(1.67, 2);
    });

    it('should handle zero cost calculations', () => {
      const zeroConsumptionEntry: InventoryEntry = {
        productId: 'test-product-1',
        startCrates: 1,
        startBottles: 5,
        startOpenVolumeMl: 100,
        endCrates: 1,
        endBottles: 5,
        endOpenVolumeMl: 100,
      };

      const result = calculateSingleItemConsumption(zeroConsumptionEntry, mockProduct);

      expect(result.consumedVolumeMl).toBe(0);
      expect(result.consumedUnits).toBe(0);
      expect(result.costOfConsumption).toBe(0);
    });
  });
});
