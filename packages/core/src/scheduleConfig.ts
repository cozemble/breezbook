import {
    type Days,
    duration,
    type Duration,
    durationFns,
    type DurationUnit,
    exactTimeAvailability,
    type IsoDate,
    isoDateFns,
    minutes,
    type Minutes,
    time24,
    time24Fns,
    TimePeriod,
    timePeriod,
    timePeriodFns,
    type TwentyFourHourClockTime
} from "@breezbook/packages-types";
import {mandatory} from "./utils.js";
import {StartTime} from "./availability.js";
import {timeslotSpec, TimeslotSpec} from "./types.js";

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

export interface TimeBlocks {
    _type: 'time-blocks'
    blocks: TimePeriod[]
    period: Period
}

export function timeBlocks(blocks: TimePeriod[], period: Period): TimeBlocks {
    return {_type: 'time-blocks', blocks, period}
}

export interface TimeList {
    _type: 'time-list'
    times: TwentyFourHourClockTime[]
}

export function timeList(times: TwentyFourHourClockTime[]): TimeList {
    return {_type: 'time-list', times}
}

export const timeRangeFns = {
    times(timeRange: TimeRange): TwentyFourHourClockTime[] {
        const result = [] as TwentyFourHourClockTime[]
        let current = timeRange.from
        while (current.value < timeRange.to.value) {
            result.push(current)
            current = time24Fns.addMinutes(current, timeRange.period.duration)
        }
        return result
    }
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
    options: TimeRange | TimeList | TimeBlocks
}

