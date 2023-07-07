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
		const nameState = name.nameState

		if (nameState !== NameState.not_found) {
			alert(`${searchFriendName} is ${NameState[nameState]}!`);
			return;
		}
		await friendListStore.add(searchFriendName, name.world)
		searchFriendName = '';
	}

	async function remove(idx: number) {
		const friend = $friendListStore[idx];
		await friendListStore.delete(friend.name);
	}
</script>

<div class="card p-4 m-4">
	<h2 class="h2 pb-4">Buddy List</h2>
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
							{#if row.status == "offline"}
								<strong class="text-red-500">{row.status}</strong>
							{:else}
								<strong class="text-green-500">{row.status}</strong>
							{/if}
						</td>
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
			<tfoot>
				<tr>
					<td colspan="3">
						{#if $friendListStore.length < 3}
							<div class="md:flex md:items-center mb-6">
								<div class="md:w-2/3">
									<label class="block md:text-right mb-1 md:mb-0 pr-4" for="inline-full-name">
										<input
											class="input"
											id="inline-full-name"
											type="text"
											placeholder="Search for a friend"
											bind:value={searchFriendName}
										/>
									</label>
								</div>
								<div class="md:w-1/3">
									<button type="button" class="btn variant-filled" on:click={add}
									>Add</button
									>
								</div>
							</div>
						{:else}
							<em>You can only track up to 3 player names</em>
						{/if}
					</td>
				</tr>
			</tfoot>
		</table>
	</div>
</div>
