import {type IsoDate, type TwentyFourHourClockTime} from "@breezbook/packages-types";
import type {Duration} from "./types2";

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
    _type: 'pick-one';
    options: DatePickConfig[];
}

export function pickDateConfig(options: DatePickConfig[]): PickDateConfig {
    return {_type: 'pick-one', options}

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
    _type: 'pick-one';
    options: DayTimes[];
}

export function pickTimeConfig(options: DayTimes[]): PickTimeConfig {
    return {_type: 'pick-one', options}
}

// export interface EndDateConfig {
//     _type: 'end-date-config';
//     minDays?: number;
//     maxDays?: number;
//     options: PickDateConfig;
// }
//
// export function endDateConfig(options: PickDateConfig, minDays?: number, maxDays?: number): EndDateConfig {
//     return {minDays, maxDays, options, _type: 'end-date-config'}
// }

// export interface EndTimeConfig {
//     _type: 'end-time';
//     minDuration?: Duration;
//     maxDuration?: Duration;
//     time: PickTimeConfig | UserSelectedTimeConfig;
// }
//
// export function endTimeConfig(time: PickTimeConfig | UserSelectedTimeConfig, minDuration?: Duration, maxDuration?: Duration): EndTimeConfig {
//     return {minDuration, maxDuration, time, _type: 'end-time'}
// }

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
    minDuration: Duration;
    endTime?: PickTimeConfig | UserSelectedTimeConfig | FixedTimeConfig;
    endDate?: PickDateConfig | RelativeEnd;
    maxDuration: Duration|null;
}
