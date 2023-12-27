<script lang="ts">
    import {orderLineError, type OrderLineInput} from "./inputTypes";

    export let value: OrderLineInput
    $: error= orderLineError(value)

</script>

<div>
    <form>
        <select bind:value={value.serviceId}>
            <option value="smallCarWash" selected={value.serviceId ==="smallCarWash"}>Small Car Wash</option>
            <option value="mediumCarWash" selected={value.serviceId ==="mediumCarWash"}>Medium Car Wash</option>
            <option value="largeCarWash" selected={value.serviceId ==="largeCarWash"}>Large Car Wash</option>
        </select>
        <label for="date">Date</label>
        <input type="date" bind:value={value.date} id="date"/>
        <select bind:value={value.slot}>
            <option value="-----" selected={!value.slot}>-----</option>
            <option value="09:00 - 13:00" selected={value.slot ==="09:00 - 13:00"}>09:00 - 13:00</option>
            <option value="13:00 - 16:00" selected={value.slot ==="13:00 - 16:00"}>13:00 - 16:00</option>
            <option value="16:00 - 18:00" selected={value.slot ==="16:00 - 18:00"}>16:00 - 18:00</option>
        </select>
        {#if error}
            <span class="error">{error}</span>
        {/if}
    </form>
</div>

<style>
    .error {
        color: red;
    }
</style>