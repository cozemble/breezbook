<script lang="ts">
import { ChevronDown, Flag, MapPin, PaintBucket, Dumbbell } from 'lucide-svelte';

let step: number = 1;
let selectedTrainer: string | null = null;
let expandedTrainer: string | null = null;

interface Trainer {
    id: string;
    name: string;
    specialty: string;
    background: string;
    qualifications: string[];
    price: number;
    image: string;
    details: string;
}

const trainers: Trainer[] = [
    {
        id: 'mike',
        name: 'Mike',
        specialty: 'Recovery from injury',
        background: 'Sports science background, worked with professional athletes and those recovering from injury.',
        qualifications: ['BSc (Hons) Sports Science', 'Level 3 Personal Trainer', 'Level 3 Sports Massage Therapist'],
        price: 70,
        image: 'https://pbs.twimg.com/profile_images/1783563449005404160/qS4bslrZ_400x400.jpg',
        details: 'Mike specializes in helping clients recover from injuries and regain their strength and mobility. He uses a combination of targeted exercises, stretching, and massage techniques to address specific issues and prevent future injuries.'
    },
    {
        id: 'mete',
        name: 'Mete',
        specialty: 'Elite sports training, focus on power events',
        background: 'Worked with Olympic gold medalists and world champions.',
        qualifications: ['PhD in Sports Science', 'MSc in Exercise Science', 'BSc in Sports Science', 'Certified Strength and Conditioning Specialist (CSCS)'],
        price: 90,
        image: 'https://avatars.githubusercontent.com/u/86600423',
        details: 'Mete is an expert in elite sports training, with a focus on power events like weightlifting, sprinting, and jumping. He has worked with Olympic gold medalists and world champions, helping them achieve peak performance through specialized training programs and advanced techniques.'
    },
];

$: {
    if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', navState.theme.toLowerCase());
    }
}

function handleThemeChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    navState = { ...navState, theme: value.toLowerCase() };
    document.documentElement.setAttribute('data-theme', navState.theme);
}

function handleLanguageChange(event: Event) {
    const language = (event.target as HTMLSelectElement).value;
    navState = { ...navState, language };
}

function handleLocationChange(event: Event) {
    const location = (event.target as HTMLSelectElement).value;
    navState = { ...navState, location };
}

function toggleExpandedTrainer(trainerId: string) {
    expandedTrainer = expandedTrainer === trainerId ? null : trainerId;
}

let navState: { [key: string]: string } = {
    language: "English",
    theme: "emerald",
    location: "Harlow"
};

const navOptions = [
    { key: 'language', icon: Flag, options: ['Turkish', 'English'], onChange: handleLanguageChange },
    { key: 'theme', icon: PaintBucket, options: ['light', 'dark', 'emerald'], onChange: handleThemeChange },
    { key: 'location', icon: MapPin, options: ['Harlow', 'London', 'Manchester'], onChange: handleLocationChange }
];
</script>

<div class="container mx-auto p-2 max-w-md">
    <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-2">
            <Dumbbell size={24} class="text-base-content" />
            <h1 class="text-xl font-bold">Breez Gym</h1>
        </div>
    </div>
    <div class="bg-base-100 shadow-xl rounded-lg overflow-hidden border border-base-300">
        <div class="p-4">
            <div class="flex justify-between items-center mb-4">
                {#each navOptions as { key, icon, options, onChange }}
                    <div class="flex items-center space-x-1 rounded-md shadow-sm px-2 py-1">
                        <svelte:component this={icon} size={16} class="text-base-content" />
                        <select
                            value={navState[key]}
                            on:change={onChange}
                            class="bg-transparent border-none text-sm font-medium">
                            {#each options as option}
                                <option value={option} selected={navState[key] === option}>{option}</option>
                            {/each}
                        </select>
                    </div>
                {/each}
            </div>
            <p class="text-lg font-bold mb-4">Personal Training</p>

            <div class="space-y-4">
                <h2 class="text-xl font-bold mb-4 text-base-content">Choose Your Trainer</h2>
                <div class="space-y-4">
                    {#each trainers as trainer (trainer.id)}
                        <div
                            class="p-4 rounded-lg cursor-pointer transition-all {selectedTrainer === trainer.id
                                ? 'bg-base-200 border border-base-300'
                                : 'bg-base-100 shadow-md hover:shadow-lg hover:border-base-300 border border-transparent'}"
                            on:click={() => selectedTrainer = trainer.id}>
                            <div class="flex flex-col md:flex-row items-start">
                                <img
                                    src={trainer.image}
                                    alt={trainer.name}
                                    class="w-24 h-24 rounded-full mb-4 md:mb-0 md:mr-4 object-cover" />
                                <div class="flex-grow">
                                    <h3 class="text-lg font-semibold text-base-content">{trainer.name}</h3>
                                    <p class="text-sm text-base-content opacity-70">{trainer.specialty}</p>
                                    <p class="text-sm mt-2 text-base-content">{trainer.background}</p>
                                    <ul class="list-disc list-inside text-sm mt-2 text-base-content">
                                        {#each trainer.qualifications as qual}
                                            <li>{qual}</li>
                                        {/each}
                                    </ul>
                                    <p class="font-bold mt-2 text-base-content">£{trainer.price} per session</p>
                                    <div class="mt-3 text-right">
                                        <button
                                            class="text-primary hover:text-primary-focus font-medium flex items-center justify-end w-full"
                                            on:click|stopPropagation={() => toggleExpandedTrainer(trainer.id)}>
                                            View More
                                            <ChevronDown
                                                size={20}
                                                class="ml-1 transform transition-transform {expandedTrainer === trainer.id ? 'rotate-180' : ''}" />
                                        </button>
                                    </div>
                                    {#if expandedTrainer === trainer.id}
                                        <div class="mt-4 text-base-content">
                                            {trainer.details}
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

            <div class="mt-6 flex justify-end">
                <button
                    class="px-6 py-2 bg-primary hover:bg-primary-focus text-primary-content rounded-md transition-colors font-semibold">
                    Next
                </button>
            </div>
        </div>
    </div>
</div>