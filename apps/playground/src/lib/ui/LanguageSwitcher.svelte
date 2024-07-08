<script lang="ts">
    import {onMount} from 'svelte';
    import {language, translations} from "$lib/ui/stores";

    let currentLanguage: string

    onMount(() => {
        currentLanguage = localStorage.getItem('language') || 'en';
        language.set(currentLanguage);
    });

    function changeLanguage(event: Event) {
        currentLanguage = (event.target as HTMLSelectElement).value;
        language.set(currentLanguage);
        localStorage.setItem('language', currentLanguage);
    }
</script>

<div class="flex">
    <label class="label">{$translations.language}</label>
    <select
            bind:value={currentLanguage}
            on:change={changeLanguage}
            class="select select-bordered w-full max-w-xs">
        <option value="en" selected={$language === 'en'}>English</option>
        <option value="tr" selected={$language === 'tr'}>Türkçe</option>
    </select>
</div>
