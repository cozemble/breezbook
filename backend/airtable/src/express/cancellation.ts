import express from 'express';
import { bookingIdParam, cancellationId, handleOutcome, HttpError, httpError, sendJson, withTwoRequestParams } from '../infra/functionalExpress.js';
import { BookingId, Clock, SystemClock } from '@breezbook/packages-core';
import { DbBooking, DbCancellationGrant } from '../prisma/dbtypes.js';
import { dbBridge, DbExpressBridge, DbResourceFinder, namedDbResourceFinder } from '../infra/dbExpressBridge.js';
import { findRefundRule, refundPolicy, TimebasedRefundRule } from '@breezbook/packages-core/dist/cancellation.js';
import { toDomainBooking, toDomainTimeslotSpec } from '../prisma/dbToDomain.js';
import { CancellationGranted, cancellationGranted } from '@breezbook/backend-api-types';
import { PrismaClient } from '@prisma/client';
import { prismaUpdates, PrismaUpdates } from '../infra/prismaMutations.js';
import { updateBooking, updateCancellationGrant } from '../prisma/breezPrismaMutations.js';
import { jsDateFns } from '@breezbook/packages-core/dist/jsDateFns.js';

function findBookingById(bookingId: BookingId): DbResourceFinder<DbBooking> {
	return (prisma, tenantEnvironment) => {
		return prisma.bookings.findUnique({
			where: {
				id: bookingId.value,
				environment_id: tenantEnvironment.environmentId.value,
				tenant_id: tenantEnvironment.tenantId.value
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
			tenants: { connect: { tenant_id: db.tenantEnvironment.tenantId.value } },
			environment_id: db.tenantEnvironment.environmentId.value,
			definition: grant as any,
			bookings: { connect: { id: grant.bookingId } }
		}
	});
	return sendJson(res, grant, 201);
}

export async function requestCancellationGrant(req: express.Request, res: express.Response): Promise<void> {
	await withTwoRequestParams(req, res, dbBridge(), bookingIdParam(), async (db, bookingId) => {
		await db.withResource(namedDbResourceFinder('Booking', findBookingById(bookingId)), async (theBooking) => {
			const refundRules = await db.prisma.refund_rules.findMany({
				where: {
					tenant_id: db.tenantEnvironment.tenantId.value,
					environment_id: db.tenantEnvironment.environmentId.value
				}
			});
			const theRefundPolicy = refundPolicy(refundRules.map((r) => r.definition as any as TimebasedRefundRule));
			const timeslots = await db.prisma.time_slots.findMany({
				where: {
					tenant_id: db.tenantEnvironment.tenantId.value,
					environment_id: db.tenantEnvironment.environmentId.value
				}
			});
			const refundJudgement = findRefundRule(toDomainBooking(theBooking, timeslots.map(toDomainTimeslotSpec)), theRefundPolicy, new SystemClock());
			if (refundJudgement._type === 'refund.possible') {
				return grantCancellation(
					res,
					db,
					cancellationGranted(refundJudgement.applicableRule.percentage.value, refundJudgement.hoursToBookingStart.value, bookingId.value)
				);
			}
			if (refundJudgement._type === 'booking.is.in.the.past') {
				return res.status(400).send('Cannot cancel a booking in the past');
			}
			return grantCancellation(res, db, cancellationGranted(1, null, bookingId.value));
		});
	});
}

export function doCommitCancellation(prisma: PrismaClient, cancellation: DbCancellationGrant, clock: Clock): PrismaUpdates | HttpError {
	if (cancellation.committed) {
		return httpError(409, 'Cancellation already committed');
	}
	const now = clock.now();
	// if the cancellation is more than 30 mins old, we can't commit it
	if (jsDateFns.differenceInMinutes(now, cancellation.created_at) > 30) {
		return httpError(409, 'Cancellation too old to commit');
	}
	return prismaUpdates([
		updateCancellationGrant(prisma, { committed: true }, { id: cancellation.id }),
		updateBooking(prisma, { status: 'cancelled' }, { id: cancellation.booking_id })
	]);
}

export async function commitCancellation(req: express.Request, res: express.Response): Promise<void> {
	await withTwoRequestParams(req, res, dbBridge(), cancellationId(), async (db, cancellationId) => {
		await db.withResource(namedDbResourceFinder('Cancellation', findCancellationById(cancellationId)), async (cancellation) => {
			await handleOutcome(res, db, doCommitCancellation(db.prisma, cancellation, new SystemClock()));
		});
	});
}