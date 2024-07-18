import {type IsoDate, isoDate, time24, type TwentyFourHourClockTime} from "@breezbook/packages-types";

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

const justDisabled: Disabled = {disabled: true};

interface PickDateConfig {
    type: 'pick-one';
    options: { date: IsoDate, disabled?: Disabled }[];
}

interface Time {
    type: "time";
    start: TwentyFourHourClockTime;
    disabled?: Disabled;
    capacity?: Capacity;
    price?: PriceLabel;
}

interface Timeslot {
    type: "time-slot";
    start: TwentyFourHourClockTime;
    end: TwentyFourHourClockTime;
    label: string;
    disabled?: Disabled;
    capacity?: Capacity;
    price?: PriceLabel;
}

interface DayTimes {
    date: IsoDate;
    times: (Time | Timeslot)[];
}

interface PickTimeConfig {
    type: 'pick-one';
    options: DayTimes[];
}


interface EndDateConfig {
    minDays?: number;
    maxDays?: number;
    options: PickDateConfig;
}

interface EndTimeConfig {
    minDurationMinutes?: number;
    maxDurationMinutes?: number;
    time: PickTimeConfig;
}

interface FixedTimeConfig {
    type: 'fixed-time';
    time: TwentyFourHourClockTime;
    timeLabel: string;
}

interface RelativeEnd {
    type: 'relative-end';
    numDays: number;
}

interface SlotSelectionConfig {
    startDate: PickDateConfig;
    startTime: PickTimeConfig | FixedTimeConfig;
    endTime?: EndTimeConfig | FixedTimeConfig;
    endDate?: EndDateConfig | RelativeEnd
}

const equipmentRental: SlotSelectionConfig = {
    startDate: {
        type: "pick-one", options: [
            {date: isoDate('2023-06-01')},
            {date: isoDate('2023-06-02')},
            {date: isoDate('2023-06-03'), disabled: justDisabled},
            {date: isoDate('2023-06-04')},
        ]
    },
    startTime: {
        type: "pick-one", options: [
            {
                date: isoDate('2023-06-01'), times: [
                    {type: "time", start: time24('08:00')},
                    {type: "time", start: time24('10:00'), disabled: justDisabled},
                    {type: "time", start: time24('12:00')},
                ]
            },
            {
                date: isoDate('2023-06-02'), times: [
                    {type: "time", start: time24('08:00')},
                    {type: "time", start: time24('10:00')},
                    {type: "time", start: time24('12:00')},
                ]
            },
            {
                date: isoDate('2023-06-04'), times: [
                    {type: "time", start: time24('08:00')},
                    {type: "time", start: time24('10:00')},
                    {type: "time", start: time24('12:00')},
                ]
            }
        ]
    },
    endTime: {
        minDurationMinutes: 120,
        time: {
            type: "pick-one", options: [
                {
                    date: isoDate('2023-06-01'), times: [
                        {type: "time", start: time24('08:00')},
                        {type: "time", start: time24('10:00')},
                        {type: "time", start: time24('12:00')},
                    ]
                },
                {
                    date: isoDate('2023-06-02'), times: [
                        {type: "time", start: time24('08:00')},
                        {type: "time", start: time24('10:00')},
                        {type: "time", start: time24('12:00')},
                    ]
                },
                {
                    date: isoDate('2023-06-04'), times: [
                        {type: "time", start: time24('08:00')},
                        {type: "time", start: time24('10:00')},
                        {type: "time", start: time24('12:00')},
                    ]
                }
            ]
        }
    },
    endDate: {
        minDays: 1,
        maxDays: 7,
        options: {
            type: "pick-one", options: [
                {date: isoDate('2023-06-01')},
                {date: isoDate('2023-06-02')},
                {date: isoDate('2023-06-03'), disabled: justDisabled},
                {date: isoDate('2023-06-04')},
            ]
        }
    }
}

const carwash: SlotSelectionConfig = {
    startDate: {
        type: "pick-one", options: [
            {date: isoDate('2023-06-01')},
            {date: isoDate('2023-06-02')},
            {date: isoDate('2023-06-03'), disabled: justDisabled},
            {date: isoDate('2023-06-04')},
        ]
    },
    startTime: {
        type: "pick-one", options: [
            {
                date: isoDate('2023-06-01'), times: [
                    {type: "time-slot", start: time24('08:00'), end: time24('10:00'), label: 'Morning'},
                    {type: "time-slot", start: time24('10:00'), end: time24('12:00'), label: 'Late Morning', disabled: justDisabled},
                    {type: "time-slot", start: time24('12:00'), end: time24('14:00'), label: 'Afternoon'},
                ]
            },
            {
                date: isoDate('2023-06-02'), times: [
                    {type: "time-slot", start: time24('08:00'), end: time24('10:00'), label: 'Morning'},
                    {type: "time-slot", start: time24('10:00'), end: time24('12:00'), label: 'Late Morning'},
                    {type: "time-slot", start: time24('12:00'), end: time24('14:00'), label: 'Afternoon'},
                ]
            },
            {
                date: isoDate('2023-06-04'), times: [
                    {type: "time-slot", start: time24('08:00'), end: time24('10:00'), label: 'Morning'},
                    {type: "time-slot", start: time24('10:00'), end: time24('12:00'), label: 'Late Morning'},
                    {type: "time-slot", start: time24('12:00'), end: time24('14:00'), label: 'Afternoon'},
                ]
            },
        ]
    }
}

