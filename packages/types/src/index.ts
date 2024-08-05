import { v4 as uuidv4, v4 as uuid } from 'uuid';
import { TwentyFourHourClockTime } from '@breezbook/packages-date-time';

export interface ValueType<T> {
	_type: unknown;
	value: T;
}

type IdLike = { value: string };

export interface Identified {
	id: IdLike;
}

export const byId = {
	find<I extends IdLike, T extends Identified>(items: T[], id: I): T {
		const found = items.find(i => i.id.value === id.value);
		if (!found) {
			throw new Error(`No item with id ${id.value}`);
		}
		return found;
	},
	maybeFind(items: Identified[], id: string): Identified | null {
		return items.find(i => i.id.value === id) || null;
	}
};

export const values = {
	isEqual: (value1: ValueType<unknown>, value2: ValueType<unknown>): boolean => {
		return value1.value === value2.value && value1._type === value2._type;
	},
	allSame(vs: ValueType<any>[]): boolean {
		return vs.every((v, i, arr) => values.isEqual(v, arr[0]));
	}
};

export interface EnvironmentId extends ValueType<string> {
	_type: 'environment.id';
}

export function environmentId(value: string): EnvironmentId {
	return {
		_type: 'environment.id',
		value
	};
}

export interface TenantId extends ValueType<string> {
	_type: 'tenant.id';
}

export interface Minutes extends ValueType<number> {
	_type: 'minutes';
}

export function tenantId(value: string): TenantId {
	return {
		_type: 'tenant.id',
		value
	};
}

export interface LanguageId extends ValueType<string> {
	_type: 'language.id';
}

export function languageId(value: string): LanguageId {
	return {
		_type: 'language.id',
		value
	};
}

export const languages = {
	en: languageId('en'),
	tr: languageId('tr')
};

export interface LocationId extends ValueType<string> {
	_type: 'location.id';
}

export function locationId(value: string): LocationId {
	return {
		_type: 'location.id',
		value
	};
}

export interface TenantEnvironment {
	_type: 'tenant.environment';
	environmentId: EnvironmentId;
	tenantId: TenantId;
}

export function tenantEnvironment(environmentId: EnvironmentId, tenantId: TenantId): TenantEnvironment {
	return {
		_type: 'tenant.environment',
		environmentId,
		tenantId
	};
}

export interface TenantEnvironmentLocation {
	_type: 'tenant.environment.location';
	environmentId: EnvironmentId;
	tenantId: TenantId;
	locationId: LocationId;
}

export function tenantEnvironmentLocation(environmentId: EnvironmentId, tenantId: TenantId, locationId: LocationId): TenantEnvironmentLocation {
	return {
		_type: 'tenant.environment.location',
		environmentId,
		tenantId,
		locationId
	};
}

export interface ServiceId extends ValueType<string> {
	_type: 'service.id';
}


export function resourceType(value: string): ResourceType {
	return {
		_type: 'resource.type',
		value
	};
}

export const resourceTypeFns = {
	findByValue(resourceTypes: ResourceType[], value: string): ResourceType {
		const found = resourceTypes.find(rt => rt.value === value);
		if (!found) {
			throw new Error(`No resource type with value ${value}`);
		}
		return found;
	}
};

export interface ResourceType extends ValueType<string> {
	_type: 'resource.type';
}

export interface BookingId extends ValueType<string> {
	_type: 'booking.id';
}

export function bookingId(value = uuidv4()): BookingId {
	return {
		_type: 'booking.id',
		value
	};
}

export interface ResourceId extends ValueType<string> {
	_type: 'resource.id';
}

export function serviceId(value = uuidv4()): ServiceId {
	return {
		_type: 'service.id',
		value
	};
}

export interface ExactTimeAvailability {
	_type: 'exact.time.availability';
	time: TwentyFourHourClockTime;
}

export function exactTimeAvailability(time: TwentyFourHourClockTime): ExactTimeAvailability {
	return {
		_type: 'exact.time.availability',
		time
	};
}

export interface Id extends ValueType<string> {
	_type: 'id';
}

export function id(value = uuid()): Id {
	if (value === null || value === undefined) {
		throw new Error('id value cannot be null or undefined');
	}
	return {
		_type: 'id',
		value
	};
}

export const makeId = id;

export interface Email extends ValueType<string> {
	_type: 'email';
}

export function email(value: string): Email {
	return {
		_type: 'email',
		value
	};
}

export interface PhoneNumber extends ValueType<string> {
	_type: 'phone.number';
}

export function phoneNumber(e164: string): PhoneNumber {
	const regEx = /^\+[1-9]\d{1,14}$/;
	if (!e164.match(regEx)) {
		throw new Error(`Invalid phone number format ${e164}. Expected E.164 format`);
	}
	return {
		_type: 'phone.number',
		value: e164
	};
}

export interface Capacity extends ValueType<number> {
	_type: 'capacity';
}

export function capacity(value: number): Capacity {
	return {
		_type: 'capacity',
		value
	};
}

