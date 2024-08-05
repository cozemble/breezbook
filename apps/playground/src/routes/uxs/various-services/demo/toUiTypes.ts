import {type DisabledDays, formatDate} from "$lib/ui/time-picker/types";
import {type IsoDate, isoDate, isoDateFns, time24Fns} from "@breezbook/packages-types";
import {disabled, type Disabled} from "../demo-0.1/timeSelectionUiTypes";
import {type SelectableTimeOption, time, type Time, timeslot} from "./uiTypes";
import type {DayConstraint, DayLength, PickTime, TimeRange, TimeslotSelection, VariableLength} from "./scheduleConfig";

function disabledIfPast(date: IsoDate): Disabled | undefined {
    if (date.value <= isoDateFns.today(timezones.utc).value) {
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

function disabledIfConstrained(date: IsoDate, constraints: DayConstraint[]): Disabled | undefined {
    return constraints
        .map(constraint => disabledIfExcluded(date, constraint.days))
        .find(disabled => !!disabled)
}

export function disabledStartDays(month: Date, dayConstraints: DayConstraint[]): DisabledDays {
    const startOfMonth = isoDate(formatDate(new Date(month.getFullYear(), month.getMonth(), 1)))
    const daysInMonth = isoDateFns.daysInMonth(startOfMonth)
    const disabledDays = daysInMonth.map(day =>
        disabledIfPast(day)
        ?? disabledIfConstrained(day, dayConstraints))
    return daysInMonth.reduce((acc, day, index) => {
        acc[day.value] = !!disabledDays[index]
        return acc
    }, {} as DisabledDays)
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

export function getPossibleStartTimes(startDate: IsoDate, times: TimeslotSelection | PickTime): SelectableTimeOption[] {
    if (times._type === "timeslot-selection") {
        return times.times.map(t => timeslot(t.slot.from, t.slot.to, t.description))
    } else {
        return timeRangeToTimes(times.timeRange)
    }
}

export function getPossibleEndTimes(endDate: IsoDate, times: PickTime): Time[] {
    return timeRangeToTimes(times.timeRange)
}

function disabledIfBeforeDate(date: IsoDate, selectedStartDate: IsoDate): Disabled | undefined {
    if (date.value < selectedStartDate.value) {
        return disabled("Date is before start date")
    }
    return undefined
}

function disabledIfBreaksRangeLength(date: IsoDate, selectedStartDate: IsoDate, length: VariableLength): Disabled | undefined {
    const daysBetween = isoDateFns.daysBetween(selectedStartDate, date)
    if (daysBetween < length.minDays.value) {
        return disabled("Date is too soon")
    }
    if (length.maxDays && daysBetween + 1 > length.maxDays.value) {
        return disabled("Date is too far in the future")
    }
    return undefined
}

function disabledIfBreaksLength(date: IsoDate, selectedStartDate: IsoDate, length: DayLength): Disabled | undefined {
    if (length._type === "variable-length") {
        return disabledIfBreaksRangeLength(date, selectedStartDate, length)
    }
    if (length._type === "fixed-length") {
        const daysBetween = isoDateFns.daysBetween(selectedStartDate, date)
        if (daysBetween + 1 !== length.days.value) {
            return disabled("Date is not the correct length")
        }
    }
    return undefined
}

export function disabledEndDays(currentMonth: Date, selectedStartDate: IsoDate, length: DayLength, dayConstraints: DayConstraint[]): DisabledDays {
    const startOfMonth = isoDate(formatDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)))
    const daysInMonth = isoDateFns.daysInMonth(startOfMonth)
    const disabledDays = daysInMonth.map(day =>
        disabledIfPast(day)
        ?? disabledIfConstrained(day, dayConstraints)
        ?? disabledIfBeforeDate(day, selectedStartDate)
        ?? disabledIfBreaksLength(day, selectedStartDate, length))
    return daysInMonth.reduce((acc, day, index) => {
        acc[day.value] = !!disabledDays[index]
        return acc
    }, {} as DisabledDays)

}