<script lang="ts">
	import '@skeletonlabs/skeleton/themes/theme-gold-nouveau.css';
	import '@skeletonlabs/skeleton/styles/skeleton.css';
	import '../app.postcss';

	import { AppShell, AppBar, ProgressRadial } from '@skeletonlabs/skeleton';
	import Login from '$lib/Login.svelte';
	import Logout from '$lib/Logout.svelte';
	import { userStore } from '$lib/firebase';

	// Imports for popup
	import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });
			

</script>

<svelte:head>
	<title>Tibia Buddy List</title>
</svelte:head>

<AppShell>
	<svelte:fragment slot="header">
		<AppBar>
			<svelte:fragment slot="lead">
				<strong class="text-xl uppercase">Tibia Buddy List</strong>
			</svelte:fragment>
			<svelte:fragment slot="trail">
				{#if $userStore}
					<a href="/">Home</a>
					<a href="/profile">Profile</a>
					<a href="/faq">FAQ</a>
					<Logout />
				{/if}
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	{#if $userStore === undefined}
		<div class="flex justify-center items-center h-screen mx-4">
			<ProgressRadial />
		</div>
	{:else if $userStore === null}
		<Login />
	{:else}
		<slot />
	{/if}

	<svelte:fragment slot="pageFooter">
		<AppBar>
			<p>Copyright &copy; 2023</p>
		</AppBar>
	</svelte:fragment>
</AppShell>