const oneDayPetBoarding: SlotSelectionConfig = {
    startDate: {
        type: "pick-one", options: [
            {date: isoDate('2023-06-01')},
            {date: isoDate('2023-06-02')},
            {date: isoDate('2023-06-03'), disabled: justDisabled},
            {date: isoDate('2023-06-04')},
        ]
    },
    startTime: {
        type: "fixed-time", time: time24('09:00'), timeLabel: 'Drop off'
    },
    endTime: {
        type: "fixed-time", time: time24('17:00'), timeLabel: 'Pick up'
    }
}

const multiDayPetBoardingFixedDropOffAndPickUp: SlotSelectionConfig = {
    startDate: {
        type: "pick-one", options: [
            {date: isoDate('2023-06-01')},
            {date: isoDate('2023-06-02')},
            {date: isoDate('2023-06-03'), disabled: justDisabled},
            {date: isoDate('2023-06-04')},
        ]
    },
    startTime: {
        type: "fixed-time", time: time24('09:00'), timeLabel: 'Drop off'
    },
    endTime: {
        type: "fixed-time", time: time24('17:00'), timeLabel: 'Pick up'
    },
    endDate: {
        minDays: 1,
        maxDays: 14,
        options: {
            type: "pick-one", options: [
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
        type: "pick-one", options: [
            {date: isoDate('2023-06-01')},
            {date: isoDate('2023-06-02')},
            {date: isoDate('2023-06-03'), disabled: justDisabled},
            {date: isoDate('2023-06-04')},
        ]
    },
    startTime: {
        type: "pick-one", options: [
            {
                date: isoDate('2023-06-01'), times: [
                    {type: "time", start: time24('08:00')},
                    {type: "time", start: time24('10:00')},
                    {type: "time", start: time24('12:00')},
                ]
            },
            {
                date: isoDate('2023-06-02'), times: [
                    {type: "time", start: time24('08:00')},
                    {type: "time", start: time24('10:00')},
                    {type: "time", start: time24('12:00')},
                ]
            },
            {
                date: isoDate('2023-06-04'), times: [
                    {type: "time", start: time24('08:00')},
                    {type: "time", start: time24('10:00')},
                    {type: "time", start: time24('12:00')},
                ]
            }
        ]
    },
    endDate: {
        options: {
            type: "pick-one", options: [
                {date: isoDate('2023-06-01')},
                {date: isoDate('2023-06-02')},
                {date: isoDate('2023-06-03'), disabled: justDisabled},
                {date: isoDate('2023-06-04')},
            ]
        }
    },
    endTime: {
        minDurationMinutes: 120,
        time: {
            type: "pick-one", options: [
                {
                    date: isoDate('2023-06-01'), times: [
                        {type: "time", start: time24('08:00')},
                        {type: "time", start: time24('10:00')},
                        {type: "time", start: time24('12:00')},
                    ]
                },
                {
                    date: isoDate('2023-06-02'), times: [
                        {type: "time", start: time24('08:00')},
                        {type: "time", start: time24('10:00')},
                        {type: "time", start: time24('12:00')},
                    ]
                },
                {
                    date: isoDate('2023-06-04'), times: [
                        {type: "time", start: time24('08:00')},
                        {type: "time", start: time24('10:00')},
                        {type: "time", start: time24('12:00')},
                    ]
                }
            ]
        }
    }
}

const hotelRoom: SlotSelectionConfig = {
    startDate: {
        type: "pick-one", options: [
            {date: isoDate('2023-06-01')},
            {date: isoDate('2023-06-02')},
            {date: isoDate('2023-06-03'), disabled: justDisabled},
            {date: isoDate('2023-06-04')},
        ]
    },
    endDate: {
        minDays: 1,
        maxDays: 14,
        options: {
            type: "pick-one", options: [
                {date: isoDate('2023-06-01')},
                {date: isoDate('2023-06-02')},
                {date: isoDate('2023-06-03'), disabled: justDisabled},
                {date: isoDate('2023-06-04')},
            ]
        }
    },
    startTime: {
        type: "fixed-time", time: time24('15:00'), timeLabel: 'Check-in'
    },
    endTime: {
        type: "fixed-time", time: time24('11:00'), timeLabel: 'Check-out'
    }
}

const summerCamp: SlotSelectionConfig = {
    startDate: {
        type: "pick-one", options: [
            {date: isoDate('2023-06-01')}, // starting each week
            {date: isoDate('2023-06-08')},
            {date: isoDate('2023-06-15'), disabled: justDisabled},
            {date: isoDate('2023-06-22')},
        ]
    },
    startTime: {
        type: "fixed-time", time: time24('09:00'), timeLabel: 'Drop off'
    },
    endTime: {
        type: "fixed-time", time: time24('17:00'), timeLabel: 'Pick up'
    },
    endDate: {
        type: "relative-end",
        numDays: 5
    }
}