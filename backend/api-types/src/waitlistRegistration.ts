export interface WaitlistRegistration {
    _type: "waitlist.registration"
    email: string
}

export function waitlistRegistration(email:string):WaitlistRegistration {
    return {
        _type:"waitlist.registration",
        email
    }
}