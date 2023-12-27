import * as express from 'express';
import {orderBody, tenantIdParam, withTwoRequestParams} from "../infra/functionalExpress.js";
import {inTxn, withAdminPgClient} from "../infra/postgresPool.js";
import {booking, calcSlotPeriod, Customer, customerId, mandatory, orderFns, TenantId} from "@breezbook/packages-core";
import pg from "pg";
import {getEverythingForTenant} from "./getEverythingForTenant.js";

async function upsertCustomer(client: pg.PoolClient, tenantId: TenantId, customer: Customer): Promise<string> {
    const maybeExistingCustomer = await client.query(`select *
                                                      from customers
                                                      where tenant_id = $1
                                                        and email = $2`, [tenantId.value, customer.email]);

    if (maybeExistingCustomer.rows.length === 0) {
        const newCustomer = await client.query(`insert into customers (tenant_id, email, first_name, last_name)
                                                values ($1, $2, $3, $4)
                                                RETURNING id`, [tenantId.value, customer.email, customer.firstName, customer.lastName]);
        return newCustomer.rows[0].id as string;
    } else {
        await client.query(`update customers
                            set first_name = $3,
                                last_name  = $4
                            where tenant_id = $1
                              and email = $2`, [tenantId.value, customer.email, customer.firstName, customer.lastName]);
        return maybeExistingCustomer.rows[0].id as string;
    }
}

export async function addOrder(req: express.Request, res: express.Response): Promise<void> {
    await withTwoRequestParams(req, res, tenantIdParam(), orderBody(), async (tenantId, order) => {
        await withAdminPgClient(async (client) => {
            await inTxn(client, async () => {
                const {fromDate, toDate} = orderFns.getOrderDateRange(order)
                const everythingForTenant = await getEverythingForTenant(client, tenantId, fromDate, toDate);
                const customerIdValue = await upsertCustomer(client, tenantId, order.customer);
                const newOrder = await client.query(`insert into orders (tenant_id, customer_id)
                                                     values ($1, $2)
                                                     RETURNING id`, [tenantId.value, customerIdValue]);
                const orderId = newOrder.rows[0].id as string;
                const bookingIds = [];
                for (const line of order.lines) {
                    const service = mandatory(everythingForTenant.businessConfiguration.services.find(s => s.id.value === line.serviceId.value), `Service with id ${line.serviceId.value} not found`);
                    const servicePeriod = calcSlotPeriod(line.slot, service.duration)
                    const time_slot_id = line.slot._type === 'timeslot.spec' ? line.slot.id.value : null;
                    const addOnsJsonbArray = line.addOnIds.length === 0 ? '{}' : `{"${line.addOnIds.join('","')}"}`;
                    await client.query(`insert into order_lines (tenant_id, order_id, service_id, time_slot_id,
                                                                 start_time_24hr, end_time_24hr, add_on_ids, date)
                                        values ($1, $2, $3, $4, $5, $6, $7,
                                                $8)`, [tenantId.value, orderId, line.serviceId.value, time_slot_id, servicePeriod.from.value, servicePeriod.to.value, addOnsJsonbArray, line.date.value]);
                    const bookingObject = booking(customerId(customerIdValue), line.serviceId, line.date, line.slot);
                    await client.query(`insert into bookings (tenant_id, customer_id, service_id, order_id, date,
                                                              start_time_24hr, end_time_24hr, definition, id)
                                        values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                        [tenantId.value, customerIdValue, line.serviceId.value, orderId, line.date.value, servicePeriod.from.value, servicePeriod.to.value, JSON.stringify(bookingObject), bookingObject.id.value]);
                    bookingIds.push(bookingObject.id.value);
                }

                res.send({customerId: customerIdValue, orderId: '123', bookingIds});

            });
        });
    })
}