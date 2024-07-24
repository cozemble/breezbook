import {isoDate, type IsoDate, time24, type TwentyFourHourClockTime} from "@breezbook/packages-types";
import {days, duration, type Duration, hours} from "./types2";

export interface Disabled {
    disabled?: boolean;
    reason?: string;
}

export function disabled(reason: string): Disabled {
    return {disabled: true, reason}
}

interface Capacity {
    max: number;
    remaining: number;
}

interface PriceLabel {
    label: string;
}

export const justDisabled: Disabled = {disabled: true};

export interface DatePickConfig {
    date: IsoDate
    disabled?: Disabled
}

export function datePickConfig(date: IsoDate, disabled?: Disabled): DatePickConfig {
    return {date, disabled}

}

export interface PickDateConfig {
    _type: 'pick-date-config';
    // options: DatePickConfig[];
}

export function pickDateConfig(): PickDateConfig {
    return {_type: 'pick-date-config'}

}

export interface Time {
    _type: "time";
    start: TwentyFourHourClockTime;
    disabled?: Disabled;
    capacity?: Capacity;
    price?: PriceLabel;
}

export function time(start: TwentyFourHourClockTime): Time {
    return {_type: "time", start}
}

export interface Timeslot {
    _type: "time-slot";
    start: TwentyFourHourClockTime;
    end: TwentyFourHourClockTime;
    label: string;
    disabled?: Disabled;
    capacity?: Capacity;
    price?: PriceLabel;
}

export function timeSlot(start: TwentyFourHourClockTime, end: TwentyFourHourClockTime, label: string): Timeslot {
    return {_type: "time-slot", start, end, label}
}

export interface UserSelectedTimeConfig {
    _type: "user-selected-time-config";
    from: TwentyFourHourClockTime;
    to: TwentyFourHourClockTime;
}

export function userSelectedTimeConfig(from: TwentyFourHourClockTime, to: TwentyFourHourClockTime): UserSelectedTimeConfig {
    return {_type: "user-selected-time-config", from, to}
}

export type TimeOptions = Time[] | Timeslot[]

export interface DayTimes {
    date: IsoDate;
    times: TimeOptions
}

export function dayTimes(date: IsoDate, times: Time[] | Timeslot[]): DayTimes {
    return {date, times}
}

export interface PickTimeConfig {
    _type: 'pick-time-config';
    options: DayTimes[];
}

export function pickTimeConfig(options: DayTimes[]): PickTimeConfig {
    return {_type: 'pick-time-config', options}
}

export interface FixedTimeConfig {
    _type: 'fixed-time';
    time: TwentyFourHourClockTime;
    timeLabel: string;
}

export function fixedTimeConfig(time: TwentyFourHourClockTime, timeLabel: string): FixedTimeConfig {
    return {_type: 'fixed-time', time, timeLabel}
}

export interface RelativeEnd {
    _type: 'relative-end';
    numDays: number;
}

export function relativeEnd(numDays: number): RelativeEnd {
    return {_type: 'relative-end', numDays}
}

export interface SlotSelectionConfig {
    startDate: PickDateConfig;
    startTime: PickTimeConfig | FixedTimeConfig | UserSelectedTimeConfig;
    minDuration: Duration | null;
    endTime?: PickTimeConfig | UserSelectedTimeConfig | FixedTimeConfig;
    endDate?: PickDateConfig | RelativeEnd;
    maxDuration: Duration | null;
}


