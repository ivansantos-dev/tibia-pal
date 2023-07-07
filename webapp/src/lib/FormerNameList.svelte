<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { getCharacterFromTibia, NameState } from '$lib/tibia_client';
	import {expiringNamesStore } from '$lib/firebase';
	import Icon from '@iconify/svelte';


	onMount(async () => {
		expiringNamesStore.load();
	});
	
	onDestroy(() => {
		expiringNamesStore.destroy(); });

	let searchCharacterName = '';

	async function add() {
		const character = await getCharacterFromTibia(searchCharacterName);
		const nameState = character.nameState
		if (character.nameState !== NameState.expiring) {
			alert(`${searchCharacterName} is ${NameState[nameState]}!`);
			return;
		}

		await expiringNamesStore.add(searchCharacterName);
		searchCharacterName = '';
	}

	async function remove(idx: number) {
		const expiring_name = $expiringNamesStore[idx];
		await expiringNamesStore.delete(expiring_name.id);
	}
</script>

<div class="card">
	<header class="card-header">
		<h2 class="h2 pb-4">Former Names</h2>
	</header>
	<section class="p-4">
		<div class="table-container">
			<table class="table hover">
				<thead>
					<tr>
						<th>Name</th>
						<th>Status</th>
						<th>Last Checked</th>
						<th><span /></th>
					</tr>
				</thead>
				<tbody>
					{#each $expiringNamesStore as row, i}
						<tr>
							<td>{row.name}</td>
							<td>{row.status}</td>
							<td>{row.lastChecked?.toDate().toLocaleString()}</td>
							<td
								><button type="button" class="btn variant-filled-error" on:click={() => remove(i)}
									>
									<Icon icon="mdi:trash" />
								</button
								>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
	
	<footer class="card-footer">

		{#if $expiringNamesStore.length < 3}
			<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
				<div class="input-group-shim"><Icon icon="mdi:search" /></div>
				<input type="search" placeholder="Search..." 
					bind:value={searchCharacterName} />
				<button class="variant-filled" on:click={add}>Add</button>
			</div>
		{:else}
		<em>You can only track up to 3 player names</em>
		{/if}
	</footer>
</div>
