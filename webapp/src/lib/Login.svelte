<script lang="ts">
	import { login } from '$lib/firebase';
	let email = '';
	let password = '';

	function signin() {
		login(email.trim(), password.trim());
	}
</script>

<div class="card max-w-2xl mx-auto p-8 m-4">
	<header class="card-jeader">
		<h1 class="h1">Sign In</h1> 
	</header>
	<section class="p-4">
		<form>
			<label class="label">
				<span>Email</span>
				<input class="input" type="text" id="email" bind:value={email} />
			</label>

			<label class="label">
				<span>Password</span>
				<input class="input" type="password" id="password" bind:value={password} />
			</label>
		</form>
	</section>
	<footer class="card-footer">
		<button type="button" class="btn variant-filled" on:click={signin}>Login</button>
	</footer>

</div>
