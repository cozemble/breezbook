import {
    type Days,
    duration,
    type Duration,
    type DurationUnit,
    type IsoDate,
    isoDateFns,
    type Minutes,
    type TwentyFourHourClockTime
} from "@breezbook/packages-date-time";
import {timeslotSpec, type TimeslotSpec} from "@breezbook/packages-core";

export interface Period {
    _type: 'period'
    duration: Minutes
}

export function period(duration: Minutes): Period {
    return {_type: 'period', duration}
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

export interface TimeslotSelection {
    _type: 'timeslot-selection'
    times: TimeslotSpec[]
}

export function timeslotSelection(times: TimeslotSpec[]): TimeslotSelection {
    return {_type: 'timeslot-selection', times}
}

export function timeslot(from: TwentyFourHourClockTime, to: TwentyFourHourClockTime, description: string): TimeslotSpec {
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

export type DurationOption = Duration | DurationRange

export interface VariableDurationConfig {
    _type: 'variable-duration-config'
    times: PickTime | AnyTimeBetween
    duration: DurationOption
}

export function variableDurationConfig(duration: Duration | DurationRange, times: PickTime | AnyTimeBetween): VariableDurationConfig {
    return {
        _type: 'variable-duration-config',
        times,
        duration
    }
}

export interface TimeOptions<T> {
    _type: 'time-options'
    usual: T;
    seasonal?: {
        [season: string]: T;
    };
    weekday?: T;
    weekend?: T;
    special?: {
        [dateString: string]: T;
    };
}

export const timeOptionsFns = {
    forDate<T>(options: TimeOptions<T>, date: IsoDate): T {
        if (options.special && options.special[date.value]) {
            return options.special[date.value]
        }
        if (options.weekend && isoDateFns.isWeekend(date)) {
            return options.weekend
        }
        if (options.weekday && !isoDateFns.isWeekend(date)) {
            return options.weekday
        }
        return options.usual
    }
}
export type TimeOptionsParams<T> = Omit<TimeOptions<T>, "usual" | "_type">
export type MultiDayStartTimeOptions = TimeOptions<FixedTime | PickTime | AnyTimeBetween>
export type MultiDayEndTimeOptions = TimeOptions<PickTime | AnyTimeBetween>

export interface SingleDayScheduling {
    _type: 'single-day-scheduling'
    times: TimeslotSelection | FixedTime | VariableDurationConfig
    startDay?: DayConstraint[]
}

export interface MultiDayScheduling {
    _type: 'multi-day-scheduling'
    length: DayLength
    startTimes: MultiDayStartTimeOptions
    endTimes?: MultiDayEndTimeOptions
    startDay?: DayConstraint[]
    endDay?: DayConstraint[]
}

export function singleDayScheduling(times: TimeslotSelection | FixedTime | VariableDurationConfig, startDay?: DayConstraint[]): SingleDayScheduling {
    return {
        _type: 'single-day-scheduling',
        times,
        startDay
    }
}

export function multiDayScheduling(length: DayLength, startTimes: MultiDayStartTimeOptions, endTimes: MultiDayEndTimeOptions | null = null, startDay?: DayConstraint[], endDay?: DayConstraint[]): MultiDayScheduling {
    return {
        _type: 'multi-day-scheduling',
        length,
        startTimes,
        endTimes: endTimes ?? undefined,
        startDay,
        endDay
    }
}

export interface DaysOfWeek {
    _type: 'days-of-week'
    days: string[]
}

export function daysOfWeek(...days: string[]): DaysOfWeek {
    return {_type: 'days-of-week', days}
}

export function startTimes<T>(usual: T, params: TimeOptionsParams<T> = {}): TimeOptions<T> {
    return {
        _type: 'time-options',
        usual,
        ...params
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
export type ScheduleConfig = SingleDayScheduling | MultiDayScheduling