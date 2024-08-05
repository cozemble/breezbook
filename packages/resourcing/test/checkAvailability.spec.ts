import { describe, expect, test } from 'vitest';
import { resourcing } from '../src/index.js';
import { capacity, resourceId, resourceType } from '@breezbook/packages-types';
import checkAvailability = resourcing.checkAvailability;
import resource = resourcing.resource;
import timeslotFns = resourcing.timeslotFns;
import anySuitableResource = resourcing.anySuitableResource;
import service = resourcing.service;
import resourceRequirements = resourcing.resourceRequirements;
import resourcingAccumulator = resourcing.resourcingAccumulator;
import toResourceUsages = resourcing.toResourceUsages;
import booking = resourcing.booking;
import resourcedBooking = resourcing.resourcedBooking;
import resourceCommitment = resourcing.resourceCommitment;
import resourceBookings = resourcing.resourceBookings;
import unresourceableBooking = resourcing.unresourceableBooking;
import available = resourcing.available;
import unavailable = resourcing.unavailable;

describe('given a service requiring fungible resources without capacity, checkAvailability', () => {
	const room = resourceType('room');
	const room1 = resource(room, [timeslotFns.sameDay('2021-01-01', '09:00', '12:00')], [], resourceId('room1'));
	const resources = [room1];
	const anyRoom = anySuitableResource(room);
	const theService = service(resourceRequirements([anyRoom]));

	test('states whether a booking is possible', () => {
		const theBooking = booking(timeslotFns.sameDay('2021-01-01', '09:00', '12:00'), theService);
		const outcome = checkAvailability(resourcingAccumulator(toResourceUsages(resources)), theBooking);
		expect(outcome).toEqual(available(resourcedBooking(theBooking, [resourceCommitment(anyRoom, room1)]), capacity(1), capacity(0)));
	});

	test('states whether a booking is not possible', () => {
		const firstBooking = booking(timeslotFns.sameDay('2021-01-01', '09:00', '12:00'), theService);
		const secondBooking = booking(timeslotFns.sameDay('2021-01-01', '09:00', '12:00'), theService);
		const resourcingOutcome = resourceBookings(resources, [firstBooking]);
		const outcome = checkAvailability(resourcingOutcome, secondBooking);
		expect(outcome).toEqual(unavailable(unresourceableBooking(secondBooking, [anyRoom])));
	});
});
