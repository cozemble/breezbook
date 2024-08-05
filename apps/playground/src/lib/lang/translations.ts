export interface Translations {
    theme: string
    language: string
    location: string
    availabilityFor: string
    daysOfTheWeek: string[]
    daysOfTheWeekShort: string[]
    noSlotsAvailable: string
    selectedSlot: string
    confirm: string
    submit: string
    next: string
    back: string
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
    chooseTrainer: string
    personalTraining: string
    viewMore: string
    chooseTime: string
    bookingConfirmed: string
    thankYouSentence: string
    bookAnotherSession: string
    serviceUnavailableAtLocation: string
    use4242: string
    useFutureExpiry: string
    useAnyCVC: string
    loadingCheckoutForm: string
}

const translationsEnglish: Translations = {
    theme: "Theme",
    language: "Language",
    location: "Location",
    availabilityFor: "Availability for",
    daysOfTheWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    daysOfTheWeekShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    noSlotsAvailable: "No slots available",
    selectedSlot: "Selected slot",
    confirm: "Confirm",
    submit: "Submit",
    next: "Next",
    back: "Back",
    payment: "Payment",
    pay: "Pay",
    price: "Price",
    personalTrainers: "Personal Trainers",
    yourDetails: "Your Contact Details",
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
    thankYou: "Thank you",
    chooseTrainer: "Choose a trainer",
    personalTraining: "Personal Training",
    viewMore: "View More",
    chooseTime: "Choose a time",
    bookingConfirmed: "Booking Confirmed",
    thankYouSentence: "Thank you for your booking. We look forward to seeing you soon",
    bookAnotherSession: "Book another session",
    serviceUnavailableAtLocation: "Personal training unavailable at this location",
    use4242:"Use test credit card 4242 4242 4242 4242",
    useFutureExpiry:"Expiry can be any date in future",
    useAnyCVC:"CVC can be any 3 digits",
    loadingCheckoutForm:"Loading checkout form..."
}

const translationsTurkish: Translations = {
    theme: "Tema",
    language: "Dil",
    location: "Konum",
    availabilityFor: "Müsaitlik",
    daysOfTheWeek: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"],
    daysOfTheWeekShort: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
    noSlotsAvailable: "Uygun slot yok",
    selectedSlot: "Seçilen slot",
    confirm: "Onayla",
    submit: "Gönder",
    next: "Sonraki",
    back: "Geri",
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
    thankYou: "Teşekkürler",
    chooseTrainer: "Antrenör seçin",
    personalTraining: "Kişisel",
    viewMore: "Daha Fazla",
    chooseTime: "Zaman Seçin",
    bookingConfirmed: "Rezervasyon Onaylandı",
    thankYouSentence: "Rezervasyonunuz için teşekkür ederiz. Sizi yakında görmekten mutluluk duyarız.",
    bookAnotherSession: "Başka bir oturum rezerve et",
    serviceUnavailableAtLocation: "Bu konum için kişisel antrenman mevcut değil",
    use4242:"Test kredi kartı 4242 4242 4242 4242 kullanın",
    useFutureExpiry:"Son kullanma tarihi gelecek bir tarih olabilir",
    useAnyCVC:"CVC herhang bir 3 haneli sayı olabilir",
    loadingCheckoutForm:"Ödeme formu yükleniyor..."
}

export function translationsFor(lang: string): Translations {
    switch (lang) {
        case "en":
            return translationsEnglish
        case "tr":
            return translationsTurkish
        default:
            return translationsEnglish
    }
}