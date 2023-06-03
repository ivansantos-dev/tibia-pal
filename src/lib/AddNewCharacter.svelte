<div class="modal-example-form {cBase}">
    <header class={cHeader}>{$modalStore[0].title ?? '(title missing)'}</header>
    <article>{$modalStore[0].body ?? '(body missing)'}</article>
    <!-- Enable for debugging: -->
    <form class="modal-form {cForm}">
        <label class="label">
            <span>Name</span>
            <input class="input" type="text" bind:value={formData.name} placeholder="Enter name..." />
        </label>
        <label class="label">
            <span>Phone Number</span>
            <input class="input" type="tel" bind:value={formData.tel} placeholder="Enter phone..." />
        </label>
        <label class="label">
            <span>Email</span>
            <input class="input" type="email" bind:value={formData.email} placeholder="Enter email address..." />
        </label>
    </form>
    <!-- prettier-ignore -->
    <footer class="modal-footer {parent.regionFooter}">
    <button class="btn {parent.buttonNeutral}" on:click={parent.onClose}>{parent.buttonTextCancel}</button>
    <button class="btn {parent.buttonPositive}" on:click={onFormSubmit}>Submit Form</button>
</footer>
</div>