import { InventoryEntry, Product } from '../models';

export interface CalculatedConsumption {
    productId: string;
    consumedUnits: number; // Total consumption in the smallest unit (e.g., ml or individual bottles if not ml-based)
    consumedVolumeMl?: number; // Specifically for items with volume
    costOfConsumption: number;
    notes?: string[]; // To record any issues, like negative consumption
}

/**
 * Calculates the total volume in ml for a given inventory entry part (start or end).
 * @param entryPart The start or end part of an InventoryEntry (e.g., item.startCrates, item.startBottles, item.startOpenVolumeMl).
 * @param product The product definition, used for itemsPerCrate and volume.
 * @returns Total volume in ml.
 */
function getTotalVolumeMl(
    crates: number | undefined,
    bottles: number | undefined,
    openVolumeMl: number | undefined,
    product: Product
): number {
    let totalMl = 0;
    if (product.itemsPerCrate && product.itemsPerCrate > 0 && crates) {
        totalMl += crates * product.itemsPerCrate * product.volume;
    }
    if (bottles) {
        totalMl += bottles * product.volume;
    }
    if (openVolumeMl) {
        totalMl += openVolumeMl;
    }
    return totalMl;
}


/**
 * Calculates the consumption for a single inventory item.
 * @param entry The inventory entry for a product (contains start and end counts).
 * @param product The product definition (contains volume, price info).
 * @returns CalculatedConsumption object for the item.
 */
export function calculateSingleItemConsumption(entry: InventoryEntry, product: Product): CalculatedConsumption {
    const notes: string[] = [];

    // Calculate start and end total volumes in ml
    const startMl = getTotalVolumeMl(entry.startCrates, entry.startBottles, entry.startOpenVolumeMl, product);
    const endMl = getTotalVolumeMl(entry.endCrates, entry.endBottles, entry.endOpenVolumeMl, product);

    const consumedVolumeMl = startMl - endMl;
    let consumedUnits = consumedVolumeMl; // Default to ml if volume based

    // If the product is not typically measured in ml (e.g. items sold by piece, like a can of red bull not part of a cocktail)
    // then `product.volume` might represent '1' for '1 piece'.
    // For now, we assume all products have a meaningful `product.volume` in ml.
    // If a product is sold by piece and also has a volume (e.g. a 330ml can), this logic holds.

    if (consumedVolumeMl < 0) {
        notes.push(`Negative consumption detected (${consumedVolumeMl}ml). End count is higher than start.`);
        // Depending on policy, consumption might be floored to 0 or reported as negative.
        // For now, report as negative and let UI/user decide.
    }

    // Cost calculation
    let costOfConsumption = 0;
    // Prioritize pricePer100ml if available and makes sense (for open items)
    // Otherwise, use pricePerBottle.
    if (product.pricePer100ml && product.pricePer100ml > 0) {
        costOfConsumption = (consumedVolumeMl / 100) * product.pricePer100ml;
    } else if (product.pricePerBottle && product.volume > 0) { // Ensure volume is not zero to prevent division error
        const pricePerMl = product.pricePerBottle / product.volume;
        costOfConsumption = consumedVolumeMl * pricePerMl;
    } else {
        notes.push("Pricing information incomplete for cost calculation.");
    }

    // If product.volume is 1 (representing a 'piece' rather than ml volume), consumedUnits should be this count.
    // This part needs careful definition based on how products are set up.
    // If a "bottle" is the unit of sale and inventory, then consumedUnits might be consumedVolumeMl / product.volume.
    if (product.volume > 0) { // Avoid division by zero
      consumedUnits = consumedVolumeMl / product.volume; // Number of "standard units" (e.g. bottles)
    }


    return {
        productId: entry.productId,
        consumedUnits: consumedUnits, // This might be in bottles or other units depending on product definition
        consumedVolumeMl: consumedVolumeMl, // Always available
        costOfConsumption: Math.round(costOfConsumption * 100) / 100, // Round to 2 decimal places
        notes
    };
}

/**
 * Calculates consumption for all items in an area.
 * @param inventoryItems Array of InventoryEntry from a specific area.
 * @param allProducts Array of all available Product definitions.
 * @returns Array of CalculatedConsumption objects.
 */
export function calculateAreaConsumption(
    inventoryItems: InventoryEntry[],
    allProducts: Product[]
): CalculatedConsumption[] {
    const results: CalculatedConsumption[] = [];
    for (const item of inventoryItems) {
        const product = allProducts.find(p => p.id === item.productId);
        if (product) {
            results.push(calculateSingleItemConsumption(item, product));
        } else {
            console.warn(`Product definition not found for ID: ${item.productId}. Skipping consumption calculation for this item.`);
            // Optionally add a placeholder result indicating missing product info
            results.push({
                productId: item.productId,
                consumedUnits: 0,
                consumedVolumeMl: 0,
                costOfConsumption: 0,
                notes: [`Product definition missing (ID: ${item.productId})`]
            });
        }
    }
    return results;
}

console.log("Calculation Service loaded.");