export function pickTime(options: TimeRange | TimeList | TimeBlocks): PickTime {
    return {_type: 'pick-time', options}
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

export const singleDaySchedulingFns = {
    pickTime(options: {
        duration?: Minutes | Duration
        startTime?: TwentyFourHourClockTime
        endTime?: TwentyFourHourClockTime
        period?: Minutes
    } = {}): SingleDayScheduling {
        const theDuration = options.duration ? durationFns.toDuration(options.duration) : duration(minutes(60))
        const theStartTime = options.startTime ?? time24("09:00")
        const theEndTime = options.endTime ?? time24("17:00")
        const thePeriod = options.period ?? minutes(60)
        const theTimes = pickTime(timeRange(theStartTime, theEndTime, period(thePeriod)))
        return singleDayScheduling(variableDurationConfig(theDuration, theTimes))
    },
    timelist(times: TwentyFourHourClockTime[], options: {
        duration?: Minutes | Duration
    } = {}): SingleDayScheduling {
        const theDuration = options.duration ? durationFns.toDuration(options.duration) : duration(minutes(60))
        return singleDayScheduling(variableDurationConfig(theDuration, pickTime(timeList(times))))
    },
    timeblocks(blocks: TimePeriod[], options: {
        duration?: Minutes | Duration,
        period?: Minutes
    } = {}): SingleDayScheduling {
        const theDuration = options.duration ? durationFns.toDuration(options.duration) : duration(minutes(60))
        const thePeriod = options.period ?? minutes(60)
        return singleDayScheduling(variableDurationConfig(theDuration, pickTime(timeBlocks(blocks, period(thePeriod)))))
    },
    neverAvailable(): SingleDayScheduling {
        return singleDayScheduling(timeslotSelection([]))
    },
    alwaysAvailable(): SingleDayScheduling {
        return singleDayScheduling(variableDurationConfig(durationRange(minutes(0)), anyTimeBetween(time24("00:00"), time24("23:59"))))
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

export interface MinimumNoticePeriod {
    _type: 'minimum-notice-period'
    duration: Duration
}

export function minimumNoticePeriod(d: DurationUnit): MinimumNoticePeriod {
    return {
        _type: 'minimum-notice-period',
        duration: duration(d)
    }
}

export type DayLength = VariableLength | FixedLength

export interface SimpleScheduleConfig {
    _type: 'simple-schedule-config'
    duration: Duration
}

export function simpleScheduleConfig(duration: Duration): SimpleScheduleConfig {
    return {
        _type: 'simple-schedule-config',
        duration
    }
}

// export type ScheduleConfig = SingleDayScheduling | MultiDayScheduling | SimpleScheduleConfig

export interface ScheduleConfig {
    _type: 'schedule-config'
    scheduling: SingleDayScheduling | MultiDayScheduling | SimpleScheduleConfig
    minimumNoticePeriod?: MinimumNoticePeriod
}

export function scheduleConfig(
    scheduling: SingleDayScheduling | MultiDayScheduling | SimpleScheduleConfig,
    options?: {
        minimumNoticePeriod?: MinimumNoticePeriod
    }
): ScheduleConfig {
    return {
        _type: 'schedule-config',
        scheduling,
        minimumNoticePeriod: options?.minimumNoticePeriod,
    }
}

function willEndBefore(time: TwentyFourHourClockTime, duration: Minutes, endTime: TwentyFourHourClockTime) {
    return time24Fns.addMinutes(time, duration).value <= endTime.value
}

export const scheduleConfigFns = {

    getMinimumNoticePeriod(config: ScheduleConfig): Duration | null {
        return config.minimumNoticePeriod ? config.minimumNoticePeriod.duration : null
    },

    duration(scheduleConfig: ScheduleConfig): Duration {
        if(scheduleConfig.scheduling._type === 'simple-schedule-config') {
            return scheduleConfig.scheduling.duration
        }
        if (scheduleConfig.scheduling._type === 'multi-day-scheduling') {
            throw new Error('Cannot get duration for multi-day scheduling')
        }
        if (scheduleConfig.scheduling.times._type === 'timeslot-selection') {
            const firstSlot = mandatory(scheduleConfig.scheduling.times.times[0], 'Expected at least one timeslot')
            return timePeriodFns.duration(firstSlot.slot)
        }
        if (scheduleConfig.scheduling.times._type === 'fixed-time') {
            return timePeriodFns.duration(timePeriod(scheduleConfig.scheduling.times.start, scheduleConfig.scheduling.times.end))
        }
        if (scheduleConfig.scheduling.times._type === 'variable-duration-config') {
            if (scheduleConfig.scheduling.times.duration._type === 'duration-range') {
                return scheduleConfig.scheduling.times.duration.minDuration
            }
            return scheduleConfig.scheduling.times.duration
        }
        throw new Error('Unexpected times type')
    },
    startTimes(scheduleConfig: ScheduleConfig, duration: Minutes): StartTime[] | null {
        if(scheduleConfig.scheduling._type === 'simple-schedule-config') {
            return null
        }
        if (scheduleConfig.scheduling._type === 'multi-day-scheduling') {
            throw new Error('Cannot get start times for multi-day scheduling')
        }
        if (scheduleConfig.scheduling.times._type === 'timeslot-selection') {
            return scheduleConfig.scheduling.times.times
        }
        if (scheduleConfig.scheduling.times._type === 'fixed-time') {
            return [exactTimeAvailability(scheduleConfig.scheduling.times.start)]
        }
        if (scheduleConfig.scheduling.times._type === 'variable-duration-config') {
            if (scheduleConfig.scheduling.times.times._type === 'pick-time') {
                if (scheduleConfig.scheduling.times.times.options._type === 'time-range') {
                    const endTime = scheduleConfig.scheduling.times.times.options.to
                    return timeRangeFns.times(scheduleConfig.scheduling.times.times.options)
                        .filter(time => willEndBefore(time, duration, endTime))
                        .map(time => exactTimeAvailability(time))
                }
                if (scheduleConfig.scheduling.times.times.options._type === 'time-list') {
                    return scheduleConfig.scheduling.times.times.options.times.map(time => exactTimeAvailability(time))
                }
                const period = scheduleConfig.scheduling.times.times.options.period.duration
                const latestEndTime = scheduleConfig.scheduling.times.times.options.blocks.map(block => block.to).reduce((latest, current) => current.value > latest.value ? current : latest)
                return scheduleConfig.scheduling.times.times.options.blocks.flatMap(block => timePeriodFns.listPossibleStartTimes(block, period))
                    .filter(time => willEndBefore(time, duration, latestEndTime))
                    .map(time => exactTimeAvailability(time))
            }
            if (scheduleConfig.scheduling.times.times._type === 'any-time-between') {
                throw new Error('Cannot get start times for any-time-between')
            }

        }
        throw new Error('Unexpected times type')
    }
}