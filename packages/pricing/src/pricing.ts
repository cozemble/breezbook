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
    type: string;
    value: T
}

export interface Price {
    _type: 'price';
    amountInMinorUnits: number;
}

export function price(amountInMinorUnits: number): Price {
    return {_type: 'price', amountInMinorUnits}
}

export interface PriceAdjustment {
    ruleId: string;
    ruleName: string;
    originalPrice: Price;
    adjustedPrice: Price;
    explanation: string;
}

interface PricingResult {
    finalPrice: Price;
    basePrice: Price;
    adjustments: PriceAdjustment[];
}

export function pricingResult(basePrice: Price, finalPrice: Price = basePrice, adjustments: PriceAdjustment[] = []): PricingResult {
    return {finalPrice, basePrice, adjustments}
}

interface JexlCondition {
    _type: 'jexl.condition';
    condition: string
}

export function jexlCondition(condition: string): Condition {
    return {_type: 'jexl.condition', condition}
}

type Condition = JexlCondition

interface Multiply {
    _type: 'multiply';
    factor: number;
}

export function multiply(factor: number): Multiply {
    return {_type: 'multiply', factor}
}

interface JexlMutation {
    _type: 'jexl.mutation';
    jexlExpression: string;
}

export function jexlMutation(jexlExpression: string): JexlMutation {
    return {_type: 'jexl.mutation', jexlExpression}
}

type Mutation = Multiply | JexlMutation

interface ConditionalMutation {
    condition?: Condition;
    mutation: Mutation;
    description: string;
}

export interface PricingRule {
    id: string;
    name: string;
    description: string;
    requiredFactors: string[];
    mutations: ConditionalMutation[];
    applyAllOrFirst: 'all' | 'first';
}

export class PricingEngine {
    private rules: PricingRule[] = [];
    private jexlInstance = new jexl.Jexl();


    addRule(rule: PricingRule) {
        this.rules.push(rule);
    }

    calculatePrice(basePrice: Price, factors: PricingFactor[]): PricingResult {
        const result = pricingResult(basePrice);

        for (const rule of this.rules) {
            if (rule.requiredFactors.every(factor => factors.some(f => f.type === factor))) {
                const outcome = this.executeRule(rule, result.finalPrice, factors);
                if (outcome.finalPrice.amountInMinorUnits !== result.finalPrice.amountInMinorUnits) {
                    result.finalPrice = outcome.finalPrice;
                    result.adjustments.push(...outcome.adjustments);
                }
            }
        }
        return result;
    }

    private executeRule(rule: PricingRule, currentPrice: Price, factors: PricingFactor[]): PricingResult {
        const context = this.factorsToContext(factors, currentPrice);
        const result = pricingResult(currentPrice);
        for (const mutation of rule.mutations) {
            const condition = mutation.condition?.condition || 'true';
            const shouldApply = this.jexlInstance.evalSync(condition, context);
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

    private applyMutation(mutation: Mutation, context: any): Price {
        if(mutation._type === 'jexl.mutation') {
            return price(this.jexlInstance.evalSync(mutation.jexlExpression, context));
        }
        return price(context.currentPrice * mutation.factor);
    }

    private factorsToContext(factors: PricingFactor[], currentPrice: Price) {
        const context = {
            currentPrice: currentPrice.amountInMinorUnits
        } as any;
        for (const factor of factors) {
            context[factor.type] = factor.value;
        }
        return context;
    }
}