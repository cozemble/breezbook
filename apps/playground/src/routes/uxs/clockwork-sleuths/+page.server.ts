import type {PageServerLoad} from './$types';

export const load: PageServerLoad = async () => {
    return {
        title: "Demo of a global business using Breezbook",
        description: "This demo shows capabilities of Breezbook, mainly multiple locations, location based pricing and timezone support.",
        imageUrl: "https://breezbook-playground.vercel.app/images/breez-gym-social-share.jpg",
        url: "https://breezbook-playground.vercel.app/uxs/clockwork-sleuths",
    };
};