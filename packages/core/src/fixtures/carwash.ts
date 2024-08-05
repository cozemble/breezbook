import {
    addOnId,
    capacity,
    couponCode,
    couponId,
    id,
    languages,
    locationId,
    resourceType,
    serviceId,
    tenantId,
} from '@breezbook/packages-types';
import {
    addOn,
    addOnLabels,
    coupon,
    GBP,
    percentageAsRatio,
    percentageCoupon,
    price,
    service,
    serviceLabels,
    timeslotSpec,
    unlimited
} from '../types.js';
import {carwashForm} from './carWashForms.js';
import {jexlExpression, multiply, pricingFactorName, PricingRule} from "@breezbook/packages-pricing";
import {resourcing} from "@breezbook/packages-resourcing";
import {scheduleConfig, singleDayScheduling, timeslotSelection} from "../scheduleConfig.js";
import anySuitableResource = resourcing.anySuitableResource;
import resource = resourcing.resource;
import { isoDate, time24, timePeriod, timezones } from '@breezbook/packages-date-time';

const tenantIdCarwash = tenantId('carwash');
const nineAm = time24('09:00');
const onePm = time24('13:00');
const fourPm = time24('16:00');
const sixPm = time24('18:00');
const nineToSix = timePeriod(nineAm, sixPm);
const wax = addOn(price(1000, GBP), false, addOnId('addOn-wax'));
const polish = addOn(price(500, GBP), false, addOnId('addOn-polish'));
const cleanSeats = addOn(price(2000, GBP), true, addOnId('addOn-clean-seats'));
const cleanCarpets = addOn(price(2000, GBP), false, addOnId('addOn-clean-carpets'));
const van = resourceType('vanResourceType');
const van1 = resource(van, [], {'tier': 2});
const van2 = resource(van, [], {'tier': 1});
const resources = [van1, van2];
const nineToOne = timeslotSpec(nineAm, onePm, '09:00 - 13:00', id('timeSlot#1'));
const oneToFour = timeslotSpec(onePm, fourPm, '13:00 - 16:00', id('timeSlot#2'));
const fourToSix = timeslotSpec(fourPm, sixPm, '16:00 - 18:00', id('timeSlot#3'));
const timeslots = [nineToOne, oneToFour, fourToSix]
const anySuitableVan = anySuitableResource(van);
const smallCarWash = service(
    [anySuitableVan],
    price(1000, GBP),
    [wax.id, polish.id],
    [carwashForm.id],
    scheduleConfig(singleDayScheduling(timeslotSelection(timeslots))),
    capacity(1),
    serviceId('smallCarWash.id')
);
const mediumCarWash = service(
    [anySuitableVan],
    price(1500, GBP),
    [wax.id, polish.id],
    [],
    scheduleConfig(singleDayScheduling(timeslotSelection(timeslots))),
    capacity(1),
    serviceId('mediumCarWash.id'));
const largeCarWash = service(
    [anySuitableVan],
    price(2000, GBP),
    [wax.id, polish.id, cleanSeats.id, cleanCarpets.id],
    [],
    scheduleConfig(singleDayScheduling(timeslotSelection(timeslots))),
    capacity(1),
    serviceId('largeCarWash.id')
);

const smallCarWashLabels = serviceLabels('Small Car Wash', 'Small Car Wash', smallCarWash.id, languages.en);
const mediumCarWashLabels = serviceLabels('Medium Car Wash', 'Medium Car Wash', mediumCarWash.id, languages.en);
const largeCarWashLabels = serviceLabels('Large Car Wash', 'Large Car Wash', largeCarWash.id, languages.en);

const waxLabels = addOnLabels('Wax', 'We will wax your car', wax.id, languages.en);
const polishLabels = addOnLabels('Polish', 'We will polish your car', polish.id, languages.en);
const cleanSeatsLabels = addOnLabels('Clean seats', null, cleanSeats.id, languages.en);
const cleanCarpetsLabels = addOnLabels('Clean carpets', 'We will clean the foot well carpets', cleanCarpets.id, languages.en);

const chargeMoreForSoonBookings: PricingRule = {
    id: 'charge-more-for-soon-bookings',
    name: 'Charge More for Soon Bookings',
    description: 'Increase price for bookings that are happening soon',
    requiredFactors: [pricingFactorName('daysUntilBooking')],
    mutations: [
        {
            condition: jexlExpression('daysUntilBooking == 0'),
            mutation: multiply(1.4),
            description: '40% increase applied for booking today',
        },
        {
            condition: jexlExpression('daysUntilBooking == 1'),
            mutation: multiply(1.2),
            description: '20% increase applied for booking tomorrow',
        },
        {
            condition: jexlExpression('daysUntilBooking == 2'),
            mutation: multiply(1.1),
            description: '10% increase applied for booking two days from now',
        }
    ],
    applyAllOrFirst: 'first'
}


const expired20PercentOffCoupon = coupon(couponCode("expired-20-percent-off"), unlimited(), percentageCoupon(percentageAsRatio(0.2)), isoDate('2020-01-01'), isoDate('2020-12-31'), couponId('expired-20-percent-off'));
const twentyPercentOffCoupon = coupon(couponCode("20-percent-off"), unlimited(), percentageCoupon(percentageAsRatio(0.2)), isoDate('2021-01-01'), undefined, couponId('20-OFF'));

const london = locationId('breezbook.carwash.locations.london');
const liverpool = locationId('breezbook.carwash.locations.liverpool');

export const carwash = {
    tenantId: tenantIdCarwash,
    nineAm: nineAm,
    onePm: onePm,
    fourPm: fourPm,
    sixPm: sixPm,
    nineToSix: nineToSix,
    nineToOne,
    oneToFour,
    fourToSix,
    van1,
    van2,
    pricingRules: [chargeMoreForSoonBookings],
    timeslots,
    wax,
    polish,
    cleanSeats,
    cleanCarpets,
    addOns: [wax, polish, cleanSeats, cleanCarpets],
    van: van,
    resources: resources,
    smallCarWash: smallCarWash,
    mediumCarWash: mediumCarWash,
    largeCarWash: largeCarWash,
    services: [smallCarWash, mediumCarWash, largeCarWash],
    serviceLabels: [smallCarWashLabels, mediumCarWashLabels, largeCarWashLabels],
    addOnLabels: [waxLabels, polishLabels, cleanSeatsLabels, cleanCarpetsLabels],
    coupons: {
        expired20PercentOffCoupon,
        twentyPercentOffCoupon
    },
    locations: {
        london,
        liverpool
    },
    resourceRequirements: {
        anySuitableVan
    }
};
