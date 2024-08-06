import express from 'express';
import {
	bookingIdParam,
	cancellationId,
	handleOutcome,
	HttpError,
	httpError,
	sendJson,
	tenantEnvironmentParam,
	withThreeRequestParams,
	withTwoRequestParams
} from '../infra/functionalExpress.js';
import { Clock, SystemClock } from '@breezbook/packages-core';
import { DbCancellationGrant, DbRefundRule } from '../prisma/dbtypes.js';
import { dbBridge, DbExpressBridge, DbResourceFinder, namedDbResourceFinder } from '../infra/dbExpressBridge.js';
import { findRefundRule, refundPolicy, TimebasedRefundRule } from '@breezbook/packages-core/dist/cancellation.js';
import { toDomainBooking } from '../prisma/dbToDomain.js';
import { CancellationGranted, cancellationGranted } from '@breezbook/backend-api-types';
import { updateBooking, updateCancellationGrant } from '../prisma/breezPrismaMutations.js';
import { jsDateFns } from '@breezbook/packages-core/dist/jsDateFns.js';
import { Mutations, mutations } from '../mutation/mutations.js';
import { DbBookingAndResourceRequirements, EverythingForAvailability } from './getEverythingForAvailability.js';
import { BookingId, locationId, tenantEnvironmentLocation } from '@breezbook/packages-types';
import { isoDate } from '@breezbook/packages-date-time';
import { byLocation } from '../availability/byLocation.js';

function findBookingById(bookingId: BookingId): DbResourceFinder<DbBookingAndResourceRequirements> {
	return (prisma, tenantEnvironment) => {
		return prisma.bookings.findUnique({
			where: {
				id: bookingId.value,
				environment_id: tenantEnvironment.environmentId.value,
				tenant_id: tenantEnvironment.tenantId.value
			},
			include: {
				booking_resource_requirements: true,
				booking_service_options: true,
				booking_add_ons: true
			}
		});
	};
}

function findCancellationById(cancellationId: string): DbResourceFinder<DbCancellationGrant> {
	return (prisma, tenantEnvironment) => {
		return prisma.cancellation_grants.findUnique({
			where: {
				id: cancellationId,
				environment_id: tenantEnvironment.environmentId.value,
				tenant_id: tenantEnvironment.tenantId.value
			},
			include: {
				bookings: true
			}
		});
	};
}

async function grantCancellation(res: express.Response, db: DbExpressBridge, grant: CancellationGranted): Promise<void> {
	await db.prisma.cancellation_grants.create({
		data: {
			id: grant.cancellationId,
			tenant_id: db.tenantEnvironment.tenantId.value,
			environment_id: db.tenantEnvironment.environmentId.value,
			definition: grant as any,
			booking_id: grant.bookingId
		}
	});
	return sendJson(res, grant, 201);
}

export function doCancellationRequest(
	everythingForAvailability: EverythingForAvailability,
	refundRules: DbRefundRule[],
	theBooking: DbBookingAndResourceRequirements,
	clock = new SystemClock()
): HttpError | CancellationGranted {
	const theRefundPolicy = refundPolicy(refundRules.map((r) => r.definition as any as TimebasedRefundRule));
	const refundJudgement = findRefundRule(toDomainBooking(theBooking, everythingForAvailability.businessConfiguration.services), theRefundPolicy, clock);
	if (refundJudgement._type === 'refund.possible') {
		return cancellationGranted(refundJudgement.applicableRule.percentage.value, refundJudgement.hoursToBookingStart.value, theBooking.id);
	}
	if (refundJudgement._type === 'booking.is.in.the.past') {
		return httpError(400, 'Cannot cancel a booking in the past');
	}
	return cancellationGranted(1, null, theBooking.id);
}

export async function requestCancellationGrant(req: express.Request, res: express.Response): Promise<void> {
	await withTwoRequestParams(req, res, dbBridge(), bookingIdParam(), async (db, bookingId) => {
		await db.withResource(namedDbResourceFinder('Booking', findBookingById(bookingId)), async (theBooking) => {
			const whereTenantEnv = {
				where: {
					tenant_id: db.tenantEnvironment.tenantId.value,
					environment_id: db.tenantEnvironment.environmentId.value
				}
			};
			const tel = tenantEnvironmentLocation(db.tenantEnvironment.environmentId, db.tenantEnvironment.tenantId, locationId(theBooking.location_id));
			const everythingForAvailability = await byLocation.getEverythingForAvailability(db.prisma, tel, isoDate(theBooking.date), isoDate(theBooking.date));
			const refundRules = await db.prisma.refund_rules.findMany(whereTenantEnv);
			const outcome = doCancellationRequest(everythingForAvailability, refundRules, theBooking);
			if (outcome._type === 'http.error') {
				return res.status(outcome.status).send(outcome.message);
			}
			return grantCancellation(res, db, outcome);
		});
	});
}

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export function doCommitCancellation(cancellationGrant: DbCancellationGrant, clock: Clock): Mutations | HttpError {
	if (cancellationGrant.committed) {
		return httpError(409, 'Cancellation already committed');
	}
	const now = clock.now();
	// if the cancellation is more than 30 mins old, we can't commit it
	if (jsDateFns.differenceInMinutes(now, cancellationGrant.created_at) > 30) {
		return httpError(409, 'Cancellation too old to commit');
	}
	return mutations([
		updateCancellationGrant({ committed: true }, { id: cancellationGrant.id }),
		updateBooking({ status: 'cancelled' }, { id: cancellationGrant.booking_id })
	]);
}

export async function commitCancellation(req: express.Request, res: express.Response): Promise<void> {
	await withThreeRequestParams(req, res, dbBridge(), cancellationId(), tenantEnvironmentParam(), async (db, cancellationId, tenantEnvironment) => {
		await db.withResource(namedDbResourceFinder('Cancellation', findCancellationById(cancellationId)), async (cancellation) => {
			await handleOutcome(res, db.prisma, tenantEnvironment, doCommitCancellation(cancellation, new SystemClock()));
		});
	});
}
