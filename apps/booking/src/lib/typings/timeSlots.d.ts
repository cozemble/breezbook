declare interface TimeSlot {
	from: string;
	to: string;
	price: number;
	selected: boolean;
	status?: 'available' | 'booked_by_someone' | 'booked_by_user' | 'unavailable';
	onSelect: () => void;
}

declare interface DaySlot {
	date: number;
	timeSlots: TimeSlot[];
}

declare interface MonthSlot {
	name: string;
	days: DaySlot[];
}
