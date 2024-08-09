import type {PageServerLoad} from './$types';

export const load: PageServerLoad = async () => {
    return {
        title: "Demo of booking gym services using Breezbook",
        description: "Demo showing capabilities of Breezbook, by allowing you to book services in a pretend gym",
        imageUrl: "https://breezbook-playground.vercel.app/images/breez-gym-social-share.jpg",
        url: "https://breezbook-playground.vercel.app/uxs/gym",
    };
};