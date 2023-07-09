<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { friendListStore } from '$lib/firebase';
	import Icon from '@iconify/svelte';
	import { modalStore, type ModalSettings, Modal, type ModalComponent } from '@skeletonlabs/skeleton';
	import ModalAddFormerName from './ModalAddFormerName.svelte';

	onMount(async () => {
		friendListStore.load();
	});

	onDestroy(() => {
		friendListStore.destroy();
	});

	let searchFriendName = '';

	async function add() {
		if (searchFriendName === '') {
			return
		}

		const modalComponent: ModalComponent = {
			ref: ModalAddFormerName,
			props: { playerName: searchFriendName },
		};

		const modal: ModalSettings = {
			type: 'component',
			component: modalComponent,
		};
		modalStore.trigger(modal);
	}

	async function remove(idx: number) {
		const friend = $friendListStore[idx];
		await friendListStore.delete(friend.name);
	}
</script>

<Modal />

<h2 class="h2">VIP List</h2>
<div class="table-container">
	<table class="table">
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
{#if $friendListStore.length < 3}
	<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
		<div class="input-group-shim"><Icon icon="mdi:search" /></div>
		<input type="search" placeholder="Search..." bind:value={searchFriendName} />
		<button class="variant-filled" on:click={add}>Search</button>
	</div>
{:else}
<em>You can only track up to 3 player names</em>
{/if}
