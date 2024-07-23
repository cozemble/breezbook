import {
    type DatePickConfig,
    dayTimes,
    type FixedTimeConfig,
    type PickDateConfig,
    pickTimeConfig,
    type PickTimeConfig,
    type SlotSelectionConfig,
    timeSlot
} from "./timeSelection2";
import type {SchedulingOptions, Service} from "./types2";
import {formatDate} from "$lib/ui/time-picker/types";
import {type IsoDate, isoDate, isoDateFns} from "@breezbook/packages-types";


function applySchedulingOptions(dayType: "start" | "end", date: IsoDate, schedulingOptions: SchedulingOptions): DatePickConfig {
    const dateRules = dayType === "start" ? schedulingOptions.startDays : schedulingOptions.endDays
    if (!dateRules) {
        return {date}
    }
    throw new Error("Not implemented")
}

//
// function fixedCheckInAndOut(timeType: "start" | "end", schedulingOption: FixedCheckInAndOut): FixedTimeConfig {
//     return {
//         _type: 'fixed-time',
//         time: timeType === "start" ? schedulingOption.checkInTime : schedulingOption.checkOutTime,
//         timeLabel: timeType === "start" ? schedulingOption.checkInLabel : schedulingOption.checkOutLabel
//     }
// }
//
// function getStartTimes(timeType: "start" | "end", startDays: DatePickConfig[], schedulingOptions: SchedulingOption[]): PickTimeConfig | FixedTimeConfig {
//     for (const schedulingOption of schedulingOptions) {
//         if (schedulingOption._type === "fixed-check-in-and-out") {
//             return fixedCheckInAndOut(timeType, schedulingOption)
//         }
//         if (schedulingOption._type === "timeslot-selection") {
//             const result: PickTimeConfig = {
//                 _type: 'pick-one',
//                 options: startDays
//                     .filter(d => d.disabled === undefined)
//                     .map(dateConfig => {
//                         const option: DayTimes = {
//                             date: dateConfig.date, times: schedulingOption.times.map(time => {
//                                 const slot: Timeslot = {
//                                     _type: "time-slot",
//                                     start: time.slot.from,
//                                     end: time.slot.to,
//                                     label: time.description
//                                 }
//                                 return slot
//                             })
//                         }
//                         return option
//                     })
//             }
//             return result
//         }
//         if (schedulingOption._type === "start-time-selection") {
//             const times = time24Fns.range(schedulingOption.startTime, schedulingOption.endTime, schedulingOption.period)
//             return {
//                 _type: 'pick-one', options: startDays.filter(d => d.disabled === undefined).map(dateConfig => {
//                     const x: DayTimes = {
//                         date: dateConfig.date, times: times.map(time => {
//                             const slot: Time = {
//                                 _type: "time",
//                                 start: time,
//                             }
//                             return slot
//                         })
//                     }
//                     return x
//                 })
//             }
//         }
//         if(schedulingOption._type === "flexible-duration") {
//
//         }
//     }
//     throw new Error("No start times found")
// }

function getStartTimes(timeType: "start" | "end", startDays: DatePickConfig[], schedulingOptions: SchedulingOptions): PickTimeConfig | FixedTimeConfig {
    if (timeType === "end") {
        throw new Error("End times not supported yet")

    }
    const timeConfig = schedulingOptions.startTimes
    if (timeConfig.times._type === "timeslot-selection") {
        const slots = timeConfig.times.times.map(slot => timeSlot(slot.slot.from, slot.slot.to, slot.description))
        return pickTimeConfig(startDays.map(day => dayTimes(day.date, slots)))
    }
    throw new Error("No start times found")
}


export function toSlotSelectionConfig(month: Date, service: Service): SlotSelectionConfig {
    const startOfMonth = isoDate(formatDate(new Date(month.getFullYear(), month.getMonth(), 1)))
    const daysInMonth = isoDateFns.daysInMonth(startOfMonth)
    const startDays = daysInMonth.map(day => applySchedulingOptions("start", day, service.schedulingOptions))
    const enabledDays = startDays.filter(day => !day.disabled)
    const startDate: PickDateConfig = {_type: 'pick-one', options: startDays}
    const startTime: PickTimeConfig | FixedTimeConfig = getStartTimes("start", enabledDays, service.schedulingOptions)
    return {startDate, startTime}
}
