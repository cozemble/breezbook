export const tenants: Tenant[] = [
	{
		id: '1',
		slug: 'the-smart-wash',
		name: 'The Smart Wash',
		description: 'Get your car cleaned in a smart way.'
	},
	{
		id: '2',
		slug: 'rob-robbery',
		name: 'Rob Robbery',
		description: 'We rob any place for you. Just tell us where and when.'
	}
];

export const services: Service[] = [
	{
		tenantId: '1',
		id: '1',
		slug: 'big-car-wash',
		name: 'Big Car Wash',
		description: 'We wash your big car.',
		image: 'https://picsum.photos/200/300',
		approximatePrice: 100,
		approximateDuration: 60
	},
	{
		tenantId: '1',
		id: '2',
		slug: 'small-car-wash',
		name: 'Small Car Wash',
		description: 'We wash your small car.',
		image: 'https://picsum.photos/200/300',
		approximatePrice: 50,
		approximateDuration: 30
	},
	{
		tenantId: '2',
		id: '1',
		slug: 'rob-a-bank',
		name: 'Rob a Bank',
		description: 'We rob a bank for you.',
		image: 'https://picsum.photos/200/300',
		approximatePrice: 1000000,
		approximateDuration: 120
	},
	{
		tenantId: '2',
		id: '2',
		slug: 'rob-a-store',
		name: 'Rob a Store',
		description: 'We rob a store for you.',
		image: 'https://picsum.photos/200/300',
		approximatePrice: 1000,
		approximateDuration: 30
	},
	{
		tenantId: '2',
		id: '3',
		slug: 'rob-a-house',
		name: 'Rob a House',
		description: 'We rob a house for you.',
		image: 'https://picsum.photos/200/300',
		approximatePrice: 10000,
		approximateDuration: 60
	}
];

export default {
	tenants
};
