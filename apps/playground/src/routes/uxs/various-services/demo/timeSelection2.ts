import {type IsoDate, isoDate, time24, type TwentyFourHourClockTime} from "@breezbook/packages-types";
import {allServicesMap} from "./types";

interface Disabled {
    disabled?: boolean;
    reason?: string;
}

interface Capacity {
    max: number;
    remaining: number;
}

interface PriceLabel {
    label: string;
}

export const justDisabled: Disabled = {disabled: true};

export interface DatePickConfig {
    date: IsoDate
    disabled?: Disabled
}

export interface PickDateConfig {
    _type: 'pick-one';
    options: DatePickConfig[];
}

export interface Time {
    _type: "time";
    start: TwentyFourHourClockTime;
    disabled?: Disabled;
    capacity?: Capacity;
    price?: PriceLabel;
}

export interface Timeslot {
    _type: "time-slot";
    start: TwentyFourHourClockTime;
    end: TwentyFourHourClockTime;
    label: string;
    disabled?: Disabled;
    capacity?: Capacity;
    price?: PriceLabel;
}

export function timeSlot(start: TwentyFourHourClockTime, end: TwentyFourHourClockTime, label: string): Timeslot {
    return {_type: "time-slot", start, end, label}
}

export interface DayTimes {
    date: IsoDate;
    times: (Time | Timeslot)[];
}

export function dayTimes(date: IsoDate, times: (Time | Timeslot)[]): DayTimes {
    return {date, times}
}

export interface PickTimeConfig {
    _type: 'pick-one';
    options: DayTimes[];
}

export function pickTimeConfig(options: DayTimes[]): PickTimeConfig {
    return {_type: 'pick-one', options}
}


interface EndDateConfig {
    _type: 'end-date-config';
    minDays?: number;
    maxDays?: number;
    options: PickDateConfig;
}

interface EndTimeConfig {
    _type: 'end-time';
    minDurationMinutes?: number;
    maxDurationMinutes?: number;
    time: PickTimeConfig;
}

export interface FixedTimeConfig {
    _type: 'fixed-time';
    time: TwentyFourHourClockTime;
    timeLabel: string;
}

interface RelativeEnd {
    _type: 'relative-end';
    numDays: number;
}

export interface SlotSelectionConfig {
    startDate: PickDateConfig;
    startTime: PickTimeConfig | FixedTimeConfig;
    endTime?: EndTimeConfig | FixedTimeConfig;
    endDate?: EndDateConfig | RelativeEnd
}

export const equipmentRental: SlotSelectionConfig = {
    startDate: {
        _type: "pick-one", options: [
            {date: isoDate('2023-06-01')},
            {date: isoDate('2023-06-02')},
            {date: isoDate('2023-06-03'), disabled: justDisabled},
            {date: isoDate('2023-06-04')},
        ]
    },
    startTime: {
        _type: "pick-one", options: [
            {
                date: isoDate('2023-06-01'), times: [
                    {_type: "time", start: time24('08:00')},
                    {_type: "time", start: time24('10:00'), disabled: justDisabled},
                    {_type: "time", start: time24('12:00')},
                ]
            },
            {
                date: isoDate('2023-06-02'), times: [
                    {_type: "time", start: time24('08:00')},
                    {_type: "time", start: time24('10:00')},
                    {_type: "time", start: time24('12:00')},
                ]
            },
            {
                date: isoDate('2023-06-04'), times: [
                    {_type: "time", start: time24('08:00')},
                    {_type: "time", start: time24('10:00')},
                    {_type: "time", start: time24('12:00')},
                ]
            }
        ]
    },
    endTime: {
        _type: "end-time",
        minDurationMinutes: 120,
        time: {
            _type: "pick-one", options: [
                {
                    date: isoDate('2023-06-01'), times: [
                        {_type: "time", start: time24('08:00')},
                        {_type: "time", start: time24('09:00')},
                        {_type: "time", start: time24('10:00')},
                        {_type: "time", start: time24('11:00')},
                        {_type: "time", start: time24('12:00')},
                        {_type: "time", start: time24('13:00')},
                        {_type: "time", start: time24('14:00')},
                        {_type: "time", start: time24('15:00')},
                        {_type: "time", start: time24('16:00')},
                        {_type: "time", start: time24('17:00')},
                    ]
                },
                {
                    date: isoDate('2023-06-02'), times: [
                        {_type: "time", start: time24('08:00')},
                        {_type: "time", start: time24('10:00')},
                        {_type: "time", start: time24('12:00')},
                    ]
                },
                {
                    date: isoDate('2023-06-04'), times: [
                        {_type: "time", start: time24('08:00')},
                        {_type: "time", start: time24('10:00')},
                        {_type: "time", start: time24('12:00')},
                    ]
                }
            ]
        }
    },
    endDate: {
        _type: 'end-date-config',
        minDays: 1,
        maxDays: 7,
        options: {
            _type: "pick-one", options: [
                {date: isoDate('2023-06-01')},
                {date: isoDate('2023-06-02')},
                {date: isoDate('2023-06-03'), disabled: justDisabled},
                {date: isoDate('2023-06-04')},
            ]
        }
    }
}

