<script lang="ts">
    import type {Form} from "@breezbook/packages-types";
    import type {JsonSchema} from "@vapi-ai/web/dist/api";
    import {createEventDispatcher} from "svelte";
    import {translations} from "$lib/ui/stores";

    export let form: Form
    const schema = form.schema as JsonSchema
    const properties = (schema.properties ?? {}) as any
    const keys = Object.keys(properties)
    const data = {} as Record<string, string>
    const dispatch = createEventDispatcher()

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
</script>

<h3>{form.name}</h3>
<form class="mt-2">
    {#each keys as key}
        <div>
            <label for={key} class="label">
                <span class="label-text">{label(key)}</span>
                {#if helpText(key)}
                    <span class="label-text-alt">{helpText(key)}</span>
                {/if}
            </label>
            <input class="input input-bordered" type="text" id={key} name={key} bind:value={data[key]}/>
        </div>
    {/each}
    <button class="btn btn-primary mt-4" type="submit" on:click={onSubmit}>{$translations.submit}</button>
</form>