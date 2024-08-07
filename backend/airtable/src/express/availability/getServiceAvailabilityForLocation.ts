import express from 'express';
import {
	asHandler,
	date,
	EndpointDependencies,
	EndpointOutcome,
	expressBridge,
	httpResponseOutcome,
	ParamExtractor,
	productionDeps,
	query,
	serviceIdParam,
	tenantEnvironmentLocationParam
} from '../../infra/endpoint.js';
import { byLocation } from '../../availability/byLocation.js';
import { addOnOrder, AddOnOrder, failure, Failure, success } from '@breezbook/packages-core';
import {
	addOnId,
	resourceId,
	ResourceId,
	resourceRequirementId,
	ResourceRequirementId,
	ServiceId,
	serviceOptionId,
	ServiceOptionRequest,
	TenantEnvironmentLocation
} from '@breezbook/packages-types';
import { RequestContext } from '../../infra/http/expressHttp4t.js';
import { HttpResponse } from '@breezbook/packages-http/dist/contract.js';
import { responseOf } from '@breezbook/packages-http/dist/responses.js';
import { api } from '@breezbook/backend-api-types';
import { getAvailabilityForService } from '../../availability/getAvailabilityForService.js';
import serviceAvailabilityOptions = api.serviceAvailabilityOptions;
import { IsoDate } from '@breezbook/packages-date-time';

interface RequirementOverride {
	requirementId: ResourceRequirementId;
	resourceId: ResourceId;
}

export function requirementOverride(requirementId: string, aResourceId: string): RequirementOverride {
	return { requirementId: resourceRequirementId(requirementId), resourceId: resourceId(aResourceId) };
}

export interface ServiceAvailabilityRequest {
	serviceId: ServiceId;
	fromDate: IsoDate;
	toDate: IsoDate;
	requirementOverrides: RequirementOverride[];
	serviceOptionRequests: ServiceOptionRequest[];
	addOns: AddOnOrder[];
}

export function serviceAvailabilityRequest(serviceId: ServiceId, fromDate: IsoDate, toDate: IsoDate, addOns: AddOnOrder[] = [], requirementOverrides: RequirementOverride[] = [], serviceOptionRequests: ServiceOptionRequest[] = []): ServiceAvailabilityRequest {
	return {
		serviceId,
		fromDate,
		toDate,
		requirementOverrides,
		serviceOptionRequests,
		addOns
	};
}

function serviceAvailabilityOptionParam(): ParamExtractor<api.ServiceAvailabilityOptions> {
	return (req: RequestContext) => {
		const bodyJson = req.request.body as any;
		if (Object.keys(bodyJson).length === 0) {
			return success(serviceAvailabilityOptions([], [], []));
		}
		if (!api.isServiceAvailabilityOptions(bodyJson)) {
			return failure(responseOf(400, `body is not a serviceOptionRequests type`));
		}
		return success(bodyJson);
	};
}

export function serviceAvailabilityRequestParam(): ParamExtractor<ServiceAvailabilityRequest> {
	return (req: RequestContext) => {
		const params = [serviceIdParam()(req), date(query('fromDate'))(req), date(query('toDate'))(req), serviceAvailabilityOptionParam()(req)];
		const firstFailure = params.find(p => p._type === 'failure');
		if (firstFailure) {
			return firstFailure as Failure<HttpResponse>;
		}
		const serviceOptionRequests = params[3]?.value as api.ServiceAvailabilityOptions;
		return success({
			serviceId: params[0]?.value,
			fromDate: params[1]?.value,
			toDate: params[2]?.value,
			requirementOverrides: serviceOptionRequests.requirementOverrides.map(ro => ({
				requirementId: resourceRequirementId(ro.requirementId),
				resourceId: resourceId(ro.resourceId)
			})),
			serviceOptionRequests: serviceOptionRequests.serviceOptionRequests.map(sor => ({
				serviceOptionId: serviceOptionId(sor.serviceOptionId),
				quantity: sor.quantity
			})),
			addOns: serviceOptionRequests.addOns.map(ao => addOnOrder(addOnId(ao.addOnId), ao.quantity))
		} as ServiceAvailabilityRequest);
	};
}

export async function onGetServiceAvailabilityForLocationExpress(req: express.Request, res: express.Response): Promise<void> {
	await expressBridge(productionDeps, getServiceAvailabilityForLocationEndpoint, req, res);
}

export async function getServiceAvailabilityForLocationEndpoint(deps: EndpointDependencies, req: RequestContext): Promise<EndpointOutcome[]> {
	return asHandler(deps, req).withTwoRequestParams(tenantEnvironmentLocationParam(), serviceAvailabilityRequestParam(), getServiceAvailabilityForLocation);
}

export async function getServiceAvailabilityForLocation(deps: EndpointDependencies, tenantEnvLoc: TenantEnvironmentLocation, request: ServiceAvailabilityRequest): Promise<EndpointOutcome[]> {
	const serviceOptionIds = request.serviceOptionRequests.map(sor => sor.serviceOptionId.value);
	console.log(
		`Getting availability for location ${tenantEnvLoc.locationId.value}, tenant ${tenantEnvLoc.tenantId.value} and service ${request.serviceId.value} with service option ids '${serviceOptionIds.join(',')}' from ${request.fromDate.value} to ${request.toDate.value} in environment ${tenantEnvLoc.environmentId.value}`
	);
	const everythingForTenant = await byLocation.getEverythingForAvailability(deps.prisma, tenantEnvLoc, request.fromDate, request.toDate);
	const availabilityOutcome = getAvailabilityForService(everythingForTenant, request);
	if (availabilityOutcome._type === 'error.response') {
		return [httpResponseOutcome(responseOf(400, JSON.stringify(availabilityOutcome.errorMessage), ['Content-Type', 'application/json']))];
	}
	return [httpResponseOutcome(responseOf(200, JSON.stringify(availabilityOutcome), ['Content-Type', 'application/json']))];
}
