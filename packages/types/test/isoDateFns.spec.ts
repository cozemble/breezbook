import { isoDate, isoDateFns } from '../src/index.js';
import { test, expect } from 'vitest';
import { utc } from '../src/dayjs.js';

test('defaults to today', () => {
	const today = isoDate();
	expect(today.value).toEqual(utc().format('YYYY-MM-DD'));
});

test('can add days to a date', () => {
	const added = isoDateFns.addDays(isoDate('2024-03-31'), 1);
	expect(added).toEqual(isoDate('2024-04-01'));
});

test('can list days between two dates', () => {
	const fromDate = isoDate('2024-03-31');
	const toDate = isoDate('2024-04-02');
	const days = isoDateFns.listDays(fromDate, toDate);
	expect(days).toEqual([fromDate, isoDate('2024-04-01'), toDate]);
});
