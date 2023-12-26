<script lang="ts">
	export let value: Service.Details | null;
	export let back: () => void;
	export let onComplete: () => void;

	const details: Service.Details = {
		name: '',
		email: '',
		phone: '',
		address: '',
		notes: ''
	};

	// <!-- TODO validation -->
</script>

<label class="form-control w-full max-w-xs">
	<div class="label">
		<span class="label-text">Bank Name</span>
	</div>
	<input type="text" placeholder="Example Bank" class="input input-bordered w-full max-w-xs" />
</label>

<label class="form-control w-full max-w-xs">
	<div class="label">
		<span class="label-text">Bank Number</span>
	</div>
	<input type="text" placeholder="12345678" class="input input-bordered w-full max-w-xs" />
</label>
<div class="flex justify-end gap-3 mt-2">
	<button class="btn btn-secondary" on:click={back}> Back </button>
	<button class="btn btn-primary" on:click={onComplete}> Finish Booking </button>
</div>
