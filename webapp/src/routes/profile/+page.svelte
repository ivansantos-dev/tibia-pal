<script lang="ts">
	import { profileStore } from '$lib/firebase'
	import { onDestroy, onMount } from 'svelte';
	import { SlideToggle } from '@skeletonlabs/skeleton';

	let notificationEmails = ''
	let enableEmailNotification = false;

	async function save() {
		profileStore.save(enableEmailNotification, notificationEmails)
	}


	onMount(async () => {
		profileStore.load();
		notificationEmails = $profileStore.notificationEmails
		enableEmailNotification = $profileStore.enableNotificationEmail
	});

	onDestroy(async () => {
		profileStore.destroy();
	});
</script>
	

<div class="card max-w-2xl mx-auto p-8 m-4">
	<form>
		<button class="btn variant-filled" on:click={() => Notification.requestPermission()}>Request Permission</button> 
		<br/>
		<SlideToggle name="slide" bind:checked={enableEmailNotification}>Enable Email Notification</SlideToggle>
		<label class="label">
			<span>Notification Emails</span>
			<input class="input" type="text" placeholder="notify-me@gmail.com,notify-me2@gmail.com" bind:value={notificationEmails}/>
		</label>

		<button class="btn variant-filled mt-10" on:click={save}>Save</button>
	</form>
</div>
