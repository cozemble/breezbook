import type {Duration, IsoDate, TwentyFourHourClockTime} from "@breezbook/packages-types";
import type {FixedTime} from "./types3";

export interface Time {
    _type: "time";
    start: TwentyFourHourClockTime;
}

export interface Timeslot {
    _type: "time-slot";
    start: TwentyFourHourClockTime;
    end: TwentyFourHourClockTime;
    label: string;
    disabled: boolean
}

export function time(start: TwentyFourHourClockTime): Time {
    return {
        _type: "time",
        start
    }
}

export function timeslot(start: TwentyFourHourClockTime, end: TwentyFourHourClockTime, label: string, disabled: boolean = false): Timeslot {
    return {
        _type: "time-slot",
        start,
        end,
        label,
        disabled
    }
}


export type SelectableTimeOption = Timeslot | Time
export type TimeOption = FixedTime | SelectableTimeOption

export interface SingleDaySelection {
    selectedDay: IsoDate | null
    selectedTime: TimeOption | null
}

export interface MultiDaySelection {
    start: SingleDaySelection
    end: SingleDaySelection
}

export interface DurationReport {
    actualDuration: Duration
    message: string
}

export function durationReport(actualDuration: Duration, message: string): DurationReport {
    return {
        actualDuration,
        message
    }
}
