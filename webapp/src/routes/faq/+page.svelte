<script lang="ts">
	import { Accordion, AccordionItem } from "@skeletonlabs/skeleton";
	const data = [
		{summary: "How does former names tracking work?", content: "Magic!"},
		{summary: "How do I enable notification?", content: "Magic!"},
		{summary: "How do I enable notification on Android?", content: "Magic!"},
		{summary: "How do I enable notification on iOS?", content: "Magic!"},
	]

</script>
	<div class="card">
		<Accordion>
			{#each data as row}
			<AccordionItem>
				<svelte:fragment slot="summary">{row.summary}</svelte:fragment>
				<svelte:fragment slot="content">{row.content}</svelte:fragment>
			</AccordionItem>
			{/each}
		</Accordion>
	</div>
