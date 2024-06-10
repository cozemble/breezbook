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
import {BookingId, Clock, resourceType, SystemClock} from '@breezbook/packages-core';
import {
    DbBooking,
    DbCancellationGrant,
    DbRefundRule,
    DbResourceType,
    DbService,
    DbTimeSlot
} from '../prisma/dbtypes.js';
import {dbBridge, DbExpressBridge, DbResourceFinder, namedDbResourceFinder} from '../infra/dbExpressBridge.js';
import {findRefundRule, refundPolicy, TimebasedRefundRule} from '@breezbook/packages-core/dist/cancellation.js';
import {toDomainBooking, toDomainService, toDomainTimeslotSpec} from '../prisma/dbToDomain.js';
import {CancellationGranted, cancellationGranted} from '@breezbook/backend-api-types';
import {updateBooking, updateCancellationGrant} from '../prisma/breezPrismaMutations.js';
import {jsDateFns} from '@breezbook/packages-core/dist/jsDateFns.js';
import {Mutations, mutations} from '../mutation/mutations.js';

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
            tenant_id: db.tenantEnvironment.tenantId.value,
            environment_id: db.tenantEnvironment.environmentId.value,
            definition: grant as any,
            booking_id: grant.bookingId
        }
    });
    return sendJson(res, grant, 201);
}

export function doCancellationRequest(
    refundRules: DbRefundRule[],
    timeslots: DbTimeSlot[],
    resourceTypes: DbResourceType[],
    services: DbService[],
    theBooking: DbBooking,
    clock = new SystemClock()
): HttpError | CancellationGranted {
    const mappedResourceTypes = resourceTypes.map((rt) => resourceType(rt.id));
    const mappedTimeslots = timeslots.map(toDomainTimeslotSpec);
    const mappedServices = services.map(s => toDomainService(s, mappedResourceTypes, [], mappedTimeslots))
    const theRefundPolicy = refundPolicy(refundRules.map((r) => r.definition as any as TimebasedRefundRule));
    const refundJudgement = findRefundRule(toDomainBooking(theBooking, mappedTimeslots, mappedServices), theRefundPolicy, clock);
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
            const refundRules = await db.prisma.refund_rules.findMany({
                where: {
                    tenant_id: db.tenantEnvironment.tenantId.value,
                    environment_id: db.tenantEnvironment.environmentId.value
                }
            });
            const timeslots = await db.prisma.time_slots.findMany({
                where: {
                    tenant_id: db.tenantEnvironment.tenantId.value,
                    environment_id: db.tenantEnvironment.environmentId.value
                }
            });
            const resourceTypes = await db.prisma.resource_types.findMany({
                where: {
                    tenant_id: db.tenantEnvironment.tenantId.value,
                    environment_id: db.tenantEnvironment.environmentId.value
                }
            });
            const services = await db.prisma.services.findMany({
                where: {
                    tenant_id: db.tenantEnvironment.tenantId.value,
                    environment_id: db.tenantEnvironment.environmentId.value
                }
            });
            const outcome = doCancellationRequest(refundRules, timeslots, resourceTypes, services, theBooking);
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
        updateCancellationGrant({committed: true}, {id: cancellationGrant.id}),
        updateBooking({status: 'cancelled'}, {id: cancellationGrant.booking_id})
    ]);
}

export async function commitCancellation(req: express.Request, res: express.Response): Promise<void> {
    await withThreeRequestParams(req, res, dbBridge(), cancellationId(), tenantEnvironmentParam(), async (db, cancellationId, tenantEnvironment) => {
        await db.withResource(namedDbResourceFinder('Cancellation', findCancellationById(cancellationId)), async (cancellation) => {
            await handleOutcome(res, db.prisma, tenantEnvironment, doCommitCancellation(cancellation, new SystemClock()));
        });
    });
}
