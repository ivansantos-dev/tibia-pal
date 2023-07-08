<script lang="ts">
	import { modalStore, ProgressBar } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { getCharacterFromTibia, type TibiaApiCharacter } from '$lib/tibia_client';
	import { friendListStore } from '$lib/firebase';

	export let playerName: string
	let player: TibiaApiCharacter = undefined 


	onMount(async () => {
		player = await getCharacterFromTibia(playerName);
	});

	async function add() {
			await friendListStore.add(player.name, player.world)
			modalStore.close();
	}
</script>

<slot />

<div class="card p-4 w-modal shadow-xl space-y-4">
	<header class="card-header">
		<h2 class="h2">Add to VIP List</h2>
	</header>

	<section class="p-4">
		{#if player === undefined}
			<ProgressBar />
		{:else}
			<div class="table-container w-56">
				<table class="table table-hover border border-white">
						<tr>
							<th class="text-end p-2">Name</th>
							<td>{player?.name}</td>
						</tr>
						<tr>
							<th class="text-end p-2">Former Names</th>
							<td>{player?.formerNames}</td>
						</tr>
						<tr>
							<th class="text-end p-2">World</th>
							<td>{player?.world}</td>
						</tr>
				</table>
			</div>

		{/if}
	</section>

	<footer class="card-footer text-end">

			<form>
		<button class="btn variant-filled" on:click={modalStore.close}>Cancel</button>
		<button class="btn variant-filled-primary" on:click={add}>Add</button>
			</form>
	</footer>

</div>
