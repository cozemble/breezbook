<script lang="ts">
	import _ from 'lodash';
	import { initValues } from '$lib/utils';
	import Input from './Input.svelte';

	export let schema: JSONSchema;
	export let value: ObjectValue;
	export let errors: ErrorObject;

	// <!-- TODO make sure values are defined -->
	value = initValues(schema) as ObjectValue;

	$: properties = schema.properties;

	// <!-- TODO IF NEEDED object and array properties -->
	// $: objectProperties = Object.entries(properties || []).filter(
	// 	([key, prop]) => prop.type === 'object'
	// );
	// $: arrayProperties = Object.entries(properties || []).filter(
	// 	([key, prop]) => prop.type === 'array'
	// );

	$: simpleProperties = Object.entries(properties || []).filter(
		([key, prop]) => prop.type !== 'object' && prop.type !== 'array'
	);

	// <!-- TODO validation -->
</script>

<!-- 
	@component
	Render a form from a JSON Schema definition.
	- The form is bound to a value object.
	- The errors are bound to an error object.
	- Nested properties are not supported (yet).
	- Submitting the form should happen outside of this component.
 -->

<!-- TODO render components respective to property types: date, int, float etc. -->
<!-- TODO fix type issue -->
<div class="gap-x-4 flex flex-col justify-center items-center">
	{#each simpleProperties as [key, prop], i (i)}
		<Input bind:value={value[key]} name={key} schema={prop} error={_.get(errors, key)} />
	{/each}
</div>

<style>
	/* div {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	} */
</style>
