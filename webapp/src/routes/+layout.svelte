<script lang="ts">
	import '../theme.postcss';
	// If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
	import '@skeletonlabs/skeleton/styles/skeleton.css';
	// Most of your app wide CSS should be put in this file
	import '../app.postcss';
	import { AppShell, AppBar, Avatar } from '@skeletonlabs/skeleton';
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
					<Logout />
				{/if}
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	{#if $userStore}
		<slot />
	{:else}
		<Login />
	{/if}

	<svelte:fragment slot="footer">
		<p>Copyright &copy; 2023</p>
	</svelte:fragment>
</AppShell>
