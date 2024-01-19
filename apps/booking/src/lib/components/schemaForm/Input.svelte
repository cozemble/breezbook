<script lang="ts">
	import { jsonSchemaTypeToInputType } from '$lib/utils';

	export let name: string;
	export let value: string;
	export let error: string | undefined = undefined;
	export let readonly = false;
	export let schema: JSONSchema;
	export let type: string = jsonSchemaTypeToInputType(schema.type) || 'text'; // <!-- TODO strict typing -->

	console.log(name, schema);
</script>

<label class="form-control w-full">
	<div class="label">
		<span class="label-text capitalize {error && 'text-error'}">{name}</span>
	</div>

	{#if type === 'number'}
		<input
			bind:value
			class="input input-bordered w-full pr-0 {error && 'input-error'}"
			placeholder={schema.description}
			type="number"
			{readonly}
			disabled={readonly}
		/>
	{:else}
		<input
			type="text"
			bind:value
			class="input input-bordered w-full pr-0 {error && 'input-error'}"
			placeholder={schema.description}
			{readonly}
			disabled={readonly}
		/>
	{/if}

	<div class="label">
		<span class="label-text-alt text-error">{error || ''}</span>
	</div>
</label>
