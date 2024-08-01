<script lang="ts">
    import {ChevronDown} from 'lucide-svelte';
    import type {ResourceSummary} from "@breezbook/backend-api-types";
    import Markdown from "$lib/markdown/Markdown.svelte";
    import {translations} from "$lib/ui/stores";
    import {mandatory} from "@breezbook/packages-types";

    export let trainers: ResourceSummary[]
    export let onTrainerChosen: (t: ResourceSummary) => void
    export let selectedTrainer: string | null = null;
    let expandedTrainer: string | null = null;

    $:mappedTrainers = trainers.map(t => {
        const fullDetails = t.branding?.markup?.[0]?.markup ?? '';
        const topLine = fullDetails.split('\n')[0];
        return ({
            id: t.id,
            name: t.name,
            topLine,
            price: "todo ",
            image: t.branding?.images?.[0]?.publicUrl ?? null,
            details: fullDetails
        });
    })

    function toggleExpandedTrainer(trainerId: string) {
        expandedTrainer = expandedTrainer === trainerId ? null : trainerId;
    }

    function onNext() {
        if (selectedTrainer) {
            const trainer = mandatory(trainers.find(t => t.id === selectedTrainer), `Trainer not found`);
            onTrainerChosen(trainer);
        }
    }
</script>

<div class="p-4">
    <div class="space-y-4">
        <div class="space-y-4">
            {#each mappedTrainers as trainer (trainer.id)}
                <div
                        class="p-4 rounded-lg cursor-pointer transition-all {selectedTrainer === trainer.id
                                ? 'bg-base-200 border border-base-300'
                                : 'bg-base-100 shadow-md hover:shadow-lg hover:border-base-300 border border-transparent'}"
                        on:click={() => selectedTrainer = trainer.id}>
                    <div class="flex flex-col md:flex-row items-start">
                        <img
                                src={trainer.image}
                                alt={trainer.name}
                                class="w-24 h-24 rounded-full mb-4 md:mb-0 md:mr-4 object-cover"/>
                        <div class="flex-grow">
                            <h3 class="text-lg font-semibold text-base-content">{trainer.name}</h3>
                            <p class="text-sm text-base-content opacity-70">{trainer.topLine}</p>
                            <!--                            <p class="font-bold mt-2 text-base-content">£{trainer.price} per session</p>-->
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
    </div>

    <div class="mt-6 flex justify-end">
        <button on:click={onNext} class:bg-primary={selectedTrainer}
                disabled={!selectedTrainer}
                class="px-6 py-2 hover:bg-primary-focus text-primary-content rounded-md transition-colors font-semibold">
            {$translations.next}
        </button>
    </div>
</div>