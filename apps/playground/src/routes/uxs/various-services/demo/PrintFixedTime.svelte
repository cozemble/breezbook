<script lang="ts">
    import {Clock} from "lucide-svelte";
    import type {FixedTime} from "./types3";

    export let time: FixedTime
</script>

<div class="form-control mb-4">
    <div class="alert alert-info text-sm">
        <Clock class="mr-1" size={14}/>
        <span>{time.start.value} - {time.startLabel}</span>
    </div>
</div>

<div class="form-control mb-4">
    <div class="alert alert-info text-sm">
        <Clock class="mr-1" size={14}/>
        <span>{time.end.value} - {time.endLabel}</span>
    </div>
</div>
