<script lang="ts">
	import { saveNotificationEmails, loadProfile } from '$lib/firebase'
    import { onMount } from 'svelte';
	let emails = ''

	async function save() {
		saveNotificationEmails(emails)
	}

	onMount(async () => {
		let profile = await loadProfile()
		emails = profile.notificationEmails
		
	})

</script>
	

	 
<div class="card max-w-2xl mx-auto p-8 m-4">
	<form>
		<label class="label">
			<span>Notification Emails</span>
			<input class="input" type="email" placeholder="notify-me@gmail.com,notify-me2@gmail.com" bind:value={emails}/>
		</label>

			<button class="btn variant-filled mt-10" on:click={save}>Save</button>
	</form>
</div>
