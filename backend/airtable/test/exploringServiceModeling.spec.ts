import {
    AddOnId,
    capacity,
    Capacity,
    Duration,
    duration,
    formId,
    FormId,
    Minutes,
    minutes,
    resourceType,
    serviceId,
    ServiceId,
    serviceOptionId,
    ServiceOptionId,
    time24,
    TwentyFourHourClockTime
} from "@breezbook/packages-types";
import {test} from 'vitest'
import {resourcing} from "@breezbook/packages-resourcing";
import {
    addOn,
    consumesServiceCapacity,
    currencies,
    price,
    Price,
    ServiceImpact,
    TimeslotSpec,
    timeslotSpec
} from "@breezbook/packages-core";
import {v4 as uuidv4} from "uuid";
import anySuitableResource = resourcing.anySuitableResource;
import ResourceRequirement = resourcing.ResourceRequirement;

interface MultipleDays {
    _type: 'multiple-days'
    minDays?: number
    maxDays?: number
}

function multipleDays(minDays: number, maxDays: number): MultipleDays {
    return {_type: 'multiple-days', minDays, maxDays}
}

interface FlexibleDuration {
    _type: 'flexible-duration'
    startTime: TwentyFourHourClockTime
    endTime: TwentyFourHourClockTime,
    minDuration?: Duration
    maxDuration?: Duration
}

function flexibleDuration(startTime: TwentyFourHourClockTime, endTime: TwentyFourHourClockTime, minDuration?: Duration, maxDuration?: Duration): FlexibleDuration {
    return {_type: 'flexible-duration', minDuration, maxDuration, startTime, endTime}
}

interface FixedCheckInAndOut {
    _type: 'fixed-check-in-and-out'
    checkInTime: TwentyFourHourClockTime
    checkOutTime: TwentyFourHourClockTime
    checkInLabel: string
    checkOutLabel: string
}

function fixedCheckInAndOut(checkInTime: TwentyFourHourClockTime, checkOutTime: TwentyFourHourClockTime, checkInLabel: string, checkOutLabel: string): FixedCheckInAndOut {
    return {_type: 'fixed-check-in-and-out', checkInTime, checkOutTime, checkInLabel, checkOutLabel}
}

interface TimeslotSelection {
    _type: 'timeslot-selection'
    times: TimeslotSpec[]
}

function timeslotSelection(times: TimeslotSpec[]): TimeslotSelection {
    return {_type: 'timeslot-selection', times}
}

interface StartTimeSelection {
    _type: 'start-time-selection'
    startTime: TwentyFourHourClockTime
    endTime: TwentyFourHourClockTime
    period: Minutes
}

function startTimeSelection(startTime: TwentyFourHourClockTime, endTime: TwentyFourHourClockTime, period: Minutes): StartTimeSelection {
    return {_type: 'start-time-selection', startTime, endTime, period}
}

interface FixedDaysOfWeek {
    _type: 'fixed-days-of-week'
    startingDayOfWeek: string
    endingDayOfWeek: string
}

function fixedDaysOfWeek(startingDayOfWeek: string, endingDayOfWeek: string): FixedDaysOfWeek {
    return {_type: 'fixed-days-of-week', startingDayOfWeek, endingDayOfWeek}
}

interface FlexibleCheckInAndOut {
    _type: 'flexible-check-in-and-out'
    startTime: TwentyFourHourClockTime
    endTime: TwentyFourHourClockTime
    checkInLabel: string
    checkOutLabel: string
}

function flexibleCheckInAndOut(startTime: TwentyFourHourClockTime, endTime: TwentyFourHourClockTime, checkInLabel: string, checkOutLabel: string): FlexibleCheckInAndOut {
    return {_type: 'flexible-check-in-and-out', startTime, endTime, checkInLabel, checkOutLabel}
}

interface FixedDayOfWeek {
    _type: 'fixed-day-of-week'
    dayOfWeek: string
}

function fixedDayOfWeek(dayOfWeek: string): FixedDayOfWeek {
    return {_type: 'fixed-day-of-week', dayOfWeek}
}

type SchedulingOption =
    MultipleDays
    | FixedDaysOfWeek
    | FixedDayOfWeek
    | FlexibleDuration
    | FixedCheckInAndOut
    | FlexibleCheckInAndOut
    | TimeslotSelection
    | StartTimeSelection

