import express from 'express';
import {
	handleOutcome,
	httpJsonResponse,
	HttpJsonResponse,
	paramExtractor,
	ParamExtractor,
	query,
	RequestValueExtractor,
	tenantEnvironmentParam,
	withThreeRequestParams
} from '../../infra/functionalExpress.js';
import { dbBridge, DbResourceFinder, namedDbResourceFinder } from '../../infra/dbExpressBridge.js';
import { Clock, SystemClock } from '@breezbook/packages-core';
import { DbCoupon } from '../../prisma/dbtypes.js';
import { jsDateFns } from '@breezbook/packages-core/dist/jsDateFns.js';
import { mutations } from '../../mutation/mutations.js';

export function couponCode(requestValue: RequestValueExtractor = query('couponCode')): ParamExtractor<string | null> {
	return paramExtractor('couponCode', requestValue.extractor, (s) => s);
}

function findCouponByCouponCode(couponCode: string): DbResourceFinder<DbCoupon> {
	return (prisma, tenantEnvironment) => {
		return prisma.coupons.findFirstOrThrow({
			where: {
				code: couponCode,
				environment_id: tenantEnvironment.environmentId.value,
				tenant_id: tenantEnvironment.tenantId.value
			}
		});
	};
}

export function doCouponValidityCheck(coupon: DbCoupon, clock: Clock): HttpJsonResponse {
	const now = clock.now();
	const couponStartDate = new Date(coupon.start_date);
	const couponEndDate = coupon.end_date ? new Date(coupon.end_date) : null;
	if (couponStartDate && jsDateFns.isBefore(now, couponStartDate)) {
		return httpJsonResponse(200, { valid: false, reason: 'coupon.start.date.future' });
	}
	if (couponEndDate && jsDateFns.isAfter(now, couponEndDate)) {
		return httpJsonResponse(200, { valid: false, reason: 'coupon.end.date.past' });
	}
	return httpJsonResponse(200, { valid: true });
}

export async function couponValidityCheck(req: express.Request, res: express.Response): Promise<void> {
	await withThreeRequestParams(req, res, dbBridge(), couponCode(), tenantEnvironmentParam(), async (db, couponCode, tenantEnvironment) => {
		await db.withResource(namedDbResourceFinder('Coupon', findCouponByCouponCode(couponCode)), async (coupon) => {
			await handleOutcome(res, db.prisma, tenantEnvironment, mutations([]), doCouponValidityCheck(coupon, new SystemClock()));
		});
	});
}
