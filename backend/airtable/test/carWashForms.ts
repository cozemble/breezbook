import {JsonSchemaForm} from "../../../src/types.js";

export const carwashForm: JsonSchemaForm = {
    "_type": "json.schema.form",
    "id": {"_type": "form.id", "value": "car-details-form"},
    "name": "Car Details Form",
    "schema": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
            "make": {
                "type": "string",
                "description": "The manufacturer of the car.",
            },
            "model": {
                "type": "string",
                "description": "The model of the car."
            },
            "colour": {
                "type": "string",
                "description": "The colour of the car."
            },
            "year": {
                "type": "integer",
                "description": "The year of the car."
            },
            "firstLineOfAddress": {
                "type": "string",
                "description": "The first line of the address where the car will be."
            },
            "postcode": {
                "type": "string",
                "description": "The postcode where the car will be."
            }
        },
        "required": ["make", "model", "colour", "year", "firstLineOfAddress", "postcode"],
        "additionalProperties": false
    },
}
const customerForm: JsonSchemaForm = {
    "_type": "json.schema.form",
    "id": {"_type": "form.id", "value": "customer-details-form"},
    "name": "Customer Details Form",
    "schema": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
            "phone": {
                "type": "string",
                "description": "Your phone number.",
            },
        },
        "required": ["phone"],
        "additionalProperties": false
    },
}