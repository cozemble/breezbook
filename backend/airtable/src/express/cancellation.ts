import express from 'express';
import { bookingIdParam, sendJson, withTwoRequestParams } from '../infra/functionalExpress.js';
import { BookingId, SystemClock } from '@breezbook/packages-core';
import { DbBooking } from '../prisma/dbtypes.js';
import { dbBridge, DbResourceFinder } from '../infra/dbExpressBridge.js';
import { findRefundRule, refundPolicy, TimebasedRefundRule } from '@breezbook/packages-core/dist/cancellation.js';
import { toDomainBooking, toDomainTimeslotSpec } from '../prisma/dbToDomain.js';
import { cancellationGranted } from '@breezbook/backend-api-types';

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

export async function requestCancellationGrant(req: express.Request, res: express.Response): Promise<void> {
	await withTwoRequestParams(req, res, dbBridge(), bookingIdParam(), async (db, bookingId) => {
		await db.withResource('Booking', findBookingById(bookingId), async (theBooking) => {
			const refundRules = await db.prisma.refund_rules.findMany({
				where: {
					tenant_id: db.tenantEnvironment.tenantId.value,
					environment_id: db.tenantEnvironment.environmentId.value
				}
			});
			if (refundRules.length > 1) {
				const theRefundPolicy = refundPolicy(refundRules.map((r) => r.definition as any as TimebasedRefundRule));
				const timeslots = await db.prisma.time_slots.findMany({
					where: {
						tenant_id: db.tenantEnvironment.tenantId.value,
						environment_id: db.tenantEnvironment.environmentId.value
					}
				});
				const refundJudgement = findRefundRule(toDomainBooking(theBooking, timeslots.map(toDomainTimeslotSpec)), theRefundPolicy, new SystemClock());
				if (refundJudgement._type === 'refund.possible') {
					return sendJson(res, cancellationGranted(refundJudgement.applicableRule.percentage.value, refundJudgement.hoursToBookingStart.value), 201);
				}
				if (refundJudgement._type === 'booking.is.in.the.past') {
					return res.status(400).send('Cannot cancel a booking in the past');
				}
			}
		});
		return sendJson(res, cancellationGranted(1, null), 201);
	});
}
