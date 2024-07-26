<script lang="ts">
    import {ChevronLeft, ChevronRight} from "lucide-svelte";
    import {createEventDispatcher} from "svelte";

    export let currentMonth: Date
    const dispatch = createEventDispatcher()

</script>

<div class="flex justify-between items-center mb-4">
    <h2 class="card-title">
        {currentMonth.toLocaleString('default', {month: 'long', year: 'numeric'})}
    </h2>
    <div class="btn-group">
        <button on:click={() => dispatch("prevMonth")} class="btn btn-sm">
            <ChevronLeft size={20}/>
        </button>
        <button on:click={() => dispatch("nextMonth")} class="btn btn-sm">
            <ChevronRight size={20}/>
        </button>
    </div>
</div>
