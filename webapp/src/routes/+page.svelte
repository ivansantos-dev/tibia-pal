<script lang="ts">
	import BuddyList from '$lib/BuddyList.svelte';
	import FormerNameList from '$lib/FormerNameList.svelte';
</script>

<div class="flex flex-col gap-8 justify-center items-center h-screen border-black">
	<div>
		<BuddyList />
	</div>

	<div>
		<FormerNameList />
	</div>
</div>
