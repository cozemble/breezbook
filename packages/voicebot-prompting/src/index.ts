import {
    AddOn,
    BusinessConfiguration,
    priceFns,
    PricingRule,
    Service,
    time24Fns,
    TimeslotSpec
} from "@breezbook/packages-core";

export interface BusinessDescription {
    _type: "business.description";
    name: string;
    lineOfBusiness: string;
    description: string;
}

export function businessDescription(name: string, lineOfBusiness: string, description: string): BusinessDescription {
    return {
        _type: 'business.description',
        name, lineOfBusiness, description
    }
}


function agentIdentity(description: BusinessDescription): string {
    return `[Identity]
    You are a helpful and knowledgeable virtual assistant for a company called '${description.name}'.  Our line of business is '${description.lineOfBusiness}', and a 
    more detailed description of us is '${description.description}'.
`;
}

function stylePrompt(): string {
    return `[Style]
- Be informative and comprehensive.
- Maintain a professional and polite tone.
- Be concise, as you are currently operating as a Voice Conversation.`;
}

function responseGuideLines(): string {
    return `[Response Guideline]
- Present dates in a clear format (e.g., January 15, 2024).
- When the user has choice, offer up to three options that best suit what you know about their needs and preferences.
- If you are ever unsure, ask for clarification.`
}


export function toVapiHeader(description: BusinessDescription): string {
    return [agentIdentity(description), stylePrompt(), responseGuideLines()].join("\n");
}

function timeslotsWordList(timeslots: TimeslotSpec[]): string {
    return timeslots.map((ts) => `* ${time24Fns.toWords(ts.slot.from)} to ${time24Fns.toWords(ts.slot.to)}`).join("\n");
}

function timeslotExplanation(timeslots: TimeslotSpec[]): string {
    return [`We make bookings against time slots.  The time slots we have are as follows:`, timeslotsWordList(timeslots)].join("\n");
}

function webQueryTask(business: BusinessConfiguration): string {
    const timeslotStatement = business.timeslots.length === 0 ? "" : timeslotExplanation(business.timeslots);
    return `A potential customer has initiated a chat with you on our website.  They might be an existing customer or a new one.  
    They may simply want information, or they might want to make a booking.  Your task is described below:
    
[Task]
1. Greet the user and inquire about their needs.
2. If they simply want information, do your best to tell them everything they need.
3. However, you should ask if they want to make a booking.  Your goal is to get them booked into using one of our services.
4. If they do want to book a service, then follow this sub-workflow:
    - Ask them what service they want.  Details of the services we have are listed below
    - Ask them when they would like to book the service.  You will need the date and time. ${timeslotStatement}
    - Let them know that we have extras/add-ons that can be added to services.  And ask if they would like to avail of some of these
        The list of add-ons is below.
    - Confirm the booking details with them.
    - Inform them that they will receive a confirmation email.
`;
}

function serviceWordList(services: Service[], pricingRules: PricingRule[]): string {
    const hasDynamicPricing = pricingRules.length > 0;
    return [`[Services]`, services.map((service) => serviceWords(service, hasDynamicPricing)).join("\n")].join("\n");
}

function serviceWords(service: Service, hasDynamicPricing: boolean): string {
    const maybeDescription = service.description.trim().length > 0 ? service.description.trim() : ""
    const priceJoinWord = hasDynamicPricing ? "starts at" : "is";
    const priceWords = `The price of the service ${priceJoinWord} ${priceFns.toWords(service.price)}`
    return [`- '${service.name}'`, maybeDescription, priceWords].filter(s => s.trim().length > 0).join(". ")
}

function addOnWordList(a: AddOn): string {
    const maybeDescription = a.description ?? ""
    const priceWords = `The price of this add on is ${priceFns.toWords(a.price)}`
    return [`- '${a.name}'`, maybeDescription, priceWords].filter(s => s.trim().length > 0).join(". ")
}

function addOnsWordList(addOns: AddOn[]): string {
    return ['[Add-ons]', ...addOns.map(a => addOnWordList(a))].join("\n")
}

export function webQueryPrompt(description: BusinessDescription, business: BusinessConfiguration, pricingRules: PricingRule[]): string {
    return [toVapiHeader(description), webQueryTask(business), serviceWordList(business.services, pricingRules), addOnsWordList(business.addOns)].join("\n")
}