export interface ServiceOption {
    _type: 'service.option';
    id: ServiceOptionId;
    name: string
    description: string
    price: Price;
    requiresQuantity: boolean;
    duration: Duration;
    resourceRequirements: ResourceRequirement[];
    forms: FormId[]
    serviceImpacts: ServiceImpact[];
}

export function serviceOption(
    name: string,
    description: string,
    price: Price,
    requiresQuantity: boolean,
    duration: Duration,
    resourceRequirements: ResourceRequirement[],
    forms: FormId[],
    serviceImpacts: ServiceImpact[] = [],
    id = serviceOptionId(uuidv4())
):
    ServiceOption {
    return {
        _type: 'service.option',
        id,
        name,
        description,
        price,
        requiresQuantity,
        duration,
        resourceRequirements,
        forms,
        serviceImpacts,
    };
}


interface Service {
    id: ServiceId
    name: string
    description: string
    duration: Minutes // Why is this so at odds with schedulingOptions?  What am I missing? minutes(0) when it does not apply
    resourceRequirements: ResourceRequirement[]
    price: Price;
    permittedAddOns: AddOnId[];
    serviceFormIds: FormId[];
    options: ServiceOption[];
    capacity: Capacity;
    schedulingOptions: SchedulingOption[]
}

test("can model a mobile car wash service that books against time slots and requires a van", () => {
    const van = resourceType('van')
    const wax = addOn(price(500, currencies.GBP), false)

    const mobileCarwash: Service = {
        id: serviceId('carwash'),
        name: 'Mobile car wash',
        description: 'We come to you and wash your car',
        duration: minutes(60),
        resourceRequirements: [anySuitableResource(van)],
        price: price(10000, currencies.GBP),
        permittedAddOns: [wax.id],
        serviceFormIds: [formId('car-details-form')],
        options: [
            serviceOption(
                "Second car",
                "Wash a second car at the same time",
                price(7500, currencies.GBP),
                false,
                duration(minutes(50)),
                [],
                [formId('car-details-form')])
        ],
        capacity: capacity(1),
        schedulingOptions: [
            timeslotSelection([
                timeslotSpec(time24("09:00"), time24("10:00"), "Morning slot"),
                timeslotSpec(time24("10:00"), time24("11:00"), "Mid-morning slot"),
                timeslotSpec(time24("13:00"), time24("14:00"), "Afternoon slot"),
                timeslotSpec(time24("14:00"), time24("15:00"), "Mid-afternoon slot"),
            ])]
    }
})

test("can model a group dog walking service that can take up to 6 dogs", () => {
    const walker = resourceType('walker')

    const groupDogWalking: Service = {
        id: serviceId('group-dog-walking'),
        name: 'Group dog walking',
        description: 'We walk your dogs in a group',
        duration: minutes(60),
        resourceRequirements: [anySuitableResource(walker)],
        price: price(1000, currencies.GBP),
        permittedAddOns: [],
        serviceFormIds: [formId('dog-details-form')],
        options: [
            serviceOption(
                "Second dog",
                "Walk a second dog at the same time",
                price(800, currencies.GBP),
                false,
                duration(minutes(0)),
                [],
                [formId('dog-details-form')],
                [consumesServiceCapacity("one-unit")])
        ],
        capacity: capacity(6),
        schedulingOptions: [
            timeslotSelection([
                timeslotSpec(time24("09:00"), time24("10:00"), "Morning slot"),
                timeslotSpec(time24("17:00"), time24("18:00"), "Evening slot"),
            ])
        ]
    }
})

test("can model an individual dog walking service that has fixed start times and can take up to one extra dog", () => {
    const walker = resourceType('walker')

    const individualDogWalking: Service = {
        id: serviceId('individual-dog-walking'),
        name: 'Individual dog walking',
        description: 'We walk your dog individually',
        duration: minutes(60),
        resourceRequirements: [anySuitableResource(walker)],
        price: price(1500, currencies.GBP),
        permittedAddOns: [],
        serviceFormIds: [formId('dog-details-form')],
        options: [
            serviceOption(
                "Second dog",
                "Walk a second dog at the same time",
                price(1000, currencies.GBP),
                false,
                duration(minutes(0)),
                [],
                [formId('dog-details-form')]),
        ],
        capacity: capacity(2),
        schedulingOptions: [
            startTimeSelection(time24("09:00"), time24("17:00"), minutes(60))
        ]
    }
})

