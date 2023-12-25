declare interface TimeSlot {
	from: string;
	to: string;
	price: number;
	status?: 'available' | 'booked_by_someone' | 'booked_by_user' | 'unavailable';
	/* to have access to the day in the value */
	day: Date;
}

declare interface DaySlot {
	date: Date;
	timeSlots: TimeSlot[];
}
