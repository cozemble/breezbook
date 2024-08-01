<script lang="ts">
    import {language} from "$lib/ui/stores";
    import PersonalTrainingUx from "$lib/uxs/personal-training-2/PersonalTrainingUx.svelte";
</script>

{#key $language}
    <PersonalTrainingUx languageId={$language}/>
{/key}