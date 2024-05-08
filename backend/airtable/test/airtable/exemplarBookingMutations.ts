import {Mutation} from "../../src/mutation/mutations.js";

export const exemplarBookingMutations: Mutation[] = [
    {
        _type: 'upsert',
        create: {
            data: {
                id: '1e2e743d-d35d-494a-a8fc-572b6c0610df',
                email: 'mike@email.com',
                last_name: 'Hogan',
                tenant_id: 'tenant1',
                first_name: 'Mike',
                environment_id: 'dev'
            },
            _type: 'create',
            entity: 'customers',
            entityId: {_type: 'id', value: '1e2e743d-d35d-494a-a8fc-572b6c0610df'}
        },
        update: {
            data: {last_name: 'Hogan', tenant_id: 'tenant1', first_name: 'Mike'},
            _type: 'update',
            where: {
                tenant_id_environment_id_email: {
                    email: 'mike@email.com',
                    tenant_id: 'tenant1',
                    environment_id: 'dev'
                }
            },
            entity: 'customers',
            entityId: {_type: 'id', value: '1e2e743d-d35d-494a-a8fc-572b6c0610df'}
        }
    },
    {
        _type: 'upsert',
        create: {
            data: {
                tenant_id: 'tenant1',
                customer_id: '1e2e743d-d35d-494a-a8fc-572b6c0610df',
                form_values: {phone: '23432432'},
                environment_id: 'dev'
            },
            _type: 'create',
            entity: 'customer_form_values',
            entityId: {_type: 'id', value: '1e2e743d-d35d-494a-a8fc-572b6c0610df'}
        },
        update: {
            data: {
                form_values: {
                    phone: '23432432',
                    postcode: 'X1Y2',
                    firstLineOfAddress: '11 Main Street'
                }
            },
            _type: 'update',
            where: {
                tenant_id_environment_id_customer_id: {
                    tenant_id: 'tenant1',
                    customer_id: '1e2e743d-d35d-494a-a8fc-572b6c0610df',
                    environment_id: 'dev'
                }
            },
            entity: 'customer_form_values',
            entityId: {_type: 'id', value: '1e2e743d-d35d-494a-a8fc-572b6c0610df'}
        }
    },
    {
        data: {
            id: 'a5b8c4b2-b9d2-4b73-bed5-ac5078d7f58f',
            tenant_id: 'tenant1',
            customer_id: '1e2e743d-d35d-494a-a8fc-572b6c0610df',
            environment_id: 'dev',
            total_price_currency: 'GBP',
            total_price_in_minor_units: 1400,
            payment_method: 'upfront'
        },
        _type: 'create',
        entity: 'orders',
        entityId: {_type: 'id', value: 'a5b8c4b2-b9d2-4b73-bed5-ac5078d7f58f'}
    },
    {
        data: {
            id: 'd3dab4e6-e569-461d-a4f7-21b06ccfce35',
            date: '2024-04-02',
            order_id: 'a5b8c4b2-b9d2-4b73-bed5-ac5078d7f58f',
            tenant_id: 'tenant1',
            add_on_ids: [],
            service_id: 'smallCarWash',
            time_slot_id: 'timeSlot#1',
            end_time_24hr: '13:00',
            environment_id: 'dev',
            start_time_24hr: '09:00',
            total_price_currency: "GBP",
            total_price_in_minor_units: 1400
        },
        _type: 'create',
        entity: 'order_lines',
        entityId: {_type: 'id', value: 'd3dab4e6-e569-461d-a4f7-21b06ccfce35'}
    },
    {
        data: {
            id: '050da0be-01f1-4246-8a2e-dd3f691f73fd',
            date: '2024-04-02',
            order_id: 'a5b8c4b2-b9d2-4b73-bed5-ac5078d7f58f',
            order_line_id: 'd3dab4e6-e569-461d-a4f7-21b06ccfce35',
            tenant_id: 'tenant1',
            "add_on_ids": [
                "screenwash_refill_oil_fluids_check",
                "shampoo_headlining"
            ],
            service_id: 'smallCarWash',
            customer_id: '1e2e743d-d35d-494a-a8fc-572b6c0610df',
            time_slot_id: 'timeSlot#1',
            end_time_24hr: '13:00',
            environment_id: 'dev',
            start_time_24hr: '09:00'
        },
        _type: 'create',
        entity: 'bookings',
        entityId: {_type: 'id', value: '050da0be-01f1-4246-8a2e-dd3f691f73fd'}
    },
    {
        data: {
            id: 'd473b8fa-e907-402f-8907-66d6e544b927',
            booking_id: '050da0be-01f1-4246-8a2e-dd3f691f73fd',
            expiry_time: '2024-04-02T11:38:04.477Z',
            reservation_time: '2024-04-02T11:08:04.477Z',
            reservation_type: 'awaiting payment'
        },
        _type: 'create',
        entity: 'reservations',
        entityId: {_type: 'id', value: 'd473b8fa-e907-402f-8907-66d6e544b927'}
    },
    {
        _type: 'upsert',
        create: {
            data: {
                tenant_id: 'tenant1',
                booking_id: '050da0be-01f1-4246-8a2e-dd3f691f73fd',
                environment_id: 'dev',
                service_form_id: 'car-details-form',
                service_form_values: {
                    make: 'Honda',
                    year: 2021,
                    model: 'Accord',
                    colour: 'Silver',
                    postcode: 'X1Y2',
                    firstLineOfAddress: '11 Main Street'
                }
            },
            _type: 'create',
            entity: 'booking_service_form_values',
            entityId: {_type: 'id', value: '050da0be-01f1-4246-8a2e-dd3f691f73fd'}
        },
        update: {
            data: {
                service_form_values: {
                    make: 'Honda',
                    year: 2021,
                    model: 'Accord',
                    colour: 'Silver',
                    postcode: 'X1Y2',
                    firstLineOfAddress: '11 Main Street'
                }
            },
            _type: 'update',
            where: {
                tenant_id_environment_id_booking_id_service_form_id: {
                    tenant_id: 'tenant1',
                    booking_id: '050da0be-01f1-4246-8a2e-dd3f691f73fd',
                    environment_id: 'dev',
                    service_form_id: 'car-details-form'
                }
            },
            entity: 'booking_service_form_values',
            entityId: {_type: 'id', value: '050da0be-01f1-4246-8a2e-dd3f691f73fd'}
        }
    },
    {
        _type: 'create',
        entity: 'booking_payments',
        entityId: {_type: 'id', value: '27d3388b-3b0c-4972-b2b8-970dbca8740e'},
        data: {
            "id": "27d3388b-3b0c-4972-b2b8-970dbca8740e",
            "status": "succeeded",
            "provider": "stripe",
            "tenant_id": "tenant1",
            "booking_id": "050da0be-01f1-4246-8a2e-dd3f691f73fd",
            "environment_id": "dev",
            "amount_currency": "gbp",
            "amount_in_minor_units": 6500,
            "provider_transaction_id": "pi_3PDnrNH2RPqITCMj0vUw0P3K"
        },
    }
];