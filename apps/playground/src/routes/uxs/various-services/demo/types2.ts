import {duration, minutes, time24, type TwentyFourHourClockTime} from "@breezbook/packages-types";
import {timeslotSpec, type TimeslotSpec} from "@breezbook/packages-core";

export interface SchedulingOptions {

}

export interface Service {
    id: string
    name: string
    description: string
    schedulingOptions: SchedulingOptions
}

interface TimeslotSelection {
    _type: 'timeslot-selection'
    times: TimeslotSpec[]
}

function timeslotSelection(times: TimeslotSpec[]): TimeslotSelection {
    return {_type: 'timeslot-selection', times}
}

function timeslot(from: TwentyFourHourClockTime, to: TwentyFourHourClockTime, description: string): TimeslotSpec {
    return timeslotSpec(from, to, description)
}


const mobileCarWash: Service = {
    id: "mobile-car-wash",
    name: "Mobile Car Wash",
    description: "We come to you",
    schedulingOptions: {
        startTimes: {
            times: timeslotSelection([
                timeslot(time24("09:00"), time24("10:00"), "Morning slot"),
                timeslot(time24("10:00"), time24("11:00"), "Mid-morning slot"),
                timeslot(time24("13:00"), time24("14:00"), "Afternoon slot"),
                timeslot(time24("14:00"), time24("15:00"), "Mid-afternoon slot"),
            ])
        }
    }
}

// const individualDogWalk: Service = {
//     id: "individual-dog-walk",
//     name: "Individual Dog Walk",
//     description: "One-on-one attention",
//     schedulingOptions: {
//         startTimes: {
//             times: anyTimeBetween(
//                 time24("09:00"),
//                 time24("17:00"),
//                 duration(minutes(30)),
//                 period(minutes(60)))
//         }
//     }
// }