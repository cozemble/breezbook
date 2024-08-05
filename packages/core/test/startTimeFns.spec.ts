import { describe, expect, test } from 'vitest';
import { dayAndTimePeriod, isoDateFns, minutes, time24, timePeriod, timezones } from '@breezbook/packages-date-time';
import { startTimeFns } from '../src/index.js';
import { exactTimeAvailability } from '@breezbook/packages-types';

describe('fitAvailability', () => {
	test('drops time if it extends beyond end of availability', () => {
		const start = time24('15:30');
		const end = time24('16:00');
		const duration = minutes(60);

		const result = startTimeFns.fitAvailability([exactTimeAvailability(start)], duration, [dayAndTimePeriod(isoDateFns.today(timezones.utc), timePeriod(start, end))]);

		expect(result).toHaveLength(0);
	});
});