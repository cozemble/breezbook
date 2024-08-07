import {type Form,jsonSchemaFormFns, mandatory} from "@breezbook/packages-types";
import {
    type AddOnSummary,
    type Availability,
    type FormAndLabels,
    type ResourceRequirementOverride,
    type Tenant
} from "@breezbook/backend-api-types";
import type { IsoDate } from '@breezbook/packages-date-time';

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
    tenant: Tenant
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


export function initializeJourneyState(tenant: Tenant, serviceId: string, locationId: string, requirementOverrides: ResourceRequirementOverride[]): JourneyState {
    const service = mandatory(tenant.services.find(s => s.id === serviceId), `Service with id ${serviceId} not found`)
    const serviceForms = tenant.forms.filter(f => service.forms.some(sf => sf.value === f.form.id.value)).map(f => f.form)
    return {
        tenant,
        selectedSlot: null,
        possibleAddOns: service.addOns,
        selectedAddOns: null,
        expectedForms: serviceForms,
        filledForms: null,
        customerDetails: null,
        isPaid: false,
        serviceId,
        locationId,
        requirementOverrides
    }
}

function applyFormLabels(form: Form, formLabels: FormAndLabels[]): Form {
    const labels = mandatory(formLabels.find(f => f.form.id.value === form.id.value), `Form with id ${form.id.value} not found`)
    return jsonSchemaFormFns.applyLabels(form, labels.labels)
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
        const form = mandatory(state.expectedForms[indexOfLastFilledForm], `Expected form at index ${indexOfLastFilledForm} not found`)
        return applyFormLabels(form, state.tenant.forms)
    },
    getFirstServiceForm(state: JourneyState): Form {
        const form = mandatory(state.expectedForms[0], `Expected form at index 0 not found`)
        return applyFormLabels(form, state.tenant.forms)
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
    },
    reset(journeyState: JourneyState): JourneyState {
        return {
            ...journeyState,
            selectedSlot: null,
            selectedAddOns: null,
            filledForms: null,
            customerDetails: null,
            isPaid: false,
            requirementOverrides: []
        }
    },
    slotSelected(journeyState: JourneyState, slot: Slot): JourneyState {
        return {
            ...journeyState,
            selectedSlot: slot
        }
    },
    setResourceRequirements(journeyState: JourneyState, requirementOverrides: ResourceRequirementOverride[]): JourneyState {
        return {
            ...journeyState,
            selectedSlot: null,
            requirementOverrides
        }
    },
    getFirstServiceFormData(journeyState: JourneyState) {
        return journeyState.filledForms ? journeyState.filledForms[0] : {}
    }
}