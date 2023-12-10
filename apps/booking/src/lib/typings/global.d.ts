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