export const equipmentRental: SlotSelectionConfig = {
    startDate: {
        _type: "pick-date-config"
    },
    startTime: {
        _type: "pick-time-config", options: [
            {
                date: isoDate('2023-06-01'), times: [
                    {_type: "time", start: time24('08:00')},
                    {_type: "time", start: time24('10:00'), disabled: justDisabled},
                    {_type: "time", start: time24('12:00')},
                ]
            },
            {
                date: isoDate('2023-06-02'), times: [
                    {_type: "time", start: time24('08:00')},
                    {_type: "time", start: time24('10:00')},
                    {_type: "time", start: time24('12:00')},
                ]
            },
            {
                date: isoDate('2023-06-04'), times: [
                    {_type: "time", start: time24('08:00')},
                    {_type: "time", start: time24('10:00')},
                    {_type: "time", start: time24('12:00')},
                ]
            }
        ]
    },
    endTime: {
        _type: "pick-time-config", options: [
            {
                date: isoDate('2023-06-01'), times: [
                    {_type: "time", start: time24('08:00')},
                    {_type: "time", start: time24('09:00')},
                    {_type: "time", start: time24('10:00')},
                    {_type: "time", start: time24('11:00')},
                    {_type: "time", start: time24('12:00')},
                    {_type: "time", start: time24('13:00')},
                    {_type: "time", start: time24('14:00')},
                    {_type: "time", start: time24('15:00')},
                    {_type: "time", start: time24('16:00')},
                    {_type: "time", start: time24('17:00')},
                ]
            },
            {
                date: isoDate('2023-06-02'), times: [
                    {_type: "time", start: time24('08:00')},
                    {_type: "time", start: time24('10:00')},
                    {_type: "time", start: time24('12:00')},
                ]
            },
            {
                date: isoDate('2023-06-04'), times: [
                    {_type: "time", start: time24('08:00')},
                    {_type: "time", start: time24('10:00')},
                    {_type: "time", start: time24('12:00')},
                ]
            }
        ]
    },
    endDate: {
        _type: "pick-date-config"
    },
    minDuration: duration(hours(2)),
    maxDuration: duration(days(7))
}

