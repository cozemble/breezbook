import {BookableTimeSlots, isoDate, time24, timeslotSpec} from "./types.js";
import express from 'express';

const AVAILABILITY: BookableTimeSlots = {
    "date": isoDate("2023-05-24"),
    "bookableSlots": [
        timeslotSpec(time24("09:00"), time24("13:00"), "09:00 - 13:00"),
        timeslotSpec(time24("13:00"), time24("17:00"), "13:00 - 17:00")]
};

export function handleSlotAvailability(_: express.Request, res: express.Response) {
    res.send([AVAILABILITY]);
}