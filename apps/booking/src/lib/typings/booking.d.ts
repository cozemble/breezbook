type BookingStep<TName extends string = string, TValue = any> = {
	name: TName;
	value: import('svelte/store').Writable<Writable<TValue | null>>;
	status: import('svelte/store').Writable<Writable<GenericStatus>>;
	open: import('svelte/store').Writable<Writable<boolean>>;
	summary: import('svelte/store').Writable<Writable<string>>;
	onComplete: () => void;
	onOpen: () => void;
	onGoBack?: () => void;
};

type BookingStepOptions<TName extends string, TValue> = {
	name: TName;
	initialValue: TValue;
};
