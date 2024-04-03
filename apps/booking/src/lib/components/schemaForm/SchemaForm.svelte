<script lang="ts">
	import _ from 'lodash';
	import { jsonSchemaUtils } from '$lib/common/utils';
	import Input from './Input.svelte';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';

	export let schema: JSONSchema;
	export let value: ObjectValue;
	export let errors: ErrorObject;
	/** Remember the form values with local storage */
	export let remember: {
		enabled: boolean;
		key: string;
	} = { enabled: false, key: '' };

	// <!-- TODO make sure values are defined -->
	value = jsonSchemaUtils.initValues(schema) as ObjectValue;

	$: properties = schema.properties;

	$: objectProperties = Object.entries(properties || []).filter(
		([key, prop]) => prop.type === 'object'
	);

	// <!-- TODO IF NEEDED  array properties -->
	// $: arrayProperties = Object.entries(properties || []).filter(
	// 	([key, prop]) => prop.type === 'array'
	// );

	$: simpleProperties = Object.entries(properties || []).filter(
		([key, prop]) => prop.type !== 'object' && prop.type !== 'array'
	);

	// <!-- TODO validation -->

	onMount(() => {
		if (remember.enabled && browser) {
			const storedValue = localStorage.getItem(remember.key);
			if (storedValue) {
				value = JSON.parse(storedValue);
			}
		}
	});

	onDestroy(() => {
		if (remember.enabled && browser) {
			localStorage.setItem(remember.key, JSON.stringify(value));
		}
	});
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
<div class="gap-x-4 flex flex-col justify-center items-center w-full">
	{#each simpleProperties as [key, prop], i (i)}
		<Input
			bind:value={value[key]}
			name={prop?.title ?? key}
			schema={prop}
			error={_.get(errors, key)}
		/>
	{/each}

	{#each objectProperties as [key, prop], i (i)}
		<svelte:self schema={prop} value={value[key]} errors={_.get(errors, key)} />
	{/each}
</div>

<style>
	/* div {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	} */
</style>
