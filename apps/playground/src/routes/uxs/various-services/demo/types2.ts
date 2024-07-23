import {
    duration,
    type Duration,
    minutes,
    type Minutes,
    time24,
    type TwentyFourHourClockTime
} from "@breezbook/packages-types";
import {timeslotSpec, type TimeslotSpec} from "@breezbook/packages-core";


export interface Period {
    _type: 'period'
    duration: Minutes
}

export function period(duration: Minutes): Period {
    return {_type: 'period', duration}
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

export function durationRange(minDuration: Minutes, maxDuration?: Minutes): DurationRange {
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

export function dayRange(minDays: number, maxDays?: number, minDuration?: Minutes): DayRange {
    return {
        _type: 'day-range',
        minDays,
        maxDays: maxDays ?? null,
        minDuration: minDuration ? duration(minDuration) : null
    }
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
        duration: duration(minutes(120)),
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
        duration: duration(minutes(120)),
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
        duration: duration(minutes(480)),
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
        duration: durationRange(minutes(240), minutes(480)),
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
        duration: dayRange(1, 7),
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
        duration: dayRange(1, 7, minutes(180)),
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
        duration: dayRange(1, 28),
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

const equipmentRental: Service = {
    id: "equipment-rental",
    name: "Equipment Rental",
    description: "Rent equipment",
    schedulingOptions: {
        duration: dayRange(1, 7, minutes(240)),
        startTimes: {
            times: anyTimeBetween(time24("09:00"), time24("17:00"))
        },
        endTimes: {
            times: anyTimeBetween(time24("09:00"), time24("17:00"))
        }
    }
}

const yachtCharter: Service = {
    id: "yacht-charter",
    name: "Yacht Charter",
    description: "Charter a yacht",
    schedulingOptions: {
        duration: dayRange(7, 28),
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
    {service: petBoardingForManyDaysWithFixedTimes},
    {service: hotelRoom},
    {service: summerCamp},
    {service: equipmentRental},
]