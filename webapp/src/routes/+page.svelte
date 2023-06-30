<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Modal, modalStore } from '@skeletonlabs/skeleton';
	import type { ModalSettings, ModalComponent } from '@skeletonlabs/skeleton';
	import AddNewCharacter from '$lib/AddNewCharacter.svelte';
	import { isCharacterNameExpiring, NameState } from '$lib/tibia_client';
	import { deleteExpiringName, addExpiringName, loadExpiringNames, unsubscribeAll, expiringNamesStore } from '$lib/firebase';

	onMount(async () => {
		loadExpiringNames()
	});

	onDestroy(() => {
		unsubscribeAll()
	});

	let searchCharacterName = '';

	const modalComponent: ModalComponent = {
		ref: AddNewCharacter,
		slot: '<p>Skeleton</p>'
	};

	const modal: ModalSettings = {
		type: 'component',
		// Pass the component directly:
		component: modalComponent
	};


	async function addNewCharacter() {
		//modalStore.trigger(modal);
		const nameState = await isCharacterNameExpiring(searchCharacterName);
		if (nameState !== NameState.expiring) {
			alert(`${searchCharacterName} is ${NameState[nameState]}!`);
			return;
		}

		await addExpiringName(searchCharacterName);
		searchCharacterName = '';
	}

	async function remove(idx: number) {
		const expiring_name = $expiringNamesStore[idx];
		await deleteExpiringName(expiring_name.name);
	}

	
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
