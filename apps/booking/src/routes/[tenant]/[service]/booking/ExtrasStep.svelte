<script lang="ts">
	const extras: Service.Extra[] = [
		{
			name: '50% Off HD Carnauba Wax Coating (Lasts 6 Months, Gloss Finish!)',
			price: 19.99,
			selected: false
		},
		{
			name: 'Alloy Wheel Sealant x4 wheels (Glossy Finish, Lasts 3 Months)',
			price: 39.99,
			selected: false
		},
		{
			name: 'Carpet Stripes',
			price: 4.99,
			selected: false
		},
		{
			name: 'Deep Clean 1 Seat + Mat',
			price: 19.99,
			selected: false
		}
	];

	export let value: Service.Extra[] | null;

	$: value = extras.filter((extra) => extra.selected);
</script>

{#each extras as extra, i (i)}
	<div class="form-control">
		<label class="cursor-pointer label">
			<span class="label-text">
				{extra.name}
			</span>

			<span class="flex items-center">
				<span class="label-text mr-4 text-primary">£{extra.price}</span>

				<input type="checkbox" bind:checked={extra.selected} class="checkbox checkbox-secondary" />
			</span>
		</label>
	</div>
{/each}
