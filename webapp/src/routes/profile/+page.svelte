<script lang="ts">
	import { profileStore } from '$lib/firebase'
	import { onDestroy, onMount } from 'svelte';
	import { SlideToggle } from '@skeletonlabs/skeleton';
	import { where } from 'firebase/firestore';

	let notificationEmails = ''
	let enableEmailNotification = false;

	async function save() {
		profileStore.save(enableEmailNotification, notificationEmails)
	}

	async function requestPermission() {
		profileStore.notificationRequestPermission()
	}

	function testNotification() {
		new Notification('Tibia Pal', { body: 'This is a test notification', icon: '/favicon.ico' })
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
		<button class="btn variant-filled mb-4" on:click={requestPermission}>Request Permission</button> 
		<button class="btn variant-filled-surface mb-4" on:click={testNotification}>Test Notification</button> 
	<form>
		<SlideToggle name="slide" bind:checked={enableEmailNotification}>Enable Email Notification</SlideToggle>
		<label class="label">
			<span>Notification Emails</span>
			<input class="input" type="text" placeholder="notify-me@gmail.com,notify-me2@gmail.com" bind:value={notificationEmails}/>
		</label>

		<button class="btn variant-filled mt-10" on:click={save}>Save</button>
	</form>
</div>
