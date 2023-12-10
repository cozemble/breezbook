export const tenants: Tenant[] = [
	{
		id: '1',
		slug: 'the-smart-wash',
		name: 'The Smart Wash',
		heading: 'Get your car cleaned in a smart way.',
		description:
			'We use the latest technology to clean your car. Your car will shine like a new one.'
	},
	{
		id: '2',
		slug: 'robs-robbery-team',
		name: "Rob's Robbery Team",
		heading: 'We rob. We are professionals.',
		description:
			'We rob any place for you. Just tell us where and when. We are not responsible for any consequences. And remember, there is no rest for the wicked.'
	},
	{
		id: '3',
		slug: 'monkey-business',
		name: 'Monkey Business',
		heading: 'We do monkey business.',
		description:
			'We are monkeys. We do business. We love bananas. We love climbing. We love throwing bananas to people.'
	}
];

export const services: Service[] = [
	{
		tenantId: '1',
		id: '1',
		slug: 'big-car-wash',
		name: 'Big Car Wash',
		description: 'We wash your big car.',
		image: 'https://picsum.photos/400/200',
		approximatePrice: 100,
		approximateDuration: 60
	},
	{
		tenantId: '1',
		id: '2',
		slug: 'small-car-wash',
		name: 'Small Car Wash',
		description: 'We wash your small car.',
		image: 'https://picsum.photos/400/200',
		approximatePrice: 50,
		approximateDuration: 30
	},
	{
		tenantId: '2',
		id: '1',
		slug: 'rob-a-bank',
		name: 'Rob a Bank',
		description: 'We rob a bank for you.',
		image: 'https://picsum.photos/400/200',
		approximatePrice: 1000000,
		approximateDuration: 120
	},
	{
		tenantId: '2',
		id: '2',
		slug: 'rob-a-store',
		name: 'Rob a Store',
		description: 'We rob a store for you.',
		image: 'https://picsum.photos/400/200',
		approximatePrice: 1000,
		approximateDuration: 30
	},
	{
		tenantId: '2',
		id: '3',
		slug: 'rob-a-house',
		name: 'Rob a House',
		description: 'We rob a house for you.',
		image: 'https://picsum.photos/400/200',
		approximatePrice: 10000,
		approximateDuration: 60
	},
	{
		tenantId: '2',
		id: '4',
		slug: 'steal-a-car',
		name: 'Steal a Car',
		description: 'We steal a car for you. Must be a nice one.',
		image: 'https://picsum.photos/400/200',
		approximatePrice: 20000,
		approximateDuration: 60
	},
	{
		tenantId: '2',
		id: '5',
		slug: 'rob-a-jewelry-store',
		name: 'Rob a Jewelry Store',
		description: 'Jewelry is expensive. We rob a jewelry store for you.',
		image: 'https://picsum.photos/400/200',
		approximatePrice: 500000,
		approximateDuration: 90
	},
	{
		tenantId: '3',
		id: '1',
		slug: 'eat-a-banana',
		name: 'Eat a banana.',
		description: 'Banana. Delicious.',
		image: 'https://picsum.photos/400/200',
		approximatePrice: 10,
		approximateDuration: 10
	},
	{
		tenantId: '3',
		id: '2',
		slug: 'climb-a-tree',
		name: 'Climb a tree',
		description: 'Climb a tree. Like a monkey.',
		image: 'https://picsum.photos/400/200',
		approximatePrice: 50,
		approximateDuration: 20
	},
	{
		tenantId: '3',
		id: '3',
		slug: 'throw-banana-to-someone',
		name: 'Throw banana to someone',
		description: 'Throw banana to someone. Like a monkey.',
		image: 'https://picsum.photos/400/200',
		approximatePrice: 100,
		approximateDuration: 30
	},
	{
		tenantId: '3',
		id: '4',
		slug: 'climb-a-building',
		name: 'Climb a building',
		description: 'Climb a building. Like a monkey. Dangerous.',
		image: 'https://picsum.photos/400/200',
		approximatePrice: 5000,
		approximateDuration: 120
	}
];

export default {
	tenants,
	services
};
