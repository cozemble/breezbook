import {AirtableMappingPlan} from "./airtableMappingTypes.js";

export const natsCarWashAirtableMapping: AirtableMappingPlan = {
    _type: 'airtable.mapping.plan',
    mappings: [
        {
            when: '_type == "upsert" && create.entity == "add_on"',
            airtable: {
                recordId: {mappedTo: {entity: 'add_on', entityId: {id: 'create.data.id'}}},
                records: [
                    {
                        _type: 'airtable.upsert',
                        baseId: 'ENV.SMARTWASH_BASE_ID',
                        table: 'Add-ons',
                        fields: {
                            Name: {_type: 'object.path', path: 'create.data.name', nullable: false},
                            Price: {_type: 'expression', expression: 'create.data.price / 100'}
                        }
                    }
                ]
            }
        },
        {
            when: '_type == "upsert" && create.entity == "services"',
            airtable: {
                recordId: {mappedTo: {entity: 'services', entityId: {id: 'create.data.id'}}},
                records: [
                    {
                        _type: 'airtable.upsert',
                        baseId: 'ENV.SMARTWASH_BASE_ID',
                        table: 'Services',
                        fields: {
                            Name: {_type: 'object.path', path: 'create.data.name', nullable: false},
                            Description: {_type: 'object.path', path: 'create.data.description'},
                            Price: {_type: 'expression', expression: 'create.data.price / 100'}
                        }
                    }
                ]
            }
        },
        {
            when: '_type == "upsert" && create.entity == "customers"',
            airtable: {
                recordId: {mappedTo: {entity: 'customers', entityId: {id: 'create.data.id'}}},
                records: [
                    {
                        _type: 'airtable.upsert',
                        baseId: 'ENV.SMARTWASH_BASE_ID',
                        table: 'Customers',
                        fields: {
                            'First name': {_type: 'object.path', path: 'create.data.first_name', nullable: false},
                            'Last name': {_type: 'object.path', path: 'create.data.last_name', nullable: false},
                            Email: {_type: 'object.path', path: 'create.data.email', nullable: false},
                            Phone: {_type: 'object.path', path: 'create.data.phone_e164', nullable: false}
                        }
                    }
                ]
            }
        },
        {
            when: '_type == "create" && entity == "orders"',
            airtable: {
                recordId: {
                    mappedTo: {
                        entity: 'orders',
                        entityId: {id: 'data.id'}
                    }
                },
                records: [
                    {
                        _type: 'airtable.create',
                        baseId: 'ENV.SMARTWASH_BASE_ID',
                        table: 'Orders',
                        fields: {
                            "Payment method": {_type: 'object.path', path: 'data.payment_method'},
                        }
                    }
                ]
            }
        },
        {
            when: '_type == "create" && entity == "order_lines"',
            airtable: {
                recordId: {
                    mappedTo: {
                        entity: 'order_lines',
                        entityId: {id: 'data.id'}
                    }
                },
                records: [
                    {
                        _type: 'airtable.create',
                        baseId: 'ENV.SMARTWASH_BASE_ID',
                        table: 'Order lines',
                        fields: {
                            Order: [{
                                _type: 'lookup',
                                entity: 'orders',
                                entityId: {id: 'data.order_id'},
                                table: 'Orders'
                            }],
                            Price: {_type: 'expression', expression: 'data.total_price_in_minor_units / 100'},
                        }
                    }
                ]
            }
        },
        {
            when: '_type == "create" && entity == "bookings"',
            airtable: {
                recordId: {
                    mappedTo: {
                        entity: 'bookings',
                        entityId: {id: 'data.id'}
                    }
                },
                records: [
                    {
                        _type: 'airtable.create',
                        baseId: 'ENV.SMARTWASH_BASE_ID',
                        table: 'Bookings',
                        fields: {
                            Customer: [
                                {
                                    _type: 'lookup',
                                    entity: 'customers',
                                    entityId: {id: 'data.customer_id'},
                                    table: 'Customers',
                                    nullable: false
                                }
                            ],
                            "Add-ons": {
                                _type: 'map',
                                list: {_type: 'object.path', path: 'data.add_on_ids'},
                                variableName: "add_on_id",
                                fn: {
                                    _type: 'lookup',
                                    entity: 'add_on',
                                    entityId: {id: {variable: 'add_on_id'}},
                                    table: 'Add-ons',
                                    nullable: false
                                }

                            },
                            "Order line": [
                                {
                                    _type: 'lookup',
                                    entity: 'order_lines',
                                    entityId: {id: 'data.order_line_id'},
                                    table: 'Order lines',
                                    nullable: false
                                }
                            ],
                            'Due Date': {_type: 'object.path', path: 'data.date'},
                            Time: {
                                _type: 'expression',
                                expression: 'data.start_time_24hr + " to " + data.end_time_24hr'
                            },
                            "Service ID": [{
                                _type: 'lookup',
                                entity: 'services',
                                entityId: {id: 'data.service_id'},
                                table: 'Services'
                            }],
                            "Breezbook ID": {_type: 'object.path', path: 'data.id'}
                        }
                    }
                ]
            }
        },

        {
            when: '_type == "upsert" && create.entity == "booking_service_form_values"',
            airtable: {
                recordId: {
                    mappedTo: {
                        entity: 'bookings',
                        entityId: {id: 'create.data.booking_id'}
                    }
                },
                records: [
                    {
                        _type: 'airtable.upsert',
                        baseId: 'ENV.SMARTWASH_BASE_ID',
                        table: 'Car details',
                        fields: {
                            Make: {_type: 'object.path', path: 'create.data.service_form_values.make'},
                            Model: {_type: 'object.path', path: 'create.data.service_form_values.model'},
                            'Year and colour': {
                                _type: 'expression',
                                expression: 'create.data.service_form_values.year + " " + create.data.service_form_values.colour'
                            }
                        }
                    },
                    {
                        _type: 'airtable.update',
                        baseId: 'ENV.SMARTWASH_BASE_ID',
                        table: 'Bookings',
                        fields: {
                            'First line of address': {
                                _type: 'object.path',
                                path: 'create.data.service_form_values.firstLineOfAddress'
                            },
                            Postcode: {_type: 'object.path', path: 'create.data.service_form_values.postcode'},
                            'Car details': [
                                {
                                    _type: 'lookup',
                                    entity: 'bookings',
                                    entityId: {id: 'create.data.booking_id'},
                                    table: 'Car details'
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            when: '_type == "create" && entity == "booking_payments"',
            airtable: {
                recordId: {
                    mappedTo: {
                        entity: 'booking_payments',
                        entityId: {id: 'data.id'}
                    }
                },
                records: [
                    {
                        _type: 'airtable.create',
                        baseId: 'ENV.SMARTWASH_BASE_ID',
                        table: 'Booking payments',
                        fields: {
                            'Booking': [
                                {
                                    _type: 'lookup',
                                    entity: 'bookings',
                                    entityId: {id: 'data.booking_id'},
                                    table: 'Bookings'
                                }
                            ],
                            Amount: {_type: 'expression', expression: 'data.amount_in_minor_units / 100'},
                            "Stripe Payment ID": {_type: 'expression', expression: 'data.provider_transaction_id'},
                        }
                    }
                ]
            }
        },
        {
            when: '_type == "update" && entity == "bookings"',
            airtable: {
                recordId: {
                    mappedTo: {
                        entity: 'bookings',
                        entityId: {id: 'where.id'}
                    }
                },
                records: [
                    {
                        _type: 'airtable.update',
                        baseId: 'ENV.SMARTWASH_BASE_ID',
                        table: 'Bookings',
                        fields: {
                            Status: {_type: 'object.path', path: 'data.status'}
                        }
                    }
                ]
            }
        }
    ]
};