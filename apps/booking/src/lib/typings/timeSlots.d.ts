declare interface TimeSlot {
	id: string;
	start: string;
	end: string;
	price: number;
	status?: 'available' | 'booked_by_someone' | 'booked_by_user' | 'unavailable';
	/* to have access to the day in the value */
	day: string;
}

declare interface DaySlot {
	date: string;
	timeSlots: TimeSlot[];
}
