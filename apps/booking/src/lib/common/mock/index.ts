import type {Tenant} from "@breezbook/backend-api-types";

export const tenants: Tenant[] = [
    {
        id: '1',
        slug: 'thesmartwashltd',
        name: 'The Smart Wash',
        heading: 'Get your car cleaned in a smart way.',
        description:
            'We use the latest technology to clean your car. Your car will shine like a new one.',
        heroImage: 'https://picsum.photos/800/450',
        theme: {
            font: {
                sans: 'Comfortaa'
            },
            theme: 'sunset'
        },
        locations: [],
        services: [],
        serviceLocations: [],
        forms: [],
        customerForm: null
    },
    {
        id: '2',
        slug: 'robs-robbery-team',
        name: "Rob's Robbery Team",
        heading: 'We rob. We are professionals.',
        description:
            'We rob any place for you. Just tell us where and when. We are not responsible for any consequences. And remember, there is no rest for the wicked.',
        heroImage: 'https://picsum.photos/800/450',
        theme: {},
        locations: [],
        services: [],
        serviceLocations: [],
        forms: [],
        customerForm: null
    },
];

export const services: Service[] = [
    {
        tenantId: '1',
        id: 'thesmartwashltd_dev_service_mini.valet.large.car',
        slug: 'thesmartwashltd_dev_service_mini.valet.large.car',
        name: 'Mini Valet Large Car',
        description: 'Mini Valet Large Car',
        image: 'https://picsum.photos/400/201',
        approximatePrice: 50,
        approximateDuration: 30
    },

    {
        tenantId: '1',
        id: '2',
        slug: 'mediumCarWash',
        name: 'Medium Car Wash',
        description: 'We wash your medium size car.',
        image: 'https://picsum.photos/400/200',
        approximatePrice: 80,
        approximateDuration: 60
    },
    {
        tenantId: '1',
        id: '3',
        slug: 'largeCarWash',
        name: 'Large Car Wash',
        description: 'We wash your large car.',
        image: 'https://picsum.photos/400/200',
        approximatePrice: 100,
        approximateDuration: 60
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
    },

    {
        tenantId: '4',
        id: '1',
        slug: 'clean-a-house',
        name: 'Clean a house',
        description: 'We clean your house.',
        image: 'https://picsum.photos/400/200',
        approximatePrice: 200,
        approximateDuration: 60
    },
    {
        tenantId: '4',
        id: '2',
        slug: 'clean-a-big-house',
        name: 'Clean a big house',
        description: 'We clean your big house like 4-7 bedrooms',
        image: 'https://picsum.photos/400/201',
        approximatePrice: 300,
        approximateDuration: 120
    },
    {
        tenantId: '4',
        id: '3',
        slug: 'clean-a-giant-mansion',
        name: 'Clean a giant mansion',
        description:
            "We clean your giant mansion. Here we'll need help from Rob's Robbery Team. We'll clean your mansion and rob it.",
        image: 'https://picsum.photos/400/202',
        approximatePrice: 10000,
        approximateDuration: 240
    },

    {
        tenantId: '5',
        id: '1',
        slug: 'catch-a-ghost',
        name: 'Catch a ghost',
        description: "We ain't afraid of no ghost.",
        image: 'https://picsum.photos/400/200',
        approximatePrice: 150,
        approximateDuration: 60
    },
    {
        tenantId: '5',
        id: '2',
        slug: 'catch-a-big-ghost',
        name: 'Catch a big ghost',
        description: "We ain't afraid of no big ghost either.",
        image: 'https://picsum.photos/400/201',
        approximatePrice: 250,
        approximateDuration: 120
    },
    {
        tenantId: '5',
        id: '3',
        slug: 'catch-a-ghost-gang',
        name: 'Catch a ghost gang',
        description: "We ain't afraid of no ghost gang.",
        image: 'https://picsum.photos/400/202',
        approximatePrice: 4500,
        approximateDuration: 300
    }
];

const extras: Service.Extra[] = [
    {
        id: '1',
        name: 'Wax Coating',
        description: '50% Off HD Carnauba Wax Coating (Lasts 6 Months, Gloss Finish!)',
        price: 19.99,
        selected: false
    },
    {
        id: '2',
        name: 'Paint Protection',
        description: 'Alloy Wheel Sealant x4 wheels (Glossy Finish, Lasts 3 Months)',
        price: 39.99,
        selected: false
    },
    {
        id: '3',
        name: 'Carpet Stripes',
        price: 4.99,
        selected: false
    },
    {
        id: '4',
        name: 'Deep Clean 1 Seat + Mat',
        price: 19.99,
        selected: false
    }
];

const jsonSchema = `
{
	"type": "object",
	"$schema": "http://json-schema.org/draft-07/schema#",
	"required": [
		"make",
		"model",
		"colour",
		"year"
	],
	"properties": {
		"make": {
			"type": "string",
			"description": "The manufacturer of the car."
		},
		"model": {
			"type": "string",
			"description": "The model of the car."
		},
		"year": {
			"type": "integer",
			"description": "The manufacturing year of the car."
		},
		"colour": {
			"type": "string",
			"description": "The colour of the car."
		}
	},
	"additionalProperties": false
}`;

export default {
    tenants,
    services,
    extras,
    jsonSchema
};
