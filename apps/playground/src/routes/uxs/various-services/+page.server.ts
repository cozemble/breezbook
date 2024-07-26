import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    return {
        title: "Demo of Breezbook Scheduling Rules",
        description: "A demo that proves different kinds of service definition of bookings and appointments",
        imageUrl: "/images/breezbook-scheduling-options-social-share.jpg",
        url: "https://breezbook-playground.vercel.app/uxs/various-services",
    };
};