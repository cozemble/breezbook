<script lang="ts">
    import {createEventDispatcher} from 'svelte';
    import type {JSONSchema} from './types.js';


    export let schema: JSONSchema;
    export let data: { [key: string]: any }

    const dispatch = createEventDispatcher();

    function isRequired(field: string): boolean {
        return schema.required ? schema.required.includes(field) : false;
    }

    function nextStep() {
        dispatch('next');
    }

    function prevStep() {
        dispatch('prev');
    }

</script>

<div class="bg-base-200 p-4 rounded-lg">
    <form on:submit|preventDefault>
        {#each Object.entries(schema.properties) as [field, fieldSchema]}
            <div class="form-control w-full mb-4">
                <label class="label" for={field}>
                    <span class="label-text">{fieldSchema.title || field}{isRequired(field) ? ' *' : ''}</span>
                </label>

                {#if fieldSchema.type === 'string'}
                    <input
                            type="text"
                            id={field}
                            class="input input-bordered w-full"
                            placeholder={fieldSchema.description || ''}
                            bind:value={data[field]}
                            required={isRequired(field)}
                    />
                {:else if fieldSchema.type === 'number'}
                    <input
                            type="number"
                            id={field}
                            class="input input-bordered w-full"
                            placeholder={fieldSchema.description || ''}
                            bind:value={data[field]}
                            required={isRequired(field)}
                    />
                {:else if fieldSchema.type === 'boolean'}
                    <label class="label cursor-pointer justify-start">
                        <input
                                type="checkbox"
                                id={field}
                                class="checkbox mr-2"
                                bind:checked={data[field]}
                                required={isRequired(field)}
                        />
                        <span class="label-text">{fieldSchema.description || ''}</span>
                    </label>
                {/if}
            </div>
        {/each}
        <div class="mt-4 flex flex-col">
            <button class="btn btn-primary mb-2" on:click={nextStep}>Next</button>
            <button class="btn btn-outline" on:click={prevStep}>Back</button>
        </div>
    </form>
</div>