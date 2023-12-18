<script lang="ts">
	export let tenant: Tenant;
</script>

<header class="navbar px-3 md:px-6 flex border-b sticky top-0 left-0 right-0 z-50">
	<div class="flex-1">
		<a href="/{tenant.slug}" class="text-xl font-bold hover-link">{tenant.name}</a>
	</div>

	<div class="flex-none">
		<div class="dropdown dropdown-end">
			<div tabindex="0" role="button" class="btn btn-ghost btn-circle">
				<div class="indicator">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
						/></svg
					>
					<span class="badge badge-sm indicator-item">8</span>
				</div>
			</div>

			<button
				tabindex="0"
				class="mt-3 z-[1] card card-compact dropdown-content w-52 bg-base-100 shadow"
			>
				<div class="card-body">
					<span class="font-bold text-lg">8 Items</span>
					<span class="text-info">Subtotal: $999</span>
					<div class="card-actions">
						<button class="btn btn-primary btn-block">View cart</button>
					</div>
				</div>
			</button>
		</div>
	</div>
</header>
