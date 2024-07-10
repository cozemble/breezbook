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
        if (!details.firstName || !details.lastName || !details.email || !details.phone) {
            alert($translations.pleaseFillInAllFields)
            return
        }
        if (!details.email.includes('@')) {
            alert($translations.pleaseEnterAValidEmail)
            return
        }
        if (details.firstName.length < 2) {

            alert($translations.pleaseEnterALongerFirstName)
            return
        }
        if (details.lastName.length < 2) {
            alert($translations.pleaseEnterALongerLastName)
            return
        }
        if (details.phone.length < 2) {
            alert($translations.pleaseEnterALongerPhoneNumber)
            return
        }
        dispatch('filled', details)
    }

    function onPrev() {
        dispatch('prev')
    }
</script>

<form class="flex flex-col">
    <label class="label">
        First name
    </label>
    <input class="input input-bordered" type="text" bind:value={details.firstName}/>
    <label class="label">
        Last name
    </label>
    <input class="input input-bordered" type="text" bind:value={details.lastName}/>
    <label class="label">
        Email
    </label>
    <input class="input input-bordered" type="email" bind:value={details.email}/>
    <label class="label">
        Phone
    </label>
    <input class="input input-bordered" type="tel" bind:value={details.phone}/>
    <button class="btn btn-primary mt-6" on:click={onNext}>Next</button>
    <button class="btn btn-outline mt-2" on:click={onPrev}>Back</button>
</form>