<script lang="ts">
	import '@skeletonlabs/skeleton/themes/theme-gold-nouveau.css';
	import '@skeletonlabs/skeleton/styles/skeleton.css';
	import '../app.postcss';

	import { AppShell, AppBar, ProgressRadial } from '@skeletonlabs/skeleton';
	import Login from '$lib/Login.svelte';
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
				<a href="/" class="font-bold text-xl uppercase">Tibia Buddy</a>
			</svelte:fragment>
			<svelte:fragment slot="trail">
				{#if $userStore}
					<a href="/faq">FAQ</a>
					<a href="/settings">Settings</a>
				{/if}
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<div class="flex flex-col items-center h-screen m-4 w-fit sm:w-[50%] ">
	{#if $userStore === undefined}
			<ProgressRadial />
	{:else if $userStore === null}
		<Login />
	{:else}
			<div class="container">
				<slot />
			</div>
	{/if}
	</div>

	<svelte:fragment slot="pageFooter">
		<AppBar>
			<p>Copyright &copy; 2023</p>
		</AppBar>
	</svelte:fragment>
</AppShell>