test("can model a pet boarding service that requires a kennel and can take up to 10 pets and has fixed drop off times", () => {
    const petBoardingForOneDay: Service = {
        id: serviceId('pet-boarding'),
        name: 'Pet boarding',
        description: 'We look after your pets while you are away',
        duration: minutes(0),
        resourceRequirements: [],
        price: price(2000, currencies.GBP),
        permittedAddOns: [],
        serviceFormIds: [formId('pet-details-form')],
        options: [],
        capacity: capacity(10),
        schedulingOptions: [
            fixedCheckInAndOut(time24("09:00"), time24("17:00"), "Drop off", "Pick up")
        ],
    }
});

test("can model a pet boarding service that permits flexible time selection", () => {
    const petBoardingForOneDay: Service = {
        id: serviceId('pet-boarding'),
        name: 'Pet boarding',
        description: 'We look after your pets while you are away',
        duration: minutes(0),
        resourceRequirements: [],
        price: price(2000, currencies.GBP),
        permittedAddOns: [],
        serviceFormIds: [formId('pet-details-form')],
        options: [],
        capacity: capacity(10),
        schedulingOptions: [
            flexibleDuration(time24("09:00"), time24("17:00"), duration(minutes(120)))
        ],
    }
});

test("can model a pet boarding service that supports up to 14 days", () => {
    const petBoardingForOneDay: Service = {
        id: serviceId('pet-boarding'),
        name: 'Pet boarding',
        description: 'We look after your pets while you are away',
        duration: minutes(0),
        resourceRequirements: [],
        price: price(2000, currencies.GBP),
        permittedAddOns: [],
        serviceFormIds: [formId('pet-details-form')],
        options: [],
        capacity: capacity(10),
        schedulingOptions: [
            multipleDays(1, 14),
            fixedCheckInAndOut(time24("09:00"), time24("17:00"), "Drop off", "Pick up")
        ]
    }
})

test("can model a hotel service that requires a room and can take up to 2 people", () => {
    const room = resourceType('room')

    const hotelRoom: Service = {
        id: serviceId('hotel-room'),
        name: 'Hotel room',
        description: 'A room in our hotel',
        duration: minutes(0),
        resourceRequirements: [anySuitableResource(room)],
        price: price(10000, currencies.GBP),
        permittedAddOns: [],
        serviceFormIds: [],
        options: [],
        capacity: capacity(2),
        schedulingOptions: [
            multipleDays(1, 365),
            fixedCheckInAndOut(time24("09:00"), time24("17:00"), "Check in", "Check out")
        ]
    }
});

test("can model a summer camp, which has a fixed days of the week and fixed start and end times", () => {
    const summerCamp: Service = {
        id: serviceId('summer-camp'),
        name: 'Summer camp',
        description: 'A summer camp for kids',
        duration: minutes(0),
        resourceRequirements: [],
        price: price(10000, currencies.GBP),
        permittedAddOns: [],
        serviceFormIds: [],
        options: [],
        capacity: capacity(10),
        schedulingOptions: [
            fixedDaysOfWeek('Monday', 'Friday'),
            fixedCheckInAndOut(time24("09:00"), time24("17:00"), "Check in", "Check out")
        ]
    }
});

test("can model equipment rental", () => {
    const equipment = resourceType('equipment')

    const equipmentRental: Service = {
        id: serviceId('equipment-rental'),
        name: 'Equipment rental',
        description: 'Rent equipment',
        duration: minutes(0),
        resourceRequirements: [anySuitableResource(equipment)],
        price: price(10000, currencies.GBP),
        permittedAddOns: [],
        serviceFormIds: [],
        options: [],
        capacity: capacity(1),
        schedulingOptions: [
            multipleDays(1, 30),
            flexibleCheckInAndOut(time24("09:00"), time24("17:00"), "Pick up", "Drop off")
        ]
    }
});

test("can model a yacht charter", () => {
    const yacht = resourceType('yacht')

    const yachtCharter: Service = {
        id: serviceId('yacht-charter'),
        name: 'yacht charter',
        description: 'Charter a yacht',
        duration: minutes(0),
        resourceRequirements: [anySuitableResource(yacht)],
        price: price(10000, currencies.GBP),
        permittedAddOns: [],
        serviceFormIds: [],
        options: [],
        capacity: capacity(10),
        schedulingOptions: [
            multipleDays(7, 28),
            fixedDayOfWeek('Saturday'),
            flexibleCheckInAndOut(time24("15:00"), time24("12:00"), "Pick up", "Drop off")
        ]
    }
});