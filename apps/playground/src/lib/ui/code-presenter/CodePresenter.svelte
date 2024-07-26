<script lang="ts">
    import { onMount } from 'svelte';
    import hljs from 'highlight.js/lib/core';
    import typescript from 'highlight.js/lib/languages/typescript';

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
        } catch (err:any) {
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
            const codeElement = document.querySelector('pre code') as HTMLElement;
            if (codeElement) {
                hljs.highlightElement(codeElement);
            }
        }, 0);
    }
</script>

<div>
    {#if loading}
        <p>Loading...</p>
    {:else if error}
        <p>Error: {error}</p>
    {:else}
        <pre><code class="language-typescript">{code}</code></pre>
    {/if}
</div>

<style>
    pre {
        background-color: #f4f4f4;
        padding: 1em;
        border-radius: 4px;
        overflow-x: auto;
    }
</style>