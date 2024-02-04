type BookingStep = {
	id: string;
	status: import('svelte/store').Writable<GenericStatus>;
	open: import('svelte/store').Writable<boolean>;
	available: import('svelte/store').Writable<boolean>;
	/** Check for the value, then set the status to success and open the next step */
	onComplete: () => void;
	/** Open the step if the previous step is completed */
	onOpen: () => void;
	/** Open the previous step */
	onGoBack?: () => void;
};

type Booking = {
	/** Only for frontend utility */
	id: string;
	service: Service;
	calculatedPrice: number;

	time: TimeSlot;
	extras: Service.Extra[];
	details: Service.Details;
};
