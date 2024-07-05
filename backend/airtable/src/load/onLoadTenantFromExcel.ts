import express from "express";
import {
    asHandler,
    EndpointDependencies,
    EndpointOutcome,
    environmentIdParam,
    expressBridge,
    httpResponseOutcome,
    postedFile,
    productionDeps
} from "../infra/endpoint.js";
import {PostedFile, RequestContext} from "../infra/http/expressHttp4t.js";
import {responseOf} from "@breezbook/packages-http/dist/responses.js";
import * as XLSX from 'xlsx';
import {WorkBook} from 'xlsx';
import {EnvironmentId, JsonSchemaForm, languages, mandatory, TenantId, tenantId} from "@breezbook/packages-types";
import {Upsert} from "../mutation/mutations.js";
import {
    makeId,
    upsertAddOn,
    upsertBusinessHours,
    upsertForm,
    upsertLocation,
    upsertResource,
    upsertResourceAvailability,
    upsertResourceType,
    upsertService,
    upsertServiceForm,
    upsertServiceLabel,
    upsertServiceResourceRequirement,
    upsertTenant,
    upsertTenantSettings,
    upsertTimeslot
} from "../prisma/breezPrismaMutations.js";
import {z, ZodType} from 'zod';

export async function onLoadTenantFromExcel(req: express.Request, res: express.Response): Promise<void> {
    await expressBridge(productionDeps, onLoadTenantFromExcelEndpoint, req, res)
}

async function onLoadTenantFromExcelEndpoint(deps: EndpointDependencies, request: RequestContext): Promise<EndpointOutcome[]> {
    return asHandler(deps, request).withTwoRequestParams(environmentIdParam(), postedFile('file'), loadTenantFromExcel)
}

function toJson<T>(workbook: WorkBook, sheetName: string, type: ZodType): T[] {
    const jsons = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
    return jsons.map((json: any) => type.parse(json))
}

const TenantSettingsSchema = z.object({
    "Tenant ID": z.string(),
    "Name": z.string(),
    "Customer Form ID": z.string(),
    "Timezone": z.string(),
    "Hero": z.string(),
    "Description": z.string(),
    "Headline": z.string(),
    "Theme": z.any()
});
type TenantSettings = z.infer<typeof TenantSettingsSchema>;

const LocationsSchema = z.object({
    "ID": z.string(),
    "Name": z.string(),
    "Slug": z.string(),
});
type Location = z.infer<typeof LocationsSchema>;

const BusinessHoursSchema = z.object({
    "Day of week": z.string(),
    "Start time": z.string(),
    "End time": z.string(),
});
type BusinessHours = z.infer<typeof BusinessHoursSchema>;

const ResourcesSchema = z.object({
    "ID": z.string(),
    "Name": z.string(),
    "Type": z.string()
});

type Resource = z.infer<typeof ResourcesSchema>;

const TimeslotsSchema = z.object({
    "Name": z.string(),
    "Start time": z.string(),
    "End time": z.string(),
});
type Timeslot = z.infer<typeof TimeslotsSchema>;

const ResourceAvailabilitySchema = z.object({
    "Resource ID": z.string(),
    "Day of week": z.string(),
    "Start time": z.string(),
    "End time": z.string(),
});
type ResourceAvailability = z.infer<typeof ResourceAvailabilitySchema>;
const AddOnSchema = z.object({
    "ID": z.string(),
    "Name": z.string(),
    "Price": z.string(),
    "Description": z.string(),
});
type AddOn = z.infer<typeof AddOnSchema>;

const FormsSchema = z.object({
    "ID": z.string(),
    "Name": z.string(),
    "Description": z.string(),
    "Definition JSON": z.any(),
});
type Form = z.infer<typeof FormsSchema>;
const ServicesSchema = z.object({
    "ID": z.string(),
    "Name": z.string(),
    "Price": z.string(),
    "Description": z.string(),
    "Resource Type Required": z.string(),
    "Requires Timeslot": z.string(),
    "Service Forms": z.string(),
    "Thumbnail": z.string(),
    "Location ID": z.string(),
});
type Service = z.infer<typeof ServicesSchema>;


