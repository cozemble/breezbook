import {
    datePickConfig,
    type DatePickConfig,
    dayTimes,
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
    timeSlot,
    userSelectedTimeConfig,
    type UserSelectedTimeConfig
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

function getStartTimes(startDays: DatePickConfig[], schedulingOptions: SchedulingOptions): PickTimeConfig | FixedTimeConfig | UserSelectedTimeConfig {
    if (schedulingOptions.startTimes.times._type === "any-time-between") {
        return userSelectedTimeConfig(schedulingOptions.startTimes.times.from, schedulingOptions.startTimes.times.to)
    }
    return getTimes(schedulingOptions.startTimes.times, startDays)
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

function getEndTimes(startDays: DatePickConfig[], schedulingOptions: SchedulingOptions): PickTimeConfig | UserSelectedTimeConfig | FixedTimeConfig | undefined {
    if (!schedulingOptions.endTimes) {
        return undefined
    }

    if (schedulingOptions.endTimes.times._type === "any-time-between") {
        return userSelectedTimeConfig(schedulingOptions.endTimes.times.from, schedulingOptions.endTimes.times.to)
    }
    return getTimes(schedulingOptions.endTimes.times, startDays)
}

function getTimes(times: TimeslotSelection | PickTime | FixedTime, startDays: DatePickConfig[]): PickTimeConfig | FixedTimeConfig | UserSelectedTimeConfig {
    if (times._type === "timeslot-selection") {
        const slots = times.times.map(slot => timeSlot(slot.slot.from, slot.slot.to, slot.description))
        return pickTimeConfig(startDays.map(day => dayTimes(day.date, slots)))
    }
    if (times._type === "pick-time") {
        const mappedTimes = timeRangeToTimes(times.options)
        return pickTimeConfig(startDays.map(day => dayTimes(day.date, mappedTimes)))
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

export function toUiModel(startMonth: Date, service: Service): SlotSelectionConfig {
    const startOfMonth = isoDate(formatDate(new Date(startMonth.getFullYear(), startMonth.getMonth(), 1)))
    const daysInMonth = isoDateFns.daysInMonth(startOfMonth)
    const startDays = daysInMonth.map(day => applySchedulingOptions("start", day, service.schedulingOptions))
    const enabledDays = startDays.filter(day => !day.disabled)
    const startDate = pickDateConfig()
    const startTime = getStartTimes(enabledDays, service.schedulingOptions)
    const endDate = getEndDateConfig(service.schedulingOptions)
    const endTime = getEndTimes(enabledDays, service.schedulingOptions)
    const {minDuration, maxDuration} = getDurations(service.schedulingOptions.duration)
    return {startDate, startTime, endDate, endTime, maxDuration, minDuration}
}

export function disabledDaysInMonth(month: Date): DisabledDays {
    const startOfMonth = isoDate(formatDate(new Date(month.getFullYear(), month.getMonth(), 1)))
    const daysInMonth = isoDateFns.daysInMonth(startOfMonth)
    const disabledDays = daysInMonth.map(day => disabledIfPast(day))
    return daysInMonth.reduce((acc, day, index) => {
        acc[day.value] = !!disabledDays[index]
        return acc
    }, {} as DisabledDays)
}

export function disabledEndDaysInMonth(selectedStartDate: IsoDate, month: Date): DisabledDays {
    const startOfMonth = isoDate(formatDate(new Date(month.getFullYear(), month.getMonth(), 1)))
    const daysInMonth = isoDateFns.daysInMonth(startOfMonth)
    const disabledDays = daysInMonth.map(day => {
        if (day.value < selectedStartDate.value) {
            return disabled("End date must be after start date")
        }
        return undefined
    })
    return daysInMonth.reduce((acc, day, index) => {
        acc[day.value] = !!disabledDays[index]
        return acc
    }, {} as DisabledDays)

}
