import {
    capacity,
    type Capacity,
    type Duration,
    duration,
    formId,
    type FormId,
    type Minutes,
    minutes,
    resourceType,
    serviceId,
    type ServiceId,
    serviceOptionId,
    type ServiceOptionId,
    time24,
    type TwentyFourHourClockTime
} from "@breezbook/packages-types";
import {resourcing} from "@breezbook/packages-resourcing";
import {
    consumesServiceCapacity,
    currencies,
    price,
    type Price,
    type ServiceImpact,
    type TimeslotSpec,
    timeslotSpec
} from "@breezbook/packages-core";
import {v4 as uuidv4} from "uuid";
import anySuitableResource = resourcing.anySuitableResource;
// @ts-ignore
import ResourceRequirement = resourcing.ResourceRequirement;

interface MultipleDays {
    _type: 'multiple-days'
    minDays?: number
    maxDays?: number
}

function timeslot(from: TwentyFourHourClockTime, to: TwentyFourHourClockTime, description: string): TimeslotSpec {
    return timeslotSpec(from, to, description)
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

interface FixedDaysOfTheWeek {
    _type: 'fixed-days-of-week'
    daysOfTheWeek: string[]
}

function fixedDaysOfTheWeek(...daysOfTheWeek: string[]): FixedDaysOfTheWeek {
    return {_type: 'fixed-days-of-week', daysOfTheWeek}
}

interface StartDays {
    _type: 'start-days'
    constraint: FixedDaysOfTheWeek
}

interface EndDays {
    _type: 'end-days'
    constraint: FixedDaysOfTheWeek
}

function startDays(constraint: FixedDaysOfTheWeek): StartDays {
    return {_type: 'start-days', constraint}
}

function endDays(constraint: FixedDaysOfTheWeek): EndDays {
    return {_type: 'end-days', constraint}
}

type SchedulingOption =
    MultipleDays
    | FixedDaysOfWeek
    | FlexibleDuration
    | FixedCheckInAndOut
    | FlexibleCheckInAndOut
    | TimeslotSelection
    | StartTimeSelection
    | StartDays
    | EndDays

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


export interface Service {
    id: ServiceId
    name: string
    description: string
    duration: Minutes // Why is this so at odds with schedulingOptions?  What am I missing? minutes(0) when it does not apply
    resourceRequirements: ResourceRequirement[]
    price: Price;
    options: ServiceOption[];
    capacity: Capacity;
    schedulingOptions: SchedulingOption[]
}

const van = resourceType('van')

const mobileCarwash: Service = {
    id: serviceId('mobile-carwash'),
    name: 'Mobile car wash',
    description: 'We come to you and wash your car',
    duration: minutes(60),
    resourceRequirements: [anySuitableResource(van)],
    price: price(10000, currencies.GBP),
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
            timeslot(time24("09:00"), time24("10:00"), "Morning slot"),
            timeslot(time24("10:00"), time24("11:00"), "Mid-morning slot"),
            timeslot(time24("13:00"), time24("14:00"), "Afternoon slot"),
            timeslot(time24("14:00"), time24("15:00"), "Mid-afternoon slot"),
        ])]
}

const walker = resourceType('walker')

const groupDogWalking: Service = {
    id: serviceId('group-dog-walking'),
    name: 'Group dog walking',
    description: 'We walk your dogs in a group',
    duration: minutes(60),
    resourceRequirements: [anySuitableResource(walker)],
    price: price(1000, currencies.GBP),
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
            timeslot(time24("09:00"), time24("10:00"), "Morning slot"),
            timeslot(time24("17:00"), time24("18:00"), "Evening slot"),
        ])
    ]
}

const individualDogWalking: Service = {
    id: serviceId('individual-dog-walking'),
    name: 'Individual dog walking',
    description: 'We walk your dog individually',
    duration: minutes(60),
    resourceRequirements: [anySuitableResource(walker)],
    price: price(1500, currencies.GBP),
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
        startTimeSelection(
            time24("09:00"),
            time24("17:00"),
            minutes(60))
    ]
}

const petBoardingForOneDayWithFixedTimes: Service = {
    id: serviceId('pet-boarding-with-fixed-dates'),
    name: 'Pet boarding',
    description: 'We look after your pets while you are away',
    duration: minutes(0),
    resourceRequirements: [],
    price: price(2000, currencies.GBP),
    options: [],
    capacity: capacity(10),
    schedulingOptions: [
        fixedCheckInAndOut(
            time24("09:00"),
            time24("17:00"),
            "Drop off",
            "Pick up")
    ],
}