function makeTenantUpserts(theTenantId: TenantId, environmentId: EnvironmentId, workbook: XLSX.WorkBook): Upsert<any, any, any>[] {
    const tenantSettingsData = toJson<TenantSettings>(workbook, 'Tenant Settings', TenantSettingsSchema);
    const locationData = toJson<Location>(workbook, 'Locations', LocationsSchema);
    const businessHoursData = toJson<BusinessHours>(workbook, 'Business Hours', BusinessHoursSchema);
    const timeslotData = toJson<Timeslot>(workbook, 'Timeslots', TimeslotsSchema);
    const resourceData = toJson<Resource>(workbook, 'Resources', ResourcesSchema);
    const resourceAvailabilityData = toJson<ResourceAvailability>(workbook, 'Resource Availability', ResourceAvailabilitySchema);
    const addOnData = toJson<AddOn>(workbook, 'Add-Ons', AddOnSchema);
    const formData = toJson<Form>(workbook, 'Forms', FormsSchema);
    const serviceData = toJson<Service>(workbook, 'Services', ServicesSchema);

    const tenant_id = theTenantId.value;
    const environment_id = environmentId.value;

    const tenantUpserts = tenantSettingsData.map(ts => upsertTenant({
        tenant_id,
        name: ts.Name,
        slug: theTenantId.value,
    }))

    const locationsUpserts = locationData.map(l => upsertLocation({
        id: makeId(environment_id, "locations"),
        tenant_id,
        environment_id,
        name: l.Name,
        slug: l.Slug,
    }))

    const businessHoursUpserts = businessHoursData.map(bh => upsertBusinessHours({
        id: makeId(environment_id, "business_hours"),
        tenant_id,
        environment_id,
        day_of_week: bh["Day of week"],
        start_time_24hr: bh["Start time"],
        end_time_24hr: bh["End time"]
    }))

    const timeslotUpserts = timeslotData.map(ts => upsertTimeslot({
        id: makeId(environment_id, "timeslots"),
        tenant_id,
        environment_id,
        description: ts["Start time"] + " - " + ts["End time"],
        start_time_24hr: ts["Start time"],
        end_time_24hr: ts["End time"]
    }));

    const resourceTypes = Array.from(new Set(resourceData.map(r => r.Type)));
    const resourceTypeUpserts = resourceTypes.map(rt => upsertResourceType({
            id: makeId(environment_id, "resource_types"),
            tenant_id,
            environment_id,
            name: rt
        }
    ));
    const resourceUpserts = resourceData.map(r => {
        const resourceTypeUpsert = mandatory(resourceTypeUpserts.find(rt => rt.create.data.name === r.Type), `Resource Type not found for resource ${r.Name}`);
        return upsertResource({
            id: makeId(environment_id, "resources"),
            tenant_id,
            environment_id,
            name: r.Name,
            resource_type: resourceTypeUpsert.create.data.id
        });
    })
    const resourceAvailabilityUpserts = resourceAvailabilityData.map(ra => {
        const resourceUpsert = mandatory(resourceUpserts.find(r => r.create.data.name === ra["Resource ID"]), `Resource not found for resource availability ${ra["Resource ID"]}`);
        return upsertResourceAvailability({
            id: makeId(environment_id, "resource_availability"),
            tenant_id,
            environment_id,
            resource_id: resourceUpsert.create.data.id,
            day_of_week: ra["Day of week"],
            start_time_24hr: ra["Start time"],
            end_time_24hr: ra["End time"]
        });
    });
    const addOnUpserts = addOnData.map(ao => upsertAddOn({
        id: makeId(environment_id, "add_ons"),
        tenant_id,
        environment_id,
        name: ao.Name,
        price: ao.Price,
        price_currency: "GBP",
        expect_quantity: false,
        description: ao.Description
    }));
    const formUpserts = formData.map(f => upsertForm({
        id: makeId(environment_id, "forms"),
        tenant_id,
        environment_id,
        name: f.Name,
        description: f.Description ?? f.Name,
        definition: f["Definition JSON"]
    }));
    const tenantSettingsUpserts = tenantSettingsData.map(ts => {
        const contactDetailsForm = mandatory(formUpserts.find(f => {
            const form = JSON.parse(f.create.data.definition as any) as JsonSchemaForm;
            return form.id.value === ts["Customer Form ID"];
        }), `Form not found for tenant settings ${ts["Customer Form ID"]}`);
        return upsertTenantSettings({
                tenant_id,
                environment_id,
                customer_form_id: contactDetailsForm.create.data.id,
                iana_timezone: ts.Timezone
            }
        );
    })
    const allAddOnIds = addOnUpserts.map(ao => ao.create.data.id);
    const serviceUpserts = serviceData.flatMap(s => {
        const resourceTypeUpsert = mandatory(resourceTypeUpserts.find(rt => rt.create.data.name === s["Resource Type Required"]), `Resource Type not found for service ${s.Name}`);
        const formUpsert = mandatory(formUpserts.find(f => f.create.data.name === s["Service Forms"]), `Form not found for service ${s.Name}`);
        const serviceUpsert = upsertService({
            id: makeId(environment_id, "services"),
            tenant_id,
            environment_id,
            slug: s.ID,
            duration_minutes: 120,
            price: s.Price,
            price_currency: "GBP",
            permitted_add_on_ids: allAddOnIds,
            requires_time_slot: s["Requires Timeslot"] === "Y",
        })
        return [
            serviceUpsert,
            upsertServiceLabel({
                tenant_id,
                environment_id,
                language_id: languages.en.value,
                service_id: serviceUpsert.create.data.id,
                name: s.Name,
                description: s.Description
            }),
            upsertServiceResourceRequirement({
                id: makeId(environment_id, "service_resource_requirements"),
                tenant_id,
                environment_id,
                service_id: serviceUpsert.create.data.id,
                requirement_type: 'any_suitable',
                resource_type: resourceTypeUpsert.create.data.id
            }),
            upsertServiceForm({
                tenant_id,
                environment_id,
                service_id: serviceUpsert.create.data.id,
                form_id: formUpsert.create.data.id,
                rank: 0
            })
        ];
    })

    return [
        ...tenantUpserts,
        ...locationsUpserts,
        ...businessHoursUpserts,
        ...timeslotUpserts,
        ...resourceTypeUpserts,
        ...resourceUpserts,
        ...resourceAvailabilityUpserts,
        ...addOnUpserts,
        ...formUpserts,
        ...tenantSettingsUpserts,
        ...serviceUpserts
    ]
}

async function loadTenantFromExcel(deps: EndpointDependencies, environmentId: EnvironmentId, file: PostedFile): Promise<EndpointOutcome[]> {
    const workbook: XLSX.WorkBook = XLSX.read(file.buffer, {type: 'buffer'});
    const tenantSettingsWorksheet: XLSX.WorkSheet = workbook.Sheets['Tenant Settings'];
    const sheetData: any[] = XLSX.utils.sheet_to_json(tenantSettingsWorksheet);
    const theTenantId = tenantId(mandatory(sheetData[0]['Tenant ID'], 'Tenant ID not found in Excel file'));
    const upserts = makeTenantUpserts(theTenantId, environmentId, workbook);
    console.log({upserts})
    return [httpResponseOutcome(responseOf(200, 'OK'))]
}
