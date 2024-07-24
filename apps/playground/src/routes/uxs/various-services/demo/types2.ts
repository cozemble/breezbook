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

export interface PickTime {
    _type: 'pick-time'
    options: TimeRange
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

export function pickTime(options: TimeRange): PickTime {
    return {_type: 'pick-time', options}
}

export interface FixedTime {
    _type: 'fixed-time'
    time: TwentyFourHourClockTime
    description: string
}

export function fixedTime(time: TwentyFourHourClockTime, description: string): FixedTime {
    return {_type: 'fixed-time', time, description}
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

export interface DayRange {
    _type: 'day-range'
    minDays: number
    maxDays: number | null
    minDuration: Duration | null
}

export interface NumDays {
    _type: 'num-days'
    days: number
}

export function numDays(days: number): NumDays {
    return {_type: 'num-days', days}
}

export interface DaysOfWeek {
    _type: 'days-of-week'
    days: string[]
}

export function daysOfWeek(...days: string[]): DaysOfWeek {
    return {_type: 'days-of-week', days}
}

export interface SchedulingOptions {
    duration: Duration | DurationRange | DayRange | NumDays
    startTimes: { times: TimeslotSelection | PickTime | FixedTime | AnyTimeBetween }
    endTimes?: { times: PickTime | FixedTime | AnyTimeBetween }
    startDays?: { days: DaysOfWeek }
    endDays?: { days: DaysOfWeek }
}

export interface Service {
    id: string
    name: string
    description: string
    schedulingOptions: SchedulingOptions
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


const mobileCarWash: Service = {
    id: "mobile-car-wash",
    name: "Mobile Car Wash",
    description: "We come to you",
    schedulingOptions: {
        duration: duration(hours(2)),
        startTimes: {
            times: timeslotSelection([
                timeslot(time24("09:00"), time24("11:00"), "Morning"),
                timeslot(time24("11:00"), time24("13:00"), "Midday"),
                timeslot(time24("13:00"), time24("15:00"), "Afternoon"),
                timeslot(time24("15:00"), time24("17:00"), "Late afternoon")
            ])
        }
    }
}

const groupDogWalk: Service = {
    id: "group-dog-walk",
    name: "Group Dog Walk",
    description: "Socialize with other dogs",
    schedulingOptions: {
        duration: duration(hours(2)),
        startTimes: {
            times: timeslotSelection([
                timeslot(time24("09:00"), time24("10:00"), "Morning slot"),
                timeslot(time24("17:00"), time24("18:00"), "Evening slot")
            ])
        }
    }
}

const individualDogWalkWithFixedTimeChoices: Service = {
    id: "individual-dog-walk",
    name: "Individual Dog Walk",
    description: "One-on-one attention",
    schedulingOptions: {
        duration: duration(minutes(60)),
        startTimes: {
            times: pickTime(
                timeRange(
                    time24("10:30"),
                    time24("16:00"),
                    period(minutes(30))))
        }
    }
}

const individualDogWalkWithToTheMinuteSelectableTime: Service = {
    id: "individual-dog-walk-with-selectable-time-range",
    name: "Individual Dog Walk with Selectable Time Range",
    description: "One-on-one attention",
    schedulingOptions: {
        duration: durationRange(minutes(30), minutes(120)),
        startTimes: {
            times: anyTimeBetween(time24("09:00"), time24("17:00"))
        }
    }
}

const petBoardingForOneDayWithFixedCheckInAndOut: Service = {
    id: "pet-boarding-for-one-day-with-fixed-check-in-and-out",
    name: "Pet Boarding For One Day With Fixed Check-In And Out",
    description: "For one day",
    schedulingOptions: {
        duration: duration(hours(8)),
        startTimes: {
            times: fixedTime(time24("09:00"), "Drop-off")
        },
        endTimes: {
            times: fixedTime(time24("17:00"), "Pick-up")
        }
    }
}

const petBoardingForOneDayWithSelectableCheckInAndOut: Service = {
    id: "pet-boarding-for-one-day-with-selectable-check-in-and-out",
    name: "Pet Boarding For One Day With Selectable Check-In And Out",
    description: "For one day",
    schedulingOptions: {
        duration: durationRange(hours(4), hours(8)),
        startTimes: {
            times: anyTimeBetween(time24("09:00"), time24("17:00"))
        },
        endTimes: {
            times: anyTimeBetween(time24("09:00"), time24("17:00"))
        }
    }
}

const petBoardingForManyDaysWithFixedTimes: Service = {
    id: "pet-boarding-for-many-days-with-fixed-times",
    name: "Pet Boarding For Many Days With Fixed Times",
    description: "For many days",
    schedulingOptions: {
        duration: durationRange(hours(240), days(7)),
        startTimes: {
            times: fixedTime(time24("09:00"), "Drop-off")
        },
        endTimes: {
            times: fixedTime(time24("17:00"), "Pick-up")
        }
    }
}

const petBoardingForManyDaysWithSelectableTimes: Service = {
    id: "pet-boarding-for-many-days-with-selectable-times",
    name: "Pet Boarding For Many Days With Selectable Times",
    description: "For many days",
    schedulingOptions: {
        duration: durationRange(hours(3), days(7)),
        startTimes: {
            times: anyTimeBetween(time24("09:00"), time24("17:00"))
        },
        endTimes: {
            times: anyTimeBetween(time24("09:00"), time24("17:00"))
        }
    }
}

const hotelRoom: Service = {
    id: "hotel-room",
    name: "Hotel Room",
    description: "Stay overnight",
    schedulingOptions: {
        duration: durationRange(days(1), days(28)),
        startTimes: {
            times: fixedTime(time24("14:00"), "Check-in")
        },
        endTimes: {
            times: fixedTime(time24("11:00"), "Check-out")
        }
    }
}

const summerCamp: Service = {
    id: "summer-camp",
    name: "Summer Camp",
    description: "For kids",
    schedulingOptions: {
        duration: numDays(5),
        startDays: {
            days: daysOfWeek("Monday")
        },
        startTimes: {
            times: fixedTime(time24("09:00"), "Drop-off")
        },
        endTimes: {
            times: fixedTime(time24("17:00"), "Pick-up")
        }
    }
}

const equipmentRentalWithFlexibleTime: Service = {
    id: "equipment-rental-with-flexible-time",
    name: "Equipment Rental with flexible time",
    description: "Rent equipment",
    schedulingOptions: {
        duration: durationRange(hours(4), days(7)),
        startTimes: {
            times: anyTimeBetween(time24("09:00"), time24("17:00"))
        },
        endTimes: {
            times: anyTimeBetween(time24("09:00"), time24("17:00"))
        }
    }
}

const equipmentRentalWithControlledTimes: Service = {
    id: "equipment-rental-with-controlled-times",
    name: "Equipment Rental with controlled times",
    description: "Rent equipment",
    schedulingOptions: {
        duration: durationRange(hours(4), days(7)),
        startTimes: {
            times: pickTime(
                timeRange(
                    time24("09:00"),
                    time24("17:00"),
                    period(minutes(60))))
        },
        endTimes: {
            times: pickTime(
                timeRange(
                    time24("09:00"),
                    time24("17:00"),
                    period(minutes(60))))
        }
    }
}

const yachtCharter: Service = {
    id: "yacht-charter",
    name: "Yacht Charter",
    description: "Charter a yacht",
    schedulingOptions: {
        duration: durationRange(days(7), days(28)),
        startTimes: {
            times: fixedTime(time24("09:00"), "Departure")
        },
        endTimes: {
            times: fixedTime(time24("17:00"), "Return")
        },
        startDays: {
            days: daysOfWeek("Saturday")
        },
        endDays: {
            days: daysOfWeek("Saturday")
        }
    }
}

// export const allServices = {
//     mobileCarWash,
// }

// export const allServices = {
//     mobileCarWash,
//     groupDogWalk,
//     individualDogWalkWithFixedTimeChoices,
//     individualDogWalkWithToTheMinuteSelectableTime,
//     petBoardingForOneDayWithFixedCheckInAndOut,
//     petBoardingForOneDayWithSelectableCheckInAndOut,
//     petBoardingForManyDaysWithFixedTimes,
//     petBoardingForManyDaysWithSelectableTimes,
//     hotelRoom,
//     summerCamp,
//     equipmentRental,
//     yachtCharter
// }

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
]