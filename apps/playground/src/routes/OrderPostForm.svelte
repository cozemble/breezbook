<script lang="ts">
    import {type CustomerInput, type OrderLineInput, toCustomer, toOrderLine} from "./inputTypes";
    import OrderLineEditor from "./OrderLineEditor.svelte";
    import {order, type OrderLine} from "@breezbook/packages-core";
    import CustomerForm from "./CustomerForm.svelte";
    import {endpoint} from "./endpoint";

    let orderLines: OrderLineInput[] = [{}];
    let customerInput: CustomerInput = {formId:"customer-details-form", firstName: "mike", lastName: "hogan", email: "mike@email.com"};
    let orderError: string | null = null;


    async function sendOrder() {
        const acceptableLines = orderLines.map(line => {
            try {
                return toOrderLine(line);
            } catch {
                return null;
            }
        }).filter(line => line !== null) as OrderLine[];
        const theOrder = order(toCustomer(customerInput), acceptableLines, );
        const response = await fetch(`${$endpoint}/api/tenant1/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(theOrder)
        });
        if (response.ok) {
            alert('Order sent');
        } else {
            orderError = await response.text();
        }
    }
</script>


<CustomerForm bind:customerInput={customerInput}/>

{#each orderLines as _orderLine, i}
    <OrderLineEditor bind:value={orderLines[i]}/>
{/each}
<button on:click={() => orderLines = [...orderLines, {}]}>Add order line</button>
<button on:click={sendOrder}>Send order</button>

{#if orderError}
    <p style="color: red">{orderError}</p>
{/if}
