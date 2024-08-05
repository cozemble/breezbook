import {days, duration, hours, minutes, time24} from "@breezbook/packages-date-time";
import {
    anyTimeBetween,
    daysOfWeek,
    durationRange,
    fixedLength,
    fixedTime,
    multiDayScheduling,
    period,
    pickTime,
    type ScheduleConfig,
    singleDayScheduling,
    startTimes,
    timeRange,
    timeslot,
    timeslotSelection,
    variableDurationConfig,
    variableLength
} from "./scheduleConfig";


export interface Service {
    id: string
    name: string
    description: string
    scheduleConfig: ScheduleConfig
}


// BEGIN-CODE: mobile-car-wash
const mobileCarWash: Service = {
    id: "mobile-car-wash",
    name: "Mobile Car Wash",
    description: "We come to you",
    scheduleConfig:
        singleDayScheduling(
            timeslotSelection(
                [
                    timeslot(time24("09:00"), time24("11:00"), "Morning"),
                    timeslot(time24("11:00"), time24("13:00"), "Midday"),
                    timeslot(time24("13:00"), time24("15:00"), "Afternoon"),
                    timeslot(time24("15:00"), time24("17:00"), "Late afternoon")]))
}
// END-CODE: mobile-car-wash

// BEGIN-CODE: group-dog-walk
const groupDogWalk: Service = {
    id: "group-dog-walk",
    name: "Group Dog Walk",
    description: "Socialize with other dogs",
    scheduleConfig:
        singleDayScheduling(
            timeslotSelection(
                [
                    timeslot(time24("09:00"), time24("10:00"), "Morning slot"),
                    timeslot(time24("17:00"), time24("18:00"), "Evening slot")]))
}
// END-CODE: group-dog-walk

// BEGIN-CODE: individual-dog-walk
const individualDogWalkWithFixedTimeChoices: Service = {
    id: "individual-dog-walk",
    name: "Individual Dog Walk",
    description: "One-on-one attention",
    scheduleConfig:
        singleDayScheduling(
            variableDurationConfig(
                duration(minutes(60)),
                pickTime(
                    timeRange(
                        time24("10:00"),
                        time24("16:00"),
                        period(minutes(30))))))
}
// END-CODE: individual-dog-walk

// BEGIN-CODE: individual-dog-walk-with-selectable-time-range
const individualDogWalkWithToTheMinuteSelectableTime: Service = {
    id: "individual-dog-walk-with-selectable-time-range",
    name: "Individual Dog Walk with Selectable Time Range",
    description: "One-on-one attention",
    scheduleConfig:
        singleDayScheduling(
            variableDurationConfig(
                durationRange(minutes(30), minutes(120)),
                anyTimeBetween(time24("09:00"), time24("17:00"))))
}
// END-CODE: individual-dog-walk-with-selectable-time-range

// BEGIN-CODE: pet-boarding-for-one-day-with-fixed-check-in-and-out
const petBoardingForOneDayWithFixedCheckInAndOut: Service = {
    id: "pet-boarding-for-one-day-with-fixed-check-in-and-out",
    name: "Pet Boarding For One Day With Fixed Check-In And Out",
    description: "For one day",
    scheduleConfig:
        singleDayScheduling(
            fixedTime(
                time24("09:00"), "Drop-off",
                time24("17:00"), "Pick-up"))
}
// END-CODE: pet-boarding-for-one-day-with-fixed-check-in-and-out

// BEGIN-CODE: pet-boarding-for-one-day-with-selectable-check-in-and-out
const petBoardingForOneDayWithSelectableCheckInAndOut: Service = {
    id: "pet-boarding-for-one-day-with-selectable-check-in-and-out",
    name: "Pet Boarding For One Day With Selectable Check-In And Out",
    description: "For one day",
    scheduleConfig:
        singleDayScheduling(
            variableDurationConfig(
                durationRange(hours(4), hours(8)),
                anyTimeBetween(time24("09:00"), time24("17:00"))))
}
// END-CODE: pet-boarding-for-one-day-with-selectable-check-in-and-out

// BEGIN-CODE: pet-boarding-for-many-days-with-fixed-times
const petBoardingForManyDaysWithFixedTimes: Service = {
    id: "pet-boarding-for-many-days-with-fixed-times",
    name: "Pet Boarding For Many Days With Fixed Times",
    description: "For many days",
    scheduleConfig:
        multiDayScheduling(
            variableLength(days(1), days(7)),
            startTimes(
                fixedTime(time24("09:00"), "Drop-off",
                    time24("17:00"), "Pick-up")))
}
// END-CODE: pet-boarding-for-many-days-with-fixed-times

