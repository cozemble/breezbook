<script lang="ts">
    import type {CoreCustomerDetails} from "$lib/uxs/personal-training/journeyState";
    import {createEventDispatcher} from "svelte";

    const details: CoreCustomerDetails = {
        firstName: 'Mike',
        lastName: 'Hogan',
        email: 'mike@email.com',
        phone: '+14155552671',
    }
    const dispatch = createEventDispatcher()

    function onNext() {
        if(!details.firstName || !details.lastName || !details.email || !details.phone) {
            alert('Please fill in all fields')
            return
        }
        if(!details.email.includes('@')) {
            alert('Please enter a valid email address')
            return
        }
        if(details.firstName.length < 2) {
            alert('Please enter a longer first name')
            return
        }
        if(details.lastName.length < 2) {
            alert('Please enter a longer last name')
            return
        }
        if(details.phone.length < 2) {
            alert('Please enter a longer phone number')
            return
        }
        dispatch('filled', details)
    }
</script>

<h3>Your Details</h3>
<form class="flex flex-col w-1/6">
    <label>
        First Name
        <input class="input input-bordered" type="text" bind:value={details.firstName}/>
    </label>
    <label>
        Last Name
        <input class="input input-bordered" type="text" bind:value={details.lastName}/>
    </label>
    <label>
        Email
        <input class="input input-bordered" type="email" bind:value={details.email}/>
    </label>
    <label>
        Phone
        <input class="input input-bordered" type="tel" bind:value={details.phone}/>
    </label>
    <button class="btn btn-primary" type="submit" on:click={onNext}>Next</button>
</form>