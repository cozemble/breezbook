<script lang="ts">
    import ThemeSwitcher from "$lib/ui/ThemeSwitcher.svelte";
    import LanguageSwitcher from "$lib/ui/LanguageSwitcher.svelte";
    import PersonalTrainingUx from "$lib/uxs/personal-training/PersonalTrainingUx.svelte";
    import {language} from "$lib/ui/language";
</script>
<div class="flex mb-4">
    <ThemeSwitcher/>
    <LanguageSwitcher/>
</div>

{#key $language}
    <PersonalTrainingUx languageId={$language}/>
{/key}