export const capacityFns = {
	sum: (a: Capacity, ...others: Capacity[]) => capacity(a.value + others.reduce((acc, c) => acc + c.value, 0))
};

export function resourceId(value = uuidv4()): ResourceId {
	return {
		_type: 'resource.id',
		value
	};
}

export interface AddOnId extends ValueType<string> {
	_type: 'add.on.id';
}

export function addOnId(value: string): AddOnId {
	return {
		_type: 'add.on.id',
		value
	};
}


export interface FormId extends ValueType<string> {
	_type: 'form.id';
}

export function formId(value = uuidv4()): FormId {
	return {
		_type: 'form.id',
		value
	};
}

export interface JsonSchemaForm {
	_type: 'json.schema.form';
	id: FormId;
	name: string;
	description?: string;
	schema: unknown;
}

export function jsonSchemaForm(id: FormId, name: string, schema: unknown, description?: string): JsonSchemaForm {
	return {
		_type: 'json.schema.form',
		id,
		name,
		schema,
		description
	};
}

export const jsonSchemaFormFns = {
	extractLabels: (form: JsonSchemaForm, languageId: LanguageId): JsonSchemaFormLabels => {
		const schema = form.schema as any;
		const keyLabels = Object.keys(schema.properties).map(key => {
			const itemDef = schema.properties[key];
			return schemaKeyLabel(key, key, itemDef.description);
		});
		return jsonSchemaFormLabels(form.id, languageId, form.name, keyLabels, form.description);
	},
	applyLabels(form: JsonSchemaForm, labels: JsonSchemaFormLabels) {
		const schema = form.schema as any;
		const propertyKeys = Object.keys(schema.properties);
		const labeledProperties = propertyKeys.reduce((acc, key) => {
			const itemDef = schema.properties[key];
			const label = labels.schemaKeyLabels.find(sl => sl.schemaKey === key);
			if (!label) {
				return { ...acc, [key]: itemDef };
			}
			return {
				...acc,
				[key]: {
					...itemDef,
					title: label.label,
					description: label.description
				}
			};
		}, {});
		return {
			...form,
			name: labels.name,
			description: labels.description,
			schema: {
				...schema,
				properties: labeledProperties
			}
		};
	}
};

export interface SchemaKeyLabel {
	_type: 'schema.key.label';
	schemaKey: string;
	label: string;
	description?: string;
}

export function schemaKeyLabel(schemaKey: string, label: string, description?: string): SchemaKeyLabel {
	return {
		_type: 'schema.key.label',
		schemaKey,
		label,
		description
	};
}

export interface JsonSchemaFormLabels {
	_type: 'json.schema.form.labels';
	formId: FormId;
	languageId: LanguageId;
	name: string;
	description?: string;
	schemaKeyLabels: SchemaKeyLabel[];
}

export function jsonSchemaFormLabels(formId: FormId, languageId: LanguageId, name: string, schemaKeyLabels: SchemaKeyLabel[], description?: string): JsonSchemaFormLabels {
	return {
		_type: 'json.schema.form.labels',
		formId,
		languageId,
		name,
		description,
		schemaKeyLabels
	};
}

export type Form = JsonSchemaForm;

export interface CouponCode extends ValueType<string> {
	_type: 'coupon.code';
}

export function couponCode(value: string): CouponCode {
	return {
		_type: 'coupon.code',
		value
	};
}

export interface CouponId extends ValueType<string> {
	_type: 'coupon.id';
}

export function couponId(value: string): CouponId {
	return {
		_type: 'coupon.id',
		value
	};
}


export interface OrderId extends ValueType<string> {
	_type: 'order.id';
}

export function orderId(value = uuid()): OrderId {
	return {
		_type: 'order.id',
		value
	};
}

export interface ResourceRequirementId extends ValueType<string> {
	_type: 'resource.requirement.id';
}

export function resourceRequirementId(value = uuidv4()): ResourceRequirementId {
	return {
		_type: 'resource.requirement.id',
		value
	};
}

export function mandatory<T>(value: T | undefined | null, errorMessage: string): T {
	if (value === null || value === undefined) {
		throw new Error(errorMessage);
	}
	return value as T;
}

export type Metadata = Record<string, string | number | boolean>

export interface ServiceOptionId extends ValueType<string> {
	_type: 'service.option.id';
}

export function serviceOptionId(value: string): ServiceOptionId {
	return {
		_type: 'service.option.id',
		value
	};
}


export interface ServiceOptionRequest {
	serviceOptionId: ServiceOptionId;
	quantity: number;
}

export function serviceOptionRequest(serviceOptionId: ServiceOptionId, quantity = 1): ServiceOptionRequest {
	return {
		serviceOptionId,
		quantity
	};
}

export interface KeyValue {
	_type: 'key.value';
	key: string;
	value: string;
}

export function keyValue(key: string, value: string): KeyValue {
	return {
		_type: 'key.value',
		key,
		value
	};
}

