<script lang="ts">
	import { onMount } from 'svelte';
	import { Modal, modalStore } from '@skeletonlabs/skeleton';
	import type { ModalSettings, ModalComponent } from '@skeletonlabs/skeleton';
	import AddNewCharacter from '$lib/AddNewCharacter.svelte';
	import {isCharacterNameExpiring, NameState } from '$lib/tibia_client';
	import { deleteExpiringName, addExpiringName, getExpiringNames } from '$lib/firebase'


	let searchCharacterName = '';
	let sourceData = [];

	const modalComponent: ModalComponent = {
		ref: AddNewCharacter,
		slot: '<p>Skeleton</p>'
	};

	const modal: ModalSettings = {
		type: 'component',
		// Pass the component directly:
		component: modalComponent
	};


	async function loadOnlineCharacters() {
		sourceData = await getExpiringNames()
	}

	async function addNewCharacter() {
		//modalStore.trigger(modal);

		const nameState = await isCharacterNameExpiring(searchCharacterName)
		if (nameState !== NameState.expiring) {
			alert(`${searchCharacterName} is ${NameState[nameState]}!`)
			return
		}

		await addExpiringName(searchCharacterName)
		loadOnlineCharacters()
		searchCharacterName = ''
	}

	async function remove(idx: number) {
		const name = sourceData[idx]
		await deleteExpiringName(name.name)
		loadOnlineCharacters();
	}

	onMount(async() => {
		loadOnlineCharacters();
	});

</script>

<Modal />
<div class="container h-full mx-auto flex justify-center items-center">
	<div class="space-y-5">
		<h1 class="h1">Former Names</h1>

		<div class="table-container">
			<table class="table hover">
				<thead>
					<tr>
						<th>Name</th>
						<th>Status</th>
						<th>Next Check</th>
						<th></th>
					</tr>Search
				</thead>
				<tbody>
					{#each sourceData as row, i}
						<tr>
							<td>{row.name}</td>
							<td>{row.status}</td>
							<td>{row.nextCheck.toDate()}</td>
							<td><button type="button" class="btn variant-filled" on:click={() => remove(i)}>Remove</button>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr>
						<td colspan="3">
							{#if sourceData.length < 30}
								<div class="md:flex md:items-center mb-6">
									<div class="md:w-2/3">
										<label class="block md:text-right mb-1 md:mb-0 pr-4" for="inline-full-name">
											<input
												class="input"
												id="inline-full-name"
												type="text"
												placeholder="Search for a pal"
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
