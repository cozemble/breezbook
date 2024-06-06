import {
    addOn,
    addOnId,
    anySuitableResource,
    coupon,
    couponCode,
    couponId,
    daysFromToday,
    GBP,
    id,
    isoDate,
    locationId,
    percentageAsRatio,
    percentageCoupon,
    price,
    resource,
    resourceType,
    service,
    serviceFns,
    serviceId,
    tenantId,
    time24,
    timeBasedPriceAdjustmentSpec,
    timePeriod,
    timeslotSpec,
    unlimited
} from '../types.js';
import {percentageBasedPriceAdjustment} from '../calculatePrice.js';
import {carwashForm} from './carWashForms.js';

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
const van = resourceType('van');
const van1 = resource(van, 'Van 1');
const van2 = resource(van, 'Van 2');
const resources = [van1, van2];
const nineToOne = timeslotSpec(nineAm, onePm, '09:00 - 13:00', id('timeSlot#1'));
const oneToFour = timeslotSpec(onePm, fourPm, '13:00 - 16:00', id('timeSlot#2'));
const fourToSix = timeslotSpec(fourPm, sixPm, '16:00 - 18:00', id('timeSlot#3'));
const timeslots = [nineToOne, oneToFour, fourToSix]
const smallCarWash = serviceFns.setStartTimes(service(
    'Small Car Wash',
    'Small Car Wash',
    [anySuitableResource(van)],
    120,
    price(1000, GBP),
    [wax.id, polish.id],
    [carwashForm.id],
    serviceId('smallCarWash.id')
), timeslots);
const mediumCarWash = serviceFns.setStartTimes(service('Medium Car Wash', 'Medium Car Wash', [anySuitableResource(van)], 120, price(1500, GBP), [wax.id, polish.id], [], serviceId('mediumCarWash.id')), timeslots);
const largeCarWash = serviceFns.setStartTimes(service(
    'Large Car Wash',
    'Large Car Wash',
    [anySuitableResource(van)],
    120,
    price(2000, GBP),
    [wax.id, polish.id, cleanSeats.id, cleanCarpets.id],
    [],
    serviceId('largeCarWash.id')
), timeslots);

const fortyPercentMoreToday = timeBasedPriceAdjustmentSpec(daysFromToday(0), percentageBasedPriceAdjustment(0.4), id('40% more today'));
const twentyFivePercentMoreTomorrow = timeBasedPriceAdjustmentSpec(daysFromToday(1), percentageBasedPriceAdjustment(0.25), id('25% more tomorrow'));
const tenPercentMoreDayAfterTomorrow = timeBasedPriceAdjustmentSpec(daysFromToday(2), percentageBasedPriceAdjustment(0.1), id('10% more day after tomorrow'));
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
    fortyPercentMoreToday,
    twentyFivePercentMoreTomorrow,
    tenPercentMoreDayAfterTomorrow,
    pricingRules: [fortyPercentMoreToday, twentyFivePercentMoreTomorrow, tenPercentMoreDayAfterTomorrow],
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
    coupons: [expired20PercentOffCoupon, twentyPercentOffCoupon],
    locations: {
        london,
        liverpool
    }
};
