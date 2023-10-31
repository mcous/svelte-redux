<script lang="ts">
  import { writable } from "$lib";

  const value = writable("count", 0);
</script>

<button on:click={() => ($value += 1)}>increment</button>
<button on:click={() => ($value -= 1)}>decrement</button>
<p>{$value}</p>
