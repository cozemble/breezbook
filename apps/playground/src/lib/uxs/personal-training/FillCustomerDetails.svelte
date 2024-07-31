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

    function validate() {
        if(!details.firstName || !details.lastName || !details.email || !details.phone) {
            return $translations.pleaseFillInAllFields
        }
        if(!details.email.includes('@')) {
            return $translations.pleaseEnterAValidEmail
        }
        if(details.firstName.length < 2) {
            return $translations.pleaseEnterALongerFirstName
        }
        if(details.lastName.length < 2) {
            return $translations.pleaseEnterALongerLastName
        }
        if(details.phone.length < 2) {
            return $translations.pleaseEnterALongerPhoneNumber
        }
        return null
    }

    function onNext() {
        const maybeError = validate()
        if(maybeError) {
            alert(maybeError)
            return
        }
        dispatch('filled', details)
    }

    $: kindaValid = (validate() === null)
</script>

<h2 class="text-xl font-bold">{$translations.yourDetails}</h2>

<form class="flex flex-col">
    <label class="label-text">
        {$translations.firstName}
    </label>
    <input class="input input-bordered" type="text" bind:value={details.firstName}/>
    <label class="label-text">
        {$translations.lastName}
    </label>
    <input class="input input-bordered" type="text" bind:value={details.lastName}/>
    <label class="label-text">
        {$translations.firstName}
    </label >
    <input class="input input-bordered" type="email" bind:value={details.email}/>
    <label class="label-text">
        {$translations.phone}
    </label>
    <input class="input input-bordered" type="tel" bind:value={details.phone}/>
    <div class="mt-6 flex justify-end">
        <button on:click={onNext} class:bg-primary={kindaValid}
                disabled={!kindaValid}
                class="px-6 py-2 hover:bg-primary-focus text-primary-content rounded-md transition-colors font-semibold">
            {$translations.next}
        </button>
    </div>
</form>