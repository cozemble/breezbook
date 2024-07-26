<script lang="ts">
    import { onMount } from 'svelte';
    import hljs from 'highlight.js/lib/core';
    import typescript from 'highlight.js/lib/languages/typescript';
    import 'highlight.js/styles/github-dark.css';  // Import a theme

    hljs.registerLanguage('typescript', typescript);

    export let githubUrl: string;
    export let codeBlockId: string;

    let code: string = '';
    let loading: boolean = true;
    let error: string | null = null;

    async function fetchCode() {
        try {
            const response = await fetch(githubUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch the file');
            }
            const text = await response.text();
            const regex = new RegExp(`// BEGIN-CODE: ${codeBlockId}\\n([\\s\\S]*?)// END-CODE: ${codeBlockId}`);
            const match = text.match(regex);
            if (match) {
                code = match[1].trim();
            } else {
                throw new Error('Code block not found');
            }
        } catch (err: any) {
            error = err.message;
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        fetchCode();
    });

    $: if (code) {
        setTimeout(() => {
            const codeElement = document.querySelector('code');
            if (codeElement) {
                hljs.highlightElement(codeElement);
            }
        }, 0);
    }
</script>

<div class="card bg-base-200 shadow-xl">
    <div class="card-body p-0">  <!-- Removed padding -->
        {#if loading}
            <div class="flex justify-center items-center p-4">
                <span class="loading loading-spinner loading-md"></span>
            </div>
        {:else if error}
            <div class="alert alert-error m-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Error: {error}</span>
            </div>
        {:else}
            <div class="mockup-code bg-base-200 text-xs">
                <pre><code class="language-typescript">{code}</code></pre>
            </div>
        {/if}
    </div>
</div>

<style>
    :global(pre) {
        background-color: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
    }
    :global(code) {
        font-size: 0.75rem !important;
    }
    :global(.hljs) {
        background: transparent !important;
    }
</style>