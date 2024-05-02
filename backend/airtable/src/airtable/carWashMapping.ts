import {AirtableMappingPlan} from "./airtableMappingTypes.js";

export const carWashMapping: AirtableMappingPlan = {
    _type: 'airtable.mapping.plan',
    mappings: [
        {
            when: '_type == "upsert" && create.entity == "add_on"',
            airtable: {
                recordId: {mappedTo: {entity: 'add_on', entityId: {id: 'create.data.id'}}},
                records: [
                    {
                        _type: 'airtable.upsert',
                        baseId: 'ENV.TEST_CARWASH_BASE_ID',
                        table: 'Add ons',
                        fields: {
                            Name: {_type: 'object.path', path: 'create.data.name', nullable: false},
                            Price: {_type: 'expression', expression: 'create.data.price / 10'}
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
                        baseId: 'ENV.TEST_CARWASH_BASE_ID',
                        table: 'Services',
                        fields: {
                            Name: {_type: 'object.path', path: 'create.data.name', nullable: false},
                            Description: {_type: 'object.path', path: 'create.data.description'},
                            Price: {_type: 'expression', expression: 'create.data.price / 10'}
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
                        baseId: 'ENV.TEST_CARWASH_BASE_ID',
                        table: 'Customers',
                        fields: {
                            'First name': {_type: 'object.path', path: 'create.data.first_name', nullable: false},
                            'Last name': {_type: 'object.path', path: 'create.data.last_name', nullable: false},
                            Email: {_type: 'object.path', path: 'create.data.email', nullable: false}
                        }
                    }
                ]
            }
        },
        {
            when: '_type == "upsert" && create.entity == "customer_form_values"',
            airtable: {
                recordId: {
                    mappedTo: {
                        entity: 'customers',
                        entityId: {id: 'create.data.customer_id'}
                    }
                },
                records: [
                    {
                        _type: 'airtable.update',
                        baseId: 'ENV.TEST_CARWASH_BASE_ID',
                        table: 'Customers',
                        fields: {
                            Phone: {_type: 'object.path', path: 'create.data.form_values.phone', nullable: false}
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
                        baseId: 'ENV.TEST_CARWASH_BASE_ID',
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
                            'Due Date': {_type: 'object.path', path: 'data.date'},
                            Time: {
                                _type: 'expression',
                                expression: 'data.start_time_24hr + " to " + data.end_time_24hr'
                            }
                        }
                    },
                    {
                        _type: 'airtable.create',
                        baseId: 'ENV.TEST_CARWASH_BASE_ID',
                        table: 'Booked services',
                        fields: {
                            Bookings: [{
                                _type: 'lookup',
                                entity: 'bookings',
                                entityId: {id: 'data.id'},
                                table: 'Bookings'
                            }],
                            Service: [{
                                _type: 'lookup',
                                entity: 'services',
                                entityId: {id: 'data.service_id'},
                                table: 'Services'
                            }]
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
                        baseId: 'ENV.TEST_CARWASH_BASE_ID',
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
                        baseId: 'ENV.TEST_CARWASH_BASE_ID',
                        table: 'Booked services',
                        fields: {
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
        }
    ]
};