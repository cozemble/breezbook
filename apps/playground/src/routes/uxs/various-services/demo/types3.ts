import {minutes, type Minutes, time24, type TwentyFourHourClockTime, type ValueType} from "@breezbook/packages-types";
import {timeslotSpec, type TimeslotSpec} from "@breezbook/packages-core";

export interface Period {
    _type: 'period'
    duration: Minutes
}

export function period(duration: Minutes): Period {
    return {_type: 'period', duration}
}

export interface Days extends ValueType<number> {
    _type: 'days'
}

export function days(value: number): Days {
    return {value, _type: 'days'}
}

export interface Hours extends ValueType<number> {
    _type: 'hours'
}

export function hours(value: number): Hours {
    return {value, _type: 'hours'}
}

export type DurationUnit = Minutes | Days | Hours

export interface Duration extends ValueType<DurationUnit> {
    _type: 'duration';
}

export function duration(value: DurationUnit): Duration {
    return {
        _type: 'duration',
        value
    };
}

export interface TimeRange {
    _type: 'time-range'
    from: TwentyFourHourClockTime
    to: TwentyFourHourClockTime
    period: Period
}

export interface AnyTimeBetween {
    _type: 'any-time-between'
    from: TwentyFourHourClockTime
    to: TwentyFourHourClockTime
}

export function anyTimeBetween(from: TwentyFourHourClockTime, to: TwentyFourHourClockTime): AnyTimeBetween {
    return {_type: 'any-time-between', from, to}
}

export function timeRange(from: TwentyFourHourClockTime, to: TwentyFourHourClockTime, period: Period): TimeRange {
    return {_type: 'time-range', from, to, period}

}

export interface DurationRange {
    _type: 'duration-range'
    minDuration: Duration
    maxDuration: Duration | null
}

export function durationRange(minDuration: DurationUnit, maxDuration?: DurationUnit): DurationRange {
    return {
        _type: 'duration-range',
        minDuration: duration(minDuration),
        maxDuration: maxDuration ? duration(maxDuration) : null
    }
}

export interface DaysOfWeek {
    _type: 'days-of-week'
    days: string[]
}

export function daysOfWeek(...days: string[]): DaysOfWeek {
    return {_type: 'days-of-week', days}
}

export interface Service {
    id: string
    name: string
    description: string
    schedulingOptions: SingleDayScheduling | MultiDayScheduling
}

export interface TimeslotSelection {
    _type: 'timeslot-selection'
    times: TimeslotSpec[]
}

function timeslotSelection(times: TimeslotSpec[]): TimeslotSelection {
    return {_type: 'timeslot-selection', times}
}

function timeslot(from: TwentyFourHourClockTime, to: TwentyFourHourClockTime, description: string): TimeslotSpec {
    return timeslotSpec(from, to, description)
}

export interface PickTime {
    _type: 'pick-time'
    timeRange: TimeRange
}

export function pickTime(timeRange: TimeRange): PickTime {
    return {_type: 'pick-time', timeRange}
}

export interface FixedTime {
    _type: 'fixed-time'
    start: TwentyFourHourClockTime
    end: TwentyFourHourClockTime
    startLabel: string
    endLabel: string
}

export function fixedTime(start: TwentyFourHourClockTime, startLabel: string, end: TwentyFourHourClockTime, endLabel: string): FixedTime {
    return {_type: 'fixed-time', start, startLabel, end, endLabel}
}

export type FixedDurationConfig = TimeslotSelection | FixedTime

export interface VariableDurationConfig {
    _type: 'variable-duration-config'
    times: PickTime | AnyTimeBetween
    duration: Duration | DurationRange
}

export function variableDurationConfig(duration: Duration | DurationRange, times: PickTime | AnyTimeBetween): VariableDurationConfig {
    return {
        _type: 'variable-duration-config',
        times,
        duration
    }
}

export interface SingleDayScheduling {
    _type: 'single-day-scheduling'
    times: FixedDurationConfig | VariableDurationConfig
    startDay?: DayConstraint[]
}

export function singleDayScheduling(times: FixedDurationConfig | VariableDurationConfig, startDay?: DayConstraint[]): SingleDayScheduling {
    return {
        _type: 'single-day-scheduling',
        times,
        startDay
    }
}

export type DayConstraint = DaysOfWeek

export interface VariableLength {
    _type: 'variable-length'
    minDays: Days
    maxDays?: Days
}

export function variableLength(minDays: Days, maxDays?: Days): VariableLength {
    return {
        _type: 'variable-length',
        minDays,
        maxDays
    }
}

export interface FixedLength {
    _type: 'fixed-length'
    days: Days
}

export function fixedLength(days: Days): FixedLength {
    return {
        _type: 'fixed-length',
        days
    }
}

export type DayLength = VariableLength | FixedLength

export interface MultiDayScheduling {
    _type: 'multi-day-scheduling'
    length: DayLength
    times: TimeslotSelection | FixedTime | PickTime | AnyTimeBetween
    startDay?: DayConstraint[]
    endDay?: DayConstraint[]
}

export function multiDayScheduling(length: DayLength, times: TimeslotSelection | FixedTime | PickTime | AnyTimeBetween, startDay?: DayConstraint[], endDay?: DayConstraint[]): MultiDayScheduling {
    return {
        _type: 'multi-day-scheduling',
        length,
        times,
        startDay,
        endDay
    }
}

