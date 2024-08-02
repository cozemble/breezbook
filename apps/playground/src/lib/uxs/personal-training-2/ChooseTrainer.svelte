<script lang="ts">
    import {ChevronDown} from 'lucide-svelte';
    import type {EarliestResourceAvailability, ResourceSummary} from "@breezbook/backend-api-types";
    import Markdown from "$lib/markdown/Markdown.svelte";
    import {translations} from "$lib/ui/stores";
    import {isoDate, isoDateFns, mandatory} from "@breezbook/packages-types";
    import {currencies, price, priceFns} from "@breezbook/packages-core";
    import StickyFooterWrapper from "$lib/ui/StickyFooterWrapper.svelte";

    export let trainers: ResourceSummary[]
    export let onTrainerChosen: (t: ResourceSummary) => void
    export let selectedTrainer: string | null = null;
    export let earliestAvailability: EarliestResourceAvailability[]

    let expandedTrainer: string | null = null;

    $: mappedTrainers = mapTrainers(trainers, earliestAvailability);

    function mapTrainers(trainers: ResourceSummary[], earliestAvailability: EarliestResourceAvailability[]) {
        return trainers.map(t => {
            const fullDetails = t.branding?.markup?.[0]?.markup ?? '';
            const topLine = fullDetails.split('\n')[0];
            let priceString = null as string | null;
            const earliestForTrainer = earliestAvailability.find(ea => ea.resourceId === t.id);
            let whenAvailable = null as string | null;
            if (earliestForTrainer && earliestForTrainer.cheapestPrice) {
                const p = priceFns.format(price(earliestForTrainer.cheapestPrice, currencies.GBP));
                priceString = `£${p}`;
            }
            if (earliestForTrainer?.earliestDate) {
                const date = isoDate(earliestForTrainer.earliestDate);
                if (date.value === isoDate().value) {
                    whenAvailable = `today`;
                } else if (date.value === isoDateFns.addDays(isoDate(), 1).value) {
                    whenAvailable = `tomorrow`;
                } else {
                    whenAvailable = `from ${isoDateFns.dayOfWeek(date)}`;
                }
            }

            return ({
                id: t.id,
                name: t.name,
                topLine,
                price: priceString,
                image: t.branding?.images?.[0]?.publicUrl ?? null,
                details: fullDetails,
                whenAvailable
            });
        });
    }

    function toggleExpandedTrainer(trainerId: string) {
        expandedTrainer = expandedTrainer === trainerId ? null : trainerId;
    }

    function onNext() {
        if (selectedTrainer) {
            const trainer = mandatory(trainers.find(t => t.id === selectedTrainer), `Trainer not found`);
            onTrainerChosen(trainer);
        }
    }

    function selectTrainer(trainerId: string) {
        selectedTrainer = trainerId;
    }
</script>

<div class="space-y-4">
    {#each mappedTrainers as trainer (trainer.id)}
        <div
                class="p-4 rounded-lg cursor-pointer transition-all {selectedTrainer === trainer.id
                    ? 'bg-base-200 border border-base-300'
                    : 'bg-base-100 shadow-md hover:shadow-lg hover:border-base-300 border border-transparent'}"
                on:click={() => selectTrainer(trainer.id)}>
            <div class="flex flex-col md:flex-row items-start">
                <img
                        src={trainer.image}
                        alt={trainer.name}
                        class="w-24 h-24 rounded-full mb-4 md:mb-0 md:mr-4 object-cover"/>
                <div class="flex-grow">
                    <h3 class="text-lg font-semibold text-base-content">{trainer.name}</h3>
                    <p class="text-sm text-base-content opacity-70">{trainer.topLine}</p>
                    {#if trainer.price}
                        <p class="font-bold mt-2 text-base-content">{trainer.price} per session</p>
                    {/if}
                    {#if trainer.whenAvailable}
                        <p class="mt-2 text-base-content opacity-70">Available {trainer.whenAvailable}</p>
                    {/if}
                    <div class="mt-3 text-right">
                        <button
                                class="text-primary hover:text-primary-focus font-medium flex items-center justify-end w-full"
                                on:click|stopPropagation={() => toggleExpandedTrainer(trainer.id)}>
                            {$translations.viewMore}
                            <ChevronDown
                                    size={20}
                                    class="ml-1 transform transition-transform {expandedTrainer === trainer.id ? 'rotate-180' : ''}"/>
                        </button>
                    </div>
                </div>
            </div>
            {#if expandedTrainer === trainer.id}
                <div class="mt-4 text-base-content">
                    <Markdown markdown={trainer.details}/>
                </div>
            {/if}
        </div>
    {/each}
</div>

<StickyFooterWrapper>
    {#if selectedTrainer}
        <div class="flex justify-end">
            <button
                    on:click={onNext}
                    class="px-6 py-2 bg-primary hover:bg-primary-focus text-primary-content rounded-md transition-colors font-semibold">
                {$translations.next}
            </button>
        </div>
    {/if}
</StickyFooterWrapper>