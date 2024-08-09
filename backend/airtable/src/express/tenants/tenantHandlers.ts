import express from 'express';
import {
	DbForm,
	DbFormLabel,
	DbLocation,
	DbPackage,
	DbPackageImage,
	DbPackageLabel,
	DbPackageLocation,
	DbPackageLocationPrice,
	DbPricingRule,
	DbServiceLocation,
	DbServiceLocationPrice,
	DbServiceResourceRequirement,
	DbTenant,
	DbTenantBranding,
	DbTenantBrandingLabel,
	DbTenantImage,
	DbTenantSettings
} from '../../prisma/dbtypes.js';
import { Package, PackageLocation, Tenant } from '@breezbook/backend-api-types';
import { PrismaClient } from '@prisma/client';
import {
	EnvironmentId,
	jsonSchemaFormFns,
	JsonSchemaFormLabels,
	LanguageId,
	mandatory
} from '@breezbook/packages-types';
import { RequiredServiceData, toApiService } from '../services/serviceHandlers.js';
import {
	asHandler,
	EndpointDependencies,
	EndpointOutcome,
	environmentIdParam,
	expressBridge,
	httpResponseOutcome,
	languageIdParam,
	paramExtractor,
	ParamExtractor,
	productionDeps,
	query,
	RequestValueExtractor
} from '../../infra/endpoint.js';
import { RequestContext } from '../../infra/http/expressHttp4t.js';
import { responseOf } from '@breezbook/packages-http/dist/responses.js';
import { toDomainForm } from '../../prisma/dbToDomain.js';


type DbPackageLocationAndStuff = DbPackageLocation & { package_location_prices: DbPackageLocationPrice[] };
type DbPackageAndStuff = (DbPackage & {
	package_labels: DbPackageLabel[],
	package_images: DbPackageImage[],
	package_locations: DbPackageLocationAndStuff[]
})

type DbTenantAndStuff = DbTenant & {
	tenant_images: DbTenantImage[],
	locations: DbLocation[],
	tenant_branding: (DbTenantBranding & { tenant_branding_labels: DbTenantBrandingLabel[] })[],
	services: RequiredServiceData[],
	service_locations: (DbServiceLocation & { service_location_prices: DbServiceLocationPrice[] })[],
	service_resource_requirements: DbServiceResourceRequirement[],
	pricing_rules: DbPricingRule[],
	forms: (DbForm & { form_labels: DbFormLabel[] })[],
	tenant_settings: DbTenantSettings[],
	packages: DbPackageAndStuff[]
};

function toApiPackage(p: DbPackageAndStuff):Package {
	const labels = mandatory(p.package_labels[0], `Expected exactly one label for package ${p.id}, got ${p.package_labels.length}`);
	return {
		id: p.id,
		name: labels.name,
		slug: p.slug,
		description: labels.description,
		image: p.package_images.length > 0 ? p.package_images[0].public_image_url : 'https://picsum.photos/800/450',
	};
}

function toApiPackageLocation(p: DbPackageAndStuff, pl: DbPackageLocationAndStuff):PackageLocation {
	const prices = pl.package_location_prices.map(plp => {
		const priceWithNoDecimalPlaces = (typeof plp.price === 'object' && 'toNumber' in plp.price) ? plp.price.toNumber() : plp.price;
		return ({ priceCurrency: plp.price_currency, priceWithNoDecimalPlaces });
	})
	return {
		packageId: p.id,
		locationId: pl.location_id,
		prices
	}
}

