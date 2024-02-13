<script lang="ts">
  import Icon from '@iconify/svelte'
  import type { Notification } from '$lib/stores/notifications'

  export let notification: Notification

  const { title: text, description, type, remove, canUserClose } = notification

  const classes = `
    ${(type === 'error' && 'alert-error') || ''}
    ${(type === 'success' && 'alert-success') || ''}
    ${(type === 'warning' && 'alert-warning') || ''}
    ${(type === 'info' && 'alert-info') || ''}
    ${(type === 'loading' && 'alert-info') || ''}
  `.trim()

  const icon =
    notification.icon ||
    `
    ${(type === 'error' && 'mdi:alert-circle') || ''}
    ${(type === 'success' && 'mdi:check-circle') || ''}
    ${(type === 'warning' && 'mdi:alert-circle-outline') || ''}
    ${(type === 'info' && 'mdi:information-outline') || ''}
    ${(type === 'loading' && 'mdi:loading') || ''}
  `.trim()
</script>

<div class="alert shadow-xl relative {classes}">
  {#if type === 'loading'}
    <span class="loading" />
  {:else}
    <Icon {icon} class="stroke-current shrink-0 w-6 h-6 xs-only:hidden" />
  {/if}

  <div class="flex flex-col">
    <span class="font-semibold">{text}</span>
    <span class="text-sm">{description}</span>
  </div>

  {#if canUserClose}
    <!-- spacer div -->
    <div />
    <button class="absolute top-1 right-2 btn btn-circle btn-xs btn-neutral" on:click={remove}
      ><Icon icon="mdi:close" class="stroke-current text-base" />
    </button>
  {/if}
</div>
