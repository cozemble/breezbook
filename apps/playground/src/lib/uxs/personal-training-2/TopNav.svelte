<script lang="ts">
    import {Flag, MapPin, PaintBucket} from "lucide-svelte";
    import {translations} from "$lib/ui/stores";
    import {keyValue, type KeyValue} from "@breezbook/packages-types";
    import {get, type Writable, writable} from "svelte/store";
    import {onMount} from "svelte";

    export let onLanguageChanged: (lang: string) => void
    export let onLocationChanged: (location: string) => void;
    export let locations: KeyValue[]
    export let themes: KeyValue[] = [keyValue('light', 'Light'), keyValue('dark', 'Dark'), keyValue('emerald', 'Emerald')]
    export let languages: KeyValue[] = [keyValue('tr', 'Turkish'), keyValue('en', 'English')]
    export let theme: Writable<string | null> = writable('light');
    export let language: Writable<string | null> = writable('en');
    export let location: Writable<string | null> = writable(locations[0]?.key ?? null);

    onMount(() => {
        if ($theme) {
            document.documentElement.setAttribute('data-theme', $theme);
        }
    })

    type StoreType = "language" | "theme" | "location";

    type NavOption = {
        key: StoreType,
        icon: typeof Flag | typeof MapPin | typeof PaintBucket,
        options: KeyValue[],
        store: Writable<string | null>,
        onChange: (event: Event) => void
    }

    const navOptions: NavOption[] = [
        {
            key: 'language',
            icon: Flag,
            options: languages,
            store: language,
            onChange: handleLanguageChange
        },
        {key: 'theme', icon: PaintBucket, options: themes, store: theme, onChange: handleThemeChange},
        {key: 'location', icon: MapPin, options: locations, store: location, onChange: handleLocationChange}
    ];

    function handleThemeChange(event: Event) {
        const value = (event.target as HTMLSelectElement).value;
        $theme = value.toLowerCase();
        document.documentElement.setAttribute('data-theme', $theme);
    }

    function handleLanguageChange(event: Event) {
        $language = (event.target as HTMLSelectElement).value;
        onLanguageChanged($language);
    }

    function handleLocationChange(event: Event) {
        $location = (event.target as HTMLSelectElement).value;
        onLocationChanged($location);
    }
</script>

<div class="flex justify-between items-center mb-4">
    {#each navOptions as {store, icon, options, onChange}}
        <div class="flex items-center space-x-1 rounded-md shadow-sm px-2 py-1">
            <svelte:component this={icon} size={16} class="text-base-content"/>
            <select
                    on:change={onChange}
                    class="bg-transparent border-none text-sm font-medium">
                {#each options as option}
                    <option value={option.key} selected={get(store) === option.key}>{option.value}</option>
                {/each}
            </select>
        </div>
    {/each}
</div>
<p class="text-2xl font-bold mb-4">{$translations.personalTraining}</p>
