<script lang="ts">
	import '@skeletonlabs/skeleton/themes/theme-gold-nouveau.css';
	import '@skeletonlabs/skeleton/styles/skeleton.css';
	import '../app.postcss';

	import { AppShell, AppBar, ProgressRadial } from '@skeletonlabs/skeleton';
	import Login from '$lib/Login.svelte';
	import Logout from '$lib/Logout.svelte';
	import { userStore } from '$lib/firebase';
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
					<a href='/'>Home</a>
					<a href='/profile'>Profile</a>
					<Logout />
				{/if}
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<div class="flex justify-center items-center h-screen mx-4">
		{#if $userStore === undefined}
			<ProgressRadial />
		{:else if $userStore === null}
			<Login />
		{:else}
			<slot />
		{/if}
	</div>

	<svelte:fragment slot="pageFooter">
		<AppBar>
			<p>Copyright &copy; 2023</p>
		</AppBar>
	</svelte:fragment>
</AppShell>
