<script lang="ts">
	function goBack() {
		window.history.back();
	}
</script>

<button on:click={goBack} class="btn btn-lg glass"> Go Back </button>
