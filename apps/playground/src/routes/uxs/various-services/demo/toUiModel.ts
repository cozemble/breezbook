import {
    disabled,
    type Disabled,
    fixedTimeConfig,
    type FixedTimeConfig,
    pickDateConfig,
    type PickDateConfig,
    pickTimeConfig,
    type PickTimeConfig,
    relativeEnd,
    type RelativeEnd,
    type SlotSelectionConfig,
    time,
    type Time,
    type Timeslot,
    userSelectedTimeConfig,
    type UserSelectedTimeConfig,
    timeSlot
} from "./timeSelectionUiTypes";
import {
    days,
    type Duration,
    duration,
    type DurationOption,
    type FixedTime,
    type PickTime,
    type SchedulingOptions,
    type Service,
    type TimeRange,
    type TimeslotSelection
} from "./types2";
import {type DisabledDays, formatDate} from "$lib/ui/time-picker/types";
import {daysOfWeek, type IsoDate, isoDate, isoDateFns, time24Fns} from "@breezbook/packages-types";


function disabledIfPast(date: IsoDate): Disabled | undefined {
    if (date.value <= isoDate().value) {
        return disabled("Date is in the past")
    }
    return undefined;
}

function disabledIfExcluded(date: IsoDate, permittedDaysOfWeek: string[]): Disabled | undefined {
    const dayOfWeek = isoDateFns.dayOfWeek(date)
    if (!permittedDaysOfWeek.includes(dayOfWeek)) {
        return disabled("Day is not permitted")
    }
    return undefined

}

// function applySchedulingOptions(dayType: "start" | "end", date: IsoDate, schedulingOptions: SchedulingOptions): DatePickConfig {
//     const dateRules = dayType === "start" ? schedulingOptions.startDays : schedulingOptions.endDays
//     if (!dateRules) {
//         return datePickConfig(date, disabledIfPast(date))
//     }
//     return datePickConfig(date, disabledIfPast(date) ?? disabledIfExcluded(date, dateRules.days.days))
// }

function timeRangeToTimes(timeRange: TimeRange): Time[] {
    const times = [] as Time[]
    let current = timeRange.from
    while (current.value < timeRange.to.value) {
        times.push(time(current))
        current = time24Fns.addMinutes(current, timeRange.period.duration)
    }
    times.push(time(timeRange.to))
    return times
}

function getStartTimes(schedulingOptions: SchedulingOptions): PickTimeConfig | FixedTimeConfig | UserSelectedTimeConfig {
    if (schedulingOptions.startTimes.times._type === "any-time-between") {
        return userSelectedTimeConfig(schedulingOptions.startTimes.times.from, schedulingOptions.startTimes.times.to)
    }
    return getTimes(schedulingOptions.startTimes.times)
}

function getDurations(option: DurationOption): { minDuration: Duration, maxDuration: Duration | null } {
    if (option._type === "num-days") {
        return {minDuration: duration(days(option.days)), maxDuration: duration(days(option.days))}
    }
    if (option._type === "duration") {
        return {minDuration: option, maxDuration: option}
    }
    return {minDuration: option.minDuration, maxDuration: option.maxDuration}
}

function getEndTimes(schedulingOptions: SchedulingOptions): PickTimeConfig | UserSelectedTimeConfig | FixedTimeConfig | undefined {
    if (!schedulingOptions.endTimes) {
        return undefined
    }

    if (schedulingOptions.endTimes.times._type === "any-time-between") {
        return userSelectedTimeConfig(schedulingOptions.endTimes.times.from, schedulingOptions.endTimes.times.to)
    }
    return getTimes(schedulingOptions.endTimes.times)
}

function getTimes(times: TimeslotSelection | PickTime | FixedTime): PickTimeConfig | FixedTimeConfig | UserSelectedTimeConfig {
    if (times._type === "timeslot-selection") {
        return pickTimeConfig()
    }
    if (times._type === "pick-time") {
        return pickTimeConfig()
    }
    return fixedTimeConfig(times.time, times.description)
}


function getEndDateConfig(schedulingOptions: SchedulingOptions): PickDateConfig | RelativeEnd | undefined {
    if (schedulingOptions.endDays) {
        return pickDateConfig()
    }
    if (schedulingOptions.duration._type === "num-days") {
        return relativeEnd(schedulingOptions.duration.days)
    }
    const {minDuration, maxDuration} = getDurations(schedulingOptions.duration)
    if (minDuration.value._type === "days" || maxDuration?.value._type === "days") {
        return pickDateConfig()
    }
    return undefined
}

export function toUiModel(service: Service): SlotSelectionConfig {
    const startDate = pickDateConfig()
    const startTime = getStartTimes(service.schedulingOptions)
    const endDate = getEndDateConfig(service.schedulingOptions)
    const endTime = getEndTimes(service.schedulingOptions)
    const {minDuration, maxDuration} = getDurations(service.schedulingOptions.duration)
    return {startDate, startTime, endDate, endTime, maxDuration, minDuration}
}

export function disabledStartDays(month: Date, schedulingOptions: SchedulingOptions): DisabledDays {
    const startOfMonth = isoDate(formatDate(new Date(month.getFullYear(), month.getMonth(), 1)))
    const daysInMonth = isoDateFns.daysInMonth(startOfMonth)
    const disabledDays = daysInMonth.map(day =>
        disabledIfPast(day)
        ?? disabledIfExcluded(day, schedulingOptions.startDays?.days?.days ?? daysOfWeek))
    return daysInMonth.reduce((acc, day, index) => {
        acc[day.value] = !!disabledDays[index]
        return acc
    }, {} as DisabledDays)
}

function disabledIfEarlierThan(selectedStartDate: IsoDate, date: IsoDate): Disabled | undefined {
    if (date.value < selectedStartDate.value) {
        return disabled("Date is earlier than start date")
    }
    return undefined;
}

export function disabledEndDaysInMonth(selectedStartDate: IsoDate, month: Date, schedulingOptions: SchedulingOptions): DisabledDays {
    const startOfMonth = isoDate(formatDate(new Date(month.getFullYear(), month.getMonth(), 1)))
    const daysInMonth = isoDateFns.daysInMonth(startOfMonth)
    const disabledDays = daysInMonth.map(day =>
        disabledIfPast(day)
        ?? disabledIfEarlierThan(selectedStartDate, day)
        ?? disabledIfExcluded(day, schedulingOptions.endDays?.days?.days ?? daysOfWeek))
    return daysInMonth.reduce((acc, day, index) => {
        acc[day.value] = !!disabledDays[index]
        return acc
    }, {} as DisabledDays)
}

export function getPossibleStartTimes(selectedStartDate: IsoDate, schedulingOptions: SchedulingOptions): Time[] | Timeslot[] {
    if (schedulingOptions.startTimes.times._type === "timeslot-selection") {
        return schedulingOptions.startTimes.times.times.map(t => timeSlot(t.slot.from, t.slot.to, t.description))
    }
    if(schedulingOptions.startTimes.times._type === "pick-time") {
        return timeRangeToTimes(schedulingOptions.startTimes.times.options)
    }
    throw new Error("Unsupported start times")
}

export function getPossibleEndTimes(selectedEndDate: IsoDate,  schedulingOptions: SchedulingOptions): Time[] | Timeslot[] {
    if (schedulingOptions.endTimes?.times._type === "pick-time") {
        return timeRangeToTimes(schedulingOptions.endTimes.times.options)
    }
    throw new Error("Unsupported end times")
}