// BEGIN-CODE: pet-boarding-for-many-days-with-selectable-times
const petBoardingForManyDaysWithSelectableTimes: Service = {
    id: "pet-boarding-for-many-days-with-selectable-times",
    name: "Pet Boarding For Many Days With Selectable Times",
    description: "For many days",
    scheduleConfig: multiDayScheduling(
        variableLength(days(1), days(7)),
        startTimes(anyTimeBetween(time24("09:00"), time24("17:00"))))
}
// END-CODE: pet-boarding-for-many-days-with-selectable-times

// BEGIN-CODE: hotel-room
const hotelRoom: Service = {
    id: "hotel-room",
    name: "Hotel Room",
    description: "Stay overnight",
    scheduleConfig: multiDayScheduling(
        variableLength(days(1), days(365)),
        startTimes(
            fixedTime(time24("15:00"), "Check-in",
                time24("11:00"), "Check-out")))
}
// END-CODE: hotel-room

// BEGIN-CODE: hotel-room-with-late-checkout-at-weekends
const hotelRoomWithLateCheckoutAtWeekends: Service = {
    id: "hotel-room-with-late-checkout-at-weekends",
    name: "Hotel Room with late checkout at weekends",
    description: "Stay overnight",
    scheduleConfig: multiDayScheduling(
        variableLength(days(1), days(365)),
        startTimes(fixedTime(time24("15:00"), "Check-in",
                time24("11:00"), "Check-out"),
            {
                weekend: fixedTime(time24("15:00"), "Check-in",
                    time24("14:00"), "Check-out")
            }))
}
// END-CODE: hotel-room-with-late-checkout-at-weekends

// BEGIN-CODE: summer-camp
const summerCamp: Service = {
    id: "summer-camp",
    name: "Summer Camp",
    description: "For kids",
    scheduleConfig: multiDayScheduling(
        fixedLength(days(5)),
        startTimes(
            fixedTime(
                time24("09:00"), "Drop-off",
                time24("17:00"), "Pick-up")),
        null,
        [daysOfWeek("Monday")])
}
// END-CODE: summer-camp

// BEGIN-CODE: equipment-rental-with-flexible-time
const equipmentRentalWithFlexibleTime: Service = {
    id: "equipment-rental-with-flexible-time",
    name: "Equipment Rental with flexible time",
    description: "Rent equipment",
    scheduleConfig: multiDayScheduling(
        variableLength(days(1), days(7)),
        startTimes(
            anyTimeBetween(time24("09:00"), time24("17:00"))))
}
// END-CODE: equipment-rental-with-flexible-time

// BEGIN-CODE: equipment-rental-with-controlled-times
const equipmentRentalWithControlledTimes: Service = {
    id: "equipment-rental-with-controlled-times",
    name: "Equipment Rental with controlled times",
    description: "Rent equipment",
    scheduleConfig: multiDayScheduling(
        variableLength(days(1), days(7)),
        startTimes(
            pickTime(
                timeRange(
                    time24("09:00"),
                    time24("17:00"),
                    period(minutes(60))))))
}
// END-CODE: equipment-rental-with-controlled-times

// BEGIN-CODE: yacht-charter
const yachtCharter: Service = {
    id: "yacht-charter",
    name: "Yacht Charter",
    description: "Charter a yacht",
    scheduleConfig: multiDayScheduling(
        variableLength(days(7), days(28)),
        startTimes(
            fixedTime(
                time24("15:00"), "Collect",
                time24("12:00"), "Return")),
        null,
        [daysOfWeek("Saturday")],
        [daysOfWeek("Saturday")])
}
// END-CODE: yacht-charter

export const allConfigs = [
    {service: mobileCarWash},
    {service: groupDogWalk},
    {service: individualDogWalkWithFixedTimeChoices},
    {service: petBoardingForOneDayWithFixedCheckInAndOut},
    {service: petBoardingForOneDayWithSelectableCheckInAndOut},
    {service: petBoardingForManyDaysWithFixedTimes},
    {service: hotelRoom},
    {service: hotelRoomWithLateCheckoutAtWeekends},
    {service: summerCamp},
    {service: equipmentRentalWithFlexibleTime},
    {service: equipmentRentalWithControlledTimes},
    {service: yachtCharter}
]