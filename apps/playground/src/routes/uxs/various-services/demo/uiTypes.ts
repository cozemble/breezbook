import type {Duration, IsoDate, TwentyFourHourClockTime} from "@breezbook/packages-date-time";

import type {FixedTime} from "./scheduleConfig";

export interface Time {
    _type: "time";
    start: TwentyFourHourClockTime;
}

export interface StartAndEndTime {
    start: TwentyFourHourClockTime;
    end: TwentyFourHourClockTime;
}

export interface Timeslot extends StartAndEndTime {
    _type: "time-slot";
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

export interface MultiDayTime {
    _type: "multi-day-time"
    startTime: Time | null
    endTime: Time | null
}

export interface MultiDaySelection {
    startDate: IsoDate | null
    endDate: IsoDate | null
    selectedStartTime: FixedTime | Time | null
    selectedEndTime: Time | null
}

export function initialMultiDaySelection(): MultiDaySelection {
    return {
        startDate: null,
        endDate: null,
        selectedStartTime: null,
        selectedEndTime: null
    }
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
