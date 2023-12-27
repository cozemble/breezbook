<script lang="ts">
    import {customerError, type CustomerInput} from "./inputTypes";

       export let customerInput: CustomerInput
    $: theCustomerError = customerError(customerInput)

</script>

<div>
    <label for="firstName">First name</label>
    <input type="text" id="firstName" bind:value={customerInput.firstName}/>
    <label for="lastName">Last name</label>
    <input type="text" id="lastName" bind:value={customerInput.lastName}/>
    <label for="email">Email</label>
    <input type="text" id="email" bind:value={customerInput.email}/>
    {#if theCustomerError}
        <span class="error">{theCustomerError}</span>
    {/if}

</div>
<style>
    .error {
        color: red;
    }
</style>

