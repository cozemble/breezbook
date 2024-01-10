<script lang="ts">
	export let name: string;
	export let value: string;
	export let error: string | undefined = undefined;
	export let readonly = false;
	export let schema: JSONSchema;
</script>

<label class="form-control w-full">
	<div class="label">
		<span class="label-text capitalize {error && 'text-error'}">{name}</span>
	</div>

	<input
		type="text"
		bind:value
		class="input input-bordered w-full pr-0 {error && 'input-error'}"
		placeholder={schema.description}
		{readonly}
		disabled={readonly}
	/>

	<div class="label">
		<span class="label-text-alt text-error">{error || ''}</span>
	</div>
</label>
