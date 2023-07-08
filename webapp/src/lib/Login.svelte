<script lang="ts">
	import { userStore } from '$lib/firebase';
	import Icon from '@iconify/svelte';
</script>

<div class="flex justify-center items-center h-screen">
	<div class="card p-4">
		<header class="card-header">
			<h1 class="h1">Sign In</h1>
		</header>
		<section class="p-10">
			<button type="button" class="btn variant-filled" on:click={userStore.login}>
				<span>
					<Icon icon="devicon:google" />
				</span>
				<span>Continue with Google</span>
			</button>
		</section>
	</div>
</div>
