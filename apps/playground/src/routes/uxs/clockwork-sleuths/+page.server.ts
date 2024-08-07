import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    return {
        title: "Clockwork Sleuths - Book Your Temporal Consultation",
        description: "This is a demo of the Breezbook booking platform. Easily book temporal consultations with Clockwork Sleuths. Choose your service, time, and options all in one place!",
        imageUrl: "https://example.com/images/clockwork-sleuths-social-preview.jpg",
        url: "https://breezbook-playground.vercel.app/uxs/clockwork-sleuths"
    };
};