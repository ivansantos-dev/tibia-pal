<script lang="ts">
	import { login } from '$lib/firebase';
	let email = '';
	let password = '';

	function signin() {
		console.log(email, password);
		login(email, password);
	}
</script>

<div class="card p-4">
	<label class="label">
		<span>Email</span>
		<input class="input" type="text" id="email" bind:value={email} />
	</label>

	<label class="label">
		<span>Password</span>
		<input class="input" type="password" id="password" bind:value={password} />
	</label>

	<button type="button" class="btn variant-filled" on:click={signin}>Login</button>
</div>
