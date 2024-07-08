<script lang="ts">
    import type {CoreCustomerDetails} from "$lib/uxs/personal-training/journeyState";
    import {createEventDispatcher} from "svelte";
    import {translations} from "$lib/ui/stores";

    const details: CoreCustomerDetails = {
        firstName: 'Mike',
        lastName: 'Hogan',
        email: 'mike@email.com',
        phone: '+14155552671',
    }
    const dispatch = createEventDispatcher()

    function onNext() {
        if(!details.firstName || !details.lastName || !details.email || !details.phone) {
            alert($translations.pleaseFillInAllFields)
            return
        }
        if(!details.email.includes('@')) {
            alert($translations.pleaseEnterAValidEmail)
            return
        }
        if(details.firstName.length < 2) {

            alert($translations.pleaseEnterALongerFirstName)
            return
        }
        if(details.lastName.length < 2) {
            alert($translations.pleaseEnterALongerLastName)
            return
        }
        if(details.phone.length < 2) {
            alert($translations.pleaseEnterALongerPhoneNumber)
            return
        }
        dispatch('filled', details)
    }
</script>

<h3>{$translations.yourDetails}</h3>
<form class="flex flex-col w-1/6">
    <label>
        {$translations.firstName}
        <input class="input input-bordered" type="text" bind:value={details.firstName}/>
    </label>
    <label>
        {$translations.lastName}
        <input class="input input-bordered" type="text" bind:value={details.lastName}/>
    </label>
    <label>
        {$translations.firstName}
        <input class="input input-bordered" type="email" bind:value={details.email}/>
    </label>
    <label>
        {$translations.phone}
        <input class="input input-bordered" type="tel" bind:value={details.phone}/>
    </label>
    <button class="btn btn-primary" type="submit" on:click={onNext}>{$translations.next}</button>
</form>