type BookingStep<TName extends string = string, TValue = any> = {
	name: TName;
	value: import('svelte/store').Writable<Writable<TValue | null>>;
	status: import('svelte/store').Writable<Writable<GenericStatus>>;
	open: import('svelte/store').Writable<Writable<boolean>>;
	summary: import('svelte/store').Readable<Writable<string>>;
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
