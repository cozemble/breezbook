<script lang="ts">
    import {Github} from 'lucide-svelte';
    import {goto} from '$app/navigation';
    import {page} from '$app/stores';
    import type {PageData} from './$types';

    export let data: PageData;

    function startDemo() {
        const currentPath = $page.url.pathname;
        goto(`${currentPath}/book`);
    }
</script>

<svelte:head>
    <title>{data.title}</title>
    <meta name="description" content={data.description}>
    <meta property="og:title" content={data.title}>
    <meta property="og:description" content={data.description}>
    <meta property="og:image" content={data.imageUrl}>
    <meta property="og:url" content={data.url}>
    <meta name="twitter:title" content={data.title}>
    <meta name="twitter:description" content={data.description}>
    <meta name="twitter:image" content={data.imageUrl}>
    <meta name="twitter:card" content="summary_large_image">
</svelte:head>

<div class="flex justify-center items-center min-h-screen bg-base-200">
    <div class="w-full max-w-md bg-base-100 shadow-xl rounded-lg p-8">

        <div class="flex flex-col items-center">
            <h2 class="text-3xl font-bold mb-6 text-primary">Breezbook Demo</h2>
            <h2 class="text-2xl font-bold mb-6 text-primary">Personal Training</h2>
        </div>
        <div class="text-base-contentmt-4">We built this app to demonstrate how Breezbook can be used to
            book personal training sessions
        </div>
        <div class="mt-2">You will find various capabilities on show:</div>
        <ul class="list-disc ml-6 mt-4">
            <li>Multi language, in this case English and Turkish</li>
            <li>Theme'ing - choose your colours</li>
            <li>Multiple locations - the "gym" has locations in London, Liverpool and Manchester</li>
            <li>Differentiated pricing - some trainers are more expensive than others</li>
            <li>Custom forms - ask a user what their fitness goals are</li>
            <li>Stripe integration</li>
        </ul>

        <div class="flex flex-col items-center mt-8">
            <button class="btn btn-primary btn-lg" on:click={startDemo}>Start the demo</button>
        </div>

        <div class="flex flex-col items-center mt-4">
            <a title="See code on github" href="https://github.com/cozemble/breezbook">
                <Github size={32} class="text-primary mb-6"/>
            </a>
        </div>
        <div class="flex flex-col items-center">
            <img src="/images/breezbook-logo.svg" alt="Breezbook Logo" class="w-32"/>
        </div>
    </div>
</div>