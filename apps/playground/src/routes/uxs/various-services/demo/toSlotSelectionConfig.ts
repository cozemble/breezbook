import {
    type DatePickConfig,
    type DayTimes,
    type FixedTimeConfig,
    justDisabled,
    type PickDateConfig,
    type PickTimeConfig,
    type SlotSelectionConfig,
    type Timeslot
} from "./timeSelection2";
import type {FixedCheckInAndOut, SchedulingOption, Service} from "./types";
import {formatDate} from "$lib/ui/time-picker/types";
import {type IsoDate, isoDate, isoDateFns} from "@breezbook/packages-types";


function applySchedulingOptions(dayType: "start" | "end", date: IsoDate, schedulingOptions: SchedulingOption[]): DatePickConfig {
    for (const schedulingOption of schedulingOptions) {
        if ((schedulingOption._type === "start-days" && dayType === "start") || (schedulingOption._type === "end-days" && dayType === "end")) {
            const isListed = schedulingOption.constraint.daysOfTheWeek.includes(isoDateFns.dayOfWeek(date))
            if (!isListed) {
                return {date, disabled: justDisabled}
            }
        }
    }
    return {date}
}

function fixedCheckInAndOut(timeType: "start" | "end", schedulingOption: FixedCheckInAndOut): FixedTimeConfig {
    return {
        _type: 'fixed-time',
        time: timeType === "start" ? schedulingOption.checkInTime : schedulingOption.checkOutTime,
        timeLabel: timeType === "start" ? schedulingOption.checkInLabel : schedulingOption.checkOutLabel
    }
}

function getStartTimes(timeType: "start" | "end", startDays: DatePickConfig[], schedulingOptions: SchedulingOption[]): PickTimeConfig | FixedTimeConfig {
    for (const schedulingOption of schedulingOptions) {
        if (schedulingOption._type === "fixed-check-in-and-out") {
            return fixedCheckInAndOut(timeType, schedulingOption)
        }
        if (schedulingOption._type === "timeslot-selection") {
            const result: PickTimeConfig = {
                _type: 'pick-one',
                options: startDays.filter(d => d.disabled === undefined).map(dateConfig => {
                    const option: DayTimes = {
                        date: dateConfig.date, times: schedulingOption.times.map(time => {
                            const slot: Timeslot = {
                                _type: "time-slot",
                                start: time.slot.from,
                                end: time.slot.to,
                                label: time.description
                            }
                            return slot
                        })
                    }
                    return option
                })
            }
            return result
        }
    }
    throw new Error("No start times found")
}

export function toSlotSelectionConfig(month: Date, service: Service): SlotSelectionConfig {
    const startOfMonth = isoDate(formatDate(new Date(month.getFullYear(), month.getMonth(), 1)))
    const daysInMonth = isoDateFns.daysInMonth(startOfMonth)
    const startDays = daysInMonth.map(day => applySchedulingOptions("start", day, service.schedulingOptions))
    const startDate: PickDateConfig = {_type: 'pick-one', options: startDays}
    const startTime: PickTimeConfig | FixedTimeConfig = getStartTimes("start", startDays, service.schedulingOptions)
    return {startDate, startTime}
}
