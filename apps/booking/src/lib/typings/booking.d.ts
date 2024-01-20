type BookingStep<TName extends string = string, TValue = any> = {
	name: TName;
	status: import('svelte/store').Writable<GenericStatus>;
	open: import('svelte/store').Writable<boolean>;
	summary: import('svelte/store').Readable<string>;
	available: import('svelte/store').Writable<boolean>;
	/** Check for the value, then set the status to success and open the next step */
	onComplete: () => void;
	/** Open the step if the previous step is completed */
	onOpen: () => void;
	/** Open the previous step */
	onGoBack?: () => void;
};

type BookingStepOptions<TName extends string, TValue> = {
	name: TName;
	valueStore: import('svelte/store').Writable<TValue | null>;
	/** Function that sets the summary when value changes */
	summaryFunction?: (value: TValue | null) => string;
};

type Booking = {
	/** Only for frontend utility */
	id: string;
	serviceId: string;

	time: TimeSlot;
	extras: Service.Extra[];
	details: Service.Details;
};
