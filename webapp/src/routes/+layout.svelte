<script lang="ts">
	import '../theme.postcss';
	import '@skeletonlabs/skeleton/styles/skeleton.css';
	import '../app.postcss';

	import { AppShell, AppBar } from '@skeletonlabs/skeleton';
	import Login from '$lib/Login.svelte';
	import Logout from '$lib/Logout.svelte';
	import { userStore } from '$lib/firebase';
</script>

<svelte:head>
	<title>Tibia Pal</title>
</svelte:head>

<AppShell>
	<svelte:fragment slot="header">
		<AppBar>
			<svelte:fragment slot="lead">
				<strong class="text-xl uppercase">Tibia Pal</strong>
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
	{#if !$userStore}
		<Login />
	{:else}
		<slot />
	{/if}

	<svelte:fragment slot="footer">
		<p>Copyright &copy; 2023</p>
	</svelte:fragment>
</AppShell>
