import * as express from 'express';
import { orderBody, tenantIdParam, withTwoRequestParams } from '../infra/functionalExpress.js';
import { calcSlotPeriod, mandatory, orderFns } from '@breezbook/packages-core';
import { getEverythingForTenant } from './getEverythingForTenant.js';
import { prismaClient } from '../prisma/client.js';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import { DbBooking, DbOrderLine } from '../prisma/dbtypes.js';


export async function addOrder(req: express.Request, res: express.Response): Promise<void> {
	await withTwoRequestParams(req, res, tenantIdParam(), orderBody(), async (tenantId, order) => {
		const { fromDate, toDate } = orderFns.getOrderDateRange(order);
		const everythingForTenant = await getEverythingForTenant(tenantId, fromDate, toDate);
		const prisma = prismaClient();
		const tenant_id = tenantId.value;
		const email = order.customer.email;
		const customerUpsert = prisma.customers.upsert({
			where: { tenant_id_email: { tenant_id: tenantId.value, email } },
			update: { first_name: order.customer.firstName, last_name: order.customer.lastName, tenant_id },
			create: {
				email, first_name: order.customer.firstName, last_name: order.customer.lastName, tenants: {
					connect: { tenant_id: tenantId.value }
				}
			}
		});
		const orderId = uuidv4();
		const createOrder = prisma.orders.create({
			data: {
				id: orderId,
				customers: {
					connect: { tenant_id_email: { tenant_id, email } }
				},
				tenants: {
					connect: { tenant_id: tenantId.value }
				}

			}
		});
		const lineInserts: Prisma.PrismaPromise<unknown>[] = [];
		for (const line of order.lines) {
			const service = mandatory(everythingForTenant.businessConfiguration.services.find(s => s.id.value === line.serviceId.value), `Service with id ${line.serviceId.value} not found`);
			const servicePeriod = calcSlotPeriod(line.slot, service.duration);
			const time_slot_id = line.slot._type === 'timeslot.spec' ? line.slot.id.value : null;
			lineInserts.push(prisma.order_lines.create({
				data: {
					tenant_id: tenantId.value,
					order_id: orderId,
					service_id: line.serviceId.value,
					time_slot_id: time_slot_id,
					start_time_24hr: servicePeriod.from.value,
					end_time_24hr: servicePeriod.to.value,
					add_on_ids: line.addOnIds.map(a => a.value),
					date: line.date.value
				}
			}));
			const bookingDefinition = { 'to': 'do' };
			lineInserts.push(prisma.bookings.create({
				data: {
					tenants: {
						connect: { tenant_id: tenantId.value }
					},
					services: {
						connect: { id: line.serviceId.value }
					},
					orders: {
						connect: { id: orderId }
					},
					customers: {
						connect: { tenant_id_email: { tenant_id, email } }
					},
					date: line.date.value,
					start_time_24hr: servicePeriod.from.value,
					end_time_24hr: servicePeriod.to.value,
					definition: bookingDefinition
				}
			}));
		}
		const [customerOutcome, orderOutcome, ...remainingOutcomes] = await prisma.$transaction([customerUpsert, createOrder, ...lineInserts]);
		const orderLineOutcomes: DbOrderLine[] = [];
		const bookingOutcomes: DbBooking[] = [];

		for (let i = 0; i < remainingOutcomes.length; i++) {
			if (i % 2 == 0) {
				orderLineOutcomes.push(remainingOutcomes[i] as DbOrderLine);
			} else {
				bookingOutcomes.push(remainingOutcomes[i] as DbBooking);
			}
		}


		res.send({ orderId: orderOutcome.id, customerId: customerOutcome.id, bookingIds: bookingOutcomes.map(b => b.id), orderLineIds: orderLineOutcomes.map(ol => ol.id) });
	});
}

