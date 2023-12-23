import {
    addOn,
    GBP,
    price,
    resource,
    resourceType,
    service, serviceId,
    tenantId,
    time24,
    timePeriod,
    timeslotSpec
} from "../../src/types.js";

export const carwashTenantId = tenantId("carwash")
export const nineAm = time24('09:00');
export const onePm = time24('13:00');
export const fourPm = time24('16:00');
export const sixPm = time24('18:00');

export const nineToSix = timePeriod(nineAm, sixPm);

export const nineToOne = timeslotSpec(nineAm, onePm, '09:00 - 13:00');
export const oneToFour = timeslotSpec(onePm, fourPm, '13:00 - 16:00');
export const fourToSix = timeslotSpec(fourPm, sixPm, '16:00 - 18:00');
export const timeslots = [nineToOne, oneToFour, fourToSix];

export const wax = addOn('Wax', price(1000, GBP), false);
export const polish = addOn('Polish', price(500, GBP), false);
export const seatClean = addOn('Clean seats', price(2000, GBP), true);
export const cleanCarpet = addOn('Clean carpets', price(2000, GBP), false);
export const addOns = [wax, polish, seatClean, cleanCarpet];

export const van = resourceType('van');
export const van1 = resource(van, "Van 1");
export const van2 = resource(van, "Van 2");
export const resources = [van1, van2];
export const smallCarWash = service('Small Car Wash', 'Small Car Wash', [van], 120, true, price(1000, GBP), [wax.id, polish.id], serviceId('smallCarWash'))
export const mediumCarWash = service('Medium Car Wash', 'Medium Car Wash', [van], 120, true, price(1500, GBP), [wax.id, polish.id], serviceId('mediumCarWash'));
export const largeCarWash = service('Large Car Wash', 'Large Car Wash', [van], 120, true, price(2000, GBP), addOns.map(a => a.id), serviceId('largeCarWash'))
export const services = [smallCarWash, mediumCarWash, largeCarWash];
