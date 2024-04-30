declare type GenericStatus = 'success' | 'error' | 'warning' | 'info' | 'default';

declare interface Tenant {
	id: string;
	slug: string;
	name: string;
	heading: string;
	description: string;
	heroImage: string;
	// status: string;
	// createdAt: string;
	// updatedAt: string;
	theme?: Theme;
}

declare interface Theme {
	font: {
		sans: string;
		/** sans is used if not specified */
		display?: string;
	};
	theme: string;
	// colors: {
	// 	primary: string;
	// 	secondary: string;
	// 	accent: string;
	// 	neutral: string;
	// 	'base-100': string;
	// 	'base-200': string;
	// 	'base-300': string;

	// 	success: string;
	// 	info: string;
	// 	warning: string;
	// 	error: string;
	// };
}

declare interface Service {
	tenantId: string;
	id: string;
	slug: string;
	name: string;
	description: string;
	image: string;
	/** in GBP */
	approximatePrice: number;
	// TODO currency option
	/** in minutes */
	approximateDuration: number;
	/** no status means available */
	status?: 'available' | 'coming_soon' | 'unavailable' | 'hidden';
	// TODO temporarily unavailable
	// createdAt: string;
	// updatedAt: string;
}

declare namespace Service {
	interface Extra {
		id: string;
		name: string;
		description?: string;
		/** in GBP */
		price: number;
		// TODO currency option
		selected: boolean;
		// <!-- TODO detail inputs -->
	}

	interface Details {
		// TODO
		[key: string]: string;
	}
}

// TODO move to a more appropriate file

// type BookingFormStepName = 'time' | 'extras' | 'details';

// declare type BookingFormStep<TName extends BookingFormStepName> = {
// 	name: TName;
// 	status: import('svelte/store').Writable<GenericStatus>;
// 	open: import('svelte/store').Writable<boolean>;
// 	summary: import('svelte/store').Writable<string>;
// 	onComplete: () => void;
// 	onOpen: () => void;
// 	onGoBack?: () => void;
// } & (
// 	| { value: import('svelte/store').Writable<TimeSlot | null>; name: 'time' }
// 	| { value: import('svelte/store').Writable<Service.Extra[] | null>; name: 'extras' }
// 	| { value: import('svelte/store').Writable<Service.Details | null>; name: 'details' }
// );

declare interface Settings {
	checkout: {
		/** Return to this URL when Stripe payment succeeds */
		successReturnUrl: import('svelte/store').Writable<string>;
	};
}
