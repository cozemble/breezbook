import type {LanguageId} from "@breezbook/packages-types";

export interface Translations {
    theme: string
    language: string
    location: string
    availabilityFor: string
    daysOfTheWeek: string[]
    noSlotsAvailable: string
    selectedSlot: string
    confirm: string
    submit: string
    next: string
    payment: string
    pay: string
    price: string
    personalTrainers: string
    yourDetails: string
    firstName: string
    lastName: string
    email: string
    phone: string
    pleaseFillInAllFields: string
    pleaseEnterAValidEmail: string
    pleaseEnterALongerFirstName: string
    pleaseEnterALongerLastName: string
    pleaseEnterALongerPhoneNumber: string,
    processingDotDotDot: string,
    thankYou: string
}

const translationsEnglish: Translations = {
    theme: "Theme",
    language: "Language",
    location: "Location",
    availabilityFor: "Availability for",
    daysOfTheWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    noSlotsAvailable: "No slots available",
    selectedSlot: "Selected slot",
    confirm: "Confirm",
    submit: "Submit",
    next: "Next",
    payment: "Payment",
    pay: "Pay",
    price: "Price",
    personalTrainers: "Personal Trainers",
    yourDetails: "Your Details",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    phone: "Phone",
    pleaseFillInAllFields: "Please fill in all fields",
    pleaseEnterAValidEmail: "Please enter a valid email",
    pleaseEnterALongerFirstName: "Please enter a longer first name",
    pleaseEnterALongerLastName: "Please enter a longer last name",
    pleaseEnterALongerPhoneNumber: "Please enter a longer phone number",
    processingDotDotDot: "Processing...",
    thankYou: "Thank you"
}

const traslationsTurkish: Translations = {
    theme: "Tema",
    language: "Dil",
    location: "Konum",
    availabilityFor: "Müsaitlik",
    daysOfTheWeek: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"],
    noSlotsAvailable: "Uygun slot yok",
    selectedSlot: "Seçilen slot",
    confirm: "Onayla",
    submit: "Gönder",
    next: "Sonraki",
    payment: "Ödeme",
    pay: "Öde",
    price: "Fiyat",
    personalTrainers: "Kişisel Antrenörler",
    yourDetails: "Detaylarınız",
    firstName: "Ad",
    lastName: "Soyad",
    email: "E-posta",
    phone: "Telefon",
    pleaseFillInAllFields: "Lütfen tüm alanları doldurun",
    pleaseEnterAValidEmail: "Lütfen geçerli bir e-posta adresi girin",
    pleaseEnterALongerFirstName: "Lütfen daha uzun bir ad girin",
    pleaseEnterALongerLastName: "Lütfen daha uzun bir soyad girin",
    pleaseEnterALongerPhoneNumber: "Lütfen daha uzun bir telefon numarası girin",
    processingDotDotDot: "İşleniyor...",
    thankYou: "Teşekkürler"

}

export function translationsFor(lang:string): Translations {
    switch (lang) {
        case "en":
            return translationsEnglish
        case "tr":
            return traslationsTurkish
        default:
            return translationsEnglish
    }
}