// export const carwash: SlotSelectionConfig = {
//     startDate: {
//         _type: "pick-date-config", options: [
//             {date: isoDate('2023-06-01')},
//             {date: isoDate('2023-06-02')},
//             {date: isoDate('2023-06-03'), disabled: justDisabled},
//             {date: isoDate('2023-06-04')},
//         ]
//     },
//     startTime: {
//         _type: "pick-time-config", options: [
//             {
//                 date: isoDate('2023-06-01'), times: [
//                     {_type: "time-slot", start: time24('08:00'), end: time24('10:00'), label: 'Morning'},
//                     {
//                         _type: "time-slot",
//                         start: time24('10:00'),
//                         end: time24('12:00'),
//                         label: 'Late Morning',
//                         disabled: justDisabled
//                     },
//                     {_type: "time-slot", start: time24('12:00'), end: time24('14:00'), label: 'Afternoon'},
//                 ]
//             },
//             {
//                 date: isoDate('2023-06-02'), times: [
//                     {_type: "time-slot", start: time24('08:00'), end: time24('10:00'), label: 'Morning'},
//                     {_type: "time-slot", start: time24('10:00'), end: time24('12:00'), label: 'Late Morning'},
//                     {_type: "time-slot", start: time24('12:00'), end: time24('14:00'), label: 'Afternoon'},
//                 ]
//             },
//             {
//                 date: isoDate('2023-06-04'), times: [
//                     {_type: "time-slot", start: time24('08:00'), end: time24('10:00'), label: 'Morning'},
//                     {_type: "time-slot", start: time24('10:00'), end: time24('12:00'), label: 'Late Morning'},
//                     {_type: "time-slot", start: time24('12:00'), end: time24('14:00'), label: 'Afternoon'},
//                 ]
//             },
//         ]
//     },
//     maxDuration: null,
//     minDuration: null
// }
//
// export const oneDayPetBoarding: SlotSelectionConfig = {
//     startDate: {
//         _type: "pick-date-config", options: [
//             {date: isoDate('2023-06-01')},
//             {date: isoDate('2023-06-02')},
//             {date: isoDate('2023-06-03'), disabled: justDisabled},
//             {date: isoDate('2023-06-04')},
//         ]
//     },
//     startTime: {
//         _type: "fixed-time", time: time24('09:00'), timeLabel: 'Drop off'
//     },
//     endTime: {
//         _type: "fixed-time", time: time24('17:00'), timeLabel: 'Pick up'
//     },
//     maxDuration: null,
//     minDuration: null
// }
//
// const multiDayPetBoardingFixedDropOffAndPickUp: SlotSelectionConfig = {
//     startDate: {
//         _type: "pick-date-config", options: [
//             {date: isoDate('2023-06-01')},
//             {date: isoDate('2023-06-02')},
//             {date: isoDate('2023-06-03'), disabled: justDisabled},
//             {date: isoDate('2023-06-04')},
//         ]
//     },
//     startTime: {
//         _type: "fixed-time", time: time24('09:00'), timeLabel: 'Drop off'
//     },
//     endTime: {
//         _type: "fixed-time", time: time24('17:00'), timeLabel: 'Pick up'
//     },
//     minDuration: duration(days(1)),
//     maxDuration: duration(days(14)),
//     endDate: {
//         _type: "pick-date-config", options: [
//             {date: isoDate('2023-06-01')},
//             {date: isoDate('2023-06-02')},
//             {date: isoDate('2023-06-03'), disabled: justDisabled},
//             {date: isoDate('2023-06-04')},
//         ]
//     }
// }
//
// const multiDayPetBoardingFlexibleDropOffAndPickUp: SlotSelectionConfig = {
//     startDate: {
//         _type: "pick-date-config", options: [
//             {date: isoDate('2023-06-01')},
//             {date: isoDate('2023-06-02')},
//             {date: isoDate('2023-06-03'), disabled: justDisabled},
//             {date: isoDate('2023-06-04')},
//         ]
//     },
//     startTime: {
//         _type: "pick-time-config", options: [
//             {
//                 date: isoDate('2023-06-01'), times: [
//                     {_type: "time", start: time24('08:00')},
//                     {_type: "time", start: time24('10:00')},
//                     {_type: "time", start: time24('12:00')},
//                 ]
//             },
//             {
//                 date: isoDate('2023-06-02'), times: [
//                     {_type: "time", start: time24('08:00')},
//                     {_type: "time", start: time24('10:00')},
//                     {_type: "time", start: time24('12:00')},
//                 ]
//             },
//             {
//                 date: isoDate('2023-06-04'), times: [
//                     {_type: "time", start: time24('08:00')},
//                     {_type: "time", start: time24('10:00')},
//                     {_type: "time", start: time24('12:00')},
//                 ]
//             }
//         ]
//     },
//     minDuration: duration(hours(2)),
//     maxDuration: null,
//     endDate: {
//         _type: "pick-date-config", options: [
//             {date: isoDate('2023-06-01')},
//             {date: isoDate('2023-06-02')},
//             {date: isoDate('2023-06-03'), disabled: justDisabled},
//             {date: isoDate('2023-06-04')},
//         ]
//     },
//     endTime: {
//         _type: "pick-time-config", options: [
//             {
//                 date: isoDate('2023-06-01'), times: [
//                     {_type: "time", start: time24('08:00')},
//                     {_type: "time", start: time24('10:00')},
//                     {_type: "time", start: time24('12:00')},
//                 ]
//             },
//             {
//                 date: isoDate('2023-06-02'), times: [
//                     {_type: "time", start: time24('08:00')},
//                     {_type: "time", start: time24('10:00')},
//                     {_type: "time", start: time24('12:00')},
//                 ]
//             },
//             {
//                 date: isoDate('2023-06-04'), times: [
//                     {_type: "time", start: time24('08:00')},
//                     {_type: "time", start: time24('10:00')},
//                     {_type: "time", start: time24('12:00')},
//                 ]
//             }
//         ]
//     }
// }
//
// export const hotelRoom: SlotSelectionConfig = {
//     startDate: {
//         _type: "pick-date-config", options: [
//             {date: isoDate('2023-06-01')},
//             {date: isoDate('2023-06-02')},
//             {date: isoDate('2023-06-03'), disabled: justDisabled},
//             {date: isoDate('2023-06-04')},
//         ]
//     },
//     minDuration: duration(days(1)),
//     maxDuration: duration(days(14)),
//     endDate: {
//         _type: "pick-date-config", options: [
//             {date: isoDate('2023-06-01')},
//             {date: isoDate('2023-06-02')},
//             {date: isoDate('2023-06-03'), disabled: justDisabled},
//             {date: isoDate('2023-06-04')},
//         ]
//     }
//     ,
//     startTime: {
//         _type: "fixed-time", time: time24('15:00'), timeLabel: 'Check-in'
//     },
//     endTime: {
//         _type: "fixed-time", time: time24('11:00'), timeLabel: 'Check-out'
//     }
// }
//
// export const summerCamp: SlotSelectionConfig = {
//     startDate: {
//         _type: "pick-date-config", options: [
//             {date: isoDate('2023-06-01')}, // starting each week
//             {date: isoDate('2023-06-08')},
//             {date: isoDate('2023-06-15'), disabled: justDisabled},
//             {date: isoDate('2023-06-22')},
//         ]
//     },
//     startTime: {
//         _type: "fixed-time", time: time24('09:00'), timeLabel: 'Drop off'
//     },
//     endTime: {
//         _type: "fixed-time", time: time24('17:00'), timeLabel: 'Pick up'
//     },
//     endDate: {
//         _type: "relative-end",
//         numDays: 5
//     },
//     maxDuration: null,
//     minDuration: null
// }