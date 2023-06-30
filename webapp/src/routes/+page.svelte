<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { getCharacterFromTibia, NameState } from '$lib/tibia_client';
	import {friendListStore, expiringNamesStore } from '$lib/firebase';

	onMount(async () => {
		friendListStore.load()
		expiringNamesStore.load()
	});

	onDestroy(() => {
		expiringNamesStore.destroy()
		friendListStore.destroy()
	});

	let searchCharacterName = '';
	let searchFriendName = '';


	async function addNewFriend() {
		const name = await getCharacterFromTibia(searchFriendName);
		const nameState = name.nameState

		if (nameState !== NameState.not_found) {
			alert(`${searchFriendName} is ${NameState[nameState]}!`);
			return;
		}
		await friendListStore.add(searchFriendName, name.world)

		searchFriendName = '';
	}

	async function removeFriend(idx: number) {
		const friend = $friendListStore[idx];
		await friendListStore.delete(friend.id);
	}

	async function addNewCharacter() {
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

<div class="flex justify-center items-center flex-col p-4">
	<div class="card p-8 m-4 w-full">
		<h1 class="h1">Online Pals</h1>

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
							<td>{row.status}</td>
							<td
								><button type="button" class="btn variant-filled" on:click={() => removeFriend(i)}
									>Remove Track</button
								>
							</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr>
						<td colspan="3">
							{#if $friendListStore.length < 30}
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
										<button type="button" class="btn variant-filled" on:click={addNewFriend}
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

	<div class="card p-8 m-4 w-full">
		<h1 class="h1">Former Names</h1>

		<div class="table-container">
			<table class="table hover">
				<thead>
					<tr>
						<th>Name</th>
						<th>Status</th>
						<th>Next Check</th>
						<th />
					</tr>
				</thead>
				<tbody>
					{#each $expiringNamesStore as row, i}
						<tr>
							<td>{row.name}</td>
							<td>{row.status}</td>
							<td>{row.nextCheck.toDate().toLocaleString()}</td>
							<td
								><button type="button" class="btn variant-filled" on:click={() => remove(i)}
									>Remove Track</button
								>
							</td></tr
						>
					{/each}
				</tbody>
				<tfoot>
					<tr>
						<td colspan="3">
							{#if $expiringNamesStore.length < 30}
								<div class="md:flex md:items-center mb-6">
									<div class="md:w-2/3">
										<label class="block md:text-right mb-1 md:mb-0 pr-4" for="inline-full-name">
											<input
												class="input"
												id="inline-full-name"
												type="text"
												placeholder="Search for an expiring name"
												bind:value={searchCharacterName}
											/>
										</label>
									</div>
									<div class="md:w-1/3">
										<button type="button" class="btn variant-filled" on:click={addNewCharacter}
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
</div>
