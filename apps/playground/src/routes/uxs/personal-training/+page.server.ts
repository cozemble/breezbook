import type {PageServerLoad} from './$types';

export const load: PageServerLoad = async () => {
    return {
        title: "Demo of personal training booking using Breezbook",
        description: "This is a demo app that shows the capabilities of Breezbook, by allowing you to book a personal training session.",
        imageUrl: "https://breezbook-playground.vercel.app/images/breez-gym-social-share.jpg",
        url: "https://breezbook-playground.vercel.app/uxs/personal-training",
    };
};