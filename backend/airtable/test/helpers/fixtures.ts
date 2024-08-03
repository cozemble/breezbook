import {
    environmentId,
    locationId,
    resourceType,
    serviceId,
    tenantEnvironmentLocation,
    tenantId
} from "@breezbook/packages-types";
import {multiLocationGym} from "../../src/dx/loadMultiLocationGymTenant.js";


const multilocationGymTenant = tenantId(multiLocationGym.tenant_id)
const multilocationGymEnv = environmentId(multiLocationGym.environment_id)

export const multilocationGym = {
    tenant: multilocationGymTenant,
    env: multilocationGymEnv,
    london: tenantEnvironmentLocation(multilocationGymEnv, multilocationGymTenant, locationId(multiLocationGym.locationLondon)),
    liverpool: tenantEnvironmentLocation(multilocationGymEnv, multilocationGymTenant, locationId(multiLocationGym.locationLiverpool)),
    manchester: tenantEnvironmentLocation(multilocationGymEnv, multilocationGymTenant, locationId(multiLocationGym.locationManchester)),
    personalTrainer: resourceType('personal.trainer'),
    personalTraining: serviceId(multiLocationGym.pt1Hr)
}