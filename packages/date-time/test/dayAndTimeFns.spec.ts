import { describe, expect, test } from 'vitest';
import { dayAndTime, dayAndTimeFns, days, duration, hours, isoDate, minutes, time24 } from '../src/index.js';

describe('dayAndTimeFns.addDuration', () => {
	const initialTime = dayAndTime(isoDate('2024-03-31'), time24('12:00'));

	test('add zero duration ok', () => {
		expect(dayAndTimeFns.addDuration(initialTime, duration(minutes(0)))).toEqual(initialTime);
	});

	test('add positive duration ok', () => {
		expect(dayAndTimeFns.addDuration(initialTime, duration(minutes(30)))).toEqual(dayAndTime(isoDate('2024-03-31'), time24('12:30')));
	});

	test('add negative duration ok', () => {
		expect(dayAndTimeFns.addDuration(initialTime, duration(minutes(-30)))).toEqual(dayAndTime(isoDate('2024-03-31'), time24('11:30')));
	});

	test('add duration that touches midnight ok', () => {
		expect(dayAndTimeFns.addDuration(initialTime, duration(minutes(720)))).toEqual(dayAndTime(isoDate('2024-04-01'), time24('00:00')));
	});

	test('add duration that crosses midnight ok', () => {
		expect(dayAndTimeFns.addDuration(initialTime, duration(minutes(1440)))).toEqual(dayAndTime(isoDate('2024-04-01'), time24('12:00')));
	});

	test('add duration that crosses multiple midnights ok', () => {
		expect(dayAndTimeFns.addDuration(initialTime, duration(minutes(4320)))).toEqual(dayAndTime(isoDate('2024-04-03'), time24('12:00')));
	});

	test('can add hour units', () => {
		expect(dayAndTimeFns.addDuration(initialTime, duration(hours(1)))).toEqual(dayAndTime(isoDate('2024-03-31'), time24('13:00')));
	});

	test('can add day units', () => {
		expect(dayAndTimeFns.addDuration(initialTime, duration(days(1)))).toEqual(dayAndTime(isoDate('2024-04-01'), time24('12:00')));
	});

});