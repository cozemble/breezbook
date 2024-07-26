<script lang="ts">

    import {Clock} from "lucide-svelte";
    import PrintDurationUnits from "./PrintDurationUnits.svelte";
    import type {Duration} from "@breezbook/packages-types";

    export let duration: Duration
</script>

<div class="form-control mb-4">
    <div class="alert alert-info text-sm">
        <Clock class="mr-1" size={14}/>
        <span>Duration: {duration.value.value}
            <PrintDurationUnits {duration}/></span>
    </div>
</div>
