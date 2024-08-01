<script lang="ts">
    import type {Form} from "@breezbook/packages-types";
    import type {JsonSchema} from "@vapi-ai/web/dist/api";
    import {createEventDispatcher} from "svelte";
    import {translations} from "$lib/ui/stores";
    import {ChevronLeft} from "lucide-svelte";

    export let form: Form
    export let data = {} as Record<string, string>
    const schema = form.schema as JsonSchema
    const properties = (schema.properties ?? {}) as any
    const keys = Object.keys(properties)
    const dispatch = createEventDispatcher()

    console.log({form})

    $: kindaValid = everyKeyHasValue(data)

    function label(key: string) {
        const itemDefinition = properties[key]
        if (itemDefinition.title) {
            return itemDefinition.title
        }
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
    }

    function everyKeyHasValue(obj: any) {
        return keys.every(key => obj[key])
    }

    function onSubmit() {
        if (everyKeyHasValue(data)) {
            dispatch('formFilled', data)
        } else {
            alert('Please fill in all fields')
        }
    }

    function helpText(key: string) {
        const itemDefinition = properties[key]
        return itemDefinition.description ?? null
    }

    function onBack() {
        dispatch('back')
    }
</script>

<h2 class="text-xl font-bold">{form.name}</h2>
{#if form.description}
    <div class="text-sm">{form.description}</div>
{/if}

<form class="mt-2">
    {#each keys as key}
        <div>
            <label for={key} class="label">
                <span class="label-text font-bold">{label(key)}</span>
                {#if helpText(key)}
                    <span class="label-text-alt">{helpText(key)}</span>
                {/if}
            </label>
            <input class="input input-bordered w-full" type="text" id={key} name={key} bind:value={data[key]}/>
        </div>
    {/each}

    <div class="mt-6 flex">
        <button on:click={onBack} class="btn mr-6">
            <ChevronLeft size={28}/>
        </button>

        <div class="flex justify-end w-full">
            <button on:click={onSubmit} class:bg-primary={kindaValid}
                    disabled={!kindaValid}
                    class="px-6 py-2 hover:bg-primary-focus text-primary-content rounded-md transition-colors font-semibold">
                {$translations.next}
            </button>
        </div>
    </div>
</form>