export const carwash: SlotSelectionConfig = {
    startDate: {
        _type: "pick-one", options: [
            {date: isoDate('2023-06-01')},
            {date: isoDate('2023-06-02')},
            {date: isoDate('2023-06-03'), disabled: justDisabled},
            {date: isoDate('2023-06-04')},
        ]
    },
    startTime: {
        _type: "pick-one", options: [
            {
                date: isoDate('2023-06-01'), times: [
                    {_type: "time-slot", start: time24('08:00'), end: time24('10:00'), label: 'Morning'},
                    {
                        _type: "time-slot",
                        start: time24('10:00'),
                        end: time24('12:00'),
                        label: 'Late Morning',
                        disabled: justDisabled
                    },
                    {_type: "time-slot", start: time24('12:00'), end: time24('14:00'), label: 'Afternoon'},
                ]
            },
            {
                date: isoDate('2023-06-02'), times: [
                    {_type: "time-slot", start: time24('08:00'), end: time24('10:00'), label: 'Morning'},
                    {_type: "time-slot", start: time24('10:00'), end: time24('12:00'), label: 'Late Morning'},
                    {_type: "time-slot", start: time24('12:00'), end: time24('14:00'), label: 'Afternoon'},
                ]
            },
            {
                date: isoDate('2023-06-04'), times: [
                    {_type: "time-slot", start: time24('08:00'), end: time24('10:00'), label: 'Morning'},
                    {_type: "time-slot", start: time24('10:00'), end: time24('12:00'), label: 'Late Morning'},
                    {_type: "time-slot", start: time24('12:00'), end: time24('14:00'), label: 'Afternoon'},
                ]
            },
        ]
    }
}

export const oneDayPetBoarding: SlotSelectionConfig = {
    startDate: {
        _type: "pick-one", options: [
            {date: isoDate('2023-06-01')},
            {date: isoDate('2023-06-02')},
            {date: isoDate('2023-06-03'), disabled: justDisabled},
            {date: isoDate('2023-06-04')},
        ]
    },
    startTime: {
        _type: "fixed-time", time: time24('09:00'), timeLabel: 'Drop off'
    },
    endTime: {
        _type: "fixed-time", time: time24('17:00'), timeLabel: 'Pick up'
    }
}

const multiDayPetBoardingFixedDropOffAndPickUp: SlotSelectionConfig = {
    startDate: {
        _type: "pick-one", options: [
            {date: isoDate('2023-06-01')},
            {date: isoDate('2023-06-02')},
            {date: isoDate('2023-06-03'), disabled: justDisabled},
            {date: isoDate('2023-06-04')},
        ]
    },
    startTime: {
        _type: "fixed-time", time: time24('09:00'), timeLabel: 'Drop off'
    },
    endTime: {
        _type: "fixed-time", time: time24('17:00'), timeLabel: 'Pick up'
    },
    endDate: {
        _type: 'end-date-config',
        minDays: 1,
        maxDays: 14,
        options: {
            _type: "pick-one", options: [
                {date: isoDate('2023-06-01')},
                {date: isoDate('2023-06-02')},
                {date: isoDate('2023-06-03'), disabled: justDisabled},
                {date: isoDate('2023-06-04')},
            ]
        }
    }
}