function toApiTenant(tenant: DbTenantAndStuff): Tenant {
	const tenantImages: DbTenantImage[] = tenant.tenant_images ?? [];
	const branding = mandatory(tenant.tenant_branding[0], `Expected exactly one branding record for tenant, got ${tenant.tenant_branding.length}`);
	const brandingLabels = mandatory(branding.tenant_branding_labels[0], `Expected exactly one branding label record for tenant, got ${branding.tenant_branding_labels.length}`);
	const tenantSettings = mandatory(tenant.tenant_settings[0], `Expected exactly one settings record for tenant, got ${tenant.tenant_settings.length}`);
	const customerForm = tenant.forms.find(f => f.id === tenantSettings.customer_form_id) ?? null;

	return {
		id: tenant.tenant_id,
		name: tenant.name,
		slug: tenant.slug,
		description: brandingLabels.description,
		heading: brandingLabels.headline,
		heroImage: tenantImages.length > 0 ? tenantImages[0].public_image_url : 'https://picsum.photos/800/450',
		locations: tenant.locations.map(l => ({ id: l.id, slug: l.slug, name: l.name })),
		theme: branding.theme,
		services: tenant.services.map(s => toApiService(s, tenant.service_resource_requirements, tenant.pricing_rules.length > 0)),
		serviceLocations: tenant.service_locations.map(sl => {
			const prices = sl.service_location_prices.map(slp => {
				const priceWithNoDecimalPlaces = (typeof slp.price === 'object' && 'toNumber' in slp.price) ? slp.price.toNumber() : slp.price;
				return ({ priceCurrency: slp.price_currency, priceWithNoDecimalPlaces });
			});
			return ({ serviceId: sl.service_id, locationId: sl.location_id, prices });
		}),
		packages: tenant.packages.map(p => toApiPackage(p)),
		packageLocations: tenant.packages.flatMap(p => p.package_locations.map(pl => toApiPackageLocation(p,pl))),
		customerForm: customerForm ? toDomainForm(customerForm) : null,
		forms: tenant.forms.map(dbForm => {
			const labels = mandatory(dbForm.form_labels[0], `Expected exactly one form label record for form ${dbForm.id}, got ${dbForm.form_labels.length}`);
			const domainLabels = labels.labels as any as JsonSchemaFormLabels;
			if (domainLabels._type !== 'json.schema.form.labels') {
				throw new Error(`Expected json.schema.form.labels, got ${domainLabels._type}`);
			}
			const form = jsonSchemaFormFns.applyLabels(toDomainForm(dbForm), domainLabels);
			return ({ form, labels: domainLabels });
		})
	};
}

function slugQueryParam(requestValue: RequestValueExtractor = query('slug')): ParamExtractor<string> {
	return paramExtractor('slug', requestValue.extractor, (s) => s);
}

async function findTenantAndLocations(prisma: PrismaClient, slug: string, environment_id: string, language_id: string): Promise<DbTenantAndStuff | null> {
	const tenant: DbTenantAndStuff | null = await prisma.tenants.findUnique({
		where: {
			slug
		},
		include: {
			tenant_images: {
				where: {
					environment_id
				}
			},
			tenant_settings: {
				where: {
					environment_id
				}
			},
			forms: {
				where: {
					environment_id
				},
				include: {
					form_labels: {
						where: {
							language_id
						}
					}
				}
			},
			packages: {
				where: {
					environment_id
				},
				include: {
					package_labels: {
						where: {
							language_id
						}
					},
					package_images: true,
					package_locations: {
						where: {
							environment_id
						},
						include: {
							package_location_prices: true
						}
					}
				}
			},
			services: {
				where: {
					environment_id
				},
				include: {
					service_images: true,
					service_labels: {
						where: {
							language_id
						}
					},
					service_schedule_config: true,
					service_resource_requirements: true,
					service_forms: true,
					service_add_ons: {
						include: {
							add_on: {
								include: {
									add_on_labels: {
										where: {
											language_id
										}
									},
									add_on_images: true
								}
							}
						}
					},
					service_service_options: {
						include: {
							service_options: {
								include: {
									service_option_labels: {
										where: {
											language_id
										}
									},
									service_option_images: true,
									service_option_resource_requirements: true,
									service_option_forms: true
								}
							}
						}
					}
				}
			},
			service_locations: {
				where: {
					environment_id
				},
				include: {
					service_location_prices: {
						where: {
							environment_id
						}
					}
				}
			},
			service_resource_requirements: {
				where: {
					environment_id
				}
			},
			tenant_branding: {
				where: {
					environment_id
				},
				include: {
					tenant_branding_labels: {
						where: {
							language_id
						}
					}
				}
			},
			locations: {
				where: {
					environment_id
				}
			},
			pricing_rules: {
				where: {
					environment_id
				}
			}
		}
	});
	if (tenant) {
		for (const service of tenant.services) {
			if (service.service_labels.length === 0) {
				throw new Error(`No service label found for service ${service.id}, language ${language_id}`);
			}
		}
	}
	return tenant;
}

export async function onGetTenantRequestExpress(req: express.Request, res: express.Response): Promise<void> {
	await expressBridge(productionDeps, onGetTenantRequestEndpoint, req, res);
}

export async function onGetTenantRequestEndpoint(deps: EndpointDependencies, req: RequestContext): Promise<EndpointOutcome[]> {
	return asHandler(deps, req).withThreeRequestParams(environmentIdParam(), slugQueryParam(), languageIdParam(), getTenant);
}

async function getTenant(deps: EndpointDependencies, environmentId: EnvironmentId, slug: string, languageId: LanguageId): Promise<EndpointOutcome[]> {
	const tenant = await findTenantAndLocations(deps.prisma, slug, environmentId.value, languageId.value);
	if (!tenant) {
		return [httpResponseOutcome(responseOf(404))];
	}
	return [httpResponseOutcome(responseOf(200, JSON.stringify(toApiTenant(tenant)), ['Content-Type', 'application/json']))];

}
