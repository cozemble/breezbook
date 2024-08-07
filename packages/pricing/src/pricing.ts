import jexl from "jexl";

/**
 * Here's a list of attributes that I believe would cover most common dynamic pricing rules in a booking/appointment SaaS:
 *
 * Time-related attributes:
 *
 * bookingDateTime: Date and time of the appointment
 * bookingDayOfWeek: Day of the week (0-6)
 * bookingTimeOfDay: Time of day in 24-hour format (e.g., "14:30")
 * bookingMonth: Month of the year (1-12)
 * isWeekend: Boolean indicating if it's a weekend
 * isHoliday: Boolean indicating if it's a holiday
 * daysUntilBooking: Number of days between now and the appointment
 * minutesUntilBooking: Number of minutes until the appointment (for very short-term pricing adjustments)
 * seasonName: Current season (e.g., "summer", "winter")
 *
 *
 * Demand-related attributes:
 *
 * currentOccupancyPercentage: Current booking occupancy for the time slot
 * bookingsInLastHour: Number of bookings made in the last hour
 * cancellationsInLastDay: Number of cancellations in the last 24 hours
 * competitorPricing: Average price of competitors for similar services (if available)
 *
 *
 * Customer-related attributes:
 *
 * customerLoyaltyTier: Customer's loyalty program tier
 * customerLifetimeValue: Total value of customer's past bookings
 * daysSinceLastBooking: Days since the customer's last booking
 * totalPastBookings: Total number of past bookings by the customer
 * customerAcquisitionChannel: How the customer was acquired (e.g., "organic", "referral", "paid_ad")
 * isNewCustomer: Boolean indicating if it's a new customer
 *
 *
 * Service-specific attributes:
 *
 * serviceId: Unique identifier for the service
 * serviceDuration: Duration of the service in minutes
 * serviceCategory: Category of the service (e.g., "haircut", "massage", "consultation")
 * resourceId: Identifier of the resource (staff member, room, equipment) providing the service
 * resourceExperienceLevel: Experience level of the resource (e.g., "junior", "senior", "expert")
 * isPackageBooking: Boolean indicating if it's part of a package deal
 * addOnsIncluded: List of add-ons included in the booking, if certain are present, apply discount
 *
 *
 * Location-related attributes:
 *
 * locationId: Identifier for the business location
 * locationCity: City of the business location
 * locationZipCode: Zip code of the business location
 *
 *
 * External factors:
 *
 * weatherCondition: Current or forecasted weather condition
 * localEventOccurring: Boolean indicating if there's a major local event
 * currentGasPrice: Current gas price (for services involving travel)
 *
 *
 * Business-specific attributes:
 *
 * daysSinceBusinessOpening: Days since the business location opened
 * promotionRunning: Boolean indicating if there's a current promotion
 * overallBusinessOccupancy: Overall occupancy across all services and time slots
 *
 *
 * Booking-specific attributes:
 *
 * isRescheduled: Boolean indicating if this is a rescheduled appointment
 * isGroupBooking: Boolean indicating if it's a group booking
 * groupSize: Number of people in a group booking
 * numberOfServicesBeingBooked: Number of services (line items) being booked in the same appointment
 * totalSpend: Total spend for the booking
 *
 *
 * This list covers a wide range of factors that can influence pricing in a booking/appointment SaaS. The exact attributes you'll need will depend on your specific business model and the types of services being booked. However, this list should provide a solid foundation for implementing a comprehensive dynamic pricing system.
 */
export interface PricingFactor<T = any> {
    name: string;
    value: T
}

export interface Price {
    _type: 'price';
    amountInMinorUnits: number;
}

export function price(amountInMinorUnits: number): Price {
    return {_type: 'price', amountInMinorUnits: Math.round(amountInMinorUnits)}
}


export interface PricingResult {
    finalPrice: Price;
    basePrice: Price;
    adjustments: PriceAdjustment[];
}

export interface PriceAdjustment {
    ruleId: string;
    ruleName: string;
    originalPrice: Price;
    adjustedPrice: Price;
    explanation: string;
}


export function pricingResult(basePrice: Price, finalPrice: Price = basePrice, adjustments: PriceAdjustment[] = []): PricingResult {
    return {finalPrice, basePrice, adjustments}
}

interface JexlExpression {
    _type: 'jexl.expression';
    expression: string
}

export function jexlExpression(expression: string): Condition {
    return {_type: 'jexl.expression', expression}
}

type Condition = JexlExpression

interface Multiply {
    _type: 'multiply';
    factor: number;
}

export function multiply(factor: number): Multiply {
    return {_type: 'multiply', factor}
}

interface Add {
    _type: 'add';
    amount: number | JexlExpression;
}

export function add(amount: number | JexlExpression): Add {
    return {_type: 'add', amount}
}

interface JexlMutation {
    _type: 'jexl.mutation';
    jexlExpression: string;
}

export function jexlMutation(jexlExpression: string): JexlMutation {
    return {_type: 'jexl.mutation', jexlExpression}
}

interface PerHour {
    _type: 'per.hour';
    mutation: Add;
}

export function perHour(mutation: Add): PerHour {
    return {_type: 'per.hour', mutation}
}

