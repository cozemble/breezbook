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

declare type GenericStatus = 'success' | 'error' | 'warning' | 'info' | 'default';

declare namespace Service {
	interface Extra {
		name: string;
		price: number;
		selected: boolean;
		// <!-- TODO detail inputs -->
	}

	interface Details {
		// TODO
		[key: string]: string;
	}
}
