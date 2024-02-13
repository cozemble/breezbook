<script lang="ts">
  import notifications from '$lib/stores/notifications'
  import Notification from './Notification.svelte'
</script>

<div
  class="fixed right-0 bottom-0 m-4 sm:mx-10 sm:my-20 z-50
        flex flex-col items-end justify-end gap-2
        "
>
  {#each $notifications as notification (notification.id)}
    <Notification {notification} />
  {/each}
</div>
