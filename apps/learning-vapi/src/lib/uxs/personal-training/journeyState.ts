import {type Form, type IsoDate, mandatory} from "@breezbook/packages-core";
import {
    type AddOnSummary,
    type Availability,
    type AvailabilityResponse,
    type ResourceRequirementOverride
} from "@breezbook/backend-api-types";

export interface Slot {
    day: IsoDate;
    slot: Availability
}

export interface CoreCustomerDetails {
    firstName: string
    lastName: string
    email: string
    phone: string
}

export interface JourneyState {
    selectedSlot: Slot | null
    possibleAddOns: AddOnSummary[]
    selectedAddOns: AddOnSummary[] | null
    expectedForms: Form[]
    filledForms: any[] | null
    customerDetails: CoreCustomerDetails | null
    isPaid: boolean
    serviceId: string
    locationId: string
    requirementOverrides: ResourceRequirementOverride[]
}

export function initialJourneyState(availabilityResponse: AvailabilityResponse, locationId: string, requirementOverrides: ResourceRequirementOverride[]): JourneyState {
    return {
        selectedSlot: null,
        possibleAddOns: availabilityResponse.addOns,
        selectedAddOns: null,
        expectedForms: availabilityResponse.serviceSummary.forms,
        filledForms: null,
        customerDetails: null,
        isPaid: false,
        serviceId: availabilityResponse.serviceSummary.id,
        locationId,
        requirementOverrides
    }
}

export const journeyStateFns = {
    requiresAddOns: (state: JourneyState) => state.possibleAddOns.length > 0 && state.selectedAddOns === null,
    requiresForms: (state: JourneyState) => state.expectedForms.length > 0 && state.filledForms === null,
    addOnsFilled: (state: JourneyState) => state.selectedAddOns !== null,
    formsFilled: (state: JourneyState) => state.filledForms !== null && state.filledForms.length === state.expectedForms.length,
    formFilled(journeyState: JourneyState, form: any) {
        const currentFilledForms = journeyState.filledForms || []
        return {
            ...journeyState,
            filledForms: [...currentFilledForms, form]
        }
    },
    currentUnfilledForm(state: JourneyState): Form {
        const indexOfLastFilledForm = state.filledForms ? state.filledForms.length : 0
        return mandatory(state.expectedForms[indexOfLastFilledForm], `Expected form at index ${indexOfLastFilledForm} not found`)
    },
    customerDetailsFilled(journeyState: JourneyState) {
        return journeyState.customerDetails !== null
    },
    setCustomerDetails(journeyState: JourneyState, detail: CoreCustomerDetails | null) {
        return {
            ...journeyState,
            customerDetails: detail
        }
    },
    isPaid(journeyState: JourneyState): boolean {
        return journeyState.isPaid
    },
    setPaid(journeyState: JourneyState) {
        return {
            ...journeyState,
            isPaid: true
        }
    }
}