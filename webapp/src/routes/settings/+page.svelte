<script lang="ts">
	import { profileStore, type UserSettings } from '$lib/firebase';
	import { onDestroy, onMount } from 'svelte';
	import { SlideToggle } from '@skeletonlabs/skeleton';
	import Logout from '$lib/Logout.svelte';

	let notificationError: string | null = null;

	let settings: UserSettings = {
		enableEmailNotification: false,
		emailSettings: {
			emails: '', 
			enableFormerNames: true,
		},
		enablePushNotification: false,
		pushSettings: {
			enableFormerNames: true,
			enableVipList: true,
		}	
	};

	async function save() {
		profileStore.save(settings);
	}

	async function changePermission() {
		if (!settings.enablePushNotification) {
			profileStore.deleteToken();
			return;
		}
		
		if (!("Notification" in window)) {
			notificationError = "This browser does not support notification"
		} else if (Notification.permission === "denied") {
			notificationError = "To get notifications, you’ll need to allow them in your browser settings first."
		} else {
			let permission = await Notification.requestPermission();
			if (permission === "granted") {
				profileStore.sendToken();
				settings.enablePushNotification = true;
				return;
			} else if (permission === "denied") {
				notificationError = "To get notifications, you’ll need to allow them in your browser settings first."
			}
		}
		settings.enablePushNotification = false;
	}

	async function deleteAccount() {
		await profileStore.deleteAccount()	
	}

	onMount(async () => {
		settings = await profileStore.load();
	});

	onDestroy(async () => {
		profileStore.destroy();
	});
</script>

<h1 class="h1">Settings</h1>
<hr />

<div class="flex flex-col gap-4">
	<h2 class="h2">Notifications</h2>
	<SlideToggle name="slide" bind:checked={settings.enablePushNotification} on:change={changePermission}>Push Notifications</SlideToggle>
	{#if settings.enablePushNotification}
		<div class="space-y-2">
			<label class="flex items-center space-x-2">
				<input class="checkbox" type="checkbox" bind:checked={settings.pushSettings.enableVipList} />
				<p>VIP List</p>
			</label>
			<label class="flex items-center space-x-2">
				<input class="checkbox" type="checkbox" bind:checked={settings.pushSettings.enableFormerNames} />
				<p>Expiring Names</p>
			</label>
		</div>
	{/if}

	<SlideToggle name="slide" bind:checked={settings.enableEmailNotification}>Emails</SlideToggle
	>
	{#if settings.enableEmailNotification}
		<label class="label">
			<span>Notification Emails</span>
			<input
				class="input"
				type="text"
				placeholder="notify-me@gmail.com,notify-me2@gmail.com"
				bind:value={settings.emailSettings.emails}
			/>
		</label>
		<div class="space-y-2">
			<label class="flex items-center space-x-2">
				<input class="checkbox" type="checkbox" bind:checked={settings.emailSettings.enableFormerNames} />
				<p>Expiring Names</p>
			</label>
		</div>
	{/if}
	<button class="btn variant-filled mt-10" on:click={save}>Save</button>

		<Logout />
		<button class="btn variant-filled-error" on:click={deleteAccount}>Delete Account</button>
</div>
{#if notificationError} 
	<div class="p-8">
		<aside class="alert variant-ghost-error">
			<p>{notificationError}</p>
		</aside>
	</div>
{/if}