const mobileCarWash: Service = {
    id: "mobile-car-wash",
    name: "Mobile Car Wash",
    description: "We come to you",
    schedulingOptions:
        singleDayScheduling(
            timeslotSelection(
                [
                    timeslot(time24("09:00"), time24("11:00"), "Morning"),
                    timeslot(time24("11:00"), time24("13:00"), "Midday"),
                    timeslot(time24("13:00"), time24("15:00"), "Afternoon"),
                    timeslot(time24("15:00"), time24("17:00"), "Late afternoon")]))
}

const groupDogWalk: Service = {
    id: "group-dog-walk",
    name: "Group Dog Walk",
    description: "Socialize with other dogs",
    schedulingOptions:
        singleDayScheduling(
            timeslotSelection(
                [
                    timeslot(time24("09:00"), time24("10:00"), "Morning slot"),
                    timeslot(time24("17:00"), time24("18:00"), "Evening slot")]))
}

const individualDogWalkWithFixedTimeChoices: Service = {
    id: "individual-dog-walk",
    name: "Individual Dog Walk",
    description: "One-on-one attention",
    schedulingOptions:
        singleDayScheduling(
            variableDurationConfig(
                duration(minutes(60)),
                pickTime(
                    timeRange(
                        time24("10:00"),
                        time24("16:00"),
                        period(minutes(30))))))
}

const individualDogWalkWithToTheMinuteSelectableTime: Service = {
    id: "individual-dog-walk-with-selectable-time-range",
    name: "Individual Dog Walk with Selectable Time Range",
    description: "One-on-one attention",
    schedulingOptions:
        singleDayScheduling(
            variableDurationConfig(
                durationRange(minutes(30), minutes(120)),
                anyTimeBetween(time24("09:00"), time24("17:00"))))
}

const petBoardingForOneDayWithFixedCheckInAndOut: Service = {
    id: "pet-boarding-for-one-day-with-fixed-check-in-and-out",
    name: "Pet Boarding For One Day With Fixed Check-In And Out",
    description: "For one day",
    schedulingOptions:
        singleDayScheduling(
            fixedTime(
                time24("09:00"), "Drop-off",
                time24("17:00"), "Pick-up"))
}

const petBoardingForOneDayWithSelectableCheckInAndOut: Service = {
    id: "pet-boarding-for-one-day-with-selectable-check-in-and-out",
    name: "Pet Boarding For One Day With Selectable Check-In And Out",
    description: "For one day",
    schedulingOptions:
        singleDayScheduling(
            variableDurationConfig(
                durationRange(hours(4), hours(8)),
                anyTimeBetween(time24("09:00"), time24("17:00"))))
}

const petBoardingForManyDaysWithFixedTimes: Service = {
    id: "pet-boarding-for-many-days-with-fixed-times",
    name: "Pet Boarding For Many Days With Fixed Times",
    description: "For many days",
    schedulingOptions:
        multiDayScheduling(
            variableLength(days(1), days(7)),
            fixedTime(time24("09:00"), "Drop-off", time24("17:00"), "Pick-up"))
}

const petBoardingForManyDaysWithSelectableTimes: Service = {
    id: "pet-boarding-for-many-days-with-selectable-times",
    name: "Pet Boarding For Many Days With Selectable Times",
    description: "For many days",
    schedulingOptions: multiDayScheduling(
        variableLength(days(1), days(7)),
        anyTimeBetween(time24("09:00"), time24("17:00")))
}

const hotelRoom: Service = {
    id: "hotel-room",
    name: "Hotel Room",
    description: "Stay overnight",
    schedulingOptions: multiDayScheduling(
        variableLength(days(1), days(365)),
        fixedTime(time24("14:00"), "Check-in", time24("11:00"), "Check-out"))
}

const summerCamp: Service = {
    id: "summer-camp",
    name: "Summer Camp",
    description: "For kids",
    schedulingOptions: multiDayScheduling(
        fixedLength(days(5)),
        fixedTime(time24("09:00"), "Drop-off", time24("17:00"), "Pick-up"))
}

const equipmentRentalWithFlexibleTime: Service = {
    id: "equipment-rental-with-flexible-time",
    name: "Equipment Rental with flexible time",
    description: "Rent equipment",
    schedulingOptions: multiDayScheduling(
        variableLength(days(1), days(7)),
        anyTimeBetween(time24("09:00"), time24("17:00")))
}

const equipmentRentalWithControlledTimes: Service = {
    id: "equipment-rental-with-controlled-times",
    name: "Equipment Rental with controlled times",
    description: "Rent equipment",
    schedulingOptions: multiDayScheduling(
        variableLength(days(1), days(7)),
        pickTime(timeRange(time24("09:00"), time24("17:00"), period(minutes(60)))))
}

const yachtCharter: Service = {
    id: "yacht-charter",
    name: "Yacht Charter",
    description: "Charter a yacht",
    schedulingOptions: multiDayScheduling(
        variableLength(days(7), days(28)),
        fixedTime(time24("15:00"), "Collect", time24("12:00"), "Return"),
        [daysOfWeek("Saturday")],
        [daysOfWeek("Saturday")])
}

export const allConfigs = [
    {service: mobileCarWash},
    {service: groupDogWalk},
    {service: individualDogWalkWithFixedTimeChoices},
    {service: petBoardingForOneDayWithFixedCheckInAndOut},
    {service: petBoardingForOneDayWithSelectableCheckInAndOut},
    {service: petBoardingForManyDaysWithFixedTimes},
    {service: hotelRoom},
    {service: summerCamp},
    {service: equipmentRentalWithFlexibleTime},
    {service: equipmentRentalWithControlledTimes},
    {service: yachtCharter}
]