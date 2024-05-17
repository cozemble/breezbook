<script lang="ts">
	let test = 'Hello World';

	const onClick = () => {
		test = 'Hello Mars!';
	};
</script>

<div class="card bg-base-200">
	<div class="card-body bg-base-300">
		<h1>{test}</h1>
		<div class="card-actions">
			<button class="btn" on:click={onClick}>Button</button>
		</div>
	</div>
</div>