type Mutation = Multiply | Add | JexlMutation | PerHour

interface ConditionalMutation {
    condition?: Condition;
    mutation: Mutation;
    description: string;
}

export interface PricingFactorName {
    _type: 'factor.name';
    name: string;
}

export function pricingFactorName(name: string): PricingFactorName {
    return {_type: 'factor.name', name}
}

export interface ParameterisedPricingFactor<T = any> {
    _type: 'parameterised.factor';
    type: string;
    name: string;
    parameters: T;
}

export function parameterisedPricingFactor<T = any>(type: string, name: string, parameters: T): ParameterisedPricingFactor<T> {
    return {_type: 'parameterised.factor', type, name, parameters}
}

export type PricingFactorSpec = PricingFactorName | ParameterisedPricingFactor

export interface PricingRule {
    id: string;
    name: string;
    description: string;
    requiredFactors: PricingFactorSpec[];
    mutations: ConditionalMutation[];
    applyAllOrFirst: 'all' | 'first';
    context?: Record<string, any>;
}

function getPropValue(item: any, path: string): boolean | { it: any } {
    if (path === 'it') {
        return {it: item};
    }
    const props = path.split('.');
    let result = item;
    for (let prop of props) {
        result = result[prop];
        if (result === undefined) return false;
    }
    return {it: result};

}

export class PricingEngine {
    private rules: PricingRule[] = [];
    private jexlInstance = new jexl.Jexl();
    private ruleContext: any = {} // to get the rule context into transforms.  Not sure how to do this better

    constructor() {
        const self = this;
        this.jexlInstance.addTransform('filter', function (arr: any[], path: string, expression: string) {
            return arr.filter(item => {
                const context = getPropValue(item, path);
                if (!context) {
                    return false
                }
                const amendedExpression = "it " + expression;
                const executeContext = {...self.ruleContext, ...context as any};
                return self.safeJexl(amendedExpression, executeContext)
            });
        });
        this.jexlInstance.addTransform('length', function (arr: any[]) {
            return arr.length;
        });
        this.jexlInstance.addTransform('includes', function (arr: any[], value: any) {
            return arr.includes(value);
        });
    }

    addRule(rule: PricingRule) {
        this.rules.push(rule);
    }

    calculatePrice(basePrice: Price, factors: PricingFactor[], externalContext: Record<string, any> = {}): PricingResult {
        const result = pricingResult(basePrice);

        for (const rule of this.rules) {
            if (rule.requiredFactors.every(factor => factors.some(f => f.name === factor.name))) {
                const outcome = this.executeRule(rule, result.finalPrice, factors, externalContext);
                if (outcome.finalPrice.amountInMinorUnits !== result.finalPrice.amountInMinorUnits) {
                    result.finalPrice = outcome.finalPrice;
                    result.adjustments.push(...outcome.adjustments);
                }
            }
        }
        return result;
    }

    private executeRule(rule: PricingRule, currentPrice: Price, factors: PricingFactor[], externalContext: Record<string, any>): PricingResult {
        const ruleContext = rule.context ?? {}
        const context = this.factorsToContext(factors, currentPrice, {...externalContext, ...ruleContext});
        this.ruleContext = context
        const result = pricingResult(currentPrice);
        for (const mutation of rule.mutations) {
            const condition = mutation.condition?.expression || 'true';
            this.ruleContext = context
            const shouldApply = this.safeJexl(condition, context);
            if (shouldApply) {
                const newPrice = this.applyMutation(mutation.mutation, context);
                result.finalPrice = newPrice;
                result.adjustments.push({
                    ruleId: rule.id,
                    ruleName: rule.name,
                    originalPrice: currentPrice,
                    adjustedPrice: newPrice,
                    explanation: mutation.description
                });
                if (rule.applyAllOrFirst === 'first') {
                    break;
                }
            }
        }
        return result;
    }

    private safeJexl(expression: string, context: any) {
        try {
            return this.jexlInstance.evalSync(expression, context);
        } catch (e: any) {
            if (e instanceof Error) {
                e.message = `Error evaluating expression "${expression}": ${e.message}`;
            }
            throw e;
        }
    }

    private applyMutation(mutation: Mutation, context: any): Price {
        if (mutation._type === 'jexl.mutation') {
            return price(this.safeJexl(mutation.jexlExpression, context));
        }
        if (mutation._type === 'add') {
            return price(context.currentPrice + this.amountToAdd(mutation, context));
        }
        if (mutation._type === 'per.hour') {
            const numberOfHours = context.serviceDurationMinutes / 60;
            const amount = this.amountToAdd(mutation.mutation, context) * numberOfHours;
            return price(context.currentPrice + amount);
        }

        return price(context.currentPrice * mutation.factor);
    }

    private amountToAdd(add: Add, context: any) {
        return typeof add.amount === 'number' ? add.amount : this.safeJexl(add.amount.expression, context);
    }

        private factorsToContext(factors: PricingFactor[], currentPrice: Price, externalContext: Record<string, any>) {
            const context = {
                ...externalContext,
                currentPrice: currentPrice.amountInMinorUnits
            } as any;
            for (const factor of factors) {
                context[factor.name] = factor.value;
            }
            return context;
        }
}