<script lang="ts">
    import type {Form} from "@breezbook/packages-core";
    import type {JsonSchema} from "@vapi-ai/web/dist/api";
    import {createEventDispatcher} from "svelte";

    export let form: Form
    const schema = form.schema as JsonSchema
    const properties = schema.properties ?? {}
    const keys = Object.keys(properties)
    const data = {} as Record<string, string>
    const dispatch = createEventDispatcher()

    function sentenceCase(camelcaseString: string) {
        return camelcaseString
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
</script>

<h3>{form.name}</h3>
<form>
    {#each keys as key}
        <div>
            <label for={key}>{sentenceCase(key)}</label>
            <input class="input input-bordered" type="text" id={key} name={key} bind:value={data[key]}/>
        </div>
    {/each}
    <button class="btn btn-primary" type="submit" on:click={onSubmit}>Submit</button>
</form>