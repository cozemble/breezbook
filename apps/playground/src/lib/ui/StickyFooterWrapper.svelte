<script lang="ts">
    import { onMount, onDestroy } from 'svelte';

    let contentWrapper: HTMLElement;
    let content: HTMLElement;
    let isSticky = false;
    let observer: IntersectionObserver;
    let timeoutId: number;

    function debounce(func: () => void, delay: number) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(func, delay) as unknown as number;
    }

    onMount(() => {
        observer = new IntersectionObserver(
            ([entry]) => {
                debounce(() => {
                    isSticky = !entry.isIntersecting;
                }, 50); // 50ms debounce
            },
            {
                threshold: 0.95, // Trigger when 95% of the element is visible
                rootMargin: '0px 0px -20px 0px' // 20px buffer at the bottom
            }
        );

        if (contentWrapper) {
            observer.observe(contentWrapper);
        }
    });

    onDestroy(() => {
        if (observer) {
            observer.disconnect();
        }
        clearTimeout(timeoutId);
    });
</script>

<div bind:this={contentWrapper} class="relative">
    <div
            bind:this={content}
            class="transition-all duration-300 ease-in-out bg-base-100 shadow-lg"
            class:sticky={isSticky}>
        <div class="container mx-auto p-2 max-w-md">
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