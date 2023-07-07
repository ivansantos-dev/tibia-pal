<script lang="ts">
	import { userStore } from '$lib/firebase';
</script>

<button class="btn variant-filled" on:click={userStore.logout}>Logout</button>
