<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { getCharacterFromTibia, NameState } from '$lib/tibia_client';
	import { friendListStore } from '$lib/firebase';
	import Icon from '@iconify/svelte';

	onMount(async () => {
		friendListStore.load();
	});

	onDestroy(() => {
		friendListStore.destroy();
	});

	let searchFriendName = '';

	async function add() {
		const name = await getCharacterFromTibia(searchFriendName);
		const nameState = name.nameState;

		if (nameState !== NameState.not_found) {
			alert(`${searchFriendName} is ${NameState[nameState]}!`);
			return;
		}
		await friendListStore.add(searchFriendName, name.world);
		searchFriendName = '';
	}

	async function remove(idx: number) {
		const friend = $friendListStore[idx];
		await friendListStore.delete(friend.name);
	}
</script>

<div class="card">
	<header class="card-header">
		<h2 class="h2 pb-4">Buddy List</h2>
	</header>
	<section class="p-4">
		<div class="table-container">
			<table class="table hover">
				<thead>
					<tr>
						<th>Name</th>
						<th>World</th>
						<th>Status</th>
						<th><span /></th>
					</tr>
				</thead>
				<tbody>
					{#each $friendListStore as row, i}
						<tr>
							<td>{row.name}</td>
							<td>{row.world}</td>
							<td>
								{#if row.status == 'offline'}
									<strong class="text-red-500">{row.status}</strong>
								{:else}
									<strong class="text-green-500">{row.status}</strong>
								{/if}
							</td>
							<td
								><button type="button" class="btn variant-filled-error" on:click={() => remove(i)}>
									<Icon icon="mdi:trash" />
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
	<footer class="card-footer">
		{#if $friendListStore.length < 3}
			<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
				<div class="input-group-shim"><Icon icon="mdi:search" /></div>
				<input type="search" placeholder="Search..." bind:value={searchFriendName} />
				<button class="variant-filled" on:click={add}>Add</button>
			</div>
		{:else}
			<em>You can only track up to 3 player names</em>
		{/if}
	</footer>
</div>
