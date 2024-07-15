import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    return {
        title: "Breez Walks - Book Your Dog Walking Service",
        description: "This is a demo of the Breezbook booking platform.  Easily book professional dog walking services with Breez Walks. Choose your service, time, and options all in one place!",
        imageUrl: "https://ltbkixtsgzejkyicczum.supabase.co/storage/v1/object/public/service-images/dev/breezbook-dog-walks/dog_walk_social_preview.jpg",
        url: "https://breezbook-playground.vercel.app/uxs/dog-walking"
    };
};