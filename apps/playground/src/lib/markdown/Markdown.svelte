<script lang="ts">
    import {afterUpdate, onMount} from 'svelte';
    import {marked} from 'marked';

    export let markdown = '';

    let htmlContent = '';
    let contentContainer: HTMLDivElement | null = null;

    $: {
        htmlContent = marked(markdown) as string;
    }

    function applyDaisyUIClasses() {
        if (contentContainer) {
            contentContainer.querySelectorAll('h1').forEach(el => el.classList.add('text-4xl', 'font-bold', 'mb-4'));
            contentContainer.querySelectorAll('h2').forEach(el => el.classList.add('text-3xl', 'font-bold', 'mb-3'));
            contentContainer.querySelectorAll('h3').forEach(el => el.classList.add('text-2xl', 'font-bold', 'mb-2'));
            contentContainer.querySelectorAll('p').forEach(el => el.classList.add('mb-4'));
            contentContainer.querySelectorAll('ul').forEach(el => el.classList.add('list-disc', 'ml-6', 'mb-4'));
            contentContainer.querySelectorAll('ol').forEach(el => el.classList.add('list-decimal', 'ml-6', 'mb-4'));
            contentContainer.querySelectorAll('li').forEach(el => el.classList.add('mb-2'));
            contentContainer.querySelectorAll('a').forEach(el => el.classList.add('link', 'link-primary'));
            contentContainer.querySelectorAll('code').forEach(el => el.classList.add('bg-base-200', 'rounded', 'px-1'));
            contentContainer.querySelectorAll('pre').forEach(el => {
                el.classList.add('bg-base-200', 'rounded-lg', 'p-4', 'mb-4');
                el.querySelector('code')?.classList.remove('bg-base-200', 'rounded', 'px-1');
            });
            contentContainer.querySelectorAll('blockquote').forEach(el => el.classList.add('border-l-4', 'border-primary', 'pl-4', 'italic', 'mb-4'));
            contentContainer.querySelectorAll('table').forEach(el => el.classList.add('table', 'table-zebra', 'w-full'));
            contentContainer.querySelectorAll('img').forEach(el => el.classList.add('rounded-lg', 'shadow-lg'));
        }
    }

    onMount(() => {
        applyDaisyUIClasses();
    });

    afterUpdate(() => {
        applyDaisyUIClasses();
    });
</script>

<div bind:this={contentContainer} class="markdown-content prose max-w-none">
    {@html htmlContent}
</div>