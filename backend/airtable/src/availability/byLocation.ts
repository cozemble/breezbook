import {
    DbBlockedTime,
    DbBusinessHours,
    DbLocation,
    DbResourceAvailability,
    DbService,
    DbServiceLocation,
    DbTimeSlot,
    findManyForTenant
} from "../prisma/dbtypes.js";
import {PrismaClient} from "@prisma/client";
import {IsoDate, tenantEnvironment, TenantEnvironmentLocation} from "@breezbook/packages-types";
import {
    AvailabilityData,
    convertAvailabilityDataIntoEverythingForAvailability,
    EverythingForAvailability
} from "../express/getEverythingForAvailability.js";

export type LocationAndServices = DbLocation & {
    service_locations: (DbServiceLocation & {
        services: DbService
    })[]
}
export const byLocation = {
    async findServices(
        prisma: PrismaClient,
        location: TenantEnvironmentLocation
    ): Promise<LocationAndServices | null> {
        return await prisma.locations.findFirst({
            where: {
                tenant_id: location.tenantId.value,
                environment_id: location.environmentId.value,
                id: location.locationId.value
            },
            include: {
                service_locations: {
                    include: {services: true}
                },
            }
        });
    },
    async findBusinessHours(prisma: PrismaClient,
                            location: TenantEnvironmentLocation): Promise<DbBusinessHours[]> {
        const hours = await prisma.business_hours.findMany({
            where: {
                tenant_id: location.tenantId.value,
                environment_id: location.environmentId.value,
                OR: [
                    {
                        location_id: location.locationId.value
                    }, {
                        location_id: null
                    }]
            }
        })
        if (hours.some(h => h.location_id === location.locationId.value)) {
            return hours.filter(h => h.location_id === location.locationId.value)
        }
        return hours

    },
    async findBlockedime(prisma: PrismaClient, location: TenantEnvironmentLocation, fromDate: IsoDate, toDate: IsoDate): Promise<DbBlockedTime[]> {
        return await prisma.blocked_time.findMany({
            where: {
                tenant_id: location.tenantId.value,
                environment_id: location.environmentId.value,
                date: {
                    gte: fromDate.value,
                    lte: toDate.value
                },
                OR: [
                    {
                        location_id: location.locationId.value
                    }, {
                        location_id: null
                    }]

            }
        })
    },

    async findResourceAvailability(prisma: PrismaClient, location: TenantEnvironmentLocation): Promise<DbResourceAvailability[]> {
        return await prisma.resource_availability.findMany({
            where: {
                tenant_id: location.tenantId.value,
                environment_id: location.environmentId.value,
                OR: [
                    {
                        location_id: location.locationId.value
                    }, {
                        location_id: null
                    }]
            }
        })
    },

    async gatherAvailabilityData(prisma: PrismaClient, location: TenantEnvironmentLocation, fromDate: IsoDate, toDate: IsoDate): Promise<AvailabilityData> {
        const tenantEnv = tenantEnvironment(location.environmentId, location.tenantId)
        const dateWhereOpts = {date: {gte: fromDate.value, lte: toDate.value}};
        const findMany = findManyForTenant(tenantEnv);

        const services = await byLocation.findServices(prisma, location).then(l => l ? l.service_locations.map(s => s.services) : [])

        const serviceResourceRequirements = await findMany(prisma.service_resource_requirements, {});
        const resourceTypes = await findMany(prisma.resource_types, {});
        const businessHours = await byLocation.findBusinessHours(prisma, location);
        const blockedTime = await byLocation.findBlockedime(prisma, location, fromDate, toDate);
        const resources = await findMany(prisma.resources, {});
        const resourceAvailability = await byLocation.findResourceAvailability(prisma, location);
        const resourceOutage = await findMany(prisma.resource_blocked_time, dateWhereOpts)
        const timeSlots = await byLocation.findTimeslots(prisma, location);
        const pricingRules = await findMany(prisma.pricing_rules, {});
        const addOns = await findMany(prisma.add_on, {});
        const serviceForms = await findMany(prisma.service_forms, {}, {rank: 'asc'});
        const forms = await findMany(prisma.forms, {});
        const tenantSettings = await prisma.tenant_settings.findFirstOrThrow({
            where: {
                tenant_id: tenantEnv.tenantId.value,
                environment_id: tenantEnv.environmentId.value
            }
        });
        const coupons = await findMany(prisma.coupons, {});
        const bookings = await prisma.bookings.findMany({
            where: {
                tenant_id: location.tenantId.value,
                environment_id: location.environmentId.value,
                location_id: location.locationId.value,
                ...dateWhereOpts,
            },
            include: {
                booking_resource_requirements: true,
                booking_service_options: true,
                booking_add_ons: true
            }
        });
        const serviceOptions = await prisma.service_options.findMany({
            where: {
                tenant_id: location.tenantId.value,
                environment_id: location.environmentId.value,
            },
            include: {
                service_option_forms: true,
                service_option_resource_requirements: true
            }
        });
        const serviceAddOns = await prisma.service_add_ons.findMany({
            where: {
                tenant_id: location.tenantId.value,
                environment_id: location.environmentId.value,
            }
        });


        return {
            businessHours,
            blockedTime,
            resources,
            resourceAvailability,
            resourceOutage,
            services,
            serviceAddOns,
            serviceOptions,
            serviceResourceRequirements,
            timeSlots,
            pricingRules,
            resourceTypes,
            addOns,
            serviceForms,
            bookings,
            forms,
            tenantSettings,
            coupons,
        };
    },


    async getEverythingForAvailability(
        prisma: PrismaClient,
        location: TenantEnvironmentLocation,
        start: IsoDate,
        end: IsoDate
    ): Promise<EverythingForAvailability> {
        const availabilityData = await byLocation.gatherAvailabilityData(prisma, location, start, end);
        return convertAvailabilityDataIntoEverythingForAvailability(tenantEnvironment(location.environmentId, location.tenantId), start, end, availabilityData);
    },
    async findTimeslots(prisma: PrismaClient, location: TenantEnvironmentLocation): Promise<DbTimeSlot[]> {
        return prisma.time_slots.findMany({
            where: {
                tenant_id: location.tenantId.value,
                environment_id: location.environmentId.value,
                OR: [
                    {
                        location_id: location.locationId.value
                    }, {
                        location_id: null
                    }]
            }
        })
    }
}