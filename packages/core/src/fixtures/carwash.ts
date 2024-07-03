import {
    addOnId,
    capacity,
    couponCode,
    couponId,
    id,
    isoDate,
    locationId,
    minutes,
    resourceType,
    serviceId,
    tenantId,
    time24,
    timePeriod
} from '@breezbook/packages-types';
import {
    addOn,
    coupon,
    GBP,
    percentageAsRatio,
    percentageCoupon,
    price,
    service,
    serviceFns,
    serviceLabels,
    timeslotSpec,
    unlimited
} from '../types.js';
import {carwashForm} from './carWashForms.js';
import {jexlCondition, multiply, PricingRule} from "@breezbook/packages-pricing";
import {resourcing} from "@breezbook/packages-resourcing";
import anySuitableResource = resourcing.anySuitableResource;
import resource = resourcing.resource;

const tenantIdCarwash = tenantId('carwash');
const nineAm = time24('09:00');
const onePm = time24('13:00');
const fourPm = time24('16:00');
const sixPm = time24('18:00');
const nineToSix = timePeriod(nineAm, sixPm);
const wax = addOn('Wax', price(1000, GBP), false, 'We will wax your car', addOnId('addOn-wax'));
const polish = addOn('Polish', price(500, GBP), false, 'We will polish your car', addOnId('addOn-polish'));
const cleanSeats = addOn('Clean seats', price(2000, GBP), true, null, addOnId('addOn-clean-seats'));
const cleanCarpets = addOn('Clean carpets', price(2000, GBP), false, 'We will clean the foot well carpets', addOnId('addOn-clean-carpets'));
const van = resourceType('vanResourceType');
const van1 = resource(van, [], {'tier': 2});
const van2 = resource(van, [], {'tier': 1});
const resources = [van1, van2];
const nineToOne = timeslotSpec(nineAm, onePm, '09:00 - 13:00', id('timeSlot#1'));
const oneToFour = timeslotSpec(onePm, fourPm, '13:00 - 16:00', id('timeSlot#2'));
const fourToSix = timeslotSpec(fourPm, sixPm, '16:00 - 18:00', id('timeSlot#3'));
const timeslots = [nineToOne, oneToFour, fourToSix]
const anySuitableVan = anySuitableResource(van);
const smallCarWash = serviceFns.setStartTimes(service(
    [anySuitableVan],
    minutes(120),
    price(1000, GBP),
    [wax.id, polish.id],
    [carwashForm.id],
    capacity(1),
    serviceId('smallCarWash.id')
), timeslots);
const mediumCarWash = serviceFns.setStartTimes(service([anySuitableVan], minutes(120),
    price(1500, GBP), [wax.id, polish.id], [], capacity(1), serviceId('mediumCarWash.id')), timeslots);
const largeCarWash = serviceFns.setStartTimes(service(
    [anySuitableVan],
    minutes(120),
    price(2000, GBP),
    [wax.id, polish.id, cleanSeats.id, cleanCarpets.id],
    [],
    capacity(1),
    serviceId('largeCarWash.id')
), timeslots);

const smallCarWashLabels = serviceLabels('Small Car Wash', 'Small Car Wash', smallCarWash.id);
const mediumCarWashLabels = serviceLabels('Medium Car Wash', 'Medium Car Wash', mediumCarWash.id);
const largeCarWashLabels = serviceLabels('Large Car Wash', 'Large Car Wash', largeCarWash.id);

const chargeMoreForSoonBookings: PricingRule = {
    id: 'charge-more-for-soon-bookings',
    name: 'Charge More for Soon Bookings',
    description: 'Increase price for bookings that are happening soon',
    requiredFactors: ['daysUntilBooking'],
    mutations: [
        {
            condition: jexlCondition('daysUntilBooking == 0'),
            mutation: multiply(1.4),
            description: '40% increase applied for booking today',
        },
        {
            condition: jexlCondition('daysUntilBooking == 1'),
            mutation: multiply(1.2),
            description: '20% increase applied for booking tomorrow',
        },
        {
            condition: jexlCondition('daysUntilBooking == 2'),
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
