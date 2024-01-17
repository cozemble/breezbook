export const tenants: Tenant[] = [
	{
		id: '1',
		slug: 'the-smart-wash',
		name: 'The Smart Wash',
		heading: 'Get your car cleaned in a smart way.',
		description:
			'We use the latest technology to clean your car. Your car will shine like a new one.',
		heroImage: 'https://picsum.photos/800/450'
	},
	{
		id: '2',
		slug: 'robs-robbery-team',
		name: "Rob's Robbery Team",
		heading: 'We rob. We are professionals.',
		description:
			'We rob any place for you. Just tell us where and when. We are not responsible for any consequences. And remember, there is no rest for the wicked.',
		heroImage: 'https://picsum.photos/800/450',
		theme: {
			font: {
				sans: 'Comfortaa'
			},
			theme: 'sunset'
		}
	},
	{
		id: '3',
		slug: 'monkey-business',
		name: 'Monkey Business',
		heading: 'We do monkey business.',
		description:
			'We are monkeys. We do business. We love bananas. We love climbing. We love throwing bananas to people.',
		heroImage: 'https://picsum.photos/800/450',
		theme: {
			font: {
				sans: 'Bangers'
			},
			theme: 'cyberpunk'
		}
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
		image: 'https://picsum.photos/400/201',
		approximatePrice: 50,
		approximateDuration: 30
	},
	{
		tenantId: '2',
		id: '1',
		slug: 'rob-a-bank',
		name: 'Rob a Bank',
		description: 'We rob a bank for you.',
		image: 'https://picsum.photos/400/202',
		approximatePrice: 1000000,
		approximateDuration: 120
	},
	{
		tenantId: '2',
		id: '2',
		slug: 'rob-a-store',
		name: 'Rob a Store',
		description: 'We rob a store for you.',
		image: 'https://picsum.photos/400/203',
		approximatePrice: 1000,
		approximateDuration: 30
	},
	{
		tenantId: '2',
		id: '3',
		slug: 'rob-a-house',
		name: 'Rob a House',
		description: 'We rob a house for you.',
		image: 'https://picsum.photos/400/204',
		approximatePrice: 10000,
		approximateDuration: 60
	},
	{
		tenantId: '2',
		id: '4',
		slug: 'steal-a-car',
		name: 'Steal a Car',
		description: 'We steal a car for you. Must be a nice one.',
		image: 'https://picsum.photos/400/205',
		approximatePrice: 20000,
		approximateDuration: 60
	},
	{
		tenantId: '2',
		id: '5',
		slug: 'rob-a-jewelry-store',
		name: 'Rob a Jewelry Store',
		description: 'Jewelry is expensive. We rob a jewelry store for you.',
		image: 'https://picsum.photos/400/206',
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
		image: 'https://picsum.photos/400/201',
		approximatePrice: 50,
		approximateDuration: 20
	},
	{
		tenantId: '3',
		id: '3',
		slug: 'throw-banana-to-someone',
		name: 'Throw banana to someone',
		description: 'Throw banana to someone. Like a monkey.',
		image: 'https://picsum.photos/400/202',
		approximatePrice: 100,
		approximateDuration: 30
	},
	{
		tenantId: '3',
		id: '4',
		slug: 'climb-a-building',
		name: 'Climb a building',
		description: 'Climb a building. Like a monkey. Dangerous.',
		image: 'https://picsum.photos/400/203',
		approximatePrice: 5000,
		approximateDuration: 120
	}
];

export const daySlots: DaySlot[] = [
	{
		date: new Date(Date.now()),
		timeSlots: [
			{
				start: '9:00',
				end: '11:00',
				price: 60,
				day: new Date(Date.now())
			},
			{
				start: '12:00',
				end: '14:00',
				price: 62.5,
				day: new Date(Date.now())
			},
			{
				start: '15:00',
				end: '17:00',
				price: 62.5,
				day: new Date(Date.now())
			}
		]
	},
	{
		date: new Date(Date.now() + 86400000),
		timeSlots: [
			{
				start: '9:00',
				end: '11:00',
				price: 55,
				day: new Date(Date.now() + 86400000)
			},
			{
				start: '12:00',
				end: '14:00',
				price: 55,
				day: new Date(Date.now() + 86400000)
			},
			{
				start: '15:00',
				end: '17:00',
				price: 58,
				day: new Date(Date.now() + 86400000)
			}
		]
	},
	{
		date: new Date(Date.now() + 86400000 * 2),
		timeSlots: [
			{
				start: '9:00',
				end: '11:00',
				price: 55,
				day: new Date(Date.now() + 86400000 * 2)
			},
			{
				start: '12:00',
				end: '14:00',
				price: 55,
				day: new Date(Date.now() + 86400000 * 2)
			},
			{
				start: '15:00',
				end: '17:00',
				price: 58,
				day: new Date(Date.now() + 86400000 * 2)
			}
		]
	},
	{
		date: new Date(Date.now() + 86400000 * 3),
		timeSlots: [
			{
				start: '9:00',
				end: '11:00',
				price: 55,
				day: new Date(Date.now() + 86400000 * 3)
			},
			{
				start: '12:00',
				end: '14:00',
				price: 55,
				day: new Date(Date.now() + 86400000 * 3)
			},
			{
				start: '15:00',
				end: '17:00',
				price: 58,
				day: new Date(Date.now() + 86400000 * 3)
			}
		]
	},
	{
		date: new Date(Date.now() + 86400000 * 4),
		timeSlots: [
			{
				start: '9:00',
				end: '11:00',
				price: 55,
				day: new Date(Date.now() + 86400000 * 4)
			},
			{
				start: '12:00',
				end: '14:00',
				price: 55,
				day: new Date(Date.now() + 86400000 * 4)
			},
			{
				start: '15:00',
				end: '17:00',
				price: 58,
				day: new Date(Date.now() + 86400000 * 4)
			}
		]
	}
];

const extras: Service.Extra[] = [
	{
		name: '50% Off HD Carnauba Wax Coating (Lasts 6 Months, Gloss Finish!)',
		price: 19.99,
		selected: false
	},
	{
		name: 'Alloy Wheel Sealant x4 wheels (Glossy Finish, Lasts 3 Months)',
		price: 39.99,
		selected: false
	},
	{
		name: 'Carpet Stripes',
		price: 4.99,
		selected: false
	},
	{
		name: 'Deep Clean 1 Seat + Mat',
		price: 19.99,
		selected: false
	}
];

export default {
	tenants,
	services,
	daySlots,
	extras
};
