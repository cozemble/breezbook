<script lang="ts">
    import {
        allConfigs,
        type AnyTimeBetween,
        type DurationOption,
        type FixedTime,
        type PickTime,
        type TimeslotSelection,
        type VariableDurationConfig
    } from "./types3";
    import {afterUpdate} from "svelte";
    import SingleDaySchedule from "./SingleDaySchedule.svelte";
    import MultiDaySchedule from "./MultiDaySchedule.svelte";

    let service = allConfigs[0].service;

    afterUpdate(() => console.log({service}));

    function onConfigChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        const found = allConfigs.find(c => c.service.name === target.value);
        if (found) {
            service = found.service;
        }
    }

    function flattenTimes(times: TimeslotSelection | FixedTime | VariableDurationConfig): TimeslotSelection | FixedTime | PickTime | AnyTimeBetween {
        if (times._type === 'variable-duration-config') {
            return times.times;
        }
        return times;
    }

    function maybeDuration(times: TimeslotSelection | FixedTime | VariableDurationConfig): DurationOption | null {
        if (times._type === 'variable-duration-config') {
            return times.duration;
        }
        return null;
    }

</script>

<div class="card bg-base-100 shadow-xl max-w-sm mx-auto">
    <div class="card-body p-4">
        <div class="form-control mb-4">
            <label class="label">
                <span class="label-text font-semibold">Select Service Type</span>
            </label>

            <select class="input-bordered input" on:change={onConfigChange}>
                {#each allConfigs as c}
                    <option value={c.service.name} selected={c.service === service}>{c.service.name}</option>
                {/each}
            </select>
        </div>

        <!--        <div class="form-control mb-4">-->
        <!--            <label class="label">Configuration definition</label>-->
        <!--            <pre>{JSON.stringify(definition, null, 2)}</pre>-->
        <!--        </div>-->
    </div>
</div>

{#key service.id}
    {#if service.scheduleConfig._type === "single-day-scheduling"}
        <SingleDaySchedule dayConstraints={service.scheduleConfig.startDay ?? []}
                           duration={maybeDuration(service.scheduleConfig.times)}
                           times={flattenTimes(service.scheduleConfig.times)}/>
    {:else}
        <MultiDaySchedule startDayConstraints={service.scheduleConfig.startDay ?? []}
                          endDayConstraints={service.scheduleConfig.endDay ?? []}
                          length={service.scheduleConfig.length}
                          startTimes={service.scheduleConfig.startTimes}
                          endTimes={service.scheduleConfig.endTimes ?? null}/>
    {/if}
{/key}