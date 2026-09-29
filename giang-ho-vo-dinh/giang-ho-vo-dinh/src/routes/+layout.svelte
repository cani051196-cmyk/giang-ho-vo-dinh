<script lang="ts">
 import { onMount } from 'svelte';
 onMount(()=>{ if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{}); });
</script>
<svelte:head>
 <meta name="theme-color" content="#0d1117" />
 <link rel="manifest" href="/manifest.webmanifest" />
 <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
</svelte:head>
<slot />
