import {
    addOn,
    GBP,
    price,
    resource,
    resourceType,
    service,
    serviceId,
    tenantId,
    time24,
    timePeriod,
    timeslotSpec
} from "../types.js";

const tenantIdCarwash = tenantId("carwash");
const nineAm = time24('09:00');
const onePm = time24('13:00');
const fourPm = time24('16:00');
const sixPm = time24('18:00');
const nineToSix = timePeriod(nineAm, sixPm);
const wax = addOn('Wax', price(1000, GBP), false);
const polish = addOn('Polish', price(500, GBP), false);
const cleanSeats = addOn('Clean seats', price(2000, GBP), true);
const cleanCarpets = addOn('Clean carpets', price(2000, GBP), false);
const van = resourceType('van');
const van1 = resource(van, "Van 1");
const van2 = resource(van, "Van 2");
const resources = [van1, van2];
const smallCarWash = service('Small Car Wash', 'Small Car Wash', [van], 120, true, price(1000, GBP), [wax.id, polish.id], serviceId('smallCarWash'));
const mediumCarWash = service('Medium Car Wash', 'Medium Car Wash', [van], 120, true, price(1500, GBP), [wax.id, polish.id], serviceId('mediumCarWash'));
const largeCarWash = service('Large Car Wash', 'Large Car Wash', [van], 120, true, price(2000, GBP), [wax.id, polish.id, cleanSeats.id, cleanCarpets.id], serviceId('largeCarWash'));
const nineToOne = timeslotSpec(nineAm, onePm, '09:00 - 13:00');
const oneToFour = timeslotSpec(onePm, fourPm, '13:00 - 16:00');
const fourToSix = timeslotSpec(fourPm, sixPm, '16:00 - 18:00');

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
    timeslots: [
        nineToOne,
        oneToFour,
        fourToSix
    ],
    wax,
    polish,
    cleanSeats,
    cleanCarpets,
    addOns: [
        wax,
        polish,
        cleanSeats,
        cleanCarpets
    ],
    van: van,
    resources: resources,
    smallCarWash: smallCarWash,
    mediumCarWash: mediumCarWash,
    largeCarWash: largeCarWash,
    services: [smallCarWash, mediumCarWash, largeCarWash]
};
