<script lang="ts">
    import { Clock } from 'lucide-svelte';
    import ThemeSwitcher from "$lib/ui/ThemeSwitcher.svelte";
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import type { PageData } from './$types';

    export let data: PageData;

    function startBooking() {
        const currentPath = $page.url.pathname;
        goto(`${currentPath}/booking`);
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
        <div class="flex justify-between items-center mb-4">
            <div class="text-sm text-base-content/70">This is a demo to show what Breezbook can do</div>
        </div>
        <div class="flex justify-between items-center mb-4">
            <div class="text-sm text-base-content/70">Choose a colour schema</div>
            <ThemeSwitcher showLabel={false}/>
        </div>
        <div class="flex flex-col items-center">
            <h2 class="text-3xl font-bold mb-6 text-primary">Welcome to Clockwork Sleuths</h2>
            <Clock size={64} class="text-primary mb-6"/>
            <button class="btn btn-primary btn-lg" on:click={startBooking}>Book a Consultation</button>
        </div>
    </div>
</div>