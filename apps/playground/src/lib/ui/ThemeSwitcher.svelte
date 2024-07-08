<script lang="ts">
    import {browser} from '$app/environment';
    import {onMount} from 'svelte';
    import {translations} from '$lib/ui/stores.js';

    // List of all DaisyUI themes
    const themes = [
        "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave",
        "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua",
        "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula", "cmyk",
        "autumn", "business", "acid", "lemonade", "night", "coffee", "winter"
    ];

    let currentTheme:string;

    onMount(() => {
        if (browser) {
            currentTheme = localStorage.getItem('theme') || 'light';
            document.documentElement.setAttribute('data-theme', currentTheme);
        }
    });

    function changeTheme(event:Event) {
        currentTheme = (event.target as HTMLSelectElement).value;
        if (browser) {
            localStorage.setItem('theme', currentTheme);
            document.documentElement.setAttribute('data-theme', currentTheme);
        }
    }
</script>

<div class="flex">
    <label class="label">{$translations.theme}</label>
    <select
            bind:value={currentTheme}
            on:change={changeTheme}
            class="select select-bordered w-full max-w-xs">
        {#each themes as theme}
            <option value={theme}>{theme}</option>
        {/each}
    </select>
</div>

