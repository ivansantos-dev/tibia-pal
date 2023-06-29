<script lang="ts">
	import { login } from '$lib/firebase';
	let email = '';
	let password = '';

	function signin() {
		console.log(email, password);
		login(email, password);
	}
</script>

<div class="card max-w-2xl mx-auto p-8 m-4">
	<h1 class="h1">Sign In</h1>
	<form>
		<label class="label">
			<span>Email</span>
			<input class="input" type="text" id="email" bind:value={email} />
		</label>

		<label class="label">
			<span>Password</span>
			<input class="input" type="password" id="password" bind:value={password} />
		</label>

		<button type="button" class="btn variant-filled mt-4 end-0" on:click={signin}>Login</button>
	</form>
</div>
