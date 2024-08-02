<script lang="ts">
    import { onMount, onDestroy } from 'svelte';

    let wrapper: HTMLElement;
    let content: HTMLElement;
    let isSticky = false;
    let wrapperRect: DOMRect;
    let bufferZone = 100; // pixels from bottom of viewport to start transition
    let scrollY = 0;

    function updateStickyState() {
        if (!wrapperRect) return;

        const bottomOfWrapper = wrapperRect.bottom + scrollY;
        const bottomOfViewport = window.innerHeight + scrollY;

        isSticky = bottomOfWrapper > bottomOfViewport - bufferZone;
    }

    function debounce(func: () => void, wait: number) {
        let timeout: number;
        return () => {
            clearTimeout(timeout);
            timeout = setTimeout(func, wait) as unknown as number;
        };
    }

    const debouncedUpdate = debounce(() => {
        wrapperRect = wrapper.getBoundingClientRect();
        updateStickyState();
    }, 10);

    function handleScroll() {
        scrollY = window.scrollY;
        updateStickyState();
    }

    onMount(() => {
        wrapperRect = wrapper.getBoundingClientRect();
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', debouncedUpdate);
        updateStickyState();
    });

    onDestroy(() => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', debouncedUpdate);
    });
</script>

<svelte:window bind:scrollY on:scroll={handleScroll} on:resize={debouncedUpdate} />

<div bind:this={wrapper} class="relative">
    <div
            bind:this={content}
            class="transition-all duration-300 ease-in-out bg-base-100"
            class:sticky={isSticky}
    >
        <div class="container mx-auto p-2 max-w-md px-6">
            <slot />
        </div>
    </div>
</div>

<style>
    .sticky {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 10;
    }
</style>