const multiDayPetBoardingFlexibleDropOffAndPickUp: SlotSelectionConfig = {
    startDate: {
        _type: "pick-one", options: [
            {date: isoDate('2023-06-01')},
            {date: isoDate('2023-06-02')},
            {date: isoDate('2023-06-03'), disabled: justDisabled},
            {date: isoDate('2023-06-04')},
        ]
    },
    startTime: {
        _type: "pick-one", options: [
            {
                date: isoDate('2023-06-01'), times: [
                    {_type: "time", start: time24('08:00')},
                    {_type: "time", start: time24('10:00')},
                    {_type: "time", start: time24('12:00')},
                ]
            },
            {
                date: isoDate('2023-06-02'), times: [
                    {_type: "time", start: time24('08:00')},
                    {_type: "time", start: time24('10:00')},
                    {_type: "time", start: time24('12:00')},
                ]
            },
            {
                date: isoDate('2023-06-04'), times: [
                    {_type: "time", start: time24('08:00')},
                    {_type: "time", start: time24('10:00')},
                    {_type: "time", start: time24('12:00')},
                ]
            }
        ]
    },
    endDate: {
        _type: 'end-date-config',
        options: {
            _type: "pick-one", options: [
                {date: isoDate('2023-06-01')},
                {date: isoDate('2023-06-02')},
                {date: isoDate('2023-06-03'), disabled: justDisabled},
                {date: isoDate('2023-06-04')},
            ]
        }
    },
    endTime: {
        _type: "end-time",
        minDurationMinutes: 120,
        time: {
            _type: "pick-one", options: [
                {
                    date: isoDate('2023-06-01'), times: [
                        {_type: "time", start: time24('08:00')},
                        {_type: "time", start: time24('10:00')},
                        {_type: "time", start: time24('12:00')},
                    ]
                },
                {
                    date: isoDate('2023-06-02'), times: [
                        {_type: "time", start: time24('08:00')},
                        {_type: "time", start: time24('10:00')},
                        {_type: "time", start: time24('12:00')},
                    ]
                },
                {
                    date: isoDate('2023-06-04'), times: [
                        {_type: "time", start: time24('08:00')},
                        {_type: "time", start: time24('10:00')},
                        {_type: "time", start: time24('12:00')},
                    ]
                }
            ]
        }
    }
}

export const hotelRoom: SlotSelectionConfig = {
    startDate: {
        _type: "pick-one", options: [
            {date: isoDate('2023-06-01')},
            {date: isoDate('2023-06-02')},
            {date: isoDate('2023-06-03'), disabled: justDisabled},
            {date: isoDate('2023-06-04')},
        ]
    },
    endDate: {
        _type: 'end-date-config',
        minDays: 1,
        maxDays: 14,
        options: {
            _type: "pick-one", options: [
                {date: isoDate('2023-06-01')},
                {date: isoDate('2023-06-02')},
                {date: isoDate('2023-06-03'), disabled: justDisabled},
                {date: isoDate('2023-06-04')},
            ]
        }
    },
    startTime: {
        _type: "fixed-time", time: time24('15:00'), timeLabel: 'Check-in'
    },
    endTime: {
        _type: "fixed-time", time: time24('11:00'), timeLabel: 'Check-out'
    }
}

export const summerCamp: SlotSelectionConfig = {
    startDate: {
        _type: "pick-one", options: [
            {date: isoDate('2023-06-01')}, // starting each week
            {date: isoDate('2023-06-08')},
            {date: isoDate('2023-06-15'), disabled: justDisabled},
            {date: isoDate('2023-06-22')},
        ]
    },
    startTime: {
        _type: "fixed-time", time: time24('09:00'), timeLabel: 'Drop off'
    },
    endTime: {
        _type: "fixed-time", time: time24('17:00'), timeLabel: 'Pick up'
    },
    endDate: {
        _type: "relative-end",
        numDays: 5
    }
}

export const allConfigs = [
    {name: "Equipment Rental", config: equipmentRental, definition: allServicesMap.equipmentRental},
    {name: "Carwash", config: carwash, definition: allServicesMap.mobileCarwash},
    {
        name: "One Day Pet Boarding",
        config: oneDayPetBoarding,
        definition: allServicesMap.petBoardingForOneDayWithFixedTimes
    },
    {
        name: "Multi Day Pet Boarding (Fixed Drop Off and Pick Up)",
        config: multiDayPetBoardingFixedDropOffAndPickUp,
        definition: allServicesMap.petBoardingForManyDaysWithFixedTimes
    },
    {
        name: "Multi Day Pet Boarding (Flexible Drop Off and Pick Up)",
        config: multiDayPetBoardingFlexibleDropOffAndPickUp,
        definition: allServicesMap.petBoardingForManyDaysWithFlexibleTimes
    },
    {name: "Hotel Room", config: hotelRoom, definition: allServicesMap.hotelRoom},
    {name: "Summer Camp", config: summerCamp, definition: allServicesMap.summerCamp},

]