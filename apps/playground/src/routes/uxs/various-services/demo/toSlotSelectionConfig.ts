import {
    datePickConfig,
    type DatePickConfig,
    dayTimes,
    disabled,
    type Disabled,
    endDateConfig,
    type EndDateConfig,
    endTimeConfig,
    type EndTimeConfig,
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
    timeSlot
} from "./timeSelection2";
import type {
    AnyTimeBetween,
    FixedTime,
    PickTime,
    SchedulingOptions,
    Service,
    TimeRange,
    TimeslotSelection
} from "./types2";
import {formatDate} from "$lib/ui/time-picker/types";
import {type IsoDate, isoDate, isoDateFns, time24Fns} from "@breezbook/packages-types";


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

function applySchedulingOptions(dayType: "start" | "end", date: IsoDate, schedulingOptions: SchedulingOptions): DatePickConfig {
    const dateRules = dayType === "start" ? schedulingOptions.startDays : schedulingOptions.endDays
    if (!dateRules) {
        return datePickConfig(date, disabledIfPast(date))
    }
    return datePickConfig(date, disabledIfPast(date) ?? disabledIfExcluded(date, dateRules.days.days))
}

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

function anyTimeBetweenToTimes(anyTimeBetween: AnyTimeBetween): Time[] {
    throw new Error("Not implemented")
}

function toTimes(options: TimeRange | AnyTimeBetween): Time[] {
    if (options._type === "time-range") {
        return timeRangeToTimes(options)
    }
    return anyTimeBetweenToTimes(options)
}

function getStartTimes(startDays: DatePickConfig[], schedulingOptions: SchedulingOptions): PickTimeConfig | FixedTimeConfig {
    return getTimes(schedulingOptions.startTimes.times, startDays)
}

function getEndTimes(startDays: DatePickConfig[], schedulingOptions: SchedulingOptions): EndTimeConfig | FixedTimeConfig | undefined {
    if (!schedulingOptions.endTimes) {
        return undefined
    }
    const mapped = getTimes(schedulingOptions.endTimes.times, startDays)
    if (mapped._type === "fixed-time") {
        return mapped
    }
    return endTimeConfig(mapped)
}

function getTimes(times: TimeslotSelection | PickTime | FixedTime, startDays: DatePickConfig[]): PickTimeConfig | FixedTimeConfig {
    if (times._type === "timeslot-selection") {
        const slots = times.times.map(slot => timeSlot(slot.slot.from, slot.slot.to, slot.description))
        return pickTimeConfig(startDays.map(day => dayTimes(day.date, slots)))
    }
    if (times._type === "pick-time") {
        const mappedTimes = toTimes(times.options)
        return pickTimeConfig(startDays.map(day => dayTimes(day.date, mappedTimes)))
    }
    return fixedTimeConfig(times.time, times.description)
}


function getEndDateConfig(days: IsoDate[], schedulingOptions: SchedulingOptions): EndDateConfig | RelativeEnd | undefined {
    if (schedulingOptions.endDays) {
        return endDateConfig(pickDateConfig(days.map(day => applySchedulingOptions("end", day, schedulingOptions))))
    }
    if (schedulingOptions.duration._type === "num-days") {
        return relativeEnd(schedulingOptions.duration.days)
    }
    if (schedulingOptions.duration._type === "day-range") {
        return endDateConfig(pickDateConfig(days.map(day => applySchedulingOptions("end", day, schedulingOptions))))
    }
    return undefined
}

export function toSlotSelectionConfig(month: Date, service: Service): SlotSelectionConfig {
    const startOfMonth = isoDate(formatDate(new Date(month.getFullYear(), month.getMonth(), 1)))
    const daysInMonth = isoDateFns.daysInMonth(startOfMonth)
    const startDays = daysInMonth.map(day => applySchedulingOptions("start", day, service.schedulingOptions))
    const enabledDays = startDays.filter(day => !day.disabled)
    const startDate: PickDateConfig = {_type: 'pick-one', options: startDays}
    const startTime: PickTimeConfig | FixedTimeConfig = getStartTimes(enabledDays, service.schedulingOptions)
    const endDate = getEndDateConfig(daysInMonth, service.schedulingOptions)
    const endTime = getEndTimes(enabledDays, service.schedulingOptions)
    return {startDate, startTime, endDate, endTime}
}