const petBoardingForOneDayWithFlexibleTimes: Service = {
    id: serviceId('pet-boarding-with-flexible-dates'),
    name: 'Pet boarding',
    description: 'We look after your pets while you are away',
    duration: minutes(0),
    resourceRequirements: [],
    price: price(2000, currencies.GBP),
    options: [],
    capacity: capacity(10),
    schedulingOptions: [
        flexibleDuration(
            time24("09:00"),
            time24("17:00"),
            duration(minutes(120)))
    ],
}

const petBoardingForManyDaysWithFixedTimes: Service = {
    id: serviceId('pet-boarding-for-many-days'),
    name: 'Pet boarding',
    description: 'We look after your pets while you are away',
    duration: minutes(0),
    resourceRequirements: [],
    price: price(2000, currencies.GBP),
    options: [],
    capacity: capacity(10),
    schedulingOptions: [
        multipleDays(1, 14),
        fixedCheckInAndOut(
            time24("09:00"),
            time24("17:00"),
            "Drop off",
            "Pick up")
    ]
}

const petBoardingForManyDaysWithFlexibleTimes: Service = {
    id: serviceId('pet-boarding-for-many-days-with-flexible-times'),
    name: 'Pet boarding',
    description: 'We look after your pets while you are away',
    duration: minutes(0),
    resourceRequirements: [],
    price: price(2000, currencies.GBP),
    options: [],
    capacity: capacity(10),
    schedulingOptions: [
        multipleDays(1, 14),
        flexibleDuration(
            time24("09:00"),
            time24("17:00"),
            duration(minutes(120)))
    ]
}

const room = resourceType('room')

const hotelRoom: Service = {
    id: serviceId('hotel-room'),
    name: 'Hotel room',
    description: 'A room in our hotel',
    duration: minutes(0),
    resourceRequirements: [anySuitableResource(room)],
    price: price(10000, currencies.GBP),
    options: [],
    capacity: capacity(2),
    schedulingOptions: [
        multipleDays(1, 365),
        fixedCheckInAndOut(
            time24("09:00"),
            time24("17:00"),
            "Check in",
            "Check out")
    ]
}

const summerCamp: Service = {
    id: serviceId('summer-camp'),
    name: 'Summer camp',
    description: 'A summer camp for kids',
    duration: minutes(0),
    resourceRequirements: [],
    price: price(10000, currencies.GBP),
    options: [],
    capacity: capacity(10),
    schedulingOptions: [
        fixedDaysOfWeek('Monday', 'Friday'),
        fixedCheckInAndOut(
            time24("09:00"),
            time24("17:00"),
            "Check in",
            "Check out")
    ]
}

const equipment = resourceType('equipment')

const equipmentRental: Service = {
    id: serviceId('equipment-rental'),
    name: 'Equipment rental',
    description: 'Rent equipment',
    duration: minutes(0),
    resourceRequirements: [anySuitableResource(equipment)],
    price: price(10000, currencies.GBP),
    options: [],
    capacity: capacity(1),
    schedulingOptions: [
        multipleDays(1, 30),
        flexibleCheckInAndOut(
            time24("09:00"),
            time24("17:00"),
            "Pick up",
            "Drop off")
    ]
}

const yacht = resourceType('yacht')

const yachtCharter: Service = {
    id: serviceId('yacht-charter'),
    name: 'yacht charter',
    description: 'Charter a yacht',
    duration: minutes(0),
    resourceRequirements: [anySuitableResource(yacht)],
    price: price(100000, currencies.GBP),
    options: [],
    capacity: capacity(10),
    schedulingOptions: [
        multipleDays(6, 24),
        startDays(fixedDaysOfTheWeek('Saturday')),
        endDays(fixedDaysOfTheWeek('Friday')),
        fixedCheckInAndOut(
            time24("15:00"),
            time24("17:00"),
            "Collect",
            "Return")
    ]
}

export const allServices = [
    mobileCarwash,
    groupDogWalking,
    individualDogWalking,
    petBoardingForOneDayWithFixedTimes,
    petBoardingForOneDayWithFlexibleTimes,
    petBoardingForManyDaysWithFixedTimes,
    hotelRoom,
    summerCamp,
    equipmentRental,
    yachtCharter
]

export const allServicesMap = {
    mobileCarwash,
    groupDogWalking,
    individualDogWalking,
    petBoardingForOneDayWithFixedTimes,
    petBoardingForOneDayWithFlexibleTimes,
    petBoardingForManyDaysWithFixedTimes,
    petBoardingForManyDaysWithFlexibleTimes,
    hotelRoom,
    summerCamp,
    equipmentRental,
    yachtCharter
}

export interface TimeSelection {
    startDate: string
    endDate: string
    startTime: string
    endTime: string
}