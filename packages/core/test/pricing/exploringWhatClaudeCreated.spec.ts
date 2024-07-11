import { test } from 'vitest';
import {pricingFactorName} from "@breezbook/packages-pricing";

interface PricingFactor {
    type: string;
    value: any;
}

interface PriceAdjustment {
    ruleId: string;
    ruleName: string;
    originalPrice: number;
    adjustedPrice: number;
    explanation: string;
}

export interface PricingResult {
    finalPrice: number;
    basePrice: number;
    adjustments: PriceAdjustment[];
}

interface PricingRule {
    id: string;
    name: string;
    description: string;
    requiredFactors: string[];
    calculate: (price: number, factors: PricingFactor[]) => [number, string];
}

class ExplainablePricingEngine {
    private rules: PricingRule[] = [];

    addRule(rule: PricingRule) {
        this.rules.push(rule);
    }

    calculatePrice(basePrice: number, factors: PricingFactor[]): PricingResult {
        let currentPrice = basePrice;
        const adjustments: PriceAdjustment[] = [];

        for (const rule of this.rules) {
            if (rule.requiredFactors.every(factor => factors.some(f => f.type === factor))) {
                const [newPrice, explanation] = rule.calculate(currentPrice, factors);
                if (newPrice !== currentPrice) {
                    adjustments.push({
                        ruleId: rule.id,
                        ruleName: rule.name,
                        originalPrice: currentPrice,
                        adjustedPrice: newPrice,
                        explanation
                    });
                    currentPrice = newPrice;
                }
            }
        }

        return {
            finalPrice: currentPrice,
            basePrice: basePrice,
            adjustments: adjustments
        };
    }
}

// Example rules
const locationBasedPricing: PricingRule = {
    id: 'location-based',
    name: 'Location-based Pricing',
    description: 'Adjust price based on service location',
    requiredFactors: [pricingFactorName('location')],
    calculate: (price, factors) => {
        const location = factors.find(f => f.type === 'location')?.value;
        if (location === 'central-london') {
            return [price * 1.2, "20% increase applied for central London location"];
        }
        return [price, "No adjustment for location"];
    }
};

const timeBasedPricing: PricingRule = {
    id: 'time-based',
    name: 'Time-based Pricing',
    description: 'Adjust price based on time of service',
    requiredFactors: [pricingFactorName('time')],
    calculate: (price, factors) => {
        const time = factors.find(f => f.type === 'time')?.value;
        if (time.getHours() >= 18) {
            return [price * 1.1, "10% increase applied for evening service"];
        }
        return [price, "No adjustment for time of day"];
    }
};

const loyaltyDiscount: PricingRule = {
    id: 'loyalty-discount',
    name: 'Loyalty Discount',
    description: 'Apply discount for loyal customers',
    requiredFactors: [pricingFactorName('customer')],
    calculate: (price, factors) => {
        const customer = factors.find(f => f.type === 'customer')?.value;
        if (customer.loyaltyPoints > 1000) {
            return [price * 0.95, "5% loyalty discount applied for high-point customer"];
        }
        return [price, "No loyalty discount applied"];
    }
};

// Usage
const pricingEngine = new ExplainablePricingEngine();
pricingEngine.addRule(locationBasedPricing);
pricingEngine.addRule(timeBasedPricing);
pricingEngine.addRule(loyaltyDiscount);

const basePrice = 10000; // £100.00
const pricingFactors: PricingFactor[] = [
    { type: 'location', value: 'central-london' },
    { type: 'time', value: new Date('2023-06-26T19:00:00') },
    { type: 'customer', value: { id: 'cust123', loyaltyPoints: 1500 } }
];


test("what does this do?", () => {
    const result = pricingEngine.calculatePrice(basePrice, pricingFactors);

    console.log(`Base price: £${(result.basePrice / 100).toFixed(2)}`);
    console.log(`Final price: £${(result.finalPrice / 100).toFixed(2)}`);
    console.log('Price adjustments:');
    result.adjustments.forEach(adj => {
        console.log(`- ${adj.ruleName}: £${(adj.originalPrice / 100).toFixed(2)} -> £${(adj.adjustedPrice / 100).toFixed(2)}`);
        console.log(`  Explanation: ${adj.explanation}`